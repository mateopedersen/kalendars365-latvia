/* In-place progressive filtering; all articles remain usable without JavaScript. */
(function(){
  'use strict';
  const normalize=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('lv').replace(/[^\p{L}\p{N}]+/gu,' ').trim();
  const library=document.querySelector('[data-blog-library]');if(!library)return;
  const form=library.querySelector('[data-blog-search]'),query=form.querySelector('input');
  const buttons=Array.from(library.querySelectorAll('[data-blog-topic]'));
  const cards=Array.from(library.querySelectorAll('[data-blog-card]')).map(el=>({el,text:normalize(el.dataset.title+' '+el.dataset.search+' '+el.dataset.category)}));
  const count=library.querySelector('[data-blog-count]'),empty=library.querySelector('[data-blog-empty]');let topic='Visi';
  function apply(){const terms=normalize(query.value).split(' ').filter(Boolean);let visible=0;for(const card of cards){const show=(topic==='Visi'||card.el.dataset.category===topic)&&terms.every(word=>card.text.includes(word));card.el.hidden=!show;if(show)visible++;}count.textContent=visible===1?'1 raksts':visible+' raksti';empty.hidden=visible!==0;for(const b of buttons)b.setAttribute('aria-pressed',String(b.dataset.blogTopic===topic));}
  form.addEventListener('submit',event=>{event.preventDefault();apply();});query.addEventListener('input',apply);
  for(const button of buttons)button.addEventListener('click',()=>{topic=button.dataset.blogTopic;apply();});
  library.querySelector('[data-blog-reset]').addEventListener('click',()=>{query.value='';topic='Visi';apply();query.focus();});
  const params=new URLSearchParams(location.search),initialTopic=params.get('tema');if(buttons.some(b=>b.dataset.blogTopic===initialTopic))topic=initialTopic;
  if(params.has('q'))query.value=params.get('q').slice(0,150);apply();
})();
