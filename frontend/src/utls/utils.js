export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    console.log("Copied to clipboard: ", text);
  } catch (err) {
    console.error(err);
  }
};

export const isImageFile = (url, type) => {
  if (type) return type.startsWith("image/");
  if (url) return /\.(jpeg|jpg|gif|png|webp)$/i.test(url);
  return false;
};

export const isVideoFile = (url, type) => {
  if (type) return type.startsWith("video/");
  if (url) return /\.(mp4|webm|ogg)$/i.test(url);
  return false;
};
