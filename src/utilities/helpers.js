// Neutral "box" placeholder shown for items/containers with no photo (or a
// broken image URL). Theme-agnostic gray line art on a transparent ground.
export const PLACEHOLDER_IMAGE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 24 24">` +
      `<rect width="24" height="24" fill="#e0e0e0"/>` +
      `<path fill="none" stroke="#9e9e9e" stroke-width="1.2" stroke-linejoin="round" ` +
      `d="M12 3 4 7v10l8 4 8-4V7z M4 7l8 4 8-4 M12 11v10"/>` +
    `</svg>`
  );

export const getImageSrc = (image) => {
    if (!image) return PLACEHOLDER_IMAGE;
    if (image.startsWith("http")) return image;
    if (!image.startsWith("data:image"))
      return `data:image/png;base64,${image}`;
    return image;
  };

export const generateRandomId = (length = 10) => {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return Math.floor(min + Math.random() * (max - min + 1)).toString();
};


// An item answers to its name and its alternate names (e.g. the Hebrew text a
// receipt prints for an item named in English), so every search checks both.
export const itemNames = (item) =>
  [item?.name, ...(item?.aliases || [])].filter(Boolean);

// Search also matches tags, so typing "chicken" lists every chicken item.
// Receipt matching deliberately uses itemNames only: a tag is a group, not a
// name, and would match many items.
export const itemMatches = (item, query) => {
  const q = String(query || "").trim().toLowerCase();
  if (!q) return true;
  return [...itemNames(item), ...(item?.tags || [])].some((n) => n.toLowerCase().includes(q));
};

// Tags in use across items, most used first: [{ tag, count }].
export const tagCounts = (items) => {
  const counts = {};
  (items || []).forEach((i) => (i.tags || []).forEach((t) => (counts[t] = (counts[t] || 0) + 1)));
  return Object.entries(counts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
};

// For MUI Autocomplete: filter options by name, alternate name or tag.
export const filterItemOptions = (options, { inputValue }) =>
  options.filter((o) => itemMatches(o, inputValue));
