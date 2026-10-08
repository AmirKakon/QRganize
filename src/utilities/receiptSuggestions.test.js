import dayjs from "dayjs";
import {
  collapseRows,
  matchExisting,
  suggestContainer,
  suggestShelfLife,
  withSuggestions,
} from "./receiptSuggestions";

const containers = [
  { id: "fridge", name: "Fridge" },
  { id: "freezer", name: "Freezer" },
  { id: "pantry", name: "Pantry" },
  { id: "inbox", name: "Recently bought" },
];
const stock = (containerId, quantity = 1) => ({ containerId, quantity });
const item = (id, tags, lots = [], extra = {}) => ({ id, name: id, tags, lots, ...extra });

describe("matchExisting", () => {
  const inventory = [
    { id: "7290000000017", name: "Cucumbers", aliases: ["מלפפון"] },
    { id: "tomato", name: "Tomato", aliases: ["עגבניות"] },
    { id: "cherry", name: "Cherry tomatoes", aliases: ["עגבניות שרי"] },
    { id: "milk", name: "Milk", aliases: ["חלב"] },
    { id: "protein-milk", name: "Protein milk", aliases: ["חלב חלבון"] },
    { id: "dish", name: "Mexican chicken drumsticks", tags: ["meal prep", "chicken"] },
  ];

  test.each([
    ["a barcode", ["?", "", "07290000000017"], "Cucumbers"],
    ["an alternate name", ["מלפפון", "", ""], "Cucumbers"],
    ["an alternate name despite vowel marks", ["מִלְפָפוֹן", "", ""], "Cucumbers"],
    ["the English name", ["xx-garbled", "Cucumbers", ""], "Cucumbers"],
    ["an alternate name inside the line", ["מלפפון חממה", "Greenhouse cucumbers", ""], "Cucumbers"],
    ["the longest alternate name", ["עגבניות שרי", "", ""], "Cherry tomatoes"],
    ["an exact two-word name over a shorter one", ["חלב חלבון", "", ""], "Protein milk"],
  ])("matches by %s", (_, [receiptName, englishName, barcode], expected) => {
    expect(matchExisting(receiptName, englishName, barcode, inventory)?.name).toBe(expected);
  });

  test("never auto-matches a homemade meal prep dish", () => {
    expect(matchExisting("שוקיים עוף", "Chicken drumsticks", "", inventory)).toBeNull();
  });
});

describe("collapseRows", () => {
  test.each([
    ["the same matched item", { matchedId: "milk" }, { matchedId: "milk", receiptName: "חלב 3%" }],
    ["the same barcode", { barcode: "7290000000017" }, { barcode: "07290000000017" }],
    ["the same printed text", { receiptName: "מלפפון" }, { receiptName: " מלפפון " }],
  ])("combines two lines with %s and adds their quantities", (_, a, b) => {
    const rows = collapseRows([
      { name: "x", quantity: 1, include: true, ...a },
      { name: "y", quantity: 2, include: true, ...b },
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ quantity: 3, lines: 2 });
  });

  test("keeps different products apart, and short store codes are not barcodes", () => {
    const rows = collapseRows([
      { receiptName: "עגבניה", barcode: "22", quantity: 1 },
      { receiptName: "מלפפון", barcode: "22", quantity: 1 },
    ]);
    expect(rows).toHaveLength(2);
  });
});

