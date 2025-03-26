export const getImageSrc = (image) => {
    if (image && image.startsWith("http")) return image;
    if (image && !image.startsWith("data:image"))
      return `data:image/png;base64,${image}`;
    return image;
  };

export const generateRandomId = (length = 10) => {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return Math.floor(min + Math.random() * (max - min + 1)).toString();
};

