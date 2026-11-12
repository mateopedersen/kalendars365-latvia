// Holiday-connected breaks for the published Latvia calendar. The detailed
// personal/six-day/override planner remains a separate tool.
export function createLongWeekendCore(C){
 const years=[2027,2028,2029,2030],cache=new Map();
 function settings(input={}){const s={year:2027,mode:'free',budget:3,sort:'earliest',...input};s.year=Number(s.year);s.budget=Number(s.budget);if(!years.includes(s.year))throw Error('Izvēlies gadu no 2027. līdz 2030. gadam.');if(!['free','leave'].includes(s.mode)||!['earliest','longest'].includes(s.sort)||!Number.isInteger(s.budget)||s.budget<1||s.budget>5)throw Error('Pārbaudi atpūtas perioda iestatījumus.');return s;}
 function yearRows(year){if(cache.has(year))return cache.get(year);const map=new Map();for(const h of C.holidays(year).filter(h=>h.dayOff)){if(!map.has(h.date))map.set(h.date,[]);map.get(h.date).push(h.title);}const rows=[];for(let d=C.parseISO(year+'-01-01');d<=C.parseISO(year+'-12-31');d=C.addDays(d,1)){const date=C.dateISO(d),holidays=map.get(date)||[],work=C.isWorkday(d,{weekLength:5});rows.push({date,work,holidays,weekday:C.weekday(d),kind:work?'leave':holidays.length?'holiday':'weekend'});}cache.set(year,rows);return rows;}
 function title(rows){const dates=rows.filter(r=>r.holidays.length).map(r=>r.date.slice(5)),names=rows.flatMap(r=>r.holidays);if(names.some(t=>/Lieldien|Piektdiena/.test(t)))return 'Lieldienu brīvdienas';if(dates.some(d=>['06-23','06-24'].includes(d)))return 'Līgo un Jāņi';if(names.some(t=>/Dziesmu|dziesmu/.test(t)))return 'Dziesmu un deju svētki';if(dates.some(d=>['05-01','05-04'].includes(d))||names.some(t=>/4\. maija/.test(t)))return 'Maija brīvdienas';if(dates.includes('11-18')||names.some(t=>/18\. novembra/.test(t)))return 'Novembra svētki';if(dates.some(d=>['12-24','12-25','12-26'].includes(d)))return 'Ziemassvētku brīvdienas';if(dates.some(d=>['12-31','01-01'].includes(d)))return 'Gadumijas brīvdienas';return names[0]||'Garās brīvdienas';}
 function decorate(rows,a,b){const days=rows.slice(a,b+1),dates=days.filter(r=>r.work).map(r=>r.date),month=Number(days[0].date.slice(5,7));return {id:days[0].date+'_'+days.at(-1).date,start:days[0].date,end:days.at(-1).date,days:days.length,leave:dates.length,rest:days.length-dates.length,dates,rows:days,title:title(days),season:month>=3&&month<=5?'spring':month>=6&&month<=8?'summer':month>=9&&month<=11?'autumn':'winter'};}
 const overlaps=(a,b)=>a.start<=b.end&&b.start<=a.end;
 function periods(input={}){const s=settings(input),rows=yearRows(s.year);let result=[];
  if(s.mode==='free'){for(let a=0;a<rows.length;a++){if(rows[a].work)continue;let b=a;while(b+1<rows.length&&!rows[b+1].work)b++;if(b-a+1>=3&&rows.slice(a,b+1).some(r=>r.holidays.length))result.push(decorate(rows,a,b));a=b;}}
  else {const candidates=[];for(let a=0;a<rows.length;a++){if(a&&!rows[a-1].work)continue;let leave=0,holidayGain=false;for(let b=a;b<Math.min(rows.length,a+20);b++){leave+=Number(rows[b].work);if(leave>s.budget)break;holidayGain ||= rows[b].holidays.length>0&&rows[b].weekday<=5;if(b+1<rows.length&&!rows[b+1].work)continue;if(b-a+1>=3&&leave>0&&holidayGain&&b-a+1-leave>=3)candidates.push({a,b,start:rows[a].date,end:rows[b].date,days:b-a+1,leave});}}
   candidates.sort((a,b)=>b.days-a.days||a.leave-b.leave||a.start.localeCompare(b.start));const selected=[];for(const c of candidates){if(selected.some(r=>overlaps(c,r)))continue;selected.push(c);if(selected.length===12)break;}result=selected.map(c=>decorate(rows,c.a,c.b));
  }
  return result.sort((a,b)=>s.sort==='longest'?(b.days-a.days||a.leave-b.leave||a.start.localeCompare(b.start)):a.start.localeCompare(b.start));
 }
 function summary(items){const best=[...items].sort((a,b)=>b.days-a.days||a.leave-b.leave||a.start.localeCompare(b.start))[0]||null;return {count:items.length,best};}
 function range(row,{year=false}={}){const a=C.parseISO(row.start),b=C.parseISO(row.end);const label=a.getUTCMonth()===b.getUTCMonth()?`${a.getUTCDate()}.–${b.getUTCDate()}. ${C.months[a.getUTCMonth()]}`:`${a.getUTCDate()}. ${C.months[a.getUTCMonth()]} → ${b.getUTCDate()}. ${C.months[b.getUTCMonth()]}`;return label+(year?' '+a.getUTCFullYear(): '');}
 const label=date=>C.dateLabel(date);
 const slugMonths=['janvaris','februaris','marts','aprilis','maijs','junijs','julijs','augusts','septembris','oktobris','novembris','decembris'];
 const calendarLink=row=>`/kalendars/${row.start.slice(0,4)}/${slugMonths[Number(row.start.slice(5,7))-1]}/?date=${row.start}`;
 const text=v=>String(v).replace(/\\/g,'\\\\').replace(/\r?\n/g,'\\n').replace(/;/g,'\\;').replace(/,/g,'\\,');
 function fold(line){let out='',part='',size=0;for(const char of line){const bytes=new TextEncoder().encode(char).length;if(size+bytes>75){out+=part+'\r\n';part=' ';size=1;}part+=char;size+=bytes;}return out+part;}
 function ics(row,now=new Date()){
  if(!row||!years.includes(Number(row.start?.slice(0,4)))||row.start>row.end||row.days!==C.diffDays(row.start,row.end)+1)throw Error('Pārbaudi saglabājamā perioda datumus.');
  const description=`${row.days} dienas atpūtai. Atvaļinājuma darba dienas: ${row.leave}. ${row.dates.length?'Atvaļinājumam vajadzīgie datumi: '+row.dates.map(label).join('; ')+'. ':''}Piecu dienu darba nedēļas modelis; atvaļinājums jāsaskaņo ar darba devēju.`;
  return ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Kalendars365//Garas brivdienas//LV','CALSCALE:GREGORIAN','BEGIN:VEVENT',`UID:garas-${row.id}@kalendars365.lv`,`DTSTAMP:${now.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z/,'Z')}`,`DTSTART;VALUE=DATE:${row.start.replaceAll('-','')}`,`DTEND;VALUE=DATE:${C.dateISO(C.addDays(row.end,1)).replaceAll('-','')}`,`SUMMARY:${text(row.title)}`,`DESCRIPTION:${text(description)}`,'URL:https://kalendars365.lv/garas-brivdienas/','END:VEVENT','END:VCALENDAR'].map(fold).join('\r\n')+'\r\n';
 }
 return {settings,periods,yearRows,summary,range,label,calendarLink,ics,years};
}
