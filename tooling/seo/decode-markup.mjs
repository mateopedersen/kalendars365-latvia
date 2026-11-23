const characters = { amp: '&', apos: "'", '#39': "'", gt: '>', lt: '<', quot: '"' };

export function decodeMarkup(text) {
  return String(text ?? '').replace(/&(amp|apos|#39|gt|lt|quot);/g, (_, name) => characters[name]);
}
