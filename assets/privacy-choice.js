(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.K365PrivacyChoice=api;})(typeof globalThis==='object'?globalThis:this,function(){
 'use strict';
 const version=2,days=180,duration=days*86400000;
 function acknowledge(now=Date.now()){
  const time=Number(now);if(!Number.isFinite(time))throw Error('Invalid notice date');
  return {choice:'necessary',acknowledged:true,date:new Date(time).toISOString(),expiresAt:new Date(time+duration).toISOString(),version,analytics:false,advertising:false};
 }
 function normalize(value,now=Date.now()){
  if(!value||typeof value!=='object'||Array.isArray(value)||value.version!==version||value.choice!=='necessary'||value.acknowledged!==true||value.analytics!==false||value.advertising!==false)return null;
  const start=Date.parse(value.date),end=Date.parse(value.expiresAt),time=Number(now);
  if(!Number.isFinite(start)||!Number.isFinite(end)||!Number.isFinite(time)||start>time||end-start!==duration||time>=end)return null;
  return {choice:'necessary',acknowledged:true,date:new Date(start).toISOString(),expiresAt:new Date(end).toISOString(),version,analytics:false,advertising:false};
 }
 return {version,days,duration,acknowledge,normalize};
});
