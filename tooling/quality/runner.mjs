const $=s=>document.querySelector(s),frame=$('#page');let stopped=false,running=false;
$('#stop').onclick=()=>{stopped=true;};
$('#start').onclick=async()=>{
 if(running)return;running=true;stopped=false;$('#start').disabled=true;
 const scope=$('#scope').value,profile=$('#profile').value,phase=$('#phase').value;
 const rows=await fetch('/_local/quality-routes.json?scope='+scope).then(r=>r.json());
 const profiles=profile==='both'?['desktop','mobile']:[profile];let completed=0,failures=0,failedRules={};
 const total=rows.length*profiles.length;
 await fetch('/_local/quality-results?phase='+phase,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:'start',scope,profile,total})});
 for(const mode of profiles){
  frame.width=mode==='mobile'?'390':'1280';frame.height=mode==='mobile'?'844':'900';
  for(const row of rows){
   if(stopped)break;
   $('#status').textContent=`${completed}/${total} · ${mode} · ${row.url} · Sorun bulunan sayfa: ${failures}`;
   frame.src=row.url+(row.url.includes('?')?'&':'?')+'quality-run='+Date.now();
   let result=null;const until=Date.now()+30000;
   while(!stopped&&Date.now()<until){
    await new Promise(r=>setTimeout(r,100));
    try{const doc=frame.contentDocument,out=doc?.querySelector('#quality-audit-result');if(doc?.location.pathname===row.url&&out?.dataset.ready){result=JSON.parse(out.textContent);break;}}catch{}
   }
   result={url:row.url,family:row.family,profile:mode,...(result||{error:stopped?'stopped':'timeout'})};
   if(result.error||result.violations?.length){failures++;for(const issue of result.violations||[])failedRules[issue.id]=(failedRules[issue.id]||0)+1;}
   await fetch('/_local/quality-results?phase='+phase,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:'result',result})});
   completed++;$('#issues').textContent=JSON.stringify({completed,total,failures,failedRules,last:result.url},null,2);
  }
  if(stopped)break;
 }
 $('#status').textContent=`${stopped?'Durduruldu':'Tamamlandı'} · ${completed}/${total} · Sorun bulunan sayfa: ${failures}`;
 $('#status').dataset.result=JSON.stringify({completed,total,failures,failedRules,stopped});
 await fetch('/_local/quality-results?phase='+phase,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:'complete',completed,total,failures,failedRules,stopped})});
 running=false;$('#start').disabled=false;
};
