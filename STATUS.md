# Kalendārs365 laidiena pārbaudes

Atjaunināts 2026-11-11. Repozitorijs: https://github.com/mateopedersen/kalendars365-latvia. Vietne: https://kalendars365.lv/. Uzturētājs: Silvis Balodis.

## Publicēšanai sagatavotais saturs

- 897 reģistra maršruti un 900 ģenerēti HTML faili; 887 indeksējami maršruti, 10 ar apzinātu `noindex`. Fotogrāfiju un licenču lapa ir `noindex,follow`.
- Katram no 900 HTML dokumentiem ir sava 1200 × 630 kopīgošanas ilustrācija, atbilstošs nosaukums, latviešu alternatīvais teksts, Open Graph, Twitter un strukturēto datu attēls. Reģistrā saglabātas attēlu un izmantoto avotu kontrolsummas.
- Atjaunoti nedēļas, ģimenes, maiņu un stundu plānotāji ar zīmola PDF un attēlu veidnēm, atvaļinājuma plānotājs un rīku katalogs. Pieņemtās gada un mēneša lejupielāžu kolekcijas saglabātas.
- 73 svētku un tradīciju tēmām ir atšķirīgas, ar avotiem un licencēm sasaistītas fotogrāfijas un optimizēti vāki. Pilsētu katalogā ir 82 vietas.
- Atjaunotas sezonu un astronomisko notikumu ilustrācijas, Saules panorāma un dienas garuma diagramma, navigācija, mēnešu izvēlne un kājene.
- Vārda dienu avots ir pārbaudītais VVC 2026. gada izdevums: 1032 tradicionālā un 4620 paplašinātā saraksta papildu ieraksti.

## Lokālās pārbaudes

- Visas 48 Node pārbaudes komandu grupas sekmīgas. Ruby testos 3158 apgalvojumi, kļūdu nav.
- Maršrutu, iekšējo saišu, meklēšanas un izveidotās vietnes audits: 900 HTML faili, 6737 meklēšanas ieraksti, kļūdu nav.
- Kopīgošanas attēlu audits pārbaudīja visus 900 HTML dokumentus, 900 unikālus attēlus un 900 unikālus attēlu satura paneļus, izmērus, kontrolsummas un attēlu dekodēšanu; kļūdu nav.
- Lokālais priekšskatījuma Jekyll būvējums ir sekmīgs. Precīzā produkcijas Ruby 4.0.9 būvēšana šajā macOS datorā neizdevās trūkstošu OpenSSL/Psych priekšnosacījumu dēļ; produkcijas būvējumu pārbauda Linux CI un Cloudflare. Šis ieraksts neapliecina neizpildītu produkcijas pārbaudi.

## Publicēšanas pārbaude

Publiskās versijas stāvoklis jāvērtē pēc konkrētā commit GitHub pārbaudēm, Cloudflare Pages izvietojuma un publiski saņemtā satura kontrolsummām. Publicēšanas rindas ieraksts pats par sevi neapliecina, ka jaunā versija jau ir redzama domēnā.

## Datu un pārbaudes robežas

Astronomiskie laiki ir aprēķini ar norādītu laika joslu un horizonta modeli. Laikapstākļu prognoze un stacijas novērojumi ir atsevišķi avoti; ārēja avota nepieejamība netiek aizstāta ar izdomātiem mērījumiem. Nākamo mācību gadu brīvlaiki netiek norādīti kā oficiāli bez atbilstoša avota. Horoskops ir izklaides saturs. Neatkarīga jurista, dzimtās valodas redaktora vai speciālista sertifikācija nav apgalvota.

Īpašnieka norāde par turpmāku darbu glabāšanu lokāli paliek spēkā, kamēr viņš attiecīgo publicēšanu nav skaidri pieprasījis.
