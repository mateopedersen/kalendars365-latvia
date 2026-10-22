# Datu un aprēķinu audits

Pārbaude: 2026-10-22. Mērķa periods: 2027-01-01–2030-12-31. Rezultāti attiecas uz šajā repozitorijā saglabāto versiju, nevis uz garantētu nākotnes normatīvo aktu stāvokli.

## Paketes izskatītais apjoms

Pilnībā nolasīti visi 10 CSV, kopā 1319 datu rindas, saglabājot sākotnējās vērtības `_data/packet-csv.json`:

| Ievade | Datu rindas |
|---|---:|
| Svētku noteikumi | 26 |
| Aprēķinātie 2027.–2030. gada datumi | 103 |
| Avotu reģistrs | 28 |
| URL matrica | 621 |
| Vārdu prioritāšu kandidāti | 69 |
| Atslēgvārdi un nolūki | 307 |
| Latviešu terminu vārdnīca | 66 |
| Drukas dizaini | 15 |
| Pieņemšanas kritēriji | 58 |
| Datumu un funkciju testu idejas | 26 |

XLSX pilnībā nolasītas visas deviņas darblapas. Izmēri ietver galvenes: Ozet 22×6; Sayfa_Plani 622×9; Anahtar_Kelimeler 308×6; Isim_Onceligi 70×8; Tatil_Verisi 104×8; Kabul_Kriterleri 59×4; 15_Tasarim 16×6; Kaynaklar 29×6; Dil_Sozlugu 67×4. Vērtības saglabātas `_data/packet-workbook.json`. Paketes statusa teksts “verified” vai “CALCULATED” netika pieņemts kā jaunas neatkarīgas pārbaudes rezultāts.

Paketes 103 datumu rindu datumi ir savietojami ar pārbaudītajiem noteikumiem. Septiņās rindās precīza teksta salīdzināšana atšķīrās nosaukumu dēļ: četri īsinātie barikāžu dienas nosaukumi un trīs aizstājošo brīvdienu formulējumi. Datuma konflikts šajos septiņos gadījumos nav konstatēts. Ražošanas kopa paplašināta ar pilnu likuma 2. pantu un no jauna pārbaudīto 2028. gada Dziesmu svētku noslēgumu.

Laboti avotu ceļi: skolas noteikumu adresē pirms `beigu` vajadzīgs `un`; svētku likuma nosaukums ir “Par svētku, atceres un atzīmējamām dienām”. USNO API dokumentācija pieejama arī `.html` adresē. Atšķirīgs adreses teksts pats par sevi nepierāda satura pareizību — izmantots atbilstošā tiesību akta numurs un pilns saturs.

## Ražošanas datu apjoms

| Kopa | Rezultāts |
|---|---|
| Kalendāra datumi | 1461 unikāls mērķa datums, 48 mēneši |
| ISO nedēļu gadi | Katram no 2027.–2030. ISO gadiem 52 nedēļas; kopā 208 |
| Svētku/atceres/atzīmējamo dienu ieraksti | 197 mērķa gados; 294 ar 2026./2031. robežgadiem |
| Vārda/datuma pāri | 1013, tikai oficiālais 2018. gada tradicionālais avots |
| Pārbaudīti prioritātes vārdu datumi | Visi 20; 68 no 69 plašākajiem kandidātiem |
| Mēness fāzes | 198 primārie notikumi: 49 / 50 / 49 / 50 |
| Gadalaiki un apsīdas | 24 primārie notikumi; astoņi saulgrieži |
| Skolas brīvdienu periodi | 4, tikai 2026./2027. mācību gads |
| Avotos pārbaudīti tematiskie raksti | 28; neatkarīga dzimtās valodas redaktora apstiprinājums nav veikts |
| L10N | 240 neatkarīgi datumu paraugi + 240 nedēļas dienu salīdzinājumi |

## Juridiski būtiskās atšķirības

