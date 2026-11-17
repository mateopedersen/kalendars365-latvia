(function(){
'use strict';
if(window.K365Analytics)return;
const id='G-5E1KZEJCNR',key='k365.analytics-consent.v1',duration=180*86400000;
let saved=null,loaded=false;
try{const v=JSON.parse(localStorage.getItem(key));if(v&&v.version===1&&typeof v.analytics==='boolean'&&v.expiresAt>Date.now()&&v.expiresAt<=Date.now()+duration)saved=v;}catch{}
const allowedHost=location.hostname==='kalendars365.lv'||location.hostname==='www.kalendars365.lv';
const clean=value=>{try{const u=new URL(value);return /^https?:$/.test(u.protocol)?u.origin+u.pathname:'';}catch{return '';}};
const banner=document.getElementById('consent-banner');
function sync(){if(banner)banner.hidden=!!saved;document.documentElement.toggleAttribute('data-consent-saved',!!saved);document.body.classList.toggle('consent-open',!saved);if(saved)document.body.style.setProperty('--consent-space','0px');}
function apply(){
 window['ga-disable-'+id]=!saved?.analytics;
 if(!saved?.analytics||!allowedHost){
  if(loaded)window.gtag('consent','update',{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
  return;
 }
 if(loaded){window.gtag('consent','update',{analytics_storage:'granted',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});return;}loaded=true;
 window.dataLayer=window.dataLayer||[];window.gtag=function(){window.dataLayer.push(arguments);};
 gtag('consent','default',{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
 gtag('consent','update',{analytics_storage:'granted',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
 const settings={send_page_view:true,page_location:clean(location.href),page_referrer:clean(document.referrer),allow_google_signals:false,allow_ad_personalization_signals:false,cookie_expires:15552000,cookie_update:false};
 gtag('set',settings);
 gtag('js',new Date());
 gtag('config',id,settings);
 const s=document.createElement('script');s.async=true;s.src='https://www.googletagmanager.com/gtag/js?id='+id;document.head.append(s);
}
function forgetCookies(){for(const c of document.cookie.split(';')){const name=c.trim().split('=')[0];if(!/^_ga(?:_|$)/.test(name))continue;for(const domain of ['',location.hostname,'.kalendars365.lv'])document.cookie=name+'=;Max-Age=0;Path=/'+(domain?';Domain='+domain:'')+';SameSite=Lax;Secure';}}
const modal=document.createElement('dialog');modal.className='consent-dialog';modal.setAttribute('aria-labelledby','analytics-choice-title');modal.innerHTML='<h2 id="analytics-choice-title">Privātuma izvēles</h2><p>Google Analytics palīdz saprast apmeklējumu un lapu lietojumu. Tas tiek ielādēts tikai ar tavu piekrišanu. Personīgos plānus, formu ievaddatus un meklēšanas frāzes tam nesūtām. Google Analytics reklāmu personalizācija ir izslēgta. Piekrišana Adsterra reklāmām ir atsevišķa izvēle; analītikas atļauja to neieslēdz.</p><p>Vari jebkurā brīdī mainīt izvēli šeit. Atteikšanās neierobežo kalendāra darbību.</p><div class="actions"><button type="button" data-analytics-choice="no">Tikai nepieciešamās</button><button type="button" data-analytics-choice="yes">Atļaut analītiku</button><button type="button" data-analytics-close>Aizvērt</button></div><p><a href="/privatuma-politika/#analitika">Privātuma politika</a></p>';document.body.append(modal);
function choose(analytics){saved={version:1,analytics,expiresAt:Date.now()+duration};try{localStorage.setItem(key,JSON.stringify(saved));}catch{}sync();if(!analytics)forgetCookies();apply();modal.close();}
window.K365Analytics={choose,choice:()=>saved,open:()=>{if(!modal.open)modal.showModal();}};
document.addEventListener('click',e=>{const b=e.target.closest?.('[data-consent],[data-analytics-choice],[data-analytics-close],[data-action="consent"]');if(!b)return;e.preventDefault();e.stopImmediatePropagation();if(b.hasAttribute('data-analytics-close'))modal.close();else if(b.dataset.action==='consent')window.K365Analytics.open();else choose(b.dataset.analyticsChoice==='yes'||b.dataset.consent==='analytics');},true);
window.addEventListener('storage',e=>{if(e.key!==key&&e.key!==null)return;try{const v=JSON.parse(e.newValue||'null');saved=v&&v.version===1&&typeof v.analytics==='boolean'&&v.expiresAt>Date.now()&&v.expiresAt<=Date.now()+duration?v:null;}catch{saved=null;}sync();if(!saved?.analytics)forgetCookies();apply();});
sync();apply();
})();
