# Datu avoti un atjaunošanas kārtība

Pārbaudes datums: **2026-10-22**. Šajā datu kopā “verified” nozīmē, ka konkrētais fakts pārbaudīts norādītajā pirmavotā. Tas nav apliecinājums par nākotnes tiesību aktu nemainīgumu vai neatkarīga cilvēka redaktora apstiprinājumu. Vēsturiskais vārdu saraksts ir īpaši marķēts `snapshot_verified`, nevis pasniegts kā pilns aktuālais saraksts.

## Ražošanas datu kopas

| Dati | Pirmavots | Izmantotais apjoms un robežas |
|---|---|---|
| Svētku, atceres un atzīmējamās dienas | [Likums “Par svētku, atceres un atzīmējamām dienām”](https://likumi.lv/ta/id/72608-par-svetku-atceres-un-atzimejamam-dienam) | Konsolidētā redakcija no 18.03.2025. Pilns 1. un 2. panta ierakstu kopums, aprēķināts 2027.–2030. gadam; 2026. un 2031. gada ieraksti nodrošina mēneša režģu gadu robežas. Teksts pieejams arī [oficiālajā vecajā adresē](https://likumi.lv/doc.php?id=72608/). |
| Darba laiks | [Darba likums, 131., 133., 135. pants](https://likumi.lv/ta/id/26019-darba-likums) | Pēc noklusējuma piecas darba dienas, astoņas stundas dienā; vienas stundas saīsinājums darba dienā tieši pirms svētku dienas. Sešu dienu modelim pirmdiena–piektdiena līdz 7 stundām un sestdienā 5 stundas. Personīgu darba grafiku nosaka lietotājs/darba devējs. |
| Dziesmu un deju svētki | [MK rīkojums par 2028. gada norises laiku](https://likumi.lv/ta/id/367734-par-xxviii-visparejo-latviesu-dziesmu-un-xviiideju-svetku-norises-laiku), [KM 14.04.2026. paziņojums](https://www.km.gov.lv/lv/jaunums/nakamie-visparejie-latviesu-dziesmu-un-deju-svetki-notiks-2028-gada-vasara) | Norises periods Rīgā: 30.06.–09.07.2028. Noslēguma diena 09.07.2028. ir svētku diena; tā ir svētdiena, tāpēc 10.07.2028. ir likumā paredzētā nākamās darbdienas brīvdiena. Viss festivāla periods nav brīvdienu periods. |
| Skolu brīvdienas | [MK noteikumi Nr. 768 par 2026./2027. mācību gadu](https://likumi.lv/ta/id/365210-noteikumi-par-20262027-macibu-gada-un-macibu-semestru-sakuma-un-beigu-laiku-un-brivdienu-laiku) | Pieņemti 16.12.2025., publicēti 18.12.2025. Četri brīvdienu periodi, klašu grupu gada beigas un 1. klases papildnedēļas nosacījums. 2027./2028. un vēlāki mācību gadi ir `pending`; to datumi nav izdomāti. |
| Tradicionālās vārdadienas — vēsturiskais avots | [VVC tradicionālo vārdadienu saraksts, PDF](https://www.vvc.gov.lv/lv/media/164/download?attachment=) | Pilns oficiālā PDF teksta izraksts; avota noslēgumā norādīts `Vardadienu_saraksts_2018.doc`. Importēti 1013 vārda/datuma pāri. Saglabātas 366 datumu rindas, ieskaitot tukšo 29. februāri. Pilna atbilstība 2026. gada izdevumam nav pārbaudīta. |
| Jaunākais VVC saraksts — gaida datņu iegūšanu | [VVC Kalendārvārdu ekspertu komisija](https://www.vvc.gov.lv/lv/kalendarvardu-ekspertu-komisija), [Latvijas atvērto datu portāls](https://data.gov.lv/dati/eng/dataset/latviesu-tradicionalais-un-paplasinatais-kalendarvardu-saraksts) | VVC lapā tradicionālā CSV atjauninājums 09.02.2026.; paplašinātā CSV 16.03.2026. CKAN datos licence CC0-1.0. Metadati nolasīti, datnes šajā sesijā nebija lejupielādējamas. `namesComplete:false`. |
| Mēness galvenās fāzes | [USNO API dokumentācija](https://aa.usno.navy.mil/data/api.html) | 198 reāli API notikumi 2027.–2030. gadā: 49, 50, 49, 50. Četras galvenās fāzes. Saglabāts UTC un pārrēķināts vietējais datums/laiks. Netiek izdomāta pilna diennakts fāze vai apgaismojuma procents. |
| Gadalaiku astronomiskie brīži | [USNO API dokumentācija](https://aa.usno.navy.mil/data/api.html) | 24 reāli notikumi: katrā gadā divas ekvinokcijas, divi saulgrieži, perihēlijs un afēlijs. USNO ASV vasaras laika slēdzis izslēgts; konvertēšana veikta ar IANA Europe/Riga. |
| Neatkarīga Lieldienu kontrole | [USNO Selected Christian Observances](https://aa.usno.navy.mil/data/api.html) | Četru gadu neatkarīgās API atbildes pārbauda Lieldienas, Lielo Piektdienu un Vasarsvētkus pret Ruby aprēķinu. |
| Rīgas Saules laiku kontrolparaugi | [USNO vienas dienas datu API](https://aa.usno.navy.mil/data/api.html) | Divi kontrolparaugi koordinātām 56.9496, 24.1052: 21.06.2027. un 21.12.2027. Tie pārbauda lietotnes aptuveno Saules aprēķinu, nevis padara visu aprēķinu par USNO efemerīdu. |
| Latviešu datumu formas | [Unicode CLDR latviešu dati](https://unicode.org/cldr/charts/49/summary/lv.html), [CLDR datumu paraugi](https://unicode.org/cldr/charts/43/verify/dates/lv.html) | 240 faktiskie neatkarīgie ICU/Intl datumu paraugi un 240 nedēļas dienu salīdzinājumi. Pārbaude neaptver visu vietnes redakcionālo valodu. |

## Lejupielādētie astronomijas pirmavoti

Katram gadam `YYYY = 2027, 2028, 2029, 2030`:

- `https://aa.usno.navy.mil/api/moon/phases/year?year=YYYY` → `_data/usno-YYYY.json`.
- `https://aa.usno.navy.mil/api/seasons?year=YYYY` → `_data/usno-seasons-YYYY.json`.
- `https://aa.usno.navy.mil/api/observances/christian?year=YYYY` → `_data/usno-christian-YYYY.json`.

Saules kontrolparaugi:

- [21.06.2027., Rīga, UTC](https://aa.usno.navy.mil/api/rstt/oneday?date=2027-06-21&coords=56.9496,24.1052&tz=0): 01:29 / 19:22 UTC; 04:29 / 22:22 Europe/Riga.
- [21.12.2027., Rīga, UTC](https://aa.usno.navy.mil/api/rstt/oneday?date=2027-12-21&coords=56.9496,24.1052&tz=0): 07:00 / 13:43 UTC; 09:00 / 15:43 Europe/Riga.

API versija: 4.0.1. Iegūtās atbildes ir saglabātas repozitorijā, tāpēc vietnes veidošana nav atkarīga no dzīvas API. SHA-256 kontrolsummas ir `_data/source-checksums.json`. Precīzi astronomiskie UTC brīži un Latvijā rādāmais laiks tiek glabāti atsevišķi; nākotnes laika joslas politikas maiņa prasa konvertēšanas atkārtošanu.

## Vārdadienu izdevumi

2018. gada avots tika iegūts caur pārlūkošanas rīka oficiālā PDF teksta izvilkumu. Saglabāts `_data/vvc-traditional-2018-extract.txt`; tas nav oriģinālā PDF binārais fails. PDF izvilkuma sapludinātās lappušu robežu rindas reproducējami atdala `lib/import_vvc_snapshot.py`. 22. maija piezīme par kalendārā neierakstītajiem vārdiem netiek importēta kā cilvēka vārds. Teksts no cita portāla netika pārrakstīts par oficiālu 2026. gada CSV.

Visiem publicētajiem vārda ierakstiem ir `edition:"2018"`, `status:"snapshot_verified"`, `currentEditionVerified:false`, pārbaudes datums un precīzs PDF avots. Visi 20 prioritātes vārdi un 68 no 69 paketes kandidātiem šajā avotā atrodami. `Daniēls` nav automātiski pielīdzināts avota `Dāniels` vai `Daniels`.

Jaunākās datnes jāiegūst un jāsalīdzina pirms pilnas 2026. gada atbilstības apgalvojuma:

- [Tradicionālā saraksta resurss](https://data.gov.lv/dati/eng/dataset/latviesu-tradicionalais-un-paplasinatais-kalendarvardu-saraksts/resource/39d01c5b-6964-4e91-b05c-45e6fbf1b77a).
- [Paplašinātā saraksta resurss](https://data.gov.lv/dati/eng/dataset/latviesu-tradicionalais-un-paplasinatais-kalendarvardu-saraksts/resource/549f6083-c28b-46b3-b401-538ccf83329f).

VVC 2025. gada 30. aprīļa komisijas ziņojumā minētie deviņi papildinājumi tika pārbaudīti, bet nav klusi pievienoti 2018. gada sarakstam. Tas novērš dažādu izdevumu sajaukšanu. Paplašinātais saraksts nav pasniegts kā tukšs oficiāls saraksts: tas ir neiegūts datu apjoms.

## Darba dienu pārcelšana

[MK 16.06.2026. sēdes protokola 44. paragrāfs](https://www.vestnesis.lv/op/2026/121.4) apliecina, ka 2027. gada pārcelšanas projekta izskatīšana toreiz atlikta. Vēlāka [iFinanses 14.10.2026. publikācija](https://ifinanses.lv/zinas/actual-2027-gada-darba-dienas-netiek-parceltas/31835) ziņo par Labklājības ministrijas skaidrojumu, ka 2027. gadā dienas netiks pārceltas. Šī vēlākā ziņa ir sekundārs apstiprinājums; tieša ministrijas publikācija sesijā netika iegūta. Ražošanas aprēķinā nav pieņemta neviena neapstiprināta pārcelšana. Arī 2028.–2030. gadam pārcelšanas netiek prognozētas.

`overrides` ļauj piemērot dokumentētu darba devēja grafiku. Tas ir lietotāja norādīts izņēmums, nevis jauns valsts likums. Svētku dienas aizstājošā brīvdiena un darba dienas pārcelšana uz sestdienu ir atšķirīgi noteikumi.

## Redakcionālie pirmavoti

28 raksti glabā savus precīzos avotus `_data/occasions.json` laukā `sourceUrls` un sasaista konkrēto skaidrojumu ar avotu tekstā. Papildus likumiem izmantoti Saeimas vēstures skaidrojumi, Valsts prezidenta kanceleja, 1991. gada barikāžu muzejs, Latvijas Okupācijas muzejs, Latviešu valodas aģentūra, ES iestādes, UN Women, LIAA Latvijas tūrisma portāls un NASA. Tradīciju apraksts ir nodalīts no juridiskā brīvdienas statusa un no astronomiska notikuma. Konkrētu nākotnes publisku pasākumu programmas nav izdomātas.

## Reproducēšana

No projekta saknes:

```sh
python3 lib/import_vvc_snapshot.py
python3 lib/build_data.py
python3 lib/build_occasions.py
ruby test/date_test.rb
node test/date_core_test.cjs
node test/date_l10n_test.cjs
```

`build_data.py` izmanto repozitorijā saglabāto paketes kandidātu CSV (`_data/name-priority-candidates.csv`) tikai kandidātu prioritātēm. Juridiskie un astronomiskie ražošanas fakti iegūti no iepriekš uzskaitītajiem pirmavotiem. Visi datu pārbūvei vajadzīgie ievades faili ir projektā; sākotnējā ZIP blakus atrašanās vieta nav nepieciešama. Datu versija un avota pārbaudes datums jāatjaunina tikai pēc īstas atkārtotas pārbaudes.
