import fs from 'node:fs';
const photo=name=>'data:image/jpeg;base64,'+fs.readFileSync(`assets/astronomy/${name}-disc.jpg`).toString('base64');
const defs='<defs><filter id="shadow" x="-40%" y="-40%" width="180%" height="190%"><feDropShadow dx="0" dy="9" stdDeviation="9" flood-color="#17202e" flood-opacity=".25"/></filter><clipPath id="disc"><circle cx="0" cy="0" r="1"/></clipPath></defs>';
function disc(name,x,y,r,shade=''){return `<g transform="translate(${x} ${y})" filter="url(#shadow)"><g transform="scale(${r})" clip-path="url(#disc)"><image href="${photo(name)}" x="-1" y="-1" width="2" height="2"/>${shade}</g></g>`;}
for(const [name,content] of [
 ['moon',disc('moon',160,125,108)],
 ['phases',disc('moon',66,133,48,'<path d="M0 -1A1 1 0 0 0 0 1Z" fill="#02040a" opacity=".96"/>')+disc('moon',160,113,67)+disc('moon',257,133,47,'<path d="M0 -1A1 1 0 0 1 0 1Z" fill="#02040a" opacity=".96"/>')],
 ['astronomy',disc('earth',136,119,94)+disc('moon',244,185,48)]
])fs.writeFileSync(`assets/category-art/${name}.svg`,`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 260"><title>${name==='moon'?'Mēness':name==='phases'?'Mēness fāžu ilustrācija':'Zeme un Mēness'}</title><desc>Real NASA Apollo 17 mission photographs, source AS17-152-23311 and AS17-148-22727. Decorative photographic artwork; not a date-specific observation. Photo masks in the phases icon are illustrative.</desc>${defs}${content}</svg>`);
console.log('Built photo-based Moon, phases and Earth/Moon SVG artwork from NASA originals.');
