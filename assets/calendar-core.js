/* Kalendārs365 date-only core. UTC fields; legal edition 2025-03-18. */
(function (root, factory) {
  const core = factory(); if (typeof module === 'object' && module.exports) module.exports = core; else root.CalendarCore = core;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const DAY=86400000;
  const FIXED=[["01-01","Jaungada diena","holiday"],["01-20","1991. gada barikāžu aizstāvju atceres diena","commemoration"],["01-26","Latvijas Republikas starptautiskās (de jure) atzīšanas diena","observance"],["02-27","Starptautiskā nevalstisko organizāciju diena","observance"],["03-02","Nacionālo partizānu bruņotās pretošanās atceres diena","commemoration"],["03-08","Starptautiskā sieviešu diena","observance"],["03-17","Nacionālās pretošanās kustības piemiņas diena","commemoration"],["03-25","Komunistiskā genocīda upuru piemiņas diena","commemoration"],["04-27","Latgales kongresa diena","observance"],["05-01","Darba svētki; Latvijas Republikas Satversmes sapulces sasaukšanas diena","holiday"],["05-04","Latvijas Republikas Neatkarības atjaunošanas diena","holiday"],["05-08","Nacisma sagrāves diena un Otrā pasaules kara upuru piemiņas diena","commemoration"],["05-09","Eiropas diena","observance"],["05-15","Starptautiskā ģimenes diena","observance"],["05-17","Ugunsdzēsēju un glābēju diena","observance"],["06-01","Starptautiskā bērnu aizsardzības diena","observance"],["06-14","Komunistiskā genocīda upuru piemiņas diena","commemoration"],["06-17","Latvijas Republikas okupācijas diena","commemoration"],["06-22","Varoņu piemiņas diena (Cēsu kaujas atceres diena)","commemoration"],["06-23","Līgo diena","holiday"],["06-24","Jāņu diena","holiday"],["07-04","Ebreju tautas genocīda upuru piemiņas diena","commemoration"],["08-11","Latvijas brīvības cīnītāju piemiņas diena","commemoration"],["08-21","Konstitucionālā likuma “Par Latvijas Republikas valstisko statusu” pieņemšanas diena","observance"],["08-23","Staļinisma un nacisma upuru atceres diena","commemoration"],["09-01","Zinību diena","observance"],["09-22","Baltu vienības diena","observance"],["10-01","Starptautiskā senioru diena","observance"],["10-05","Skolotāju diena","observance"],["10-15","Valsts valodas diena","observance"],["11-07","Robežsargu diena","observance"],["11-11","Lāčplēša diena","commemoration"],["11-18","Latvijas Republikas Proklamēšanas diena","holiday"],["11-21","2013. gada 21. novembra traģēdijas atceres diena","commemoration"],["12-05","Policijas darbinieku diena","observance"],["12-24","Ziemassvētku vakars","holiday"],["12-25","Pirmie Ziemassvētki","holiday"],["12-26","Otrie Ziemassvētki","holiday"],["12-31","Vecgada diena","holiday"]];
  const source='https://likumi.lv/ta/id/72608-par-svetku-atceres-un-atzimejamam-dienam';
  const months=['janvāris','februāris','marts','aprīlis','maijs','jūnijs','jūlijs','augusts','septembris','oktobris','novembris','decembris'];
  const monthsGenitive=['janvāra','februāra','marta','aprīļa','maija','jūnija','jūlija','augusta','septembra','oktobra','novembra','decembra'];
  const monthsLocative=['janvārī','februārī','martā','aprīlī','maijā','jūnijā','jūlijā','augustā','septembrī','oktobrī','novembrī','decembrī'];
  const weekdays=['pirmdiena','otrdiena','trešdiena','ceturtdiena','piektdiena','sestdiena','svētdiena'];
  function parseISO(value) {
    if(value instanceof Date){if(!Number.isFinite(value.getTime()))throw new RangeError('Nederīgs datums.');return new Date(Date.UTC(value.getUTCFullYear(),value.getUTCMonth(),value.getUTCDate()));}
    if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))throw new RangeError('Datums jānorāda GGGG-MM-DD formātā.');
    const [y,m,d]=value.split('-').map(Number), date=new Date(Date.UTC(y,m-1,d));
    if(date.getUTCFullYear()!==y||date.getUTCMonth()!==m-1||date.getUTCDate()!==d)throw new RangeError('Nederīgs datums.');
    return date;
  }
  function dateISO(value){return parseISO(value).toISOString().slice(0,10);}
  function addDays(value,n){if(!Number.isInteger(n))throw new RangeError('Dienu skaitam jābūt veselam skaitlim.');return new Date(+parseISO(value)+n*DAY);}
  function weekday(value){return parseISO(value).getUTCDay()||7;}
  function isoWeek(value){
    const d=parseISO(value),wd=weekday(d),thursday=addDays(d,4-wd),year=thursday.getUTCFullYear();
    return {year,week:Math.floor((+thursday-Date.UTC(year,0,1))/DAY/7)+1,weekday:wd};
  }
  function easter(y){
    const a=y%19,b=Math.floor(y/100),c=y%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451);
    return new Date(Date.UTC(y,Math.floor((h+l-7*m+114)/31)-1,(h+l-7*m+114)%31+1));
  }
  function nthWeekday(y,m,w,n){const d=new Date(Date.UTC(y,m-1,1));return addDays(d,(w-weekday(d)+7)%7+(n-1)*7);}
  function record(date,title,type){return {date:dateISO(date),title,type,dayOff:type==='holiday'||type==='substitute',source};}
  const cache=new Map();
  function holidays(y) {
    y=Number(y);if(!Number.isInteger(y)||y<1900||y>2100)throw new RangeError('Gads ārpus atbalstītā diapazona.');
    if(cache.has(y))return cache.get(y).map(r=>({...r}));
    const rows=FIXED.map(([md,t,type])=>record(y+'-'+md,t,type)),e=easter(y);
    [[-2,'Lielā Piektdiena'],[0,'Pirmās Lieldienas'],[1,'Otrās Lieldienas'],[49,'Vasarsvētki']].forEach(([n,t])=>rows.push(record(addDays(e,n),t,'holiday')));
    [[5,7,2,'Mātes diena','holiday'],[6,7,3,'Medicīnas darbinieku diena','observance'],[7,6,2,'Jūras svētku diena','observance'],[9,7,2,'Tēva diena','observance'],[12,7,1,'Pret latviešu tautu vērstā totalitārā komunistiskā režīma genocīda upuru piemiņas diena','commemoration']].forEach(([m,w,n,t,k])=>rows.push(record(nthWeekday(y,m,w,n),t,k)));
    if(y===2028){const dateSource='https://likumi.lv/ta/id/367734-par-xxviii-visparejo-latviesu-dziesmu-un-xviiideju-svetku-norises-laiku';rows.push({...record('2028-07-09','Vispārējo latviešu dziesmu un deju svētku noslēguma diena','holiday'),dateSource},{...record('2028-07-10','Brīvdiena pēc Dziesmu un deju svētku noslēguma dienas','substitute'),dateSource});}
    ['05-04','11-18'].forEach(md=>{
      let d=parseISO(y+'-'+md);
      if(weekday(d)>=6){do{d=addDays(d,1);}while(weekday(d)>=6||rows.some(r=>r.date===dateISO(d)&&r.dayOff));rows.push(record(d,'Brīvdiena pēc '+(md==='05-04'?'4. maija':'18. novembra'),'substitute'));}
    });
    rows.sort((a,b)=>(a.date+a.type+a.title).localeCompare(b.date+b.type+b.title,'lv'));cache.set(y,rows);
    return rows.map(r=>({...r}));
  }
  function isWorkday(value,options={}){
    const d=parseISO(value),weekLength=options.weekLength||5,key=dateISO(d);
    if(![5,6].includes(weekLength))throw new RangeError('Darba nedēļa: 5 vai 6 dienas.');
    if(options.overrides&&Object.prototype.hasOwnProperty.call(options.overrides,key))return !!options.overrides[key];
    return weekday(d)<=weekLength&&!holidays(d.getUTCFullYear()).some(r=>r.date===key&&r.dayOff);
  }
  function diffDays(a,b){return (+parseISO(b)-parseISO(a))/DAY;}
  function workdays(a,b,options={}){
    a=parseISO(a);b=parseISO(b);if(a>b)return -workdays(b,a,options);if(options.includeEnd===false)b=addDays(b,-1);
    let count=0;for(let d=a;d<=b;d=addDays(d,1))if(isWorkday(d,options))count++;return count;
  }
  function workHours(value,options={}){
    const d=parseISO(value);if(!isWorkday(d,options))return 0;
    const hours=Number(options.hours===undefined?8:options.hours),saturdayHours=Number(options.saturdayHours===undefined?5:options.saturdayHours);
    if(!Number.isFinite(hours)||hours<0||hours>24||!Number.isFinite(saturdayHours)||saturdayHours<0||saturdayHours>24)throw new RangeError('Nederīgs stundu skaits.');
    const base=options.weekLength===6?(weekday(d)===6?saturdayHours:Math.min(hours,7)):hours,tomorrow=addDays(d,1);
    const shortened=options.shorten!==false&&holidays(tomorrow.getUTCFullYear()).some(r=>r.date===dateISO(tomorrow)&&r.type==='holiday');
    return Math.max(0,base-(shortened?1:0));
  }
  function monthGrid(y,m){
    if(!Number.isInteger(m)||m<1||m>12)throw new RangeError('Nederīgs mēnesis.');
    const first=new Date(Date.UTC(y,m-1,1)),last=new Date(Date.UTC(y,m,0)),start=addDays(first,1-weekday(first)),finish=addDays(last,7-weekday(last)),rows=[];
    for(let d=start;d<=finish;d=addDays(d,7)){const iso=isoWeek(d);rows.push({week:iso.week,year:iso.year,days:Array.from({length:7},(_,i)=>{const day=addDays(d,i),date=dateISO(day);return {date,day:day.getUTCDate(),inMonth:day.getUTCMonth()===m-1,weekday:weekday(day),holiday:holidays(day.getUTCFullYear()).filter(r=>r.date===date)};})});}
    return rows;
  }
  function todayRiga(now=new Date()){const parts=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Riga',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now).map(p=>[p.type,p.value]));return parts.year+'-'+parts.month+'-'+parts.day;}
  function dateLabel(value){const d=parseISO(value);return d.getUTCFullYear()+'. gada '+d.getUTCDate()+'. '+months[d.getUTCMonth()];}
  function dateInSentence(value){const d=parseISO(value);return d.getUTCFullYear()+'. gada '+d.getUTCDate()+'. '+monthsLocative[d.getUTCMonth()];}
  return {parseISO,dateISO,addDays,weekday,isoWeek,easter,nthWeekday,holidays,isWorkday,diffDays,workdays,workHours,monthGrid,todayRiga,dateLabel,dateInSentence,months,monthsGenitive,monthsLocative,weekdays};
});

