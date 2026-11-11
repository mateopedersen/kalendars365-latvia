const ORIGIN='https://kalendars365.lv';
const months=['janvaris','februaris','marts','aprilis','maijs','junijs','julijs','augusts','septembris','oktobris','novembris','decembris'];
export const escapeShare=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const validDate=s=>/^20\d\d-\d\d-\d\d$/.test(s)&&!Number.isNaN(Date.parse(s+'T12:00:00Z'))&&new Date(s+'T12:00:00Z').toISOString().slice(0,10)===s;
export function safePublicUrl(input,{date,view,year,month}={}){
 const source=new URL(input,ORIGIN);if(source.protocol!=='https:'&&source.protocol!=='http:')throw new TypeError('Unsupported link');
 const url=new URL(ORIGIN);url.pathname=source.pathname;const params=source.searchParams;
 for(const key of ['date','from','to']){const v=params.get(key);if(v&&validDate(v))url.searchParams.set(key,v);}
 if(/^20(?:2[7-9]|30)$/.test(params.get('year')||''))url.searchParams.set('year',params.get('year'));
 if(/^(?:[1-9]|1[0-2])$/.test(params.get('month')||''))url.searchParams.set('month',params.get('month'));
 if(['month','week','day','year','list'].includes(params.get('view')))url.searchParams.set('view',params.get('view'));
 const city=params.get('city');if(city&&/^[a-z][a-z-]{0,45}$/.test(city))url.searchParams.set('city',city);
 const q=params.get('q');if(url.pathname==='/varda-dienas/'&&q&&/^[\p{L} '-]{1,50}$/u.test(q))url.searchParams.set('q',q);
 if(date&&validDate(date)){url.searchParams.set('date',date);if(['month','week','day','year','list'].includes(view))url.searchParams.set('view',view);}
 if(url.pathname==='/'||url.pathname==='/menesa-kalendars/'||url.pathname==='/nedelas-kalendars/'){
  const d=url.searchParams.get('date'),y=Number(year||d?.slice(0,4)),m=Number(month||d?.slice(5,7));
  if(y>=2027&&y<=2030){
   if((view||url.searchParams.get('view'))==='year')url.pathname=`/kalendars/${y}/`;
   else if(m>=1&&m<=12)url.pathname=`/kalendars/${y}/${months[m-1]}/`;
  }
 }
 return url.href;
}
export function safeShareImage(input){const u=new URL(input,ORIGIN);if(u.origin!==ORIGIN||!u.pathname.startsWith('/assets/')&&!u.pathname.startsWith('/downloads/')||!/[.](?:jpe?g|png|webp|svg)$/i.test(u.pathname))throw new TypeError('Unsupported image');u.search='';u.hash='';return u.href;}
export function safeTemplateUrl(input){const u=new URL(input,ORIGIN);if(u.origin!==ORIGIN||!u.pathname.startsWith('/downloads/')||!/[.](?:pdf|webp|png|jpg)$/i.test(u.pathname))throw new TypeError('Unsupported calendar file');u.search='';u.hash='';return u.href;}
export function shareText(context){return `${String(context.title||'Kalendārs365').slice(0,240)}\n${context.url}`;}
export function shareComposer(service,context,instance=''){
 const u=context.url,title=String(context.title||'Kalendārs365').slice(0,240),text=shareText(context),make=(base,params)=>{const x=new URL(base);for(const [k,v] of Object.entries(params))x.searchParams.set(k,v);return x.href;};
 switch(service.id){
 case 'facebook':return make('https://www.facebook.com/sharer/sharer.php',{u});
 case 'x':return make('https://x.com/intent/tweet',{url:u,text:title});
 case 'whatsapp':return make('https://wa.me/',{text});
 case 'telegram':return make('https://t.me/share/url',{url:u,text:title});
 case 'draugiem':return make('https://www.draugiem.lv/say/ext/add.php',{title,link:u});
 case 'linkedin':return make('https://www.linkedin.com/sharing/share-offsite/',{url:u});
 case 'pinterest':return make('https://www.pinterest.com/pin/create/button/',{url:u,media:context.image,description:title});
 case 'bluesky':{const graphemes=s=>[...new Intl.Segmenter('lv',{granularity:'grapheme'}).segment(s)].map(x=>x.segment),budget=Math.max(0,300-graphemes(u).length-1),parts=graphemes(title),caption=parts.length>budget?parts.slice(0,Math.max(0,budget-1)).join('')+'…':title;return make('https://bsky.app/intent/compose',{text:caption+'\n'+u});}
 case 'reddit':return make('https://www.reddit.com/submit',{url:u,title});
 case 'tumblr':return make('https://www.tumblr.com/widgets/share/tool',{canonicalUrl:u,title,caption:title,posttype:'link'});
 case 'line':return make('https://social-plugins.line.me/lineit/share',{url:u});
 case 'hackernews':return make('https://news.ycombinator.com/submitlink',{u,t:title});
 case 'gmail':return make('https://mail.google.com/mail/',{view:'cm',fs:'1',su:title,body:text});
 case 'outlook':return make('https://outlook.live.com/mail/0/deeplink/compose',{subject:title,body:text});
 case 'email':return 'mailto:?'+new URLSearchParams({subject:title,body:text}).toString();
 case 'mastodon':{
  const clean=instance.trim().replace(/^https:\/\//,'').replace(/\/$/,'');
  if(clean.length>253||!/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i.test(clean))throw new TypeError('Ievadi sava Mastodon servera domēnu, piemēram, mastodon.social.');
  return make('https://'+clean+'/share',{text});}
 default:return null;
 }
}
export function copyPayload(kind,context){
 if(kind==='copy-link')return context.url;
 if(kind==='copy-text')return shareText(context);
 if(kind==='markdown')return `[${escapeShare(String(context.title)).replace(/[\[\]\\\r\n]/g,' ')}](${context.url.replace(/\(/g,'%28').replace(/\)/g,'%29')})`;
 if(kind==='embed')return `<a href="${escapeShare(context.url)}" target="_blank" rel="noopener"><img src="${escapeShare(context.image)}" alt="${escapeShare(context.title)}" width="600" style="max-width:100%;height:auto">${escapeShare(context.title)}</a>`;
 throw new TypeError('Unknown copy action');
}
