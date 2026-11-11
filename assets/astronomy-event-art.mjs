import {astronomyArtCatalog} from './astronomy-art-catalog.mjs';
const phaseKeys={'New Moon':'moon-new','First Quarter':'moon-first','Full Moon':'moon-full','Last Quarter':'moon-last'};
const eclipseKinds={solar:new Set(['partial','annular','total']),lunar:new Set(['penumbral','partial','total'])};
export function astronomyEventArt(event){
 let key='observatory';
 if(event.kind==='phase')key=phaseKeys[event.phaseKey]||key;
 else if(event.kind==='season'){
  const month=Number(String(event.date||event.utc||'').slice(5,7));
  if(event.phenomenon==='Perihelion')key='perihelion';
  else if(event.phenomenon==='Aphelion')key='aphelion';
  else if(event.phenomenon==='Equinox')key=({3:'season-spring',9:'season-autumn'})[month]||key;
  else if(event.phenomenon==='Solstice')key=({6:'season-summer',12:'season-winter'})[month]||key;
 }else if(eclipseKinds[event.kind]){
  // The visible local phase takes priority over the eclipse's global classification.
  const type=String(event.visible&&event.localKind?event.localKind:event.eclipseKind||'').toLowerCase();
  if(eclipseKinds[event.kind].has(type))key=event.kind+'-'+type;
 }else if(event.kind==='meteor')key='perseids';
 return astronomyArtCatalog[key];
}
