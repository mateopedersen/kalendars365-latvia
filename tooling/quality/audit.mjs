// Local-only automated inspection; this file is never linked by the public build.
const result=document.createElement('output');result.id='quality-audit-result';result.hidden=true;
function compact(row){return {id:row.id,impact:row.impact,description:row.description,help:row.help,helpUrl:row.helpUrl,nodes:row.nodes.map(n=>({target:n.target,html:n.html,summary:n.failureSummary,checks:[...n.any,...n.all,...n.none].map(c=>({id:c.id,message:c.message,data:c.data}))}))};}
async function run(){
 document.body.append(result);
 try{
  await document.fonts.ready;
  await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
  const audit=await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa','best-practice']},resultTypes:['violations','incomplete']});
  result.textContent=JSON.stringify({path:location.pathname,width:innerWidth,height:innerHeight,engine:audit.testEngine,violations:audit.violations.map(compact),incomplete:audit.incomplete.map(compact),passes:audit.passes.length,documentWidth:document.documentElement.scrollWidth});
  result.dataset.ready='true';
 }catch(error){result.textContent=JSON.stringify({path:location.pathname,error:String(error)});result.dataset.ready='error';}
}
if(document.readyState==='complete')run();else addEventListener('load',run,{once:true});
