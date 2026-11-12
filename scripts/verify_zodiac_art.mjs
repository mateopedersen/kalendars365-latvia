import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
export function verifyZodiacArtifacts(root=process.cwd(),catalog=JSON.parse(readFileSync(path.join(root,'_data/zodiac-models.json'),'utf8'))){
 const profiles=JSON.parse(readFileSync(path.join(root,'_data/horoscope/profiles.json'),'utf8')).profiles;
 const sources=['scripts/build_zodiac_art.mjs','scripts/artwork/zodiac-sculptures.mjs','_data/horoscope/profiles.json'];
 const outputs=profiles.flatMap(p=>[`assets/zodiac/${p.slug}.svg`,`assets/zodiac/models/${p.slug}.bin`]).concat(['assets/zodiac/atlas.svg','_includes/ascendant-wheel.svg','lib/zodiac-versions.mjs','assets/zodiac-models.mjs']);
 for(const [kind,files] of [['sources',sources],['artifacts',outputs]])for(const file of files){
  const expected=catalog[kind]?.[file];
  const actual=createHash('sha256').update(readFileSync(path.join(root,file))).digest('hex');
  if(!expected||actual!==expected)throw Error(`Zodiac ${kind} changed: ${file}; run node scripts/build_zodiac_art.mjs and refresh affected social covers before publication.`);
 }
 return {sculptures:profiles.length,sources:sources.length,artifacts:outputs.length,policy:'verified-prebuilt-artwork'};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))console.log(JSON.stringify(verifyZodiacArtifacts()));
