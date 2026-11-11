/* Date validation and recurring lesson intersections, shared by form and import. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.OrganizerCore=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 function validDate(value){if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;const d=new Date(value+'T00:00:00Z');return Number.isFinite(+d)&&d.toISOString().slice(0,10)===value;}
 function firstLessonDate(lesson,start=lesson.from){
  const from=start>lesson.from?start:lesson.from,weekday=Number(lesson.weekday);
  if(!validDate(from)||!validDate(lesson.until)||!Number.isInteger(weekday)||weekday<0||weekday>6)return null;
  const d=new Date(from+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+(weekday-d.getUTCDay()+7)%7);const result=d.toISOString().slice(0,10);return result<=lesson.until?result:null;
 }
 function lessonsOverlap(a,b){
  if(Number(a.weekday)!==Number(b.weekday)||a.start>=b.end||b.start>=a.end)return false;
  const from=a.from>b.from?a.from:b.from,until=a.until<b.until?a.until:b.until;
  return from<=until&&firstLessonDate({...a,from,until})!==null;
 }
 return{validDate,firstLessonDate,lessonsOverlap};
});
