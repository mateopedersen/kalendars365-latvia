// Date-only vacation planning. CalendarCore remains the holiday source of truth.
export function createVacationCore(C){
 const years=[2027,2028,2029,2030],cache=new Map(),key=r=>String(r?.start||'')+'_'+String(r?.end||'');
 function validDate(date){try{C.parseISO(date);}catch{throw Error('Ievadi derīgu datumu GGGG-MM-DD formātā.');}}
 function settings(input={}){
  const s={year:2027,budget:3,weekLength:5,month:0,minRest:3,maxRest:60,maxTrips:2,sort:'longest',off:'',on:'',...input};
  for(const n of ['year','budget','weekLength','month','minRest','maxRest','maxTrips'])s[n]=Number(s[n]);
  if(!years.includes(s.year))throw Error('Izvēlies gadu no 2027. līdz 2030. gadam.');
  if(!Number.isInteger(s.budget)||s.budget<0||s.budget>60)throw Error('Atvaļinājuma budžetā ievadi 0–60 veselas darba dienas.');
  if(![5,6].includes(s.weekLength)||!Number.isInteger(s.month)||s.month<0||s.month>12)throw Error('Pārbaudi darba nedēļu un mēnesi.');
  if(!Number.isInteger(s.minRest)||s.minRest<2||s.minRest>30||!Number.isInteger(s.maxRest)||s.maxRest<s.minRest||s.maxRest>90)throw Error('Atpūtas ilgumam izvēlies 2–90 dienas; minimums nedrīkst pārsniegt maksimumu.');
  if(!Number.isInteger(s.maxTrips)||s.maxTrips<1||s.maxTrips>5)throw Error('Automātiskajam plānam izvēlies 1–5 periodus.');
  if(!['longest','efficient','earliest','least'].includes(s.sort))throw Error('Izvēlies derīgu kārtošanas veidu.');
  const overrides={};
  for(const [text,work] of [[s.off,false],[s.on,true]])for(const date of String(text||'').split(/[\s,;]+/).filter(Boolean)){validDate(date);if(date<'2027-01-01'||date>'2030-12-31')throw Error('Īpašajiem datumiem izvēlies 2027.–2030. gadu.');if(Object.hasOwn(overrides,date)&&overrides[date]!==work)throw Error('Viens datums nevar būt gan darba diena, gan brīvdiena.');overrides[date]=work;}
  for(const [date,value] of Object.entries(input.overrides||{})){validDate(date);if(date<'2027-01-01'||date>'2030-12-31')throw Error('Īpašajiem datumiem izvēlies 2027.–2030. gadu.');if(typeof value!=='boolean')throw Error('Īpašā datuma vērtībai jānorāda darba diena vai brīvdiena.');if(Object.hasOwn(overrides,date)&&overrides[date]!==value)throw Error('Viens datums nevar būt gan darba diena, gan brīvdiena.');overrides[date]=value;}
  return {...s,overrides};
 }
 function yearRows(input){const s=settings(input),id=JSON.stringify([s.year,s.weekLength,Object.entries(s.overrides).sort()]);if(cache.has(id))return cache.get(id);
  const holidays=new Map();for(const h of C.holidays(s.year).filter(h=>h.dayOff)){if(!holidays.has(h.date))holidays.set(h.date,[]);holidays.get(h.date).push(h.title);}
  const rows=[];for(let d=C.parseISO(s.year+'-01-01');d<=C.parseISO(s.year+'-12-31');d=C.addDays(d,1)){
   const date=C.dateISO(d),titles=holidays.get(date)||[],override=s.overrides[date],work=override===undefined?C.weekday(d)<=s.weekLength&&!titles.length:override;
   const kind=work?'work':titles.length?'holiday':C.weekday(d)>s.weekLength?'weekend':'extra';rows.push({date,work,kind,holidays:titles,override});
  }
  if(cache.size>=8)cache.delete(cache.keys().next().value);cache.set(id,rows);return rows;
 }
 function analyse(from,to,input){const s=settings(input);validDate(from);validDate(to);if(from>to)throw Error('Beigu datums nedrīkst būt pirms sākuma datuma.');if(from.slice(0,4)!==String(s.year)||to.slice(0,4)!==String(s.year))throw Error('Izvēlies abus datumus atlasītajā gadā. Gadu mijas plānu sadali pa gadiem.');
  const all=yearRows(s),rows=all.slice(C.diffDays(s.year+'-01-01',from),C.diffDays(s.year+'-01-01',to)+1),dates=rows.filter(r=>r.work).map(r=>r.date);
  return {id:key({start:from,end:to}),start:from,end:to,days:rows.length,leave:dates.length,rest:rows.length-dates.length,dates,rows,holidayRest:rows.filter(r=>!r.work&&r.kind==='holiday').length,weekendRest:rows.filter(r=>!r.work&&r.kind==='weekend').length,extraRest:rows.filter(r=>!r.work&&r.kind==='extra').length};
 }
 const overlaps=(a,b)=>a.start<=b.end&&b.start<=a.end;
 function selection(raw,input){const s=settings(input),rows=[],invalid=[];for(const r of Array.isArray(raw)?raw:[]){if(String(r?.start||'').slice(0,4)!==String(s.year))continue;try{rows.push(analyse(r.start,r.end,s));}catch{invalid.push(r);}}
  rows.sort((a,b)=>a.start.localeCompare(b.start));const dateSet=new Set(),workSet=new Set();rows.forEach(r=>r.rows.forEach(d=>{dateSet.add(d.date);if(d.work)workSet.add(d.date);}));
  return {rows,invalid,overlap:rows.some((r,i)=>rows.slice(i+1).some(o=>overlaps(r,o))),days:dateSet.size,leave:workSet.size,remaining:s.budget-workSet.size,dates:[...workSet].sort(),allDates:[...dateSet].sort()};
 }
 function candidates(input,{blocked=[]}={}){const s=settings(input),all=yearRows(s),rows=all.filter(r=>!s.month||Number(r.date.slice(5,7))===s.month),prefix=[0];rows.forEach(r=>prefix.push(prefix.at(-1)+Number(r.work)));const result=[],busy=new Set();for(const r of blocked)for(const row of rows)if(row.date>=r.start&&row.date<=r.end)busy.add(row.date);
  for(let a=0;a<rows.length;a++){if(busy.has(rows[a].date))continue;for(let b=a;b<Math.min(rows.length,a+s.maxRest);b++){if(busy.has(rows[b].date))break;const leave=prefix[b+1]-prefix[a];if(leave>s.budget)break;if(b-a+1<s.minRest)continue;result.push({id:rows[a].date+'_'+rows[b].date,start:rows[a].date,end:rows[b].date,days:b-a+1,leave});}}
  return result;
 }
 function rank(rows,sort='longest'){return rows.slice().sort((a,b)=>{
  if(sort==='earliest')return a.start.localeCompare(b.start)||b.days-a.days;
  if(sort==='least')return a.leave-b.leave||b.days-a.days||a.start.localeCompare(b.start);
  if(sort==='efficient'){if(a.leave===0&&b.leave!==0)return-1;if(b.leave===0&&a.leave!==0)return 1;const ratio=b.days/Math.max(1,b.leave)-a.days/Math.max(1,a.leave);if(ratio)return ratio;}
  return b.days-a.days||a.leave-b.leave||a.start.localeCompare(b.start);
 });}
 function diverse(rows){const out=[];for(const row of rows)if(!out.some(r=>overlaps(r,row)))out.push(row);return out;}
 // Bounded interval knapsack on a 366-day timeline; typed arrays keep mobile
 // memory proportional to days × budget × trip limit, not candidate count.
 function optimize(pool,budget,maxTrips=2){
  if(!Number.isInteger(budget)||budget<0||budget>60||!Number.isInteger(maxTrips)||maxTrips<0||maxTrips>5)throw Error('Pārbaudi atlikušo dienu budžetu un periodu skaitu.');if(!pool.length||!maxTrips)return[];
  for(const r of pool){validDate(r.start);validDate(r.end);if(r.start>r.end||r.start.slice(0,4)!==r.end.slice(0,4)||!Number.isInteger(r.leave)||r.leave<0||r.leave>r.days||r.days!==C.diffDays(r.start,r.end)+1)throw Error('Automātiskajā atlasē ir nederīgs periods.');}
  const first=pool.reduce((a,r)=>r.start<a?r.start:a,pool[0].start),last=pool.reduce((a,r)=>r.end>a?r.end:a,pool[0].end),N=C.diffDays(first,last)+1;if(N>366||first.slice(0,4)!==last.slice(0,4))throw Error('Automātisko plānu veido vienam gadam.');
  const B=budget+1,K=maxTrips+1,stride=B*K,size=(N+1)*stride,score=new Int16Array(size),cost=new Int16Array(size),trips=new Int8Array(size),previous=new Int32Array(size),choice=new Int32Array(size);choice.fill(-1);
  const starts=pool.map(r=>C.diffDays(first,r.start)),endings=Array.from({length:N+1},()=>[]);pool.forEach((r,i)=>{if(r.leave<=budget)endings[C.diffDays(first,r.end)+1].push(i);});
  for(let day=1;day<=N;day++)for(let b=0;b<=budget;b++)for(let k=0;k<=maxTrips;k++){
   const at=day*stride+b*K+k,old=at-stride;score[at]=score[old];cost[at]=cost[old];trips[at]=trips[old];previous[at]=old;
   if(!k)continue;for(const i of endings[day]){const r=pool[i];if(r.leave>b)continue;const before=starts[i]*stride+(b-r.leave)*K+k-1,d=score[before]+r.days,c=cost[before]+r.leave,t=trips[before]+1;
    if(d>score[at]||(d===score[at]&&(c<cost[at]||(c===cost[at]&&t<trips[at])))){score[at]=d;cost[at]=c;trips[at]=t;previous[at]=before;choice[at]=i;}
   }
  }
  const result=[];for(let at=N*stride+budget*K+maxTrips;at>0;at=previous[at])if(choice[at]>=0)result.push(pool[choice[at]]);return result.reverse();
 }
 function add(raw,range,input){const s=settings(input),totals=selection(raw,s),next=analyse(range.start,range.end,s);if(totals.overlap||totals.invalid.length)throw Error('Vispirms izlabo saglabātā plāna pārklāšanos vai nederīgos datumus.');if(totals.rows.some(r=>overlaps(r,next)))throw Error('Šis periods pārklājas ar saglabāto plānu.');if(totals.leave+next.leave>s.budget)throw Error(`Šim periodam vajag ${next.leave} atvaļinājuma darba dienas; atlikums ir ${Math.max(0,totals.remaining)}.`);return [...raw,{start:next.start,end:next.end}];}
 const csv=rows=>'\ufeff'+rows.map(r=>r.map(v=>'"'+String(v??'').replace(/^[\s]*[=+@-]/,m=>"'"+m).replaceAll('"','""')+'"').join(',')).join('\r\n');
 function planCSV(raw,input){const s=settings(input),t=selection(raw,s);return csv([['Sākums','Beigas','Atpūtas dienas','Atvaļinājuma darba dienas','Svētku brīvdienas','Atvaļinājuma datumi'],...t.rows.map(r=>[r.start,r.end,r.days,r.leave,r.holidayRest,r.dates.join(', ')])]);}
 return {settings,yearRows,analyse,selection,candidates,rank,diverse,optimize,add,overlaps,planCSV,key};
}
