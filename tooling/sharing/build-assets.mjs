import fs from 'node:fs';
import crypto from 'node:crypto';
import * as allIcons from 'simple-icons';
import {shareServices} from '../../assets/share-services.mjs';
const icons=new Map(Object.values(allIcons).filter(i=>i&&typeof i.path==='string').map(i=>[i.slug,i]));
const own={share:'<path d="M12 16V3m-5 5 5-5 5 5M4 14v6a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-6"/>',link:'<path d="m10 13 4-4m-6 7-1 1a4 4 0 0 1-6-6l5-5a4 4 0 0 1 6 0m0 12a4 4 0 0 0 6 0l5-5a4 4 0 0 0-6-6l-1 1"/>',text:'<path d="M5 5h14M5 10h14M5 15h9M5 20h11"/>',image:'<rect x="3" y="3" width="18" height="18" rx="3"/><path d="m4 17 5-6 4 5 3-3 5 5"/><circle cx="16" cy="8" r="2"/>',qr:'<path d="M3 3h6v6H3zm12 0h6v6h-6zM3 15h6v6H3zm12 0h3v3h-3zm3 3h3v3h-3M12 3v3m0 6h3m-3 3v6m3-9h6m-3 0v3"/>',code:'<path d="m8 5-6 7 6 7m8-14 6 7-6 7m-3-16-2 20"/>',mail:'<rect x="2" y="4" width="20" height="16" rx="3"/><path d="m3 5 9 8 9-8"/>'};
const esc=s=>s.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const records=[],symbols=shareServices.map(s=>{const i=icons.get(s.icon);let art;
 if(i){art=`<path d="${i.path}"/>`;records.push({id:s.id,provider:'Simple Icons',version:'16.37.0',source:i.source,license:'CC0-1.0'});}
 else if(own[s.icon]){art=`<g fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${own[s.icon]}</g>`;records.push({id:s.id,provider:'Kalendārs365',license:'Original vector'});}
 else{const label=({draugiem:'dr',linkedin:'in',slack:'S',teams:'T',outlook:'O',onenote:'N',qq:'QQ',qzone:'Q',yahoo:'Y',googlechat:'G',markdown:'M↓'})[s.id]||s.name.slice(0,2);art=`<text x="12" y="17" text-anchor="middle" font-family="Arial,sans-serif" font-size="${label.length>2?10:14}" font-weight="700" fill="currentColor">${esc(label)}</text>`;records.push({id:s.id,provider:'Kalendārs365 name monogram',license:'Original vector'});}
 return `<symbol id="s-${s.id}" viewBox="0 0 24 24">${art}</symbol>`;});
const svg=`<svg xmlns="http://www.w3.org/2000/svg"><defs>${symbols.join('')}</defs></svg>\n`;fs.writeFileSync('assets/share-icons.svg',svg);
fs.copyFileSync(new URL('node_modules/qrcode-generator/dist/qrcode.mjs',import.meta.url),'assets/vendor/share-qrcode.mjs');
const sha=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
fs.writeFileSync('_data/share-art.json',JSON.stringify({icons:records,source:'tooling/sharing/build-assets.mjs',spriteSha256:sha('assets/share-icons.svg'),qr:{name:'qrcode-generator',version:'2.0.4',license:'MIT',source:'https://github.com/kazuhikoarase/qrcode-generator',sha256:sha('assets/vendor/share-qrcode.mjs')}},null,2)+'\n');
console.log(JSON.stringify({icons:symbols.length,originalMonograms:records.filter(r=>r.provider.includes('monogram')).map(r=>r.id),spriteBytes:Buffer.byteLength(svg)}));
