(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./calendar-core.js'));else root.SchoolCalendarCore=factory(root.CalendarCore)})(typeof globalThis!=='undefined'?globalThis:this,function(D){
  'use strict';
  const iso=value=>D.dateISO(value),add=(value,n)=>iso(D.addDays(value,n));
  const normalize=value=>String(value).normalize('NFD').replace(/\p{M}/gu,'').toLowerCase();
  function periods(school,grade=8){
    if(!Number.isInteger(Number(grade))||grade<1||grade>12)throw RangeError('Izvēlies klasi no 1 līdz 12.');
    return school.breaks.filter((item,index)=>index!==3||![9,12].includes(Number(grade))).map((item,index)=>({...item,id:item.id||['autumn','winter','spring','summer'][index],days:D.diffDays(item.start,item.end)+1}));
  }
  function gradeEnd(school,grade){return school.endByGrade[String(grade)]||school.endByGrade['1–8, 10–11'];}
  function classify(school,grade,date,holidays=[]){
    date=iso(date);
    if(date<school.start||date>school.end)return {kind:'unknown',free:false,label:'Ārpus publicētā mācību gada'};
    const matches=periods(school,grade).filter(item=>date>=item.start&&date<=item.end);
    const holiday=holidays.find(item=>item.date===date&&item.dayOff);
    const weekend=D.weekday(date)>5;
    if(matches.length)return {kind:'break',free:true,label:matches[0].label,period:matches[0],holiday,weekend};
    if(holiday)return {kind:'holiday',free:true,label:holiday.title,holiday,weekend};
    if(weekend)return {kind:'weekend',free:true,label:'Nedēļas nogale',weekend};
    if(date>gradeEnd(school,grade))return {kind:'unknown',free:false,label:'Pēc klases mācību gada beigām; brīvlaika grafiks nav noteikts'};
    return {kind:'study',free:false,label:'Mācību diena pēc pamatgrafika'};
  }
  function countRange(school,grade,from,to,holidays=[]){
    from=iso(from);to=iso(to);
    if(to<from)throw RangeError('Beigu datumam jābūt pēc sākuma datuma.');
    if(from<school.start||to>school.end)throw RangeError('Izvēlies periodu publicētajā 2026./2027. mācību gadā.');
    const result={total:D.diffDays(from,to)+1,free:0,study:0,unknown:0};
    for(let date=from;date<=to;date=add(date,1)){
      const day=classify(school,grade,date,holidays);
      if(day.free)result.free++;else if(day.kind==='unknown')result.unknown++;else result.study++;
    }
    return result;
  }
  function nextBreak(school,grade,today){
    today=iso(today);const next=periods(school,grade).find(item=>item.end>=today);
    return next?{...next,ongoing:today>=next.start,daysUntil:Math.max(0,D.diffDays(today,next.start))}:null;
  }
  const escape=value=>String(value??'').replace(/\\/g,'\\\\').replace(/\r\n|\r|\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');
  function fold(line){let text='',bytes=0;for(const char of line){const length=new TextEncoder().encode(char).length;if(bytes+length>75){text+='\r\n ';bytes=1}text+=char;bytes+=length}return text;}
  function makeICS(events,title,stamp=new Date()){
    if(!Array.isArray(events)||!events.length)throw RangeError('Nav publicētu datumu eksportam.');
    const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Kalendars365//Latvijas macibu kalendars//LV','CALSCALE:GREGORIAN','METHOD:PUBLISH',`X-WR-CALNAME:${escape(title)}`];
    for(const [index,event] of events.entries()){
      const start=iso(event.start),end=iso(event.end||event.start);if(end<start)throw RangeError('Nederīgs notikuma periods.');
      lines.push('BEGIN:VEVENT',`UID:${escape(event.id||index+'-'+start+'-'+end)}@kalendars365.lv`,`DTSTAMP:${stamp.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'')}`,`DTSTART;VALUE=DATE:${start.replace(/-/g,'')}`,`DTEND;VALUE=DATE:${add(end,1).replace(/-/g,'')}`,`SUMMARY:${escape(event.label)}`);
      if(event.scope||event.source)lines.push(`DESCRIPTION:${escape([event.scope,event.source].filter(Boolean).join('\n'))}`);
      lines.push('END:VEVENT');
    }
    lines.push('END:VCALENDAR');return lines.map(fold).join('\r\n')+'\r\n';
  }
  return {iso,add,normalize,periods,gradeEnd,classify,countRange,nextBreak,makeICS};
});
