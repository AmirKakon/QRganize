import dayjs from "dayjs";
import { itemNames } from "./helpers";

// Defaults for new stock: which container it goes in, its tags, and when it
// expires. Shared by the receipt scanner and the item page's "Add stock".

// Groceries wait here when nothing better is known; like unassigned stock it
// is not where an item "lives", so it never counts as a home.
const STAGING_NAME = "recently bought";
const FREEZER_DAYS = 90;
const MEAL_PREP_DAYS = 4;
// A similar-items suggestion needs a clear winner backed by several items.
const SIMILAR_MIN_SHARE = 0.6;
const SIMILAR_MIN_ITEMS = 2;

export const normText = (value) => String(value || "").trim().replace(/\s+/g, " ").toLowerCase();

export const isStagingContainer = (container) => !container || normText(container.name) === STAGING_NAME;
export const isFreezerContainer = (container) => Boolean(container) && normText(container.name).includes("freezer");

// Strip leading zeros so barcodes compare regardless of padding.
export const normBarcode = (value) => String(value || "").replace(/\D/g, "").replace(/^0+/, "");

// A code short enough to be a store PLU (e.g. "22") is not a reliable key.
export const isRealBarcode = (value) => normBarcode(value).length >= 8;

// Letters and digits only, so "מלפפון," and "מלפפון" compare as one word.
const words = (value) => ` ${normText(value).replace(/[^\p{L}\p{N}%']+/gu, " ").trim()} `;

export const hasName = (item, text) => itemNames(item).some((n) => normText(n) === normText(text));

// Find an existing item that matches an extracted receipt line, strongest key first:
// barcode (items are keyed by barcode, plus barcode aliases), then an exact
// name or alternate name (receipt text learned from earlier receipts, then
// the English name), then an alternate name appearing as whole words in the
// receipt line (longest wins, so "עגבניות שרי" beats "עגבניות"), and finally
// the older loose substring match on names.
export const matchExisting = (receiptName, englishName, barcode, allItems) => {
  // Homemade dishes (tagged "meal prep") are never bought, so a receipt line
  // must not auto-match them ("Chicken drumsticks" vs the homemade "Mexican
  // chicken drumsticks"); they can still be linked by hand.
  const items = allItems.filter((i) => !(i.tags || []).includes("meal prep"));
  if (isRealBarcode(barcode)) {
    const bc = normBarcode(barcode);
    const byBarcode = items.find(
      (i) =>
        (/^\d+$/.test(String(i.id)) && normBarcode(i.id) === bc) ||
        (Array.isArray(i.barcodes) && i.barcodes.includes(bc))
    );
    if (byBarcode) return byBarcode;
  }

  for (const text of [receiptName, englishName]) {
    if (!normText(text)) continue;
    const exact = items.find((i) => hasName(i, text));
    if (exact) return exact;
  }

  const line = words(receiptName);
  let best = null;
  let bestLength = 0;
  for (const item of items) {
    for (const alias of item.aliases || []) {
      const phrase = words(alias);
      const length = phrase.trim().length;
      if (length >= 3 && length > bestLength && line.includes(phrase)) {
        best = item;
        bestLength = length;
      }
    }
  }
  if (best) return best;

  for (const text of [englishName, receiptName]) {
    const n = normText(text);
    if (!n) continue;
    const loose = items.find((i) => {
      const existing = normText(i.name);
      return existing && (existing.includes(n) || n.includes(existing));
    });
    if (loose) return loose;
  }
  return null;
};

