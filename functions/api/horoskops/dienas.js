import {dateKey,dayBounds} from '../../../assets/sky-core.mjs';
import {checkEditionDate,createEdition,renderCollectionMarkup,renderDailyMarkup} from '../../../lib/horoscope-edition.mjs';

export function editionCacheControl(now=new Date()) {
  const remaining=Math.max(0,Math.floor((dayBounds(dateKey(now)).end-now)/1000));
  return 'public, max-age='+Math.min(60,remaining)+', s-maxage='+Math.min(900,remaining)+', must-revalidate';
}
const json=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':status===200?editionCacheControl():'no-store','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex'}});

export async function onRequestGet({request}) {
  const url=new URL(request.url),today=dateKey(),requested=url.searchParams.get('date')||today;
  try {
    checkEditionDate(requested,today);
    const edition=createEdition(requested);
    const slug=url.searchParams.get('sign');
    if(slug&&!edition.entries[slug])return json({error:'Zodiaka zīme nav atrasta.'},404);
    const markup=slug?renderDailyMarkup(edition.entries[slug],edition.method):null;
    return json({date:edition.date,timeZone:edition.timeZone,context:edition.context,entries:slug?{[slug]:edition.entries[slug]}:edition.entries,method:edition.method,markup,collectionMarkup:slug?null:renderCollectionMarkup(edition)});
  } catch(error) {
    return json({error:error instanceof RangeError?error.message:'Pieprasītais dienas izdevums nav pieejams.'},400);
  }
}
