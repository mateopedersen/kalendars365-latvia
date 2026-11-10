import {dateKey} from '../../assets/sky-core.mjs';
import {createEdition,renderCollectionMarkup,renderDailyMarkup} from '../../lib/horoscope-edition.mjs';

const markers=(slug)=>({start:`<!--K365-HOROSCOPE-BEGIN:${slug}-->`,end:`<!--K365-HOROSCOPE-END:${slug}-->`});

export async function onRequest(context) {
  const response=await context.next(),path=new URL(context.request.url).pathname;
  if(!response.ok||!path.startsWith('/horoskops/'))return response;
  const html=await response.text(),edition=createEdition(dateKey());
  const slug=path==='/horoskops/'?'collection':decodeURIComponent(path.split('/').filter(Boolean).at(-1)||'');
  const pair=markers(slug);
  const first=html.indexOf(pair.start),last=html.indexOf(pair.end);
  let updated=html;
  if(first>=0&&last>first) {
    const markup=slug==='collection'?renderCollectionMarkup(edition):edition.entries[slug]?renderDailyMarkup(edition.entries[slug],edition.method):null;
    if(markup)updated=html.slice(0,first)+pair.start+`<div data-horoscope-${slug==='collection'?'collection':'view'}${slug==='collection'?'':`="${slug}" data-edition-date="${edition.date}"`}>${markup}</div>`+html.slice(last+pair.end.length);
  }
  const headers=new Headers(response.headers);
  headers.set('Cache-Control','no-store, no-cache, must-revalidate');
  headers.set('CDN-Cache-Control','no-store');
  headers.delete('Content-Length');
  headers.delete('ETag');
  return new Response(updated,{status:response.status,statusText:response.statusText,headers});
}
