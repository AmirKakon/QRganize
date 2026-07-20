# QRganize — UX & Flow Review

_Reviewed against the live app (`2.17.0`) on 2026-07-19, walking the real user flows in-browser. Inventory under test: 146 items, 84 in stock, 14 containers, 2 areas._

**Method:** clicked through every page and the main journeys (browse → item → stock, containers → contents, areas, duplicates, labels, shopping list, expiring, theme). Emphasis on how intuitive each flow feels, not correctness.

**Not fully testable in a headless browser (camera/file blocked):** live barcode/QR scanning and receipt-photo upload. The receipt scanner's parsing + matching + merge were validated separately in earlier sessions and work.

> **Update 2026-07-19 — implemented (v2.18.0):** #1, #2, #3, #4, #7, #8, #10, #12 fully done; #5 done (Home/QR now open on the list, scanning is a deliberate tab); #6 done (Barcodes section added to the item page).
>
> **Update 2026-07-19 — deferred batch (v2.19.0):** 🔵 **Home dashboard** shipped — Home now opens on an "Overview" tab with headline counts (items / in-stock / expiring / expired / shopping-list / containers, each a shortcut) and a "next to expire" peek. **#11 (partial):** shopping list now has a **free-text add** ("Add something to buy") for items not yet in inventory. **Still deferred:** #9 header labels, #11's per-card quick-add from the grid, #13 container cards, and 🔵 global search / categories.

---

## Overall impression

The app is **genuinely pleasant and coherent** — consistent visual language (green primary, red destructive, chips for status), clean dark/light themes, and friendly empty states. The **lot/batch model is the standout**: it's modeled in the UI far better than most hobby inventory apps, and the per-batch controls feel natural.

The rough edges are mostly **(a) a few small data/display bugs, (b) discoverability**, and **(c) the app opening straight into a camera instead of showing you your stuff.** None are architectural; all are addressable incrementally.

---

## Prioritized fixes

| # | Finding | Severity | Effort | Where |
|---|---------|----------|--------|-------|
| 1 | `Contents: 22.353` — decimal, ambiguous label | 🔴 High | S | `ContainerContents` |
| 2 | "Access token updated" toast fires ~every minute | 🔴 High | S | `App.js` |
| 3 | Duplicate detector over-eager (false-positive groups) | 🟡 Med | S–M | `DuplicatesPage` |
| 4 | Broken item images show broken-icon, no fallback | 🟡 Med | S | `ItemList`, `helpers` |
| 5 | App opens into live camera (Home & QR) | 🟡 Med | M | `HomePageTabs`, `QrCodeTabs` |
| 6 | Multi-barcode feature has no UI on the item page | 🟡 Med | M | `ItemDetails` |
| 7 | 2 legacy lots have fractional quantities | 🟡 Med | S | data cleanup |
| 8 | "Add Stock" defaults container to "Unassigned" | 🟡 Med | S | `StockList` |
| 9 | Icon-only header, 10 icons, low discoverability | 🟡 Med | M | `Header` |
| 10 | Item form fields overflow right edge (desktop) | 🟢 Low | S | `ItemDetails` |
| 11 | Shopping list: no quick-add / no free-text items | 🟢 Low | M | shopping flow |
| 12 | No-photo items show a "person" avatar | 🟢 Low | S | placeholders |
| 13 | Container list = wall of QR thumbnails, no counts/area | 🟢 Low | M | `ContainerList` |

Severity = user impact · Effort: S ≈ hours, M ≈ a day.

---

## What works well (keep it)

- **Lot/batch UI.** `In stock: N` + per-batch rows (`No date · Fridge · ×1`) with **Use / Edit / Toss**, plus **"Use one (soonest to expire)"** and an inline **Add Stock** form (container + qty + expiry). This is the best part of the app — clear and low-friction.
- **Areas page.** Grouped by area with counts, an **Unassigned** bucket that surfaces stragglers (Pantry), inline add/rename/delete. Clean.
- **Find Duplicates.** Card per group, keeper radio (defaults to most-stock), explicit **"Merge N into selected"** and **"Not duplicates"** escape hatch, plus a confirm dialog listing exactly what gets deleted. The concept lands.
- **Print Labels.** Type toggle (Containers-QR / Items-barcode), search, select-all/clear, Print disabled until selection, and a clear empty-preview hint.
- **Empty states** everywhere are friendly and instructive ("Your shopping list is empty. Turn on 'Add to Shopping List'…").
- **Expiring Soon.** Color-coded day chip (`40d` green) + inline Used/Toss.
- **Dark & light** both look finished; the manual toggle with a "Switch to…" tooltip is a nice touch.

---

## 🔴 Bugs / clearly-wrong

### 1. `Contents: 22.353` on the container page
The container header shows `Contents: {sum of lot quantities}`. Two problems:
- **The label is ambiguous** — a bare number reads like "22 items" but it's actually total units across batches.
- **The decimal looks broken.** It's caused entirely by two legacy fractional lots (see #7).
- **Fix:** label it (`22 units` / `14 items · 22 units`) and round the display; ideally count distinct items *and* total units.