describe("suggestContainer", () => {
  const chickenA = item("chicken-a", ["chicken", "meat"], [stock("freezer", 2)]);
  const chickenB = item("chicken-b", ["chicken", "meat"], [stock("freezer")]);
  const frozenPeas = item("peas", ["frozen", "vegetables"], [stock("freezer")]);
  const frozenCorn = item("corn", ["frozen", "vegetables"], [stock("freezer")]);
  const cucumbers = item("cucumbers", ["vegetables"], [stock("fridge", 3)]);
  const tomatoes = item("tomatoes", ["vegetables"], [stock("fridge")]);
  const lettuce = item("lettuce", ["vegetables"], [stock("fridge")]);
  const items = [chickenA, chickenB, frozenPeas, frozenCorn, cucumbers, tomatoes, lettuce];

  test.each([
    ["an item's current home", { item: cucumbers }, "fridge", "where it is now"],
    ["where an out-of-stock item was last time",
      { item: item("milk", [], [], { lastContainerId: "fridge" }) }, "fridge", "where it was last time"],
    ["where similar items live", { tags: ["chicken", "meat"] }, "freezer", "like your other chicken items"],
    ["frozen vegetables to the freezer", { tags: ["frozen", "vegetables"] }, "freezer", "like your other frozen items"],
    ["fresh vegetables to the fridge", { tags: ["vegetables"] }, "fridge", "like your other vegetables items"],
    ["Recently bought when nothing matches", { tags: ["cleaning"] }, "inbox", "no clear match"],
    ["Recently bought when only staging stock exists",
      { item: item("bread", [], [stock("inbox")]) }, "inbox", "no clear match"],
  ])("suggests %s", (_, input, containerId, reason) => {
    expect(suggestContainer(input, items, containers)).toEqual({ containerId, reason });
  });

  test("needs a clear winner backed by more than one item", () => {
    const oneSnack = [item("chips", ["snacks"], [stock("pantry")])];
    expect(suggestContainer({ tags: ["snacks"] }, oneSnack, containers).containerId).toBe("inbox");
  });

  test("leaves the container empty when there is no Recently bought container", () => {
    const withoutInbox = containers.filter((c) => c.id !== "inbox");
    expect(suggestContainer({ tags: ["cleaning"] }, items, withoutInbox)).toEqual({ containerId: "", reason: "" });
  });
});

describe("suggestShelfLife", () => {
  const fridge = containers[0];
  const freezer = containers[1];

  test.each([
    ["the freezer over the item's history", { item: { shelfLifeDays: 5 }, container: freezer }, 90, "frozen"],
    ["the item's own history", { item: { shelfLifeDays: 14 }, aiDays: 7, container: fridge }, 14, "like last time"],
    ["meal prep", { tags: ["meal prep"], aiDays: 30, container: fridge }, 4, "meal prep"],
    ["Gemini's estimate", { aiDays: 7, text: "cucumbers", container: fridge }, 7, "typical for this product"],
    ["the keyword table as a last resort", { text: "Cucumbers מלפפון", container: fridge }, 7, "typical for this product"],
  ])("uses %s", (_, input, days, reason) => {
    expect(suggestShelfLife(input)).toEqual({ days, reason });
  });

  test("suggests nothing for non-perishables", () => {
    expect(suggestShelfLife({ text: "Garbage bags", container: containers[2] })).toBeNull();
  });
});

describe("withSuggestions", () => {
  const today = dayjs("2026-10-08");
  const chicken = item("chicken", ["chicken", "meat"], [stock("freezer")]);
  const wings = item("wings", ["chicken", "meat"], [stock("freezer")]);

  test("fills tags, container and expiry for a new item", () => {
    const row = withSuggestions(
      { name: "Chicken thighs", aiTags: ["chicken", "meat"], aiShelfLife: 2 },
      [chicken, wings], containers, today);
    expect(row).toMatchObject({ tags: ["chicken", "meat"], containerId: "freezer", expiryReason: "frozen" });
    expect(row.expirationDate.format("YYYY-MM-DD")).toBe("2027-01-06");
  });

  test("keeps the user's container and recomputes expiry for it", () => {
    const row = withSuggestions(
      { name: "Chicken thighs", aiTags: ["chicken"], aiShelfLife: 2, containerTouched: true, containerId: "fridge", containerReason: "set by you" },
      [chicken, wings], containers, today);
    expect(row).toMatchObject({ containerId: "fridge", containerReason: "set by you", expiryReason: "typical for this product" });
    expect(row.expirationDate.format("YYYY-MM-DD")).toBe("2026-10-10");
  });

  test("keeps a date the user set", () => {
    const date = dayjs("2026-12-01");
    const row = withSuggestions({ name: "Milk", expiryTouched: true, expirationDate: date }, [], containers, today);
    expect(row.expirationDate).toBe(date);
  });
});
