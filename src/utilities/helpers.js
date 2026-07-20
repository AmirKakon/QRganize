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

