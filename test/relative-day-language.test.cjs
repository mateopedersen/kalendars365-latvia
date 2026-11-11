'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const C=require('../assets/calendar-core.js');

test('Latvian countdown labels distinguish nearby days and singular endings',()=>{
  for(const [days,expected] of [
    [-2,'Aizvakar'],[-1,'Vakar'],[0,'Šodien'],[1,'Rīt'],[2,'Parīt'],
    [3,'Pēc 3 dienām'],[11,'Pēc 11 dienām'],[21,'Pēc 21 dienas'],
    [31,'Pēc 31 dienas'],[101,'Pēc 101 dienas'],[111,'Pēc 111 dienām'],
    [-21,'Pirms 21 dienas']
  ])assert.equal(C.relativeDayLabel(days),expected,`day offset ${days}`);
});

test('countdown labels reject non-integer and invalid day offsets',()=>{
  for(const days of [NaN,Infinity,1.5,'21',null,Number.MAX_SAFE_INTEGER+1])
    assert.throws(()=>C.relativeDayLabel(days),RangeError);
});
