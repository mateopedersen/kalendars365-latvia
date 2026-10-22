'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const C=require('../assets/calendar-core.js');
const output=path.resolve(__dirname,'../docs');
const format=new Intl.DateTimeFormat('lv-LV',{year:'numeric',month:'long',day:'numeric',timeZone:'UTC'});
const weekday=new Intl.DateTimeFormat('lv-LV',{weekday:'long',timeZone:'UTC'});
const rows=[];
for(let year=2027;year<=2030;year++)for(let month=1;month<=12;month++)for(const day of [1,2,5,10,21]){
  const date=new Date(Date.UTC(year,month-1,day)),key=C.dateISO(date),expected=format.format(date),actual=C.dateLabel(date);
  assert.equal(actual,expected,key);assert.equal(C.weekdays[C.weekday(date)-1],weekday.format(date).toLocaleLowerCase('lv'));
  rows.push([key,expected,actual,'PASS']);
}
assert.equal(rows.length,240);
const csv=[['date','expected_ICU_lv_LV','actual_core','result'],...rows].map(r=>r.map(s=>'"'+s.replaceAll('"','""')+'"').join(',')).join('\n');
fs.writeFileSync(path.join(output,'L10N_DATE_SAMPLES.csv'),csv+'\n');
fs.writeFileSync(path.join(output,'LATVIAN_L10N_QA.md'),`# Letonca tarih ve dil kontrolü\n\nKontrol tarihi: 22 Ekim 2026.\n\n240 tarih ifadesi, dört yılın her ayı ve ayın 1, 2, 5, 10, 21. günleri için bağımsız Node/ICU lv-LV biçimlendiricisinin çıktısıyla karşılaştırıldı. Her tarih için hafta günü ayrıca karşılaştırıldı: 480 karşılaştırma geçti. Ayrıntı: L10N_DATE_SAMPLES.csv. ICU sürümü: ${process.versions.icu}; Unicode sürümü: ${process.versions.unicode}; CLDR sürümü: ${process.versions.cldr}.\n\nDoğrulama kaynağı: https://unicode.org/cldr/charts/49/summary/lv.html ve https://unicode.org/cldr/charts/43/verify/dates/lv.html.\n\nDüzeltilen hata: tek başına tarih etiketinde ilgi hali yerine yalın ay adı kullanıldı (2027. gada 1. janvāris). Cümle içinde tarih için ayrı locative biçim (janvārī), aylık sayfa başlığında genitive (janvāra kalendārs) korunuyor. Yeni Ay etiketi paket sözlüğündeki Jaunmēness olarak birleştirildi.\n\nBu test tarih biçimleri ve haftanın günleri içindir; sitenin tüm cümleleri, kişi adı çekimleri veya editoryal doğal dil kalitesini kanıtlamaz. Ana dili Letonca olan bağımsız bir editörün incelemesi yapılmadı. Bu nedenle uzman editör onayı varmış gibi sunulmamalıdır.\n`);
console.log(JSON.stringify({status:'passed',dateSamples:rows.length,comparisons:rows.length*2,icu:process.versions.icu,cldr:process.versions.cldr,nativeEditor:false}));