// Rough household shelf life (days) for perishables, keyed by name substrings
// (English + Hebrew). First matching entry wins, so more specific entries come
// first. Non-perishables match nothing. Last resort after the item's own
// history and Gemini's per-product estimate.
const SHELF_LIFE = [
  { days: 30, keys: ["תפוח אדמה", "תפוד", "potato", "בצל", "onion", "שום", "garlic"] },
  { days: 2, keys: ["salmon", "סלמון", "fresh fish", "דג טרי", "טונה טרי"] },
  { days: 4, keys: ["strawberr", "raspberr", "blueberr", "berry", "berries", "תות", "פטל"] },
  {
    days: 5,
    keys: [
      "lettuce", "spinach", "salad", "greens", "arugula", "herb", "basil",
      "cilantro", "parsley", "mushroom", "banana", "avocado", "asparagus",
      "bread", "pita", "חסה", "תרד", "פטרוזיליה", "כוסברה", "בזיליקום",
      "פטריות", "בננה", "אבוקדו", "לחם", "פיתה",
    ],
  },
  {
    days: 7,
    keys: [
      "cucumber", "tomato", "pepper", "zucchini", "broccoli", "cauliflower",
      "grape", "milk", "cream", "מלפפון", "עגבני", "פלפל", "קישוא", "ברוקולי",
      "כרובית", "ענב", "חלב", "שמנת",
    ],
  },
  { days: 10, keys: ["yogurt", "יוגורט", "יורט"] },
  { days: 14, keys: ["cheese", "feta", "celery", "cabbage", "tofu", "גבינ", "סלרי", "כרוב", "טופו"] },
  { days: 21, keys: ["apple", "orange", "citrus", "lemon", "carrot", "egg", "תפוח", "תפוז", "לימון", "גזר", "ביצ"] },
];

const keywordShelfLife = (text) => {
  const n = normText(text);
  if (!n) return null;
  const hit = SHELF_LIFE.find((e) => e.keys.some((k) => n.includes(k)));
  return hit ? hit.days : null;
};

// Where an item lives: the container holding most of its stock now, else the
// one it was last put in (stock records are deleted when used up, so the item
// remembers `lastContainerId`). Staging and unassigned never count.
export const homeContainer = (item, containersById) => {
  const totals = new Map();
  for (const lot of item?.lots || []) {
    const container = containersById.get(lot.containerId);
    if (!isStagingContainer(container)) {
      totals.set(container.id, (totals.get(container.id) || 0) + (lot.quantity || 0));
    }
  }
  const [best] = [...totals.entries()].sort((a, b) => b[1] - a[1]);
  if (best) return { containerId: best[0], source: "now" };
  const last = containersById.get(item?.lastContainerId);
  if (!isStagingContainer(last)) return { containerId: last.id, source: "last" };
  return null;
};

// The container a set of items mostly lives in, if one clearly leads.
const clearWinner = (weighted) => {
  const byContainer = new Map();
  let total = 0;
  for (const { containerId, weight } of weighted) {
    const entry = byContainer.get(containerId) || { weight: 0, items: 0 };
    entry.weight += weight;
    entry.items += 1;
    byContainer.set(containerId, entry);
    total += weight;
  }
  const [best] = [...byContainer.entries()].sort((a, b) => b[1].weight - a[1].weight);
  if (!best || best[1].weight / total < SIMILAR_MIN_SHARE || best[1].items < SIMILAR_MIN_ITEMS) {
    return null;
  }
  return best[0];
};

// The container similar items live in. Items carrying all the same tags decide
// first ("frozen"+"vegetables" -> the freezer, even though most "vegetables"
// are in the fridge); only if they don't, items sharing some tags vote,
// weighted by overlap. The reason names the most specific of the tags.
export const similarItemsContainer = (tags, items, containersById, excludeId = null) => {
  const mine = [...new Set(tags || [])];
  if (!mine.length) return null;
  const others = items
    .filter((other) => other.id !== excludeId)
    .map((other) => ({ tags: other.tags || [], home: homeContainer(other, containersById) }))
    .filter((other) => other.home);

  const sameTags = others.filter((o) => mine.every((t) => o.tags.includes(t)));
  let containerId = clearWinner(sameTags.map((o) => ({ containerId: o.home.containerId, weight: 1 })));
  if (!containerId) {
    containerId = clearWinner(
      others
        .map((o) => ({
          containerId: o.home.containerId,
          weight: o.tags.filter((t) => mine.includes(t)).length / new Set([...mine, ...o.tags]).size,
        }))
        .filter((o) => o.weight > 0)
    );
  }
  if (!containerId) return null;

  const usage = (t) => items.filter((i) => (i.tags || []).includes(t)).length;
  const tag = mine.reduce((rarest, t) => (usage(t) < usage(rarest) ? t : rarest));
  return { containerId, tag };
};

