# Drukas un lejupielāžu pārbaude

Pārbaudes datums: 2026-10-22. Gala rezultātu skaits un katra faila pārbaudes ieraksts ir `PRINT_RESULTS.json`; lejupielāžu saraksts ir `downloads/manifest.json`.

## Izpildījums

- Vienota milimetros aprakstīta lapa tiek zīmēta kā vektoru PDF un kā WebP. PDF nav ekrānuzņēmums.
- Iegultie īstie DM Sans Regular un DM Sans Bold fonti nodrošina latviešu diakritiskās zīmes un atlasāmu tekstu. Avots un pārbaudītie failu nospiedumi: `assets/fonts/DM-Sans-SOURCE.json`; licence: `assets/fonts/DM-Sans-OFL.txt` (SIL Open Font License 1.1).
- A4 vertikāli: 210 × 297 mm un 4961 × 7016 pikseļi. A4 horizontāli: 297 × 210 mm un 7016 × 4961 pikseļi. Izšķirtspēja aprēķināta no fiziskā papīra izmēra un 600 ppi.
- Sagatavotajiem WebP failiem ir sRGB ICC profils. Pārlūkā veidotie WebP izmanto Canvas sRGB krāstelpu; ICC profila iekļaušana ir atkarīga no pārlūka.
- Katram failam ir drošā apakšējā malā ievietots `Kalendārs365 · kalendars365.lv` zīmols. Domēna esamību īpašnieka Cloudflare kontā pārbaudīja projekta galvenais aģents.
- 15 kompozīcijas: 10 krāsainas un 5 melnbaltas. Mainās kompozīcija, kolonnu skaits, galvene, ornamenta vieta, piezīmju zonas un tabulas līniju sistēma.
- Atbalstītas 13 saimes: gada, mēneša, nedēļas, dienas, Mēness, tukšais, darba dienu, ģimenes, maiņu, skolas, kalendārs ar vārdu, gada Mēness un gada darba dienu kalendārs.
- Pārlūka ģenerators atbalsta 2027.–2030. gadu un visus 48 mēnešus. Nedēļas un dienas plānotāji saglabā izvēlēto datumu vai ISO nedēļu.

## Reāli sagatavotie faili

Pilnais sagatavošanas skripts izveido 225 PDF + 225 atbilstošus WebP un 225 nelielus priekšskatījumus:

1. 2027. un 2029. gada gada kalendāri — 15 dizainu pāri katram gadam.
2. 2029. un 2030. gada februāra mēneša kalendāri — 15 dizainu pāri katram mēnesim.
3. Katras pārējās vienpadsmit saimes 2028. gada paraugi — 15 dizainu pāri katrai saimei.

Visas pārējās kombinācijas tiek reāli izveidotas lietotāja pārlūkā pēc pieprasījuma; tās netiek nepatiesi uzskaitītas kā iepriekš glabāti faili. Fotogrāfija tiek apstrādāta lietotāja ierīcē, izgriezta ar lietotāja izvēlētu horizontālo un vertikālo pozīciju un 1-3 reižu tuvinājumu, nevis nosūtīta uz serveri. Formāti: PNG/JPEG/WebP; robeža 10 MB un 40 megapikseļi. Ierīces, kas nevar izveidot 35 megapikseļu WebP, saņem kļūdas paziņojumu ar PDF alternatīvu. Vārda dienas, kas atrastas pārbaudītajā vēsturiskajā sarakstā, norādītas ar skaidru avota izdevuma marķējumu `VVC 2018`; tas nav apgalvojums par jaunāko sarakstu.

## Veiktās pārbaudes

- `test/print.test.cjs`: 9360 lapu ainas (4 gadi × 12 mēneši × 13 saimes × 15 dizaini); nederīgi ievaddati; 2028. gada 29. februāris; 2029. gada februāris bez 29. datuma; zīmols un skaitliskas koordinātas.
- `test/print_fonts_test.cjs`: 9 360 ainas un 1 884 081 teksta komanda pārbaudīta ar faktiskajiem DM Sans metriskajiem datiem. Trūkstošu glifu un teksta ārpus lapas platuma nav. Ieraksts: `docs/PRINT_FONT_RESULTS.json`.
- `scripts/verify_print.py`: atver katru PDF, pārbauda vienu A4 lapu, iegultos TrueType fontus, latviešu tekstu, zīmolu, atver katru WebP, pārbauda pilnu pikseļu izmēru un ICC profilu, renderē katru PDF un salīdzina tā izskatu ar atbilstošo WebP.
- Pārbaudes attēli glabājas projekta darba mapē `../qa-print/`. 15 dizainu kontaktlapa tiek veidota no 2029. gada gada kalendāriem.