- Tikai `holiday` un `substitute` ir `dayOff:true`. `commemoration` un `observance` nav automātiskas brīvdienas.
- 4. maija un 18. novembra nedēļas nogales noteikums nav attiecināts uz visiem svētkiem. 1. janvārim, 1. maijam, Jāņiem un Ziemassvētkiem vispārēja pirmdienas aizstāšana nav pievienota.
- Mātes diena un Vasarsvētki saglabā svētku statusu arī svētdienā. Tēva diena ir atzīmējama diena septembra otrajā svētdienā.
- Skolotāju diena ir **5. oktobrī**, nevis pēc vecākā oktobra pirmās svētdienas principa.
- 2028-07-09 ir pārbaudītā Vispārējo dziesmu un deju svētku noslēguma diena. 2028-07-10 ir aizstājošā brīvdiena. Šī korekcija maina 2028. gada darba dienu aprēķinu.
- 2028-11-20, 2029-11-19 un 2030-05-06 ir pārējās mērķa perioda aizstājošās brīvdienas.
- Pirmssvētku saīsinājums attiecas uz darba dienu tieši pirms `holiday`. Vienkārši atrašanās pirms atceres dienas vai aizstājošās brīvdienas nerada jaunu saīsinājumu.
- Nākotnes darba dienu pārcelšanas un individuāli darba grafiki nav izsecināti no iepriekšējiem gadiem. 2026./2031. robežu svētki ir domāti mēneša režģa pārklājumam, nevis pilnīgi apstiprinātu šo gadu darba pārcelšanas kalendāru publicēšanai.

## Standarta darba laika kontrolsummas

Piecu dienu nedēļa, astoņas stundas dienā, svētku priekšvakarā viena stunda mazāk, bez darba devēja izņēmumiem:

| Gads | Kalendāra dienas | Darba dienas | Darba stundas |
|---|---:|---:|---:|
| 2027 | 365 | 252 | 2009 |
| 2028 | 366 | 251 | 2004 |
| 2029 | 365 | 251 | 2004 |
| 2030 | 365 | 250 | 1995 |

Šīs ir norādītā modeļa aprēķinu kontrolsummas, nevis universālas darba samaksas normas jebkuram darbiniekam. `overrides` var mainīt konkrētas dienas statusu. Atšķirīga dienas stundu norma un sešu dienu darba nedēļa jānorāda atsevišķi.

## Kodola līgums

Ruby: `Calendar365` no `lib/calendar.rb`. JavaScript: `window.CalendarCore` vai CommonJS no `assets/calendar-core.js`. JavaScript datuma objekti izmanto UTC pusnakti; nedrīkst to laukus lasīt ar lokālajiem `getDate/getMonth` kā Latvijas laiku. Datuma ievadēm izmanto stingru `YYYY-MM-DD`. Kalendāra noteikumu atbalstītais diapazons: 1900–2100; mērķa tests: 2027–2030.

| JavaScript | Ruby | Atgriež / semantika |
|---|---|---|
| `parseISO(value)` | `parse_iso(value)` | UTC Date / Ruby Date; nederīgs datums rada kļūdu |
| `dateISO(value)` | `date_iso(value)` | `YYYY-MM-DD` |
| `isoWeek(value)` | `iso_week(value)` | `{year,week,weekday}`; pirmdiena=1, svētdiena=7 |
| `easter(year)` | `easter(year)` | Gregora Lieldienu svētdienas Date |
| `holidays(year)` | `holidays(year)` | Ieraksti `{date,title,type,dayOff,source}`; festivālam arī `dateSource` |
| `isWorkday(date, options)` | `is_workday(date, week_length:, overrides:)` | Boolean; brīvdienas un svētki izslēgti, skaidri izņēmumi prioritāri |
| `diffDays(a,b)` | `diff_days(a,b)` | Parakstīta starpība `b−a`, neiekļauj sākuma datumu kā atsevišķu dienu |
| `workdays(a,b,options)` | `workdays(a,b, week_length:, include_end:, overrides:)` | Pēc noklusējuma abas robežas iekļautas; apgriezta secība dod negatīvu skaitu |
| `workHours(date,options)` | `work_hours(date, week_length:, hours:, saturday_hours:, overrides:, shorten:)` | Konkrētās dienas modeļa stundas |
| `monthGrid(year,month)` | `month_grid(year,month)` | Mēnesis 1–12; rindas `{week,year,days}`; dienas `{date,day,inMonth,weekday,holiday:[...]}` |

JS opcijas: `{weekLength:5|6, includeEnd:true|false, hours:8, saturdayHours:5, shorten:true|false, overrides:{'YYYY-MM-DD':true|false}}`. Ne katra opcija vajadzīga katrai funkcijai. `workdays` ar `includeEnd:false` izslēdz diapazona lielāko datumu; apgrieztam intervālam saglabā antisimetriju. Tukšs pusatvērts vienas dienas intervāls dod 0.

