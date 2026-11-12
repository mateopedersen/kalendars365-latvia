// Indexing and ranking stay off the UI thread while the visitor types.
const source=new URL('./search-core.js',self.location.href);
source.searchParams.set('v',new URL(self.location.href).searchParams.get('v')||'');
importScripts(source.href);
let indexRequest;
function index(){
 if(!indexRequest){const url=new URL('./search-index.json',self.location.href);url.search=source.search;
  indexRequest=fetch(url).then(r=>{if(!r.ok)throw Error('search-index');return r.json();}).then(raw=>K365Search.prepare(Array.isArray(raw)?raw:raw.pages||[])).catch(error=>{indexRequest=null;throw error;});
 }
 return indexRequest;
}
self.onmessage=async({data})=>{
 if(data.type==='warm'){index().catch(()=>{});return;}
 if(data.type!=='search')return;
 try{const result=K365Search.search(await index(),data.query,data.options);
  // Do not transfer private scoring structures or full article text to the DOM.
  result.results=result.results.map(({url,title,description,family,kind,nameKind,score})=>({url,title,description,family,kind,nameKind,score}));
  self.postMessage({id:data.id,result});
 }catch{self.postMessage({id:data.id,error:'Meklēšanas dati pašlaik nav pieejami.'});}
};