### 2. "Access token updated" toast every ~minute
The app refreshes the auth token on a 60-second timer and pops a top-center **"Access token updated"** snackbar each time (also on some navigations). It's meaningless to users and visually jarring (it even nudges the tab bar's vertical position). **Fix:** remove that `setMessage("Access token updated")` — only surface auth *failures*.

---

## 🟡 UX friction / polish

### 3. Duplicate detector is over-eager
Real groups it flagged today included clearly-distinct products:
- *Nescafe barista / original / decaf* (3 different coffees)
- *Onion* grouped with *"…sour cream and onion chips"* (substring "onion")
- *Finish Dishwasher Salt* vs *Finish dishwasher tablets*

The containment rule (one name contains the other, ≥4 chars) is too loose. **Fix:** require whole-word containment, raise the similarity threshold, or skip containment when the longer name adds a distinguishing noun. The "Not duplicates" button saves it, but 8 groups where most are non-dupes trains people to ignore the tool.

### 4. Broken images have no fallback
At least one item (Hebrew eggs) renders the browser's broken-image icon in the grid. **Fix:** `onError` → a neutral placeholder (and use it for no-image items too — see #12).

### 5. The app opens into a live camera
Both **Home** and **QR** default to a full camera scanner (permission prompt + camera spin-up on every visit). For a returning user with 146 items, the first thing you see is a gray camera box, not your inventory. **Fix:** default Home to **View Items** (or a dashboard — see Opportunities) and make "Scan" a deliberate tab/action. Scanning is a *task*, not a *home*.

### 6. Multi-barcode has no item-page UI
The new "one item → many barcodes" capability only gets populated via merge or receipt-link. On the item page you see a single **"Item ID"** and no way to view or add alternate barcodes. **Fix:** add a small **Barcodes** section (list current aliases + "add barcode" / scan). Otherwise the feature is invisible and hard to use deliberately.

### 7. Two legacy lots have fractional quantities
`גבינות נעם 9% = 0.308` and `ענבים ירוקים = 1.045` — leftovers from before weighed-item quantities were normalized to whole numbers. They're the sole cause of #1's decimal. **Fix:** one-time data pass to round these two lots (or set to 1).

### 8. "Add Stock" defaults container to "Unassigned"
Easy to add stock and forget to file it, leaving unassigned lots. **Fix:** default to the item's existing/most-recent container when it has one.

### 9. Icon-only header (10 icons)
Meaning isn't obvious without hovering — e.g. the merge glyph = Find Duplicates, warehouse = Areas, the stacked-boxes = Add Container. **Fix:** consider text labels (or an overflow menu grouping the less-frequent actions) — especially valuable for anyone you share this with.

### 10. Item form fields overflow the right edge (desktop)
On the item detail page the ID/Name/Price fields run under/past the right edge and the header icons get clipped. **Fix:** constrain the form to a max-width and center it.

### 11. Shopping list is items-only, per-item toggle
You can only add to the list by opening an item and flipping "Add to Shopping List." There's no quick-add from the grid and no way to jot an arbitrary item ("paper towels") that isn't already in inventory. **Fix (later):** quick-add control + free-text entries.

### 12. No-photo items show a "person" avatar
The Expiring list uses a generic person silhouette for imageless goods — wrong metaphor. **Fix:** a box/package placeholder (shared with #4).

### 13. Container list = wall of QR codes
Containers without a photo show their QR as the thumbnail; browsing is hard and there's no item-count or area shown per container. **Fix:** a cleaner container card (icon + name + area + item count), keeping QR for the print/scan flow.

### Minor
- **Bidi/RTL:** Hebrew names with `×N` render awkwardly (`2×` on the wrong side).
- **View Items sort order** isn't obviously alphabetical; add explicit sort options.
- **"Item ID" field** (the barcode) is the first, editable-looking field on the item page — technical and risky to edit; consider read-only / de-emphasize.

---

## 🔵 Bigger opportunities

- **Home dashboard** (totals: items, in stock, expiring soon, low stock, shopping-list count) as the landing view instead of a camera. This single change would most improve "how it feels."
- **Global search** across items + containers.
- **Sort/filter** (by expiry, quantity, price) on the items grid.
- **Categories / tags** — would also let the shopping list and "what's expiring" get much smarter.
- **Barcode-alias management** (see #6) to make the multi-barcode feature first-class.

---

## Suggested next batch (small, high-impact)

If we do one quick pass, I'd take: **#2 (kill the token toast)**, **#1 + #7 (Contents label + round the 2 fractional lots)**, **#4 + #12 (image placeholder)**, and **#8 (Add Stock container default)**. All small, all daily-visible. Then a second pass for **#5 (don't open into the camera)** and **#6 (barcode-alias UI)**.
