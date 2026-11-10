import {dateKey} from '../../../assets/sky-core.mjs';
import {checkEditionDate,createEdition,renderCollectionMarkup,renderDailyMarkup} from '../../../lib/horoscope-edition.mjs';

const json=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':status===200?'public, max-age=60, s-maxage=900':'no-store','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex'}});

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
