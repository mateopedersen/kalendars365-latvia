# Kalendārs365 — pašreizējais laidiena statuss

Atjaunināts 2026-11-10. Repozitorijs: https://github.com/mateopedersen/kalendars365-latvia. Publiskā vietne: https://kalendars365.lv/ — Cloudflare Pages. Šajā darba kopijā veiktās izmaiņas vēl gaida publicēšanu; šeit netiek apgalvots, ka tās jau ir dzīvajā vidē.

## Pašreizējās versijas lokālā pārbaude

- Jekyll izveide un maršrutu audits: 998 reģistra maršruti, 943 indeksējami, 55 ar `noindex`; ģenerēti 1001 HTML faili un 2007 kopējie faili (364 270 458 baiti), audita kļūdu nav.
- 391 sākotnējās URL matricas ieraksts: 390 tieši atveramas vietējās lapas un viens pastāvīgs novirzījums; galamērķu trūkumu nav.
- 82 Latvijas pilsētas/ apdzīvotas vietas; pilsētu attēlu 164 lokālie varianti pārbaudīti pēc kontrolsummām. Visiem izmantota `Europe/Riga` laika josla.
- Fotogrāfiju un licenču katalogā ir 82 pilsētu avoti, 42 unikālas svētku/atceres dienu fotogrāfijas un 9 ar atvērtu licenci pārbaudīti augstskolu attēli; 2 augstskolu foto netiek pārpublicēti, kamēr nav apstiprinātas tiesības.
- Astronomijas tabulās: 2026.–2030. gadam 248 Mēness fāzes notikumi un 30 gadalaiku notikumi. Saullēkta, saulrieta un aptumsuma aprēķinu ceļi pārbaudīti atsevišķi.
- 48 avotos balstītas svētku un atceres lapas, vēl 14 Latvijas kultūras tēmu lapas, 16 dārzeņu profili un 12 mēnešu sējas plāni.
- Dienas horoskopa API ģenerē 12 zīmju izdevumu pēc `Europe/Riga` datuma; GitHub Actions ik dienu pārbauda, vai publiskā API atgriež šodienas datumu un pilnus ierakstus.
- Sīkāka pārbaudes tabula un ierobežojumi ir `docs/TEST_RESULTS.md`; datu robežas un avotu piezīmes — `docs/DATA_AUDIT.md` un `docs/OCCASION_RESEARCH.md`.

## Publicēšanas stāvoklis

Pirms šī laidiena nosūtīšanas uz `main` un pārbaudes publiskajā vidē nav norādīts jauns commit, Cloudflare izvietojuma ID vai GitHub Actions izpildes ID. Tos šeit aizpilda tikai pēc faktiskas publicēšanas un HTTPS pārbaudes.

## Zināmie ierobežojumi

- 55 maršruti ir `noindex` satura pārbaudes vai īpaša lietojuma dēļ; tie nav kļūdaini izlaisti no sitemap.
- Vārdu dienu katalogs saglabā skaidri norādīto VVC 2018. gada tradicionālo izdevumu, nevis nepārbaudītu apgalvojumu par aktuālu pilno sarakstu. Nākamo mācību gadu brīvlaiki netiek minēti kā oficiāli, kamēr nav atbilstoša avota.
- Horoskops ir izklaides teksts un astronomisko datu simboliska atlase; tā nav zinātniski pamatota prognoze. Teksti sagatavoti latviski ar MI palīdzību, un dzimtās valodas redaktors tos nav neatkarīgi apstiprinājis.
- Saules laiki ir ephemerīdu aprēķini ar norādītu horizonta modeli; tie nav novērojuma garantija. Laikapstākļu attēlojums ir atkarīgs no ārējā prognozes pakalpojuma pieejamības.
- Nav veikta neatkarīga juridista, profesionāla meteorologa vai dzimtās latviešu valodas redaktora sertifikācija.

Iepriekšējā Lietuvas un Slovēnijas projekta izmaiņas nav šī laidiena daļa.
