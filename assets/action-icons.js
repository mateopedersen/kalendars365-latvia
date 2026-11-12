(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.K365ActionIcons=api;if(typeof document==='object')api.init(document);})(typeof globalThis==='object'?globalThis:this,function(){
 'use strict';
 const rules=[{"pattern":"Drukāt","icon":"print"},{"pattern":"\\bPDF\\b|\\.pdf(?:[?#]|$)","icon":"file-pdf"},{"pattern":"\\bExcel\\b|\\bXLSX?\\b|\\.xlsx?(?:[?#]|$)","icon":"file-excel"},{"pattern":"\\bWord\\b|\\bDOCX?\\b|\\.docx?(?:[?#]|$)","icon":"file-word"},{"pattern":"\\bICS\\b|\\.ics(?:[?#]|$)","icon":"file-ics"},{"pattern":"\\bCSV\\b|\\.csv(?:[?#]|$)","icon":"file-csv"},{"pattern":"\\bJSON\\b|Dublējums|Datu dublējums|\\.json(?:[?#]|$)","icon":"file-json"},{"pattern":"\\bSVG\\b|\\.svg(?:[?#]|$)","icon":"file-svg"},{"pattern":"Attēls|\\bPNG\\b|\\bJPE?G\\b|\\bWebP\\b|\\.(?:png|jpe?g|webp)(?:[?#]|$)","icon":"file-image"},{"pattern":"Importēt|Atvērt failu|Izvēlēties failu","icon":"upload"},{"pattern":"Lejupielādēt|Eksportēt|Saglabāt failu","icon":"download"}];
 const formats=/\.(?:pdf|webp|xlsx?|docx?|ics|csv|json|png|jpe?g|svg)(?:[?#]|$)/i;
 function classify({tag,attrs={},text='',fileInput=false}){
  if(['data-edit-event','data-delete-event','data-delete-task','data-date','data-add-date','data-month','data-view','data-category'].some(key=>key in attrs))return null;
  if(tag==='label'&&!fileInput)return null;
  if(tag==='a'&&!('download' in attrs)&&!/(?:button|action|download|export|format)/i.test(attrs.class||'')&&!formats.test(attrs.href||''))return null;
  if(!['button','a','label'].includes(tag))return null;
  if(tag==='label'&&fileInput)return /(?:JPG|PNG|WebP|attēl|fotogr)/i.test(text)?'file-image':'upload';
  const value=[attrs['data-format'],attrs['data-period-export'],attrs['data-export'],attrs['data-shift-download'],attrs['data-studio-export']].filter(Boolean).join(' ');
  const subject=value+' '+text+' '+(attrs.href||'');
  for(const rule of rules)if(new RegExp(rule.pattern,'i').test(subject))return rule.icon;
  if(attrs['data-action']==='backup')return 'file-json';
  return 'download' in attrs?'download':null;
 }
 function icon(name){return `<svg class="icon file-action-icon" aria-hidden="true" focusable="false"><use href="#i-${name}"/></svg>`;}
 function enhance(el){
  if(!el?.matches?.('button,a,label')||el.querySelector('svg,img,picture'))return false;
  const attrs=Object.fromEntries([...el.attributes].map(a=>[a.name,a.value]));
  const name=classify({tag:el.localName,attrs,text:el.textContent,fileInput:!!el.querySelector('input[type="file"]')});if(!name)return false;
  el.insertAdjacentHTML('afterbegin',icon(name));el.classList.add('has-file-action-icon');return true;
 }
 function init(doc){
  function scan(root){if(root.nodeType!==1)return;enhance(root);for(const el of root.querySelectorAll('button,a,label'))enhance(el);}
  for(const el of doc.querySelectorAll('button,a,label'))enhance(el);
  new MutationObserver(records=>{for(const record of records){const parent=record.target.nodeType===1?record.target:record.target.parentElement;enhance(parent?.closest('button,a,label'));for(const node of record.addedNodes)scan(node);}}).observe(doc.body,{childList:true,subtree:true});
 }
 return{classify,icon,enhance,init};
});
