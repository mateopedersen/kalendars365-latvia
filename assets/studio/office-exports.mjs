import {dimensions,eventsFor,monthGrid,isoWeek,LOCALES,FONTS} from './engine.mjs?v=541569fccac8';
import {zipStore,bytesOf} from './binary-exports.mjs?v=19ef4cc4602d';

const XML='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
const REL='http://schemas.openxmlformats.org/officeDocument/2006/relationships/';
const S='http://schemas.openxmlformats.org/spreadsheetml/2006/main';
const X=value=>String(value??'').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\ufffe\uffff]/g,'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const titleCase=value=>value[0].toLocaleUpperCase('lv')+value.slice(1);
const hex=value=>value.replace('#','').toUpperCase();
const mmToEmu=mm=>Math.round(mm*36000),mmToTwip=mm=>Math.round(mm*1440/25.4);
const relationships=rows=>XML+'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+rows.map(r=>`<Relationship Id="${r.id}" Type="${r.type.startsWith('http')?r.type:REL+r.type}" Target="${X(r.target)}"/>`).join('')+'</Relationships>';
export function calendarMonths(s,scope='current'){return s.view==='year'||scope==='all'?Array.from({length:12},(_,i)=>i+1):[s.month];}
export function selectedEvents(s,scope='current',withHolidays=true){return eventsFor(s,s.view==='month'&&scope!=='all'?s.month:null,withHolidays);}
export function excelDate(date){return (Date.parse(date+'T00:00:00Z')-Date.UTC(1899,11,30))/86400000;}
function basePackage(title,target){
 return {'_rels/.rels':relationships([{id:'rId1',type:'officeDocument',target},{id:'rId2',type:'http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties',target:'docProps/core.xml'},{id:'rId3',type:'extended-properties',target:'docProps/app.xml'}]),
 'docProps/core.xml':XML+`<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:title>${X(title)}</dc:title><dc:creator>Kalendārs365</dc:creator><dc:language>lv-LV</dc:language><dc:description>Izveidots kalendars365.lv. Personīgs kalendārs Latvijas datumiem.</dc:description></cp:coreProperties>`,
 'docProps/app.xml':XML+'<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>Kalendārs365</Application><AppVersion>1.0</AppVersion></Properties>'};
}
function contentTypes(parts){return XML+'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/>'+Object.entries(parts).map(([name,type])=>`<Override PartName="/${name}" ContentType="${type}"/>`).join('')+'<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>';}
function checkedImages(images){if(!images.length)throw Error('Kalendāram nav eksportējamu lapu.');for(const image of images){const b=bytesOf(image.bytes);if(b[0]!==137||String.fromCharCode(...b.subarray(1,4))!=='PNG'||!image.width||!image.height)throw Error('Dokumentam nepieciešams pilns PNG lapas attēls.');}}
const wordText=value=>String(value).split('\n').map((line,i)=>(i?'<w:br/>':'')+`<w:t xml:space="preserve">${X(line)}</w:t>`).join('');
function wordParagraph(value,{style='',pageBreak=false}={}){return `<w:p><w:pPr>${style?`<w:pStyle w:val="${style}"/>`:''}${pageBreak?'<w:pageBreakBefore/>':''}</w:pPr><w:r>${wordText(value)}</w:r></w:p>`;}
function wordTable(rows,width){const widths=[Math.round(width*.23),Math.round(width*.77)];return '<w:tbl><w:tblPr><w:tblW w:w="'+width+'" w:type="dxa"/><w:tblLayout w:type="fixed"/><w:tblBorders><w:bottom w:val="single" w:sz="4" w:color="DDD0CB"/><w:insideH w:val="single" w:sz="4" w:color="DDD0CB"/></w:tblBorders><w:tblCellMar><w:top w:w="110" w:type="dxa"/><w:left w:w="100" w:type="dxa"/><w:bottom w:w="110" w:type="dxa"/><w:right w:w="100" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid>'+widths.map(w=>`<w:gridCol w:w="${w}"/>`).join('')+'</w:tblGrid>'+rows.map((row,i)=>'<w:tr><w:trPr><w:cantSplit/>'+(i===0?'<w:tblHeader/>':'')+'</w:trPr>'+row.map((value,j)=>`<w:tc><w:tcPr><w:tcW w:w="${widths[j]}" w:type="dxa"/>${i===0?'<w:shd w:fill="F1E5E8"/>':''}</w:tcPr>${wordParagraph(value,{style:i===0?'TableHeading':''})}</w:tc>`).join('')+'</w:tr>').join('')+'</w:tbl>';}
function wordDrawing(image,id,width,height,description){
 return `<w:drawing><wp:anchor distT="0" distB="0" distL="0" distR="0" simplePos="0" relativeHeight="${id}" behindDoc="0" locked="0" layoutInCell="1" allowOverlap="1"><wp:simplePos x="0" y="0"/><wp:positionH relativeFrom="page"><wp:posOffset>0</wp:posOffset></wp:positionH><wp:positionV relativeFrom="page"><wp:posOffset>0</wp:posOffset></wp:positionV><wp:extent cx="${width}" cy="${height}"/><wp:effectExtent l="0" t="0" r="0" b="0"/><wp:wrapNone/><wp:docPr id="${id}" name="Kalendāra lapa ${id}" descr="${X(description)}"/><wp:cNvGraphicFramePr><a:graphicFrameLocks noChangeAspect="1"/></wp:cNvGraphicFramePr><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic><pic:nvPicPr><pic:cNvPr id="0" name="kalendars-${id}.png"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="rIdImage${id}" cstate="print"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${width}" cy="${height}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:anchor></w:drawing>`;
}
export function createDocx(s,images,{scope='current'}={}){
 checkedImages(images);const d=dimensions(s),files=basePackage(s.title||`Kalendārs ${s.year}`,'word/document.xml'),relations=[],body=[];
 for(let i=0;i<images.length;i++){
  files[`word/media/kalendars-${i+1}.png`]=images[i].bytes;relations.push({id:`rIdImage${i+1}`,type:'image',target:`media/kalendars-${i+1}.png`});
  body.push(`<w:p><w:pPr>${i?'<w:pageBreakBefore/>':''}<w:spacing w:before="0" w:after="0"/><w:rPr><w:sz w:val="2"/></w:rPr></w:pPr><w:r><w:rPr><w:sz w:val="2"/></w:rPr>${wordDrawing(images[i],i+1,mmToEmu(d.mmWidth),mmToEmu(d.mmHeight),`${s.title} · ${s.year} · ${i+1}. lapa`)}</w:r></w:p>`);
 }
 const events=selectedEvents(s,scope,false),notes=s.showNotes?s.notes:'',texts=s.layers.filter(l=>l.type==='text'&&l.text.trim());
 if(s.includeAgenda&&(events.length||notes||texts.length)){
  body.push(wordParagraph('Notikumi un piezīmes',{style:'Heading1',pageBreak:true}),wordParagraph(`${s.title||'Mans kalendārs'} · ${s.year}`,{style:'Subtitle'}));
  if(events.length)body.push(wordTable([['Datums','Mans notikums'],...events.map(e=>[e.date.split('-').reverse().join('.')+(e.annual?'\nKatru gadu':''),e.title])],mmToTwip(d.mmWidth-2*s.margin)));
  if(notes)body.push(wordParagraph('Manas piezīmes',{style:'Heading2'}),wordParagraph(notes));
  if(texts.length)body.push(wordParagraph('Papildu teksti',{style:'Heading2'}),...texts.map(l=>wordParagraph(l.text)));
  body.push(wordParagraph('Kalendārs365 · kalendars365.lv',{style:'Brand'}));
 }
 const margin=mmToTwip(s.margin);body.push(`<w:sectPr><w:pgSz w:w="${mmToTwip(d.mmWidth)}" w:h="${mmToTwip(d.mmHeight)}" w:orient="${s.orientation}"/><w:pgMar w:top="${margin}" w:right="${margin}" w:bottom="${margin}" w:left="${margin}" w:header="0" w:footer="0" w:gutter="0"/></w:sectPr>`);
 files['word/document.xml']=XML+'<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="'+REL.slice(0,-1)+'" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><w:body>'+body.join('')+'</w:body></w:document>';
 files['word/settings.xml']=XML+`<w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:doNotAutoCompressPictures/><w:defaultTabStop w:val="720"/></w:settings>`;
 files['word/styles.xml']=XML+`<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:sz w:val="21"/><w:color w:val="${hex(s.colors.ink)}"/><w:lang w:val="lv-LV"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="120" w:line="300" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style><w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="Heading 1"/><w:pPr><w:keepNext/><w:spacing w:after="220"/></w:pPr><w:rPr><w:b/><w:sz w:val="38"/><w:color w:val="${hex(s.colors.accent)}"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="Heading 2"/><w:pPr><w:keepNext/><w:spacing w:before="240" w:after="100"/></w:pPr><w:rPr><w:b/><w:sz w:val="26"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Subtitle"><w:name w:val="Subtitle"/><w:rPr><w:sz w:val="24"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="TableHeading"><w:name w:val="Table Heading"/><w:rPr><w:b/><w:color w:val="${hex(s.colors.accent)}"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Brand"><w:name w:val="Brand"/><w:pPr><w:spacing w:before="240"/></w:pPr><w:rPr><w:b/><w:sz w:val="18"/><w:color w:val="${hex(s.colors.accent)}"/></w:rPr></w:style></w:styles>`;
 relations.push({id:'rIdStyles',type:'styles',target:'styles.xml'},{id:'rIdSettings',type:'settings',target:'settings.xml'});files['word/_rels/document.xml.rels']=relationships(relations);
 files['[Content_Types].xml']=contentTypes({'word/document.xml':'application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml','word/styles.xml':'application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml','word/settings.xml':'application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml'});
 return zipStore(files);
}

