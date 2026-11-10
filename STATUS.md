# Kalendārs365 — pašreizējais laidiena statuss

Atjaunināts 2026-11-10. Repozitorijs: https://github.com/mateopedersen/kalendars365-latvia. Publiskā vietne: https://kalendars365.lv/ — Cloudflare Pages. Galvenā Letonijas laidiena saturs un ikdienas horoskopa publicēšana pārbaudīta publiskajā vidē.

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

* Pēdējā horoskopa izdevuma datu commit: [`07c537d`](https://github.com/mateopedersen/kalendars365-latvia/commit/07c537daa5844c9fad71b6c73f49b9a8b89bd459) — ģenerētais ikdienas izdevums.
* Koda/ēkas pārbaude: [GitHub Actions 42778877651](https://github.com/mateopedersen/kalendars365-latvia/actions/runs/42778877651) — `Verify Latvia calendar`, sekmīgi pie `3233a31`.
* Ikdienas izdevuma ģenerēšana, Riga datums un 12 zīmes: [GitHub Actions 42778877739](https://github.com/mateopedersen/kalendars365-latvia/actions/runs/42778877739) — sekmīgi; izveidoja `07c537d`.
* CodeQL pārbaude: [GitHub Actions 42778877907](https://github.com/mateopedersen/kalendars365-latvia/actions/runs/42778877907) — sekmīgi.
* HTTPS pārbaude `kalendars365.lv`: galvenā lapa un foto, studiju, Mēness, saules, horoskopa un Līgo lapas atbild ar 200; horoskopa API atgriež `2026-11-10`, `Europe/Riga` un 12 zīmes; Kuldīgas prognozes API atbild ar 200; neesošs ceļš atbild ar īstu 404.
* Publiskās lapas `asset-version` ir `d395eae4e21383ac`, kas sakrīt ar `main` versiju. Visas 1001 manifestā pārbaudītās lokālās aktīvu kontrolsummas sakrīt. Cloudflare izvietojuma UUID publiskie maršruti neatklāj; dzīvais domēns un satura kontrolsumma ir pārbaudīti tieši.

## Zināmie ierobežojumi

- 55 maršruti ir `noindex` satura pārbaudes vai īpaša lietojuma dēļ; tie nav kļūdaini izlaisti no sitemap.
- Vārdu dienu katalogs saglabā skaidri norādīto VVC 2018. gada tradicionālo izdevumu, nevis nepārbaudītu apgalvojumu par aktuālu pilno sarakstu. Nākamo mācību gadu brīvlaiki netiek minēti kā oficiāli, kamēr nav atbilstoša avota.
- Horoskopa ikdienas izdevums tiek ģenerēts no oriģinālas, ar MI palīdzību sagatavotas latviešu tekstu bankas; tas ir izklaides saturs un astronomisko datu simboliska atlase, nevis zinātniska prognoze vai jauns ārēja speciālista raksts. Dzimtās valodas redaktors to nav neatkarīgi apstiprinājis.
- 2026./2027. akadēmiskā gada kalendāri ir avotos pamatoti 9 no 11 valsts augstskolām; Ventspils Augstskolas un Nacionālās aizsardzības akadēmijas atsevišķs brīvlaiku grafiks pētījuma brīdī netika atrasts. Privātās koledžas šajā valsts augstskolu sarakstā nav iekļautas.
- SVG kategoriju un zodiaka zīmējumi ir oriģinālas, slāņotas vektoru ilustrācijas ar dziļuma efektu; tie nav fotoreālistiski 3D modeļi. Saules laiki ir efemerīdu aprēķini ar norādītu horizonta modeli, nevis novērojuma garantija. Laikapstākļi ir ārēja prognoze, nevis radara attēls.
- Nav veikta neatkarīga juridista, profesionāla meteorologa vai dzimtās latviešu valodas redaktora sertifikācija.

Iepriekšējā Lietuvas un Slovēnijas projekta izmaiņas nav šī laidiena daļa.
