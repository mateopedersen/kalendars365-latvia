(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./calendar-core.js'):root.CalendarCore);if(typeof module==='object'&&module.exports)module.exports=api;else root.GardenCalendarCore=api;})(typeof globalThis!=='undefined'?globalThis:this,function(C){
 'use strict';
 const normalize=text=>String(text||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('lv-LV');
 function resolveCrop(crop){
  const old=crop.preservedCalendarActions||[],refined=crop.calendarRefinements||[];
  const records=refined.length?(crop.calendarRefinementPolicy==='append'?[...old,...refined]:refined):old;
  const actions=records.map(a=>({label:a.label||a.kind,task:a.task||(/sēja/i.test(a.label||a.kind)?'sow':'plant'),months:a.months||[],window:a.window||(a.months||[]).map(n=>C.months[n-1]).join(' · '),condition:[a.condition,a.datePrecision,a.precision].filter(Boolean).join(' '),places:a.cultivation||['field'],sourceIds:a.sourceIds||crop.sourceIds}));
  for(const period of crop.harvest?.periods||[])actions.push({label:'Ražas novākšana',task:'harvest',months:period.months||[],window:period.label,condition:[period.scope,period.precision].filter(Boolean).join(' '),places:period.cultivation||['field'],sourceIds:period.sourceIds||crop.sourceIds});
  return {id:crop.id,name:crop.name,canonical:crop.canonical,intro:crop.intro.text,scope:crop.scope,readiness:crop.harvest?.readinessBasis||'',actions};
 }
 function matchingActions(crop,filters={}){return crop.actions.filter(a=>(!Number(filters.month)||a.months.includes(Number(filters.month)))&&(!filters.task||filters.task==='all'||a.task===filters.task)&&(!filters.place||filters.place==='all'||a.places.includes(filters.place)));}
 function matches(crop,filters={}){return normalize([crop.name,crop.intro].join(' ')).includes(normalize(filters.query).trim())&&matchingActions(crop,filters).length>0;}
 function date(value){C.parseISO(value);return value;}
 function reminder(item){
  if(!item||typeof item!=='object')throw Error('Nederīgs dārza atgādinājums.');
  const keys={id:120,cropId:60,cropName:100,note:160,place:100,region:100};const out={};
  for(const [key,max] of Object.entries(keys)){if(typeof item[key]!=='string'||!item[key].trim()||item[key].length>max)throw Error('Pārbaudi dārza ieraksta laukus.');out[key]=item[key];}
  out.date=date(item.date);out.task=['sow','plant','harvest','other'].includes(item.task)?item.task:'other';return out;
 }
 function state(value={},strict=false){
  if(!value||typeof value!=='object')throw Error('Nederīgs dārza plāna saturs.');
  if(strict&&(!Array.isArray(value.saved)||value.saved.some(id=>typeof id!=='string'||!/^[a-z0-9-]{1,60}$/.test(id))))throw Error('Nederīgs saglabāto kultūru saraksts.');
  if(strict&&['place','region'].some(key=>typeof value[key]!=='string'||value[key].length>100))throw Error('Nederīga vietas vai reģiona piezīme.');
  const out={saved:Array.isArray(value.saved)?[...new Set(value.saved.filter(id=>typeof id==='string'&&/^[a-z0-9-]{1,60}$/.test(id)))]:[],reminders:[],place:typeof value.place==='string'?value.place:'Atklātā laukā',region:typeof value.region==='string'?value.region:'Piekraste'};
  if(!Array.isArray(value.reminders)){if(strict)throw Error('Dublējumā nav atgādinājumu saraksta.');return out;}
  if(value.reminders.length>500)throw Error('Plānā var saglabāt līdz 500 ierakstiem.');
  for(const item of value.reminders){try{out.reminders.push(reminder(item));}catch(error){if(strict)throw error;}}
  return out;
 }
 function merge(current,incoming){
  const a=state(current,true),b=state(incoming,true),result={...a,saved:[...new Set([...a.saved,...b.saved])]},ids=new Set(a.reminders.map(r=>r.id));
  const signature=r=>JSON.stringify([r.cropId,r.date,r.task,r.note,r.place,r.region]),seen=new Set(a.reminders.map(signature));
  for(const item of b.reminders){if(seen.has(signature(item)))continue;const copy={...item};let suffix=0;while(ids.has(copy.id))copy.id=item.id.slice(0,100)+'-import-'+(++suffix);ids.add(copy.id);seen.add(signature(item));result.reminders.push(copy);}
  if(result.reminders.length>500)throw Error('Apvienotajā plānā būtu vairāk par 500 ierakstiem.');return result;
 }
 function parseBackup(text){const value=JSON.parse(text);if(value.schema!=='kalendars365-garden'||value.version!==1)throw Error('Izvēlies Kalendārs365 dārza plāna JSON failu.');return state(value.state,true);}
 function backup(value){return JSON.stringify({schema:'kalendars365-garden',version:1,state:state(value,true)},null,2);}
 function ics(value,now=new Date()){
  const records=state(value,true).reminders;if(!records.length)throw Error('Vispirms pievieno dārza darbu.');
  const escape=v=>String(v).replace(/\\/g,'\\\\').replace(/\r\n|\r|\n/g,'\\n').replace(/;/g,'\\;').replace(/,/g,'\\,');
  const stamp=now.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z');
  const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Kalendars365//Darza plans//LV','CALSCALE:GREGORIAN',...records.flatMap(r=>['BEGIN:VEVENT','UID:'+encodeURIComponent(r.id)+'@kalendars365.lv','DTSTAMP:'+stamp,'DTSTART;VALUE=DATE:'+r.date.replace(/-/g,''),'DTEND;VALUE=DATE:'+C.dateISO(C.addDays(r.date,1)).replace(/-/g,''),'SUMMARY:'+escape(r.cropName+': '+r.note),'DESCRIPTION:'+escape(`Personisks plāns. ${r.place}. ${r.region}. Datumu izvēlējies lietotājs.`),'END:VEVENT']),'END:VCALENDAR'];
  const encoder=new TextEncoder();return lines.map(line=>{let part='',length=0,out=[];for(const char of line){const size=encoder.encode(char).length;if(length+size>75){out.push(part);part=' ';length=1;}part+=char;length+=size;}out.push(part);return out.join('\r\n');}).join('\r\n')+'\r\n';
 }
 return {normalize,resolveCrop,matchingActions,matches,date,reminder,state,merge,parseBackup,backup,ics};
});
