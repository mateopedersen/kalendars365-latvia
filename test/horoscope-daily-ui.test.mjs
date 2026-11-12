import test from 'node:test';
import assert from 'node:assert/strict';
import {createEdition,renderCollectionMarkup,renderDailyMarkup} from '../lib/horoscope-edition.mjs';
const RealDate=Date;
function clock(date) {
  globalThis.Date=class extends RealDate {
    constructor(...args){super(...(args.length?args:[date+'T12:00:00Z']));}
    static now(){return new RealDate(date+'T12:00:00Z').getTime();}
  };
}
test('every sign receives a different daily interpretation across year and DST boundaries',()=>{
  let previous;
  try {
    for(let day=1;day<=370;day++) {
      const date=new RealDate(RealDate.UTC(2027,0,day)).toISOString().slice(0,10);clock(date);
      const edition=createEdition(date);assert.equal(Object.keys(edition.entries).length,12);
      if(previous)for(const [slug,entry] of Object.entries(edition.entries)) {
        assert.notEqual(entry.themeId,previous.entries[slug].themeId,`${slug}: ${date}`);
        assert.notEqual(entry.overview,previous.entries[slug].overview,`${slug}: ${date}`);
      }
      previous=edition;
    }
  } finally {globalThis.Date=RealDate;}
});
test('all twelve sign titles and illustrations link to their own detail page',()=>{
  try {
    clock('2027-02-14');const edition=createEdition(),markup=renderCollectionMarkup(edition);
    assert.equal((markup.match(/class="horoscope-sign-card-head" href=/g)||[]).length,12);
    for(const slug of Object.keys(edition.entries))assert(markup.includes(`href="/horoskops/${slug}/"`));
    assert(markup.includes('Atjaunots šodien'));assert(markup.includes('datetime="2027-02-14"'));
  } finally {globalThis.Date=RealDate;}
});
test('historical interpretations show their real edition date rather than a today label',()=>{
  try {
    clock('2027-02-14');const edition=createEdition('2027-02-13');
    for(const markup of [renderCollectionMarkup(edition),renderDailyMarkup(edition.entries.vezis,edition.method)]) {
      assert(!markup.includes('Atjaunots šodien'));assert(markup.includes('Izdevuma datums'));assert(markup.includes('datetime="2027-02-13"'));
    }
  } finally {globalThis.Date=RealDate;}
});