// SpreadsheetML cells are explicit strings or date numbers. User text never becomes a formula.
const column=n=>{let name='';for(n++;n>0;n=Math.floor((n-1)/26))name=String.fromCharCode(65+(n-1)%26)+name;return name;};
function sheetModel(name){return {name,rows:new Map(),merges:[],widths:[],heights:new Map(),freeze:0,cols:1,maxRow:1,filter:null,drawing:null,breaks:[],design:false};}
function put(m,row,col,value,style=0,numeric=false){if(!m.rows.has(row))m.rows.set(row,new Map());m.rows.get(row).set(col,{value,style,numeric});m.cols=Math.max(m.cols,col+1);m.maxRow=Math.max(m.maxRow,row);}
function merge(m,row,start,end,value,style=0){put(m,row,start,value,style);if(end>start)m.merges.push(`${column(start)}${row}:${column(end)}${row}`);m.cols=Math.max(m.cols,end+1);}
const snippets=list=>list.slice(0,2).map(e=>e.title.length>48?e.title.slice(0,47)+'…':e.title).join('\n')+(list.length>2?'\nVēl '+(list.length-2)+' · lapa “Notikumi”':'');
const wrappedLines=(value,width)=>String(value??'').split('\n').reduce((count,line)=>count+Math.max(1,Math.ceil(line.length/width)),0);
function calendarSheet(s,month=null){
 const annual=month===null,m=sheetModel(annual?'Gada kalendārs':titleCase(LOCALES.lv.months[month-1])),count=annual?(s.orientation==='landscape'?4:3):1,cols=annual?count*8-1:7;
 m.cols=cols;m.freeze=annual?3:5;m.widths=Array.from({length:cols},(_,i)=>annual?(i%8===7?2.2:5.2):19);
 const title=s.title||`Kalendārs ${s.year}`,subtitle=[s.name,s.subtitle].filter(Boolean).join(' · ');
 merge(m,1,0,cols-1,title,1);m.heights.set(1,Math.max(32,wrappedLines(title,annual?60:65)*29));
 merge(m,2,0,cols-1,subtitle,2);m.heights.set(2,Math.max(27,wrappedLines(subtitle,annual?110:120)*16+8));
 merge(m,3,0,cols-1,`${s.year} · ${annual?'Gada kalendārs':titleCase(LOCALES.lv.months[month-1])}`,3);m.heights.set(3,24);
 const events=eventsFor(s),map=new Map();for(const event of events){if(!map.has(event.date))map.set(event.date,[]);map.get(event.date).push(event);}
 for(const mo of annual?Array.from({length:12},(_,i)=>i+1):[month]){
  const base=annual?5+Math.floor((mo-1)/count)*10:5,left=annual?((mo-1)%count)*8:0;
  merge(m,base,left,left+6,titleCase(LOCALES.lv.months[mo-1]),3);m.heights.set(base,23);
  for(let col=0;col<7;col++)put(m,base+1,left+col,LOCALES.lv.days[(col+s.weekStart)%7],4);
  const grid=monthGrid(s.year,mo,s.weekStart);const weeks=annual?6:Math.ceil((grid.findIndex(d=>d.current)+new Date(Date.UTC(s.year,mo,0)).getUTCDate())/7);
  for(let w=0;w<weeks;w++)for(let c=0;c<7;c++){
   const day=grid[w*7+c],row=base+2+w*(annual?1:2),list=day.current?(map.get(day.date)||[]):[],weekend=[0,6].includes(day.weekday);
   if(day.current||s.showAdjacent)put(m,row,left+c,excelDate(day.date),!day.current?7:list.some(e=>e.holiday)?8:s.showWeekends&&weekend?6:5,true);
   else put(m,row,left+c,'',5);
   m.heights.set(row,annual?18:27);
   if(!annual){put(m,row+1,left+c,snippets(list.filter(e=>!e.holiday||s.showHolidayNames)),11);m.heights.set(row+1,Math.max(55,Math.min(88,30+Math.max(...grid.slice(w*7,w*7+7).map(d=>snippets(map.get(d.date)||[]).split('\n').length))*12)));}
  }
 }
 const footer=m.maxRow+2;merge(m,footer,0,cols-1,s.footer,2);m.heights.set(footer,23);merge(m,footer+1,0,cols-1,'Kalendārs365 · kalendars365.lv',14);
 return m;
}
function eventSheet(s,scope){const m=sheetModel('Notikumi'),head=['Datums','Notikums','Veids','Atkārtojums'];m.widths=[17,66,24,22];m.freeze=1;head.forEach((v,i)=>put(m,1,i,v,12));m.heights.set(1,26);selectedEvents(s,scope).forEach((event,i)=>{put(m,i+2,0,excelDate(event.date),10,true);put(m,i+2,1,event.title,0);put(m,i+2,2,event.holiday?'Svētku brīvdiena':'Personīgs notikums',0);put(m,i+2,3,event.annual?'Katru gadu':'',0);m.heights.set(i+2,Math.max(32,wrappedLines(event.title,60)*17));});m.filter=`A1:D${m.maxRow}`;return m;}
function notesSheet(s){const m=sheetModel('Piezīmes');m.widths=[26,90];m.freeze=1;const data=[['Lauks','Mans ieraksts'],['Virsraksts',s.title],['Vārds vai uzņēmums',s.name],['Apakšvirsraksts',s.subtitle],['Teksts lapas apakšā',s.footer],['Manas piezīmes',s.notes],...s.layers.filter(l=>l.type==='text').map((l,i)=>[`Papildu teksts ${i+1}`,l.text]),...(s.photoCredit?[['Fotogrāfijas avots',s.photoCredit]]:[]),['Izveidots','Kalendārs365 · kalendars365.lv']];data.forEach((row,i)=>{row.forEach((v,j)=>put(m,i+1,j,v,i===0?12:j===0?13:0));m.heights.set(i+1,i===0?26:Math.max(30,Math.min(400,wrappedLines(row[1],80)*18+12)));});return m;}
function styles(s){
 const font=(name,size,color,bold=false)=>`<font>${bold?'<b/>':''}<sz val="${size}"/><color rgb="FF${color}"/><name val="${X(name)}"/><family val="2"/></font>`;
 const family=(FONTS[s.font]?.family||'Arial').split(',')[0].trim(),ink=hex(s.colors.ink),accent=hex(s.colors.accent),weekend=hex(s.colors.weekend),grid=hex(s.colors.grid),paper=hex(s.colors.paper);
 const fonts=[font(family,11,ink),font(family,23,accent,true),font(family,10,'FFFFFF',true),font(family,12,accent,true),font(family,11,weekend,true),font(family,10,'8A8389'),font(family,9.5,ink),font(family,9,accent,true)];
 const xf=(fontId,fillId=0,borderId=0,numFmtId=0,horizontal='left')=>`<xf numFmtId="${numFmtId}" fontId="${fontId}" fillId="${fillId}" borderId="${borderId}" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyNumberFormat="1" applyAlignment="1"><alignment horizontal="${horizontal}" vertical="top" wrapText="1"/></xf>`;
 const border=s.showGrid?1:0;
 const formats=[xf(0),xf(1),xf(0),xf(3),xf(2,3,1,0,'center'),xf(0,2,border,164,'center'),xf(4,4,border,164,'center'),xf(5,2,border,164,'center'),xf(4,4,border,164,'center'),xf(0,2,0,164,'center'),xf(0,0,0,165),xf(6,2,1),xf(2,3),xf(3),xf(7)];
 return XML+`<styleSheet xmlns="${S}"><numFmts count="2"><numFmt numFmtId="164" formatCode="d"/><numFmt numFmtId="165" formatCode="dd.mm.yyyy"/></numFmts><fonts count="${fonts.length}">${fonts.join('')}</fonts><fills count="5"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF${paper}"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FF${accent}"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFF5E9ED"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left style="thin"><color rgb="FF${grid}"/></left><right style="thin"><color rgb="FF${grid}"/></right><top style="thin"><color rgb="FF${grid}"/></top><bottom style="thin"><color rgb="FF${grid}"/></bottom><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="${formats.length}">${formats.join('')}</cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;
}
function sheetXML(m,s){
 const end=column(m.cols-1)+m.maxRow,d=dimensions(s),margin=m.design?0:s.margin/25.4;
 const views=m.freeze?`<pane ySplit="${m.freeze}" topLeftCell="A${m.freeze+1}" activePane="bottomLeft" state="frozen"/><selection pane="bottomLeft" activeCell="A${m.freeze+1}" sqref="A${m.freeze+1}"/>`:'';
 const cols=m.widths.map((w,i)=>`<col min="${i+1}" max="${i+1}" width="${w}" customWidth="1"/>`).join('');
 const rows=[...m.rows.entries()].sort((a,b)=>a[0]-b[0]).map(([r,cells])=>`<row r="${r}"${m.heights.has(r)?` ht="${m.heights.get(r)}" customHeight="1"`:''}>`+[...cells.entries()].sort((a,b)=>a[0]-b[0]).map(([c,cell])=>`<c r="${column(c)}${r}" s="${cell.style}"${cell.numeric?'':' t="inlineStr"'}>${cell.numeric?`<v>${cell.value}</v>`:`<is><t xml:space="preserve">${X(cell.value)}</t></is>`}</c>`).join('')+'</row>').join('');
 return XML+`<worksheet xmlns="${S}" xmlns:r="${REL.slice(0,-1)}"><sheetPr><pageSetUpPr fitToPage="1"/></sheetPr><dimension ref="A1:${end}"/><sheetViews><sheetView workbookViewId="0" showGridLines="0">${views}</sheetView></sheetViews><sheetFormatPr defaultRowHeight="15"/><cols>${cols}</cols><sheetData>${rows}</sheetData>${m.filter?`<autoFilter ref="${m.filter}"/>`:''}${m.merges.length?`<mergeCells count="${m.merges.length}">${m.merges.map(ref=>`<mergeCell ref="${ref}"/>`).join('')}</mergeCells>`:''}<printOptions horizontalCentered="1"/><pageMargins left="${margin}" right="${margin}" top="${margin}" bottom="${margin}" header="${m.design?0:.15}" footer="${m.design?0:.2}"/><pageSetup paperSize="${{a4:9,a3:8,letter:1}[s.paper]}" orientation="${s.orientation}" fitToWidth="1" fitToHeight="${m.name.includes('kalendārs')||LOCALES.lv.months.some(name=>titleCase(name)===m.name)?1:0}" horizontalDpi="${s.quality}" verticalDpi="${s.quality}"/><headerFooter>${m.design?'':`<oddFooter>&amp;CKalendārs365 · kalendars365.lv&amp;R&amp;P</oddFooter>`}</headerFooter>${m.breaks.length?`<rowBreaks count="${m.breaks.length}" manualBreakCount="${m.breaks.length}">${m.breaks.map(id=>`<brk id="${id}" max="16383" man="1"/>`).join('')}</rowBreaks>`:''}${m.drawing?'<drawing r:id="rIdDrawing"/>':''}</worksheet>`;
}
function designSheet(s,images){
 const m=sheetModel('Drukas dizains'),d=dimensions(s),points=d.mmHeight/25.4*72,rows=Math.ceil(points/15);m.design=true;m.cols=12;
 m.widths=Array.from({length:12},()=>Math.max(1,(d.mmWidth/25.4*96/12-5)/7));
 for(let page=0;page<images.length;page++)for(let r=1;r<=rows;r++){const row=page*rows+r;put(m,row,0,'');m.heights.set(row,r===rows?points-15*(rows-1):15);}
 m.breaks=images.slice(1).map((_,i)=>(i+1)*rows);m.drawing='drawing1.xml';return m;
}
function drawingXML(s,images){const d=dimensions(s),width=mmToEmu(d.mmWidth),height=mmToEmu(d.mmHeight);return XML+'<xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="'+REL.slice(0,-1)+'">'+images.map((image,i)=>`<xdr:absoluteAnchor><xdr:pos x="0" y="${i*height}"/><xdr:ext cx="${width}" cy="${height}"/><xdr:pic><xdr:nvPicPr><xdr:cNvPr id="${i+1}" name="Kalendāra dizains ${i+1}" descr="${X(s.title+' · '+s.year)}"/><xdr:cNvPicPr><a:picLocks noChangeAspect="1"/></xdr:cNvPicPr></xdr:nvPicPr><xdr:blipFill><a:blip r:embed="rIdImage${i+1}" cstate="print"/><a:stretch><a:fillRect/></a:stretch></xdr:blipFill><xdr:spPr><a:xfrm><a:off x="0" y="${i*height}"/><a:ext cx="${width}" cy="${height}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></xdr:spPr></xdr:pic><xdr:clientData/></xdr:absoluteAnchor>`).join('')+'</xdr:wsDr>';}
export function createXlsx(s,images,{scope='current'}={}){
 checkedImages(images);const files=basePackage(s.title||`Kalendārs ${s.year}`,'xl/workbook.xml');
 const sheets=[...(s.view==='year'?[calendarSheet(s)]:calendarMonths(s,scope).map(month=>calendarSheet(s,month))),eventSheet(s,scope),notesSheet(s),designSheet(s,images)],relations=[];
 const types={'xl/workbook.xml':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml','xl/styles.xml':'application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml','xl/drawings/drawing1.xml':'application/vnd.openxmlformats-officedocument.drawing+xml'};
 sheets.forEach((sheet,i)=>{
  const path=`xl/worksheets/sheet${i+1}.xml`;files[path]=sheetXML(sheet,s);types[path]='application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml';relations.push({id:`rIdSheet${i+1}`,type:'worksheet',target:`worksheets/sheet${i+1}.xml`});
  if(sheet.drawing)files[`xl/worksheets/_rels/sheet${i+1}.xml.rels`]=relationships([{id:'rIdDrawing',type:'drawing',target:'../drawings/drawing1.xml'}]);
 });
 files['xl/styles.xml']=styles(s);relations.push({id:'rIdStyles',type:'styles',target:'styles.xml'});files['xl/_rels/workbook.xml.rels']=relationships(relations);
 const names=sheets.map((sheet,i)=>`<definedName name="_xlnm.Print_Area" localSheetId="${i}">'${X(sheet.name)}'!$A$1:$${column(sheet.cols-1)}$${sheet.maxRow}</definedName>${sheet.freeze?`<definedName name="_xlnm.Print_Titles" localSheetId="${i}">'${X(sheet.name)}'!$1:$${sheet.freeze}</definedName>`:''}`).join('');
 files['xl/workbook.xml']=XML+`<workbook xmlns="${S}" xmlns:r="${REL.slice(0,-1)}"><workbookPr autoCompressPictures="0"/><bookViews><workbookView activeTab="0"/></bookViews><sheets>${sheets.map((sheet,i)=>`<sheet name="${X(sheet.name)}" sheetId="${i+1}" r:id="rIdSheet${i+1}"/>`).join('')}</sheets><definedNames>${names}</definedNames></workbook>`;
 images.forEach((image,i)=>files[`xl/media/kalendars-${i+1}.png`]=image.bytes);files['xl/drawings/drawing1.xml']=drawingXML(s,images);
 files['xl/drawings/_rels/drawing1.xml.rels']=relationships(images.map((_,i)=>({id:`rIdImage${i+1}`,type:'image',target:`../media/kalendars-${i+1}.png`})));files['[Content_Types].xml']=contentTypes(types);
 return zipStore(files);
}
