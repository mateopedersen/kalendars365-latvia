const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {selectCityPhoto}=require('../assets/city-card.js');
const cities=JSON.parse(fs.readFileSync('_data/cities.json')).cities;
test('every city uses its own photo at sunrise, sunset, midnight and both DST seasons',async()=>{
 const {citySky,zonedInstant}=await import('../assets/sky-core.mjs');
 for(const city of cities)for(const date of ['2026-11-13','2027-03-28','2027-06-21','2027-10-31','2028-02-29','2030-12-22']){
  const times=citySky(date,city).sun,solar={rise:times.sunrise,set:times.sunset};assert(solar.rise&&solar.set,city.id);
  for(const [instant,day]of [[+solar.rise-1,false],[+solar.rise,true],[+solar.set-1,true],[+solar.set,false],[+zonedInstant(date,0,0),false],[+zonedInstant(date,12,0),true]]){
   const chosen=selectCityPhoto(city,solar,new Date(instant));assert.equal(chosen.photo,day?city.photo:(city.nightPhoto||city.photo),city.id+' '+date);
   assert.equal(chosen.photoPeriod,day?'day':city.nightPhoto?'night':'archive',city.id);
  }
 }
});
test('unavailable photo is an archive, never another city or a fictitious night photo',()=>{
 const city={photo:{src:'day.webp'}},solar={rise:new Date('2026-11-13T06:00Z'),set:new Date('2026-11-13T15:00Z')};
 assert.deepEqual(selectCityPhoto(city,solar,new Date('2026-11-13T21:00Z')),{photo:city.photo,photoPeriod:'archive'});
 for(const times of [null,{rise:null,set:null},{rise:new Date(NaN),set:new Date(NaN)}])assert.equal(selectCityPhoto({...city,nightPhoto:{src:'night.webp'}},times).photoPeriod,'archive');
});
test('date-specific solar instants preserve timezones whose day crosses UTC midnight',()=>{
 const city={photo:{src:'day'},nightPhoto:{src:'night'}},times={rise:new Date('2026-11-13T18:00Z'),set:new Date('2026-11-13T04:00Z')};
 for(const [hour,expected]of [[1,'day'],[4,'night'],[12,'night'],[18,'day'],[23,'day']])assert.equal(selectCityPhoto(city,times,new Date('2026-11-13T'+String(hour).padStart(2,'0')+':00Z')).photo.src,expected);
});
