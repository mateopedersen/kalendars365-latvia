// Recolour material accents in the SVG itself. Never tint the rendered image:
// paper, metal, skin, shadows and the original geometry retain their detail.
// Carmine and white follow the Latvian flag's palette; hex values are screen
// approximations, not a claim of a colour-managed Pantone reproduction.
const materials = {
  wine: ['#a33143', '#9e1b34', '#751226', '#470b19'],
  teal: ['#a33143', '#9e1b34', '#751226', '#470b19'],
  jade: ['#a33143', '#9e1b34', '#751226', '#470b19'],
  dark: ['#511b29', '#27141a'],
  navy: ['#65424c', '#3e222c', '#231419'],
  ink: ['#65424c', '#3e222c', '#231419'],
};
const accents = new Map(Object.entries({
  '#bf6a83':'#a33143', '#973f5a':'#9e1b34', '#5d2036':'#581020',
  '#b7607b':'#a33143', '#923b57':'#9e1b34', '#561b33':'#581020',
  '#c5758e':'#a33143', '#a03c5a':'#9e1b34', '#7e203d':'#751226', '#4b1027':'#470b19',
  '#8b2b40':'#9e1b34', '#92344f':'#9e1b34', '#913e55':'#9e1b34',
  '#bc6d80':'#9e1b34', '#a64961':'#751226',
  '#2a625b':'#751226', '#153a3a':'#33121c', '#0f2d31':'#27141a',
  '#25584e':'#581020', '#284a44':'#511b29', '#285a54':'#751226',
  '#214e49':'#581020', '#1c4c47':'#470b19', '#345556':'#511b29',
  '#344e4e':'#33121c', '#2d584a':'#511b29',
  '#9db5a9':'#969092', '#abbcaf':'#969092',
}));

export function latviaArtwork(svg) {
  return svg.replace(/<(linearGradient|radialGradient)\b([^>]*\bid="([^"]+)"[^>]*)>([\s\S]*?)<\/\1>/g,
    (whole, tag, attributes, id, body) => {
      const key = Object.keys(materials).find(name => id === name || id.endsWith('-'+name));
      if (!key) return whole;
      const colors = materials[key];
      let stop = 0;
      return `<${tag}${attributes}>${body.replace(/stop-color="#[\da-fA-F]+"/g, () => `stop-color="${colors[Math.min(stop++, colors.length-1)]}"`)}</${tag}>`;
    }).replace(/#[\da-fA-F]{6}\b/g, color => accents.get(color.toLowerCase()) || color);
}
