# Drukas un lejupielāžu pārbaude

Pārbaudes datums: 2026-10-22. Gala rezultātu skaits un katra faila pārbaudes ieraksts ir `PRINT_RESULTS.json`; lejupielāžu saraksts ir `downloads/manifest.json`.

## Izpildījums

- Vienota milimetros aprakstīta lapa tiek zīmēta kā vektoru PDF un kā WebP. PDF nav ekrānuzņēmums.
- Iegultie Noto Sans Regular un Bold fonti nodrošina latviešu diakritiskās zīmes un atlasāmu tekstu. Fontiem pievienota SIL Open Font License 1.1.
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
- Visu 195 saimes/dizaina kombināciju teksta robežas pārbaudītas ar faktisko iegulto fontu platumiem. Teksts ārpus lapas nav atrasts.
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

Izpildiet `node test/print.test.cjs`, tad `node scripts/generate_print.cjs`, pēc tam `python scripts/verify_print.py`. Drukas atkarības instalē ar `npm install --prefix scripts` un `pip install -r scripts/print-requirements.txt`; bibliotēkas `pdf-lib` un `fontkit` jau ir lokāli iekļautas projektā. Pārlūka darbībai nav vajadzīga neviena ārēja API vai CDN. `--resume` atkārtoti izmanto failu tikai tad, ja sakrīt datu, zīmēšanas koda un konkrētās konfigurācijas SHA-256 nospiedums.

## Gala rezultāts

225 no 225 PDF/WebP pāriem pārbaudīti veiksmīgi. Visi 225 PDF atvērti un renderēti; visi 225 WebP pilnībā dekodēti. Pārbaudīts A4 fiziskais izmērs, patiesie 600 ppi pikseļi, sRGB profils, atlasāms latviešu teksts, iegultie fonti, zīmols un visu glifu atrašanās lapas robežās.

Lejupielāžu mapē: 225 PDF + 225 WebP + 225 mazi priekšskatījumi + 1 manifests = 676 faili. Lielākais fails: 1 006 794 baiti, zem Cloudflare Pages 25 MiB robežas. PDF un pilnā izmēra WebP kopējais apjoms: 103 389 441 baits.

Maksimālā pāra vidējā pelēktoņu atšķirība pēc vienāda izmēra renderēšanas: 2.087 no 255. Šī ir renderētāju vizuālā salīdzināšana, nevis apgalvojums par bitu identiskumu. Galīgā 15 dizainu kontaktlapa apskatīta vizuāli. Pārlūka lejupielāžu testus veic vietnes saskarnes testu uzdevums.
