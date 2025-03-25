export const getImageSrc = (image) => {
    if (image && image.startsWith("http")) return image;
    if (image && !image.startsWith("data:image"))
      return `data:image/png;base64,${image}`;
    return image;
  };