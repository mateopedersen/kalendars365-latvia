import test from 'node:test';
import assert from 'node:assert/strict';
import {familyModel,familyScenes,familyDesigns,familyFilename} from '../assets/family-planner.mjs';
import {plannerScenes} from '../assets/planner-exports.mjs';
import {textWidth} from '../assets/planner-font-metrics.mjs';
const data={members:[{id:'a',name:'Līva',color:'#32796d'},{id:'b',name:'Jānis',color:'#8b2940'}],entries:[{id:'repeat',date:'2028-02-21',start:'16:30',end:'17:30',title:'Mūzikas nodarbība',type:'event',member:'a',repeat:'weekly',until:'2028-02-28',location:'Mūzikas skola',description:'Paņemt notis'},{id:'done',date:'2028-02-29',title:'Sakārtot istabu',type:'chore',member:'b',doneDates:['2028-02-29']},{id:'joint',date:'2028-03-01',title:'Kopīga pastaiga',type:'event',member:''}],meals:[{id:'meal',date:'2028-02-29',title:'Dārzeņu zupa',ingredients:'Burkāni, kartupeļi, dilles'}],shopping:[{item:'Āboli',amount:'2 kg',aisle:'Augļi un dārzeņi',done:false},{item:'Piens',amount:'1 l',aisle:'Piena produkti',done:true}]};
test('family snapshot preserves identities, complete time ranges, recurrence limits, meals and shopping without mutation',()=>{
 const before=structuredClone(data),model=familyModel(data,'2028-02-29');
 assert.deepEqual(data,before);assert.equal(model.start,'2028-02-28');assert.equal(model.end,'2028-03-05');
 assert.equal(model.rows[0].entries[0].memberName,'Līva');assert.equal(model.rows[0].entries[0].end,'17:30');assert(model.rows[0].text.includes('Paņemt notis'));assert(model.rows[0].text.includes('Mūzikas skola'));
 assert(model.rows[1].text.includes('paveikts'));assert(model.rows[1].text.includes('kartupeļi'));assert.equal(model.shopping[1].done,true);
 assert.equal(familyModel(data,'2028-03-06').rows.flatMap(r=>r.entries).length,0);
 assert.notEqual(familyFilename(model,1),familyFilename(familyModel(data,'2028-03-06'),1));
 assert(familyFilename(familyModel({},'2030-12-31'),1).includes('2031-01'));
});
test('every family layout retains all actual family information and has safe vector geometry and text bounds',()=>{
 const model=familyModel(data,'2028-02-29');assert.equal(familyDesigns.length,15);assert.equal(new Set(familyDesigns.map(d=>d.name)).size,15);assert.equal(new Set(familyDesigns.map(d=>d.layout)).size,4);
 for(const d of familyDesigns){const pages=plannerScenes(model,{design:d.id}),all=pages.join('');
  assert(all.includes('data-family-design'));assert(all.includes('Kalendārs365™'));assert(all.includes('kalendars365.lv'));
  for(const value of ['Līva','Jānis','16:30–17:30','Mūzikas','Sakārtot','paveikts','Dārzeņu','kartupeļi','Āboli','2 kg','Piens','Nopirkts'])assert(all.includes(value),d.name+': '+value);
  assert(!/NaN|Infinity|undefined|<image|<script|<foreignObject/.test(all));
  for(const m of all.matchAll(/<text\b([^>]+)>(.*?)<\/text>/g)){
   const a=Object.fromEntries([...m[1].matchAll(/([\w-]+)="([^"]*)"/g)].map(x=>[x[1],x[2]]));const value=m[2].replaceAll('&amp;','&').replaceAll('&lt;','<').replaceAll('&gt;','>').replaceAll('&quot;','"').replaceAll('&apos;',"'");const width=textWidth(value,+a['font-size'],a['font-weight']==='700'),start=+a.x-(a['text-anchor']==='end'?width:a['text-anchor']==='middle'?width/2:0);assert(start>=0&&start+width<=1001,d.name+': '+value);assert(+a.y<=700);
  }
 }
});
test('eight members and overflowing notes or shopping lists never disappear, and input cannot become markup',()=>{
 const members=Array.from({length:8},(_,i)=>({id:String(i),name:'Ģertrūde '+i,color:'#32796d'}));
 const large={members,entries:members.map((m,i)=>({id:'e'+i,member:m.id,type:'task',date:'2027-12-27',title:`Uzdevums${i} `+'svarīgi '.repeat(160)})),meals:[{date:'2027-12-27',title:'Maltīte',ingredients:'Sastāvdaļa '.repeat(170)}],shopping:Array.from({length:65},(_,i)=>({item:'Produkts'+i+' <script>x</script>',amount:'1 kg',done:i%2===0}))};
 const model=familyModel(large,'2027-12-27');
 for(const d of [1,2,3,5,11,15]){const pages=familyScenes(model,{design:d});assert(pages.length>1);const all=pages.join('');for(let i=0;i<8;i++)assert(all.includes('Uzdevums'+i));for(let i=0;i<65;i++)assert(all.includes('Produkts'+i));assert(all.includes('Sastāvdaļa'));assert(all.includes('2028. gada 2. janvāris'));assert(all.includes('&lt;script&gt;'));assert(!all.includes('<script>'));}
});
