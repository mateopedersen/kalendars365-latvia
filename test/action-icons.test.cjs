const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),{execFileSync}=require('node:child_process');
const fixtures=[{tag:'button',attrs:{'data-period-export':'xlsx'},text:'Excel ↓'},{tag:'button',text:'Mani notikumi (ICS) ↓'},{tag:'button',text:'Drukāt kalendāru'},{tag:'button',text:'JSON dublējums ↓'},{tag:'button',text:'Tabula (CSV) ↓'},{tag:'a',attrs:{href:'/file.pdf',download:''},text:'PDF'},{tag:'label',text:'Importēt ICS / CSV',fileInput:true},{tag:'label',text:'ICS tvērums',fileInput:false},{tag:'button',text:'Atcelt'},{tag:'button',attrs:{'data-edit-event':'qa'},text:'PDF raports'},{tag:'button',attrs:{'data-date':'2027-05-20'},text:'20 Excel sapulce'}];
test('the build and browser choose identical format-specific icons without decorating ordinary form labels',()=>{
 const {classify}=require('../assets/action-icons.js');
 const python=execFileSync('python3',['-c','import json,sys;sys.path.insert(0,"scripts");from render_action_icons import classify;print(json.dumps([classify({"attrs":{},"fileInput":False,**c}) for c in json.load(sys.stdin)]))'],{input:JSON.stringify(fixtures),encoding:'utf8'});
 const expected=['file-excel','file-ics','print','file-json','file-csv','file-pdf','upload',null,null,null,null];
 assert.deepEqual(fixtures.map(classify),expected);assert.deepEqual(JSON.parse(python),expected);
});
test('build decoration preserves handlers and markup, skips script text and is idempotent',()=>{
 const html='<button type="button" data-period-export="xlsx"><span>Excel</span> ↓</button><button id="keep"><svg><path/></svg>PDF</button><a href="/photo.webp"><img src="/preview.webp" alt="Kalendārs"></a><script>const x="<button>PDF</button>"</script>';
 const result=JSON.parse(execFileSync('python3',['-c','import json,sys;sys.path.insert(0,"scripts");from render_action_icons import decorate;original=sys.stdin.read();first,n=decorate(original);second,m=decorate(first);print(json.dumps([first,n,second,m]))'],{input:html,encoding:'utf8'}));
 assert.equal(result[1],1);assert.equal(result[3],0);assert.equal(result[0],result[2]);assert(result[0].includes('data-period-export="xlsx"'));assert(result[0].includes('<span>Excel</span> ↓'));assert(result[0].includes('<button id="keep"><svg><path/></svg>PDF</button>'));assert(result[0].includes('<a href="/photo.webp"><img src="/preview.webp" alt="Kalendārs"></a>'));assert(result[0].includes('<script>const x="<button>PDF</button>"</script>'));
});
test('all 901 built pages have complete file action artwork, including print, Excel and ICS',()=>{
 const audit=JSON.parse(fs.readFileSync('docs/action-icons-audit.json'));assert.equal(audit.pages,901);assert.equal(audit.missing.length,0);assert(audit.controls>3000);
 const weekly=fs.readFileSync('_site/nedelas-kalendars/index.html','utf8');
 for(const [attribute,id] of [['data-period-export="xlsx"','file-excel'],['data-action="export-ics"','file-ics'],['data-action="print"','print']]){const controls=[...weekly.matchAll(/<button\b[^>]*>[\s\S]*?<\/button>/g)].filter(m=>m[0].includes(attribute));assert(controls.some(m=>m[0].includes('href="#i-'+id+'"')),attribute);}
 for(const id of ['excel','ics','csv','json','word','svg'])assert(weekly.includes('id="i-file-'+id+'"'));
});
