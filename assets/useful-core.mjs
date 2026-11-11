export function spacingPlan({length,width,rows,plants,germination}) {
 const a=[length,width,rows,plants,germination].map(Number);
 if(a.some(n=>!Number.isFinite(n)||n<=0)||a[0]>1000||a[1]>1000||a[2]>1000||a[3]>1000||a[4]>100)throw Error('Pārbaudi izmērus, attālumus un dīgstspēju.');
 const rowCount=Math.floor(a[1]*100/a[2]+1e-9),perRow=Math.floor(a[0]*100/a[3]+1e-9),total=rowCount*perRow;
 if(total>1000000)throw Error('Aprēķins paredzēts līdz vienam miljonam stādvietu.');
 return {area:a[0]*a[1],rowCount,perRow,total,seeds:Math.ceil(total*100/a[4])};
}
export function reminderEvent(event,lead,title,url) {
 const date=new Date(event.date+'T12:00:00Z'),n=Number(lead);
 if(!Number.isFinite(date.getTime())||date.toISOString().slice(0,10)!==event.date||!Number.isInteger(n)||n<0||n>365)throw Error('Pārbaudi notikuma datumu un atgādinājumu.');
 date.setUTCDate(date.getUTCDate()-n);
 return {date:date.toISOString().slice(0,10),title:n?`${title}: pēc ${n} dienām`:title,description:`Notikums: ${event.date}. ${event.title||title}${event.scope?' · '+event.scope:''}\n${url}`};
}
export function safeJournal(items) {
 return Array.isArray(items)?items.filter(i=>i&&/^\d{4}-\d{2}-\d{2}$/.test(i.date)&&Number.isFinite(new Date(i.date+'T12:00:00Z').getTime())&&new Date(i.date+'T12:00:00Z').toISOString().slice(0,10)===i.date&&typeof i.note==='string'&&i.note.length<=2000).slice(-366):[];
}
export function sourceMatches(items,query) {
 const normal=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('lv-LV');
 const terms=normal(query).trim().split(/\s+/).filter(Boolean);
 return items.filter(i=>terms.every(t=>normal(i.text+' '+i.url).includes(t)));
}
export function isoWeekDates(year,week){
 year=Number(year);week=Number(week);
 if(!Number.isInteger(year)||year<1901||year>2099||!Number.isInteger(week)||week<1||week>53)throw Error('Pārbaudi ISO gadu un nedēļas numuru.');
 const jan4=new Date(Date.UTC(year,0,4)),weekday=jan4.getUTCDay()||7;
 const start=new Date(+jan4+(1-weekday+(week-1)*7)*86400000);
 // The week's Thursday determines the ISO year, rejecting nonexistent week 53.
 if(new Date(+start+3*86400000).getUTCFullYear()!==year)throw Error('Šajā gadā nav šādas ISO nedēļas.');
 return {year,week,days:Array.from({length:7},(_,i)=>new Date(+start+i*86400000).toISOString().slice(0,10))};
}
