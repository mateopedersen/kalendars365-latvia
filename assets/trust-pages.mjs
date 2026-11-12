const {matchesQuestion}=await import(new URL('./trust-core.mjs'+new URL(import.meta.url).search,import.meta.url));
const root=document.querySelector('[data-trust-page]');
if(root){
 const search=root.querySelector('[data-trust-query]');
 if(search){
  const groups=[...root.querySelectorAll('[data-trust-faq-group]')],items=[...root.querySelectorAll('[data-trust-faq-item]')];
  const records=items.map(item=>({item,text:item.textContent})),count=root.querySelector('[data-trust-count]'),empty=root.querySelector('[data-trust-empty]');
  function filter(){let visible=0;for(const {item,text} of records){const match=matchesQuestion(text,search.value);item.hidden=!match;if(match)visible++;}for(const group of groups)group.hidden=![...group.querySelectorAll('[data-trust-faq-item]')].some(item=>!item.hidden);count.textContent='Atbilstošie jautājumi: '+visible;empty.hidden=visible>0;}
  search.addEventListener('input',filter);root.querySelector('[data-trust-reset]').addEventListener('click',()=>{search.value='';filter();search.focus();});
 }
 root.querySelector('[data-trust-print]')?.addEventListener('click',()=>window.print());
 let printDetails=null;
 window.addEventListener('beforeprint',()=>{
  if(printDetails)return;
  printDetails=[...root.querySelectorAll('details')].map(detail=>({detail,open:detail.open}));
  for(const {detail} of printDetails)detail.open=true;
 });
 window.addEventListener('afterprint',()=>{
  for(const {detail,open} of printDetails||[])detail.open=open;
  printDetails=null;
 });
}