// Container for new stock: the item's own home, then where similar items live,
// then "Recently bought" (or nothing if that container doesn't exist).
export const suggestContainer = ({ item, tags }, items, containers) => {
  const containersById = new Map(containers.map((c) => [c.id, c]));
  const home = item ? homeContainer(item, containersById) : null;
  if (home) {
    return {
      containerId: home.containerId,
      reason: home.source === "now" ? "where it is now" : "where it was last time",
    };
  }
  const similar = similarItemsContainer(tags, items, containersById, item?.id);
  if (similar) return { containerId: similar.containerId, reason: `like your other ${similar.tag} items` };
  const staging = containers.find((c) => normText(c.name) === STAGING_NAME);
  return staging
    ? { containerId: staging.id, reason: "no clear match" }
    : { containerId: "", reason: "" };
};

// Shelf life (days) for new stock, or null for non-perishables. A freezer
// wins (frozen food keeps for months whatever the item); then what this item
// lasted last time (learned from fridge/pantry stock only), meal prep,
// Gemini's per-product estimate, and finally the keyword table.
export const suggestShelfLife = ({ item, tags, aiDays, text, container }) => {
  if (isFreezerContainer(container)) return { days: FREEZER_DAYS, reason: "frozen" };
  if (item?.shelfLifeDays) return { days: item.shelfLifeDays, reason: "like last time" };
  if ((tags || []).includes("meal prep")) return { days: MEAL_PREP_DAYS, reason: "meal prep" };
  if (aiDays) return { days: aiDays, reason: "typical for this product" };
  const days = keywordShelfLife(text);
  return days ? { days, reason: "typical for this product" } : null;
};

// Fill a receipt row's tags, container and expiry from the suggestions above,
// keeping anything the user already changed (the *Touched flags).
export const withSuggestions = (row, items, containers, today = dayjs()) => {
  const item = row.matchedId ? items.find((i) => i.id === row.matchedId) || null : null;
  const tags = row.tagsTouched
    ? row.tags
    : item && (item.tags || []).length ? item.tags : row.aiTags || [];
  const container = row.containerTouched
    ? { containerId: row.containerId, reason: row.containerReason }
    : suggestContainer({ item, tags }, items, containers);
  const next = { ...row, tags, containerId: container.containerId, containerReason: container.reason };
  if (!row.expiryTouched) {
    const life = suggestShelfLife({
      item,
      tags,
      aiDays: row.aiShelfLife,
      text: `${row.name || ""} ${row.receiptName || ""}`,
      container: containers.find((c) => c.id === container.containerId),
    });
    next.expirationDate = life ? today.startOf("day").add(life.days, "day") : null;
    next.expiryReason = life ? life.reason : "";
  }
  return next;
};

// Lines for the same product become one row with the quantities added: same
// matched item, else same real barcode, else same printed text.
const rowKey = (row) => {
  if (row.matchedId) return `item:${row.matchedId}`;
  if (isRealBarcode(row.barcode)) return `barcode:${normBarcode(row.barcode)}`;
  return `text:${normText(row.receiptName || row.name)}`;
};

export const collapseRows = (rows) => {
  const byKey = new Map();
  for (const row of rows) {
    const key = rowKey(row);
    const kept = byKey.get(key);
    if (kept) {
      kept.quantity = (Number(kept.quantity) || 1) + (Number(row.quantity) || 1);
      kept.lines += row.lines || 1;
      kept.include = kept.include || row.include;
    } else {
      byKey.set(key, { ...row, lines: row.lines || 1 });
    }
  }
  return [...byKey.values()];
};
