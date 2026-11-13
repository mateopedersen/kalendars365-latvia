(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.K365LocationCore=api;})(typeof globalThis==='object'?globalThis:this,function(){
 'use strict';
 const key='kalendars365.city';
 const normalize=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
 const coordinate=(value,max)=>value!==null&&value!==undefined&&String(value).trim()!==''&&Number.isFinite(Number(value))&&Math.abs(Number(value))<=max?Number(value):null;
 function timeZone(value){try{new Intl.DateTimeFormat('lv-LV',{timeZone:value}).format();return typeof value==='string'&&value?value:null;}catch{return null;}}
 function countryName(code){try{return new Intl.DisplayNames(['lv'],{type:'region'}).of(code)||code;}catch{return code;}}
 function distance(a,b){const rad=Math.PI/180,dlat=(b.lat-a.lat)*rad,dlon=(b.lon-a.lon)*rad,q=Math.sin(dlat/2)**2+Math.cos(a.lat*rad)*Math.cos(b.lat*rad)*Math.sin(dlon/2)**2;return 6371*2*Math.atan2(Math.sqrt(q),Math.sqrt(Math.max(0,1-q)));}
 function externalCity(value){
  if(!value||!/^geo-/.test(value.id||'')||!/^[A-Z]{2}$/.test(value.country||'')||value.country==='LV')return null;
  const lat=coordinate(value.lat,90),lon=coordinate(value.lon,180),zone=timeZone(value.timeZone),name=typeof value.name==='string'?value.name.trim():'';
  if(lat===null||lon===null||!zone||!name||name.length>100||/[<>\x00-\x1f\x7f]/.test(name))return null;
  const roundedLat=Number(lat.toFixed(2)),roundedLon=Number(lon.toFixed(2));
  return {id:`geo-${roundedLat.toFixed(2)}_${roundedLon.toFixed(2)}`,name,lat:roundedLat,lon:roundedLon,timeZone:zone,country:value.country,countryName:countryName(value.country),external:true};
 }
 function fromEdge(cf,records){
  if(!cf||!/^[A-Z]{2}$/.test(cf.country||'')||['XX','T1'].includes(cf.country))return null;
  const lat=coordinate(cf.latitude,90),lon=coordinate(cf.longitude,180),name=normalize(cf.city);
  if(cf.country==='LV'){
   const exact=name&&records.find(c=>normalize(c.id)===name||normalize(c.name)===name);
   if(exact)return {...exact,timeZone:'Europe/Riga',country:'LV',countryName:'Latvija',matchedBy:'city'};
   if(lat===null||lon===null)return null;
   const nearest=records.map(city=>({city,km:distance({lat,lon},city)})).sort((a,b)=>a.km-b.km)[0];
   return nearest&&nearest.km<=75?{...nearest.city,timeZone:'Europe/Riga',country:'LV',countryName:'Latvija',matchedBy:'nearest'}:null;
  }
  if(lat===null||lon===null)return null;
  return externalCity({id:'geo-ip',name:cf.city,lat,lon,timeZone:cf.timezone,country:cf.country});
 }
 function createController({cities,storage,fetchLocation,onChange=()=>{}}){
  const known=id=>cities.find(c=>c.id===id),prepare=c=>({...c,timeZone:'Europe/Riga',country:'LV',countryName:'Latvija'});
  let current=null,source='detecting',revision=0,ready;
  const saved=()=>{try{return known(storage?.getItem(key));}catch{return null;}};
  function publish(city,nextSource){current=city;source=nextSource;onChange({city,source});return current;}
  const fallback=()=>publish(prepare(known('riga')||cities[0]),'fallback');
  async function detect(){
   const token=++revision;source='detecting';onChange({city:current,source});
   try{const data=await fetchLocation();if(token!==revision)return current;const match=data?.status==='available'&&(known(data.city?.id)||externalCity(data.city));if(!match)return fallback();if(match.external)return publish(prepare(known('riga')||cities[0]),'country-fallback');return publish(prepare(match),'ip');}
   catch{if(token===revision)return fallback();return current;}
  }
  function manual(id){const match=known(id)||(current?.external&&current.id===id?current:null);if(!match)return false;++revision;try{if(!match.external)storage?.setItem(key,match.id);}catch{}publish(match.external?match:prepare(match),'manual');return true;}
  function auto(){try{storage?.removeItem(key);}catch{}return ready=detect();}
  function start(){const choice=saved();if(choice){++revision;ready=Promise.resolve(publish(prepare(choice),'manual'));}else ready=detect();return ready;}
  function sync(value){const choice=known(value);if(choice){++revision;publish(prepare(choice),'manual');}else ready=detect();}
  return {get current(){return current;},get source(){return source;},get ready(){return ready;},start,manual,auto,sync};
 }
 return {key,normalize,coordinate,timeZone,distance,externalCity,fromEdge,createController};
});