Papildu JS palīgi: `addDays`, `weekday`, `nthWeekday`, `todayRiga(now)`, `dateLabel`, `dateInSentence`, `months`, `monthsGenitive`, `monthsLocative`, `weekdays`. `todayRiga` izmanto īstu Europe/Riga laika joslu, bet datumu aritmētika notiek date-only režīmā. Standalone datums: “2027. gada 1. janvāris”; teikumā: “2027. gada 1. janvārī”; mēneša lapas virsrakstā: “janvāra kalendārs”.

## Testi un neatkarība

- `ruby test/date_test.rb`: **8 testi, 3155 pārbaudes, 0 kļūmes**. 1461 datums, 48 mēneši, ISO robežas, 2028. gada 29. februāris, nederīgi datumi, likuma izņēmumi, darba laiks, starpgadu pārklājumi un ražošanas datu robežas.
- `node test/date_core_test.cjs`: **7158 pārbaudes, 0 kļūmes**. Ruby/JS paritāte visiem 1461 datumiem, ISO nedēļām, darba dienām un stundām; pilnie gada svētku ieraksti; 48 režģi; Mēness un gadalaiku datumu konversijas.
- `node test/date_l10n_test.cjs`: **240 paraugi, 480 salīdzinājumi, 0 kļūmes**. Neatkarīgais sagaidāmais teksts nāk no Node ICU/CLDR `Intl.DateTimeFormat('lv-LV')`, nevis no pārbaudāmā kodola masīviem. Faktiskie sagaidāmie un iegūtie rezultāti ir `docs/L10N_DATE_SAMPLES.csv`.
- Lieldienu, Lielās Piektdienas un Vasarsvētku sagaidāmie datumi papildus pārbaudīti pret visām četrām saglabātajām USNO Christian Observances atbildēm. Tas ir ārējs astronomijas/kalendāra kontrolavots; tikai divu mūsu kodola realizāciju sakritība netiktu uzskatīta par neatkarīgu juridiskās pareizības pierādījumu.
- Rīgas Saules vasaras un ziemas kontrolparaugi sakrīt ar lietotnes noapaļotajiem rezultātiem līdz minūtei. Šie divi paraugi neapliecina visu pilsētu/gadu precizitāti; UI saglabā “aptuvens aprēķins”.

## Neaizpildītie datu apjomi

1. Pilna VVC 2026. gada tradicionālā un paplašinātā saraksta iegūšana un salīdzināšana vēl jāveic. Tiešie CSV, CKAN API un VVC lapu savienojumi atkārtoti beidzās ar tīkla taimautu. Savā atsevišķā in-app browser cilnē neizdevās arī CDP navigācija/fokuss. Metadatu un vēsturiskā PDF nolasīšana izdevās. Tas nav pamats apgalvot, ka 2018. gada kopa ir aktuāla.
2. 2027./2028.–2030./2031. mācību gadu oficiālie brīvlaiki nav pārbaudīti. Publicēti tikai pieejamā noteikuma dati un skaidri `pending` statusi.
3. Paketes prioritāte “2025 newborn names” nav visas Latvijas iedzīvotāju popularitātes rangs. [PMLP 2025. gada publikācija](https://www.pmlp.gov.lv/lv/jaunums/2025-gada-popularakie-jaundzimuso-meitenu-un-zenu-vardi) un tās kohorta pārbaudīta; raksta attēlu rangs šajā sesijā nebija nolasāms. Kandidātu rank lauki saglabāti kā paketes kandidātu metadati, nevis no jauna pārbaudīts statistisks apgalvojums. Vārdadienu datumi ir atsevišķi pārbaudīti VVC 2018. gada avotā.
4. Neatkarīga jurista un dzimtās latviešu valodas redaktora pārbaude nav veikta. Avotu pārbaudes un automatizētos testus nedrīkst attēlot kā šādu apstiprinājumu.

Nav ievietoti izdomāti personvārdu datumi, skolu brīvlaiki, nepublicēti pārcelšanas grafiki, Mēness fāžu tuvinājumi oficiālo notikumu vietā vai paredzētas pasākumu programmas. Neiegūts avots ir norādīts kā neiegūts, nevis aizstāts ar nojausmu.
