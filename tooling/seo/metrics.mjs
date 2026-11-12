// Local lab instrumentation, injected only by tooling/seo/serve.mjs --metrics=true.
// Never included in the public build; no requests or personal data collection.
const values={lcp:0,cls:0,longTasks:0,longTaskTime:0,maxLongTask:0,ready:false};
const supported=PerformanceObserver.supportedEntryTypes;
let sessionStart=0,sessionLast=0,sessionValue=0;
function observe(type,consume){if(supported.includes(type))new PerformanceObserver(list=>{for(const e of list.getEntries())consume(e);publish();}).observe({type,buffered:true});}
observe('largest-contentful-paint',e=>{values.lcp=e.startTime;});
observe('layout-shift',e=>{if(e.hadRecentInput)return;if(e.startTime-sessionLast>1000||e.startTime-sessionStart>5000){sessionStart=e.startTime;sessionValue=0;}sessionLast=e.startTime;sessionValue+=e.value;values.cls=Math.max(values.cls,sessionValue);});
observe('longtask',e=>{values.longTasks++;values.longTaskTime+=e.duration;values.maxLongTask=Math.max(values.maxLongTask,e.duration);});
function publish(){const out=document.querySelector('#local-seo-metrics');if(!out)return;const nav=performance.getEntriesByType('navigation')[0],data={...values,at:performance.now(),width:innerWidth,height:innerHeight,elements:document.querySelectorAll('*').length,domComplete:nav?.domComplete,transfer:nav?.transferSize,ttfb:nav?nav.responseStart-nav.requestStart:null,fcp:performance.getEntriesByName('first-contentful-paint')[0]?.startTime??null};out.dataset.metrics=JSON.stringify(data);out.dataset.ready=String(values.ready);out.textContent='Lokāls tests · LCP '+Math.round(values.lcp)+' ms · CLS '+values.cls.toFixed(3);}
function mount(){const out=document.createElement('output');out.id='local-seo-metrics';out.setAttribute('aria-label','Lokālais veiktspējas mērījums');out.style.cssText='position:fixed;left:4px;bottom:4px;z-index:2147483647;padding:4px 7px;background:#fffdf4;color:#4f2035;border:1px solid #be9a96;border-radius:5px;font:11px/1.4 system-ui;pointer-events:none;contain:layout paint';document.body.append(out);publish();setTimeout(()=>{values.ready=true;publish();},1500);}
if(document.readyState==='complete')mount();else addEventListener('load',mount,{once:true});
