/* A date-only Latvia schedule. Reused by static pages, the UI and exports. */
(function(root,factory){
  const api=factory(typeof module==='object'&&module.exports?require('./calendar-core.js'):root.CalendarCore);
  if(typeof module==='object'&&module.exports)module.exports=api;else root.WorkCalendarCore=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(C){
  'use strict';
  const MIN='2027-01-01',MAX='2030-12-31';
  function options(input={}){
    const weekdays=input.weekdays===undefined?[1,2,3,4,5]:input.weekdays;
    if(!Array.isArray(weekdays)||weekdays.some(n=>!Number.isInteger(n)||n<1||n>7))throw Error('Izvēlies derīgas nedēļas dienas.');
    const hours=Number(input.hours===undefined?8:input.hours);
    if(!Number.isFinite(hours)||hours<0.5||hours>24||!Number.isInteger(hours*2))throw Error('Stundām jābūt no 0,5 līdz 24 ar soli 0,5.');
    const overrides={};
    for(const [date,value] of Object.entries(input.overrides||{})){
      validateDate(date);if(typeof value!=='boolean')throw Error('Īpašajam datumam jābūt darba dienai vai brīvdienai.');overrides[date]=value;
    }
    return {weekdays:[...new Set(weekdays)].sort(),hours,holidays:input.holidays!==false,shorten:input.shorten!==false,overrides};
  }
  function validateDate(date){C.parseISO(date);if(date<MIN||date>MAX)throw Error('Izvēlies datumus no 2027. līdz 2030. gadam.');return date;}
  function parseOverrides(off='',on=''){
    const result={};
    for(const [text,value] of [[off,false],[on,true]])for(const date of String(text).split(/[\s,;]+/).filter(Boolean)){
      validateDate(date);if(Object.hasOwn(result,date)&&result[date]!==value)throw Error('Viens datums nevar būt gan darba diena, gan brīvdiena.');result[date]=value;
    }
    return result;
  }
  function classify(date,opts){
    const d=C.parseISO(date),weekday=C.weekday(d),holiday=C.holidays(d.getUTCFullYear()).filter(h=>h.date===date&&h.dayOff);
    const scheduled=opts.weekdays.includes(weekday),override=Object.hasOwn(opts.overrides,date)?opts.overrides[date]:null;
    const work=override===null?scheduled&&!(opts.holidays&&holiday.length):override;
    const tomorrow=C.dateISO(C.addDays(d,1));
    const shortened=!!(work&&opts.shorten&&C.holidays(Number(tomorrow.slice(0,4))).some(h=>h.date===tomorrow&&h.type==='holiday'));
    const hours=work?Math.max(0,opts.hours-(shortened?1:0)):0;
    return {date,weekday,scheduled,work:!!work,hours,shortened,holiday,override,excludedHoliday:!!(scheduled&&opts.holidays&&holiday.length&&!work),kind:work?(shortened?'short':'work'):(opts.holidays&&holiday.length?'holiday':'rest')};
  }
  function day(date,input={}){validateDate(date);return classify(date,options(input));}
  function summary(rows){
    return {days:rows.length,work:rows.filter(r=>r.work).length,rest:rows.filter(r=>!r.work).length,hours:rows.reduce((sum,r)=>sum+r.hours,0),shortened:rows.filter(r=>r.shortened).length,excludedHolidays:rows.filter(r=>r.excludedHoliday).length};
  }
  function period(from,to,input={}){
    validateDate(from);validateDate(to);if(from>to)throw Error('Beigu datumam jābūt pēc sākuma datuma.');
    const opts=options(input),rows=[];
    for(let d=C.parseISO(from);C.dateISO(d)<=to;d=C.addDays(d,1))rows.push(classify(C.dateISO(d),opts));
    return {...summary(rows),from,to,rows};
  }
  function annual(year,input={}){
    year=Number(year);if(!Number.isInteger(year)||year<2027||year>2030)throw Error('Izvēlies gadu no 2027. līdz 2030. gadam.');
    const result=period(`${year}-01-01`,`${year}-12-31`,input);
    return {...result,year,months:Array.from({length:12},(_,i)=>{const rows=result.rows.filter(r=>Number(r.date.slice(5,7))===i+1);return {...summary(rows),month:i+1,from:rows[0].date,to:rows.at(-1).date,rows};})};
  }
  function dateOnly(value){
    const d=C.parseISO(value),year=d.getUTCFullYear();
    if(year<1900||year>2100)throw Error('Datumu aprēķini pieejami no 1900. līdz 2100. gadam.');
    return d;
  }
  function shiftDate(date,amount,unit='days'){
    const base=dateOnly(date);if(typeof amount==='string'&&!amount.trim())throw Error('Ievadi pieskaitāmo vai atņemamo skaitu.');amount=Number(amount);
    if(!Number.isSafeInteger(amount)||Math.abs(amount)>100000)throw Error('Ievadi veselu skaitli no −100000 līdz 100000.');
    let target;
    if(unit==='days'||unit==='weeks')target=C.addDays(base,amount*(unit==='weeks'?7:1));
    else if(unit==='months'){
      target=new Date(Date.UTC(base.getUTCFullYear(),base.getUTCMonth()+amount,1));
      const last=new Date(Date.UTC(target.getUTCFullYear(),target.getUTCMonth()+1,0)).getUTCDate();
      target.setUTCDate(Math.min(base.getUTCDate(),last));
    }else throw Error('Izvēlies dienas, nedēļas vai mēnešus.');
    dateOnly(target);
    return {date:C.dateISO(target),from:C.dateISO(base),amount,unit,days:C.diffDays(base,target),clamped:unit==='months'&&base.getUTCDate()!==target.getUTCDate(),weekday:C.weekday(target)};
  }
  function difference(from,to,inclusive=false){
    const a=dateOnly(from),b=dateOnly(to),reverse=a>b,start=reverse?b:a,end=reverse?a:b;
    const elapsed=C.diffDays(start,end),days=elapsed+(inclusive?1:0);
    let months=(end.getUTCFullYear()-start.getUTCFullYear())*12+end.getUTCMonth()-start.getUTCMonth();
    let pivot=shiftDate(start,months,'months').date;
    if(C.parseISO(pivot)>end)pivot=shiftDate(start,--months,'months').date;
    return {from:C.dateISO(a),to:C.dateISO(b),reverse,inclusive:!!inclusive,elapsed,days,weeks:Math.floor(days/7),weekDays:days%7,months,monthDays:C.diffDays(pivot,end),startWeekday:C.weekday(a),endWeekday:C.weekday(b)};
  }
  function workPeriod(from,to,input={},bounds={}){
    const result=period(from,to,input),includeStart=bounds.includeStart!==false,includeEnd=bounds.includeEnd!==false;
    const rows=result.rows.filter(row=>(includeStart||row.date!==from)&&(includeEnd||row.date!==to));
    return {...summary(rows),from,to,includeStart,includeEnd,rows};
  }
  function csv(result){
    const cell=value=>'"'+String(value??'').replace(/"/g,'""')+'"';
    const state={work:'Darba diena',short:'Saīsināta darba diena',holiday:'Svētku brīvdiena',rest:'Brīvdiena pēc grafika'};
    return '\ufeff'+[['Datums','Nedēļas diena','Statuss','Stundas','Svētku diena','Īpašais datums'],...result.rows.map(r=>[r.date,C.weekdays[r.weekday-1],state[r.kind],String(r.hours).replace('.',','),r.holiday.map(h=>h.title).join('; '),r.override===null?'':r.override?'Papildu darba diena':'Papildu brīvdiena'])].map(row=>row.map(cell).join(';')).join('\r\n')+'\r\n';
  }
  return {MIN,MAX,options,parseOverrides,day,summary,period,annual,csv,shiftDate,difference,workPeriod};
});
