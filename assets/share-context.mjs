import {safePublicUrl} from './share-core.mjs';

const longDate=new Intl.DateTimeFormat('lv-LV',{timeZone:'Europe/Riga',day:'numeric',month:'long',year:'numeric'});
const isDate=value=>/^20\d\d-\d\d-\d\d$/.test(value||'')&&!Number.isNaN(Date.parse(value+'T12:00:00Z'))&&new Date(value+'T12:00:00Z').toISOString().slice(0,10)===value;
const dateLabel=value=>longDate.format(new Date(value+'T12:00:00Z'));
const schoolYears=['2026-27','2027-28','2028-29','2029-30','2030-31'];
const signs=new Set(['auns','versis','dvini','vezis','lauva','jaunava','svari','skorpions','strelnieks','mezazis','udensvirs','zivis']);

export function horoscopeShare({slug,genitive,date}){
 if(!signs.has(slug)||!isDate(date))throw new TypeError('Unknown horoscope edition');
 return {url:safePublicUrl(`/horoskops/${slug}/?date=${date}`),title:`${genitive} horoskops · ${dateLabel(date)}`,kind:'Dienas horoskops',description:`Izdevuma datums: ${dateLabel(date)}. Saite atver šīs zodiaka zīmes horoskopu; pieejami pēdējo septiņu dienu izdevumi.`};
}

export function schoolBreakShare({path='/skolas-brivlaiki/',schoolYear,grade,id,label,start,end}){
 if(path!=='/skolas-brivlaiki/'||!schoolYears.includes(schoolYear)||!Number.isInteger(Number(grade))||Number(grade)<1||Number(grade)>12||!['autumn','winter','spring','summer'].includes(id)||!isDate(start)||!isDate(end)||end<start||id==='summer'&&[9,12].includes(Number(grade)))throw new TypeError('Unknown school break');
 const url=new URL(path,'https://kalendars365.lv');url.searchParams.set('macibu-gads',schoolYear);url.searchParams.set('klase',grade);url.hash='brivlaiks-'+id;
 return {url:safePublicUrl(url.href),title:`${label} · ${grade}. klase · ${dateLabel(start)} – ${dateLabel(end)}`,kind:'Skolas brīvlaiks',description:`${schoolYear.replace('-', './20')}. mācību gads. Saite atver izvēlētās klases brīvlaiku un tā oficiālos datumus.`};
}

export function universityShare({path,schoolYear='2026-27',id,calendar,institution,variant}){
 if(!['/skolas-brivlaiki/','/studiju-kalendars/'].includes(path)||!schoolYears.includes(schoolYear)||!/^[a-z][a-z0-9-]{0,35}$/.test(id||'')||!/^[a-z][a-z0-9-]{0,60}$/.test(calendar||'')||calendar!==id&&!calendar.startsWith(id+'-'))throw new TypeError('Unknown university calendar');
 const url=new URL(path,'https://kalendars365.lv');url.searchParams.set('macibu-gads',schoolYear);url.searchParams.set('augstskola',id);url.searchParams.set('grafiks',calendar);url.hash='study-'+id;
 return {url:safePublicUrl(url.href),title:`${institution} · ${variant||'Studiju kalendārs'} · ${schoolYear.replace('-', './20')}.`,kind:'Augstskolas grafiks',description:'Saite atver šīs augstskolas izvēlēto grafiku. Studiju periodi, sesijas un brīvlaiki ir norādīti atsevišķi.'};
}
