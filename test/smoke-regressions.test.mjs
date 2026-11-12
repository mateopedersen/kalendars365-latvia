import test from 'node:test';
import assert from 'node:assert/strict';
import {calendarEntryText} from '../assets/category-advanced-core.mjs';
test('a converted note prints once without losing distinct events or notes',()=>{
 const text='Pārbaude ĀČĒ <b>teksts</b> & plāns';
 assert.equal(calendarEntryText([{title:text,description:text}],text),text);
 assert.equal(calendarEntryText([{title:'Tikšanās',time:'09:00',description:'Paņemt karti'}],'Piezvanīt mājās'),'09:00 Tikšanās\nPaņemt karti\nPiezvanīt mājās');
 assert.equal(calendarEntryText([{title:'Tikšanās',time:'09:00'},{title:'Tikšanās',time:'11:00'}],'Tikšanās'),'09:00 Tikšanās\n11:00 Tikšanās');
 const long='ĀČĒ\n'.repeat(4000);
 assert.equal(calendarEntryText([{title:'Virsraksts',description:long}],long),'Virsraksts\n'+long);
 assert.equal(calendarEntryText([],'Pilna piezīme'),'Pilna piezīme');
});
