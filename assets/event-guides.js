(() => {
  const root=document.querySelector('[data-events-directory]');if(!root)return;
  const form=root.querySelector('form'),search=root.querySelector('[data-event-search]'),city=root.querySelector('[data-event-city]'),category=root.querySelector('[data-event-category]'),cards=[...root.querySelectorAll('[data-event-card]')];
  const normalize=value=>value.toLocaleLowerCase('lv').normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  function filter(){const query=normalize(search.value.trim());let count=0;for(const card of cards){const visible=(!city.value||card.dataset.city===city.value)&&(!category.value||card.dataset.category===category.value)&&(!query||normalize(card.textContent).includes(query));card.hidden=!visible;count+=Number(visible);}for(const group of root.querySelectorAll('[data-event-group]'))group.hidden=![...group.querySelectorAll('[data-event-card]')].some(card=>!card.hidden);root.querySelector('[data-event-count]').textContent=`${count} no ${cards.length} ceļvežiem`;root.querySelector('[data-event-empty]').hidden=count>0;}
  form.addEventListener('submit',event=>event.preventDefault());form.addEventListener('input',filter);form.addEventListener('change',filter);form.addEventListener('reset',()=>requestAnimationFrame(filter));
})();
(() => {
  const money=new Intl.NumberFormat('lv-LV',{style:'currency',currency:'EUR'});
  for(const root of document.querySelectorAll('[data-price-compare]')){
    const inputs=[...root.querySelectorAll('input')],output=root.querySelector('output');
    const update=()=>{const values=inputs.map(input=>input.value===''?null:Number(input.value));if(values.some(v=>v===null||!Number.isFinite(v)||v<0)){output.textContent='Ievadi abas cenas un nenegatīvas piegādes izmaksas.';return;}const [a,da,b,db]=values,totalA=Math.round((a+da)*100)/100,totalB=Math.round((b+db)*100)/100,diff=Math.round(Math.abs(totalA-totalB)*100)/100;output.textContent=`A: ${money.format(totalA)} · B: ${money.format(totalB)}. `+(diff===0?'Kopsummas ir vienādas.':`${totalA<totalB?'A':'B'} kopā maksā par ${money.format(diff)} mazāk.`);};
    for(const input of inputs)input.addEventListener('input',update);
  }
})();
