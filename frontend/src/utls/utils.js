export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    console.log("Copied to clipboard: ", text);
  } catch (err) {
    console.error(err);
  }
};
