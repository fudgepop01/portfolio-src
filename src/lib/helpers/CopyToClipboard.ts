// https://www.30secondsofcode.org/blog/s/copy-text-to-clipboard-with-javascript
export const copyToClipboard = str => {
  navigator.clipboard.writeText(encodeURI(str));
};