## Precīzi ierobežojumi un atšķirības no sākotnējās specifikācijas

- 02. un 07. dizainā izmantotas oriģinālas vektoru pilsētas un dabas ilustrācijas, nevis licencētas Rīgas vai Latvijas ainavu fotogrāfijas. Lietotājs var pievienot savu fotogrāfiju.
- PDF izmanto RGB vektoru krāsas. Tas nav sertificēts PDF/X vai CMYK tipogrāfijas materiāls, un tam nav pievienotas griešanas atzīmes vai izlaides. Baltā drošā mala paredzēta biroja un mājas A4 drukai.
- Nav A3 varianta. Pievienotās fotogrāfijas netiek automātiski pasludinātas par 600 effective-ppi: to reālais blīvums ir atkarīgs no ievades pikseļiem un izgriezuma.
- Fotoattēlam ir horizontālās un vertikālās pozīcijas un tuvinājuma vadība. Ģenerators atgriež faktiskā foto blīvuma `photoPpi` vērtību un brīdinājumu, ja tas ir zem 600 ppi. Melnbaltajos dizainos arī foto tiek pārvērsts pelēktoņos.
- Skolas un maiņu veidnes ir personīgai aizpildīšanai; tās neizdomā neapstiprinātus brīvlaikus vai darba maiņas.
- Cilvēka, kura dzimtā valoda ir latviešu, veikta korektūra nav apgalvota. Diakritikas, fontu un datumu pārbaudes ir tehniskas un redakcionālas aģenta pārbaudes.

## Atkārtošana

Izpildiet `node test/print.test.cjs` un `node test/print_fonts_test.cjs`, tad `node scripts/generate_print.cjs`, pēc tam `python scripts/verify_print.py`. Drukas atkarības instalē ar `npm install --prefix scripts` un `pip install -r scripts/print-requirements.txt`; bibliotēkas `pdf-lib` un `fontkit` jau ir lokāli iekļautas projektā. Pārlūka darbībai nav vajadzīga neviena ārēja API vai CDN. `--resume` atkārtoti izmanto failu tikai tad, ja sakrīt datu, zīmēšanas koda, abu faktisko fontu failu un konkrētās konfigurācijas SHA-256 nospiedums. Veca fonta WebP netiek savienots ar jauna fonta PDF arī --pdf-only režīmā.

## Gala rezultāts

DM Sans gala partija: 225 no 225 PDF/WebP pāriem pārbaudīti veiksmīgi. Visi 225 PDF atvērti un renderēti; visi 225 WebP un 225 mazie priekšskatījumi pilnībā dekodēti. Visos PDF pārbaudīti tieši iegultie DMSans-Regular un DMSans-Bold fonti. Pārbaudīts A4 fiziskais izmērs, patiesie 600 ppi pikseļi, sRGB profils, atlasāms latviešu teksts, zīmols un visu glifu atrašanās lapas robežās.

Lejupielāžu mapē: 225 PDF + 225 WebP + 225 mazi priekšskatījumi + 1 manifests = 676 faili. Lielākais fails: 1 008 512 baiti, zem Cloudflare Pages 25 MiB robežas. PDF un pilnā izmēra WebP kopējais apjoms: 102 735 275 baiti.

Maksimālā pāra vidējā pelēktoņu atšķirība pēc vienāda izmēra renderēšanas: 1.690 no 255. Tā ir renderētāju vizuālā salīdzināšana, nevis apgalvojums par bitu identiskumu. Galīgā 15 dizainu kontaktlapa apskatīta vizuāli; visas kompozīcijas un pareizās latviešu diakritiskās zīmes saglabātas. Pārlūka lejupielāžu testus veic vietnes saskarnes testu uzdevums.

## DM Sans pārbaudes

2026-10-22: 9 360 ainas, 1 884 081 teksta komanda un 540 unikālas teksta/fonta kombinācijas pārbaudītas ar faktiskajiem DM Sans fontu datiem. Abiem fontiem ir visas latviešu diakritiskās zīmes. Canvas pārbaudes rindas „Kalendārs365 ĀāĢģ Žž” platums atšķiras no fontkit aprēķina mazāk par 0,00005 pikseļiem pie 100 px izmēra; tādējādi pārbaudīta arī īstā Regular un Bold fonta izvēle rastra zīmēšanā.

`verify_print.py` noraida PDF, kura iegultā fonta nosaukums neatbilst DM Sans. Pilnās partijas rezultāts ir `PRINT_RESULTS.json`; fontu maiņa ietver visas 225 PDF/WebP versijas un priekšskatījumus, nevis tikai vietnes CSS. Atsevišķā sociālo kartīšu pārbaude dokumentēta `docs/OG_RESULTS.json`.
