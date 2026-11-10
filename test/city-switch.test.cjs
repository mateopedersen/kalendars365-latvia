const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

function harness(file){
  const nodes=new Map(),calls=[],storage=new Map(),listeners={};
  const select={value:'riga',selectedOptions:[{textContent:'Rīga'}],addEventListener(type,fn){listeners[type]=fn;}};
  const summary={dataset:{},setAttribute(name,value){this[name]=value;}};
  nodes.set('city-select',select);
  nodes.set(file==='weather.js'?'weather-summary':'station-observation',summary);
  for(const id of ['weather-condition','weather-details','weather-temperature','weather-updated','station-observation-title','station-observation-value','station-observation-detail'])nodes.set(id,{textContent:''});
  const context={document:{getElementById:id=>nodes.get(id),addEventListener(){}},window:{requestIdleCallback(){}},sessionStorage:{getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value)},fetch:url=>new Promise(resolve=>calls.push({url,resolve})),AbortSignal,Intl,Date,Map,Promise,Number,String,Math,JSON,Error,setTimeout:()=>1,clearTimeout:()=>{},console};
  vm.runInNewContext(fs.readFileSync(`assets/${file}`,'utf8'),context,{filename:file});
  const change=(id,name)=>{select.value=id;select.selectedOptions=[{textContent:name}];listeners.change();};
  const reply=(index,data)=>calls[index].resolve({ok:true,json:async()=>data});
  return {nodes,summary,calls,change,reply};
}
const flush=()=>new Promise(resolve=>setImmediate(resolve));
(async()=>{
  const weather=harness('weather.js');
  assert.equal(weather.calls.length,1);
  weather.change('ventspils','Ventspils');
  assert.equal(weather.nodes.get('weather-temperature').textContent,'','Old city temperature must clear immediately');
  weather.reply(0,{symbol:'clearsky_day',temperature:4,forecastTime:new Date().toISOString()});await flush();
  assert.equal(weather.nodes.get('weather-temperature').textContent,'','Late Riga response must not overwrite Ventspils');
  weather.reply(1,{symbol:'rain',temperature:5,forecastTime:new Date().toISOString()});await flush();
  assert.equal(weather.nodes.get('weather-temperature').textContent,'5°');
  weather.change('riga','Rīga');
  assert.equal(weather.nodes.get('weather-temperature').textContent,'4°','Cached city must render during the change event');
  assert.equal(weather.calls.length,2,'Cached city should not trigger another request');

  const station=harness('observations.js');
  const observation=(name,temp)=>({observation:{stationName:name,temperature:temp,observedAt:new Date().toISOString(),distanceKm:2}});
  station.change('ventspils','Ventspils');
  assert.equal(station.nodes.get('station-observation-value').textContent,'','Old measurement must clear immediately');
  station.reply(0,observation('Rīga Universitāte',4));await flush();
  assert.equal(station.nodes.get('station-observation-value').textContent,'','Late Riga observation must not overwrite Ventspils');
  station.reply(1,observation('Ventspils',5));await flush();
  assert.equal(station.nodes.get('station-observation-value').textContent,'5 °C');
  station.change('riga','Rīga');
  assert.equal(station.nodes.get('station-observation-value').textContent,'4 °C','Cached observation must render during the change event');
  assert.equal(station.calls.length,2);
  console.log('Rapid city switching: loading state, stale response protection, and instant cache reuse passed for weather and observations.');
})().catch(error=>{console.error(error);process.exitCode=1;});
