const entities = {'&amp;': '&', '&quot;': '"', '&#39;': "'", '&apos;': "'", '&lt;': '<', '&gt;': '>'};

function decodeMarkupText(value) {
  return value.replace(/&(?:amp|quot|#39|apos|lt|gt);/g, entity => entities[entity]);
}

module.exports = {decodeMarkupText};
