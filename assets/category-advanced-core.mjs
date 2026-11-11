// Pure helpers for bounded, source-preserving planner operations.
const iso=/^\d{4}-\d{2}-\d{2}$/;
export function dateRange(from,to,limit=366){
 const valid=s=>iso.test(s)&&Number.isFinite(new Date(s+'T12:00:00Z').getTime())&&new Date(s+'T12:00:00Z').toISOString().slice(0,10)===s;
 if(!valid(from)||!valid(to)||from>to)throw Error('Pārbaudi sākuma un beigu datumu.');
 const days=Math.round((new Date(to+'T12:00:00Z')-new Date(from+'T12:00:00Z'))/86400000)+1;
 if(days>limit)throw Error(`Vienā reizē atļautas līdz ${limit} dienām.`);
 return Array.from({length:days},(_,i)=>new Date(new Date(from+'T12:00:00Z').getTime()+i*86400000).toISOString().slice(0,10));
}
export function planWithinBudget(candidates,budget){
 budget=Number(budget);if(!Number.isInteger(budget)||budget<0||budget>366)throw Error('Norādi derīgu veselu dienu budžetu.');
 const rows=candidates.filter(r=>r&&iso.test(r.start)&&iso.test(r.end)&&r.start<=r.end&&Number.isInteger(r.leave)&&r.leave>=0&&r.leave<=budget&&Number.isFinite(r.days)&&r.days>0).slice().sort((a,b)=>a.end.localeCompare(b.end)||a.start.localeCompare(b.start));
 const better=(a,b)=>a.days!==b.days?(a.days>b.days?a:b):a.cost!==b.cost?(a.cost<b.cost?a:b):a.items.length<=b.items.length?a:b;
 const dp=[Array.from({length:budget+1},()=>({days:0,cost:0,items:[]}))];
 rows.forEach((r,i)=>{let previous=i-1;while(previous>=0&&rows[previous].end>=r.start)previous--;const next=[];for(let b=0;b<=budget;b++){let value=dp[i][b];if(r.leave<=b){const prior=dp[previous+1][b-r.leave];value=better(value,{days:prior.days+r.days,cost:prior.cost+r.leave,items:[...prior.items,r]});}next.push(value);}dp.push(next);});
 return dp.at(-1)[budget].items.slice().sort((a,b)=>a.start.localeCompare(b.start));
}
export function csv(rows){const cell=v=>'"'+String(v??'').replace(/^[\s]*[=+@-]/,m=>"'"+m).replaceAll('"','""')+'"';return '\ufeff'+rows.map(r=>r.map(cell).join(',')).join('\r\n');}
export function namedDays(records,start,days=7){return dateRange(start,new Date(new Date(start+'T12:00:00Z').getTime()+(days-1)*86400000).toISOString().slice(0,10),31).map(date=>{const m=Number(date.slice(5,7)),d=Number(date.slice(8));return {date,names:records.filter(r=>r.kind==='traditional'&&r.month===m&&r.day===d).map(r=>r.name)};});}
