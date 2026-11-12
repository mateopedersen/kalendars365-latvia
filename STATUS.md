# Kalendārs365 laidiena pārbaudes

Atjaunināts 2026-11-12; indeksēšanas, informācijas lapu un kalendāra veidotāja izmaiņas saglabātas lokāli. Repozitorijs: https://github.com/mateopedersen/kalendars365-latvia. Vietne: https://kalendars365.lv/. Uzturētājs: Silvis Balodis.

## Publicēšanai sagatavotais saturs

- 899 reģistra maršruti un 901 ģenerēts HTML fails; 898 indeksējamas satura lapas. Tikai fotogrāfiju un licenču satura lapa ir `noindex,follow`; 404 un īslaicīgas kļūdas dokumenti saglabā kļūdu lapu `noindex`.
- Arī meklēšanas sākumlapa, astoņas nākamo mācību gadu lapas un 2030./2031. gada robežnedēļa ir indeksējamas. Nepublicētie skolu brīvlaiku datumi netiek izdomāti vai pasniegti kā apstiprināti.
- Būvējums izveido attēlu vietnes karti ar 4591 unikālu, lapās izmantotu attēlu un pārbauda to failus. Publisko 7204 atbalstīto formātu attēlu failu pārmeklēšana nav bloķēta. `robots.txt` norāda abas vietnes kartes; satura lapas atļauj lielus attēlu priekšskatījumus. Faktisko indeksēšanu nosaka meklētājprogramma.
- Katram no 901 HTML dokumentiem ir sava 1200 × 630 kopīgošanas ilustrācija, atbilstošs nosaukums, latviešu alternatīvais teksts, Open Graph, Twitter un strukturēto datu attēls. Reģistrā saglabātas attēlu un izmantoto avotu kontrolsummas.
- Atjaunoti nedēļas, ģimenes, maiņu un stundu plānotāji ar zīmola PDF un attēlu veidnēm, atvaļinājuma plānotājs un rīku katalogs. Pieņemtās gada un mēneša lejupielāžu kolekcijas saglabātas.
- 73 svētku un tradīciju tēmām ir atšķirīgas, ar avotiem un licencēm sasaistītas fotogrāfijas un optimizēti vāki. Pilsētu katalogā ir 82 vietas.
- Atjaunotas sezonu un astronomisko notikumu ilustrācijas, Saules panorāma un dienas garuma diagramma, navigācija, mēnešu izvēlne un kājene.
- Vārda dienu avots ir pārbaudītais VVC 2026. gada izdevums: 1032 tradicionālā un 4620 paplašinātā saraksta papildu ieraksti.

- Pārveidotas sešas vietnes informācijas lapas; jaunajā BUJ lapā ir 25 atbildes ar vietējo meklēšanu. Krātuves inventārā ir deviņas faktiskas ierakstu grupas. Privātuma paziņojums nepieslēdz izsekošanu un ir derīgs 180 dienas. Kontaktforma sagatavo tikai vietēju melnrakstu; bez tās drošā apstrādātāja lauki paliek neaktīvi.
- Kalendāra veidotājs lejupielādē PDF, Word, Excel, JPG, PNG un SVG ar sešām atšķirīgām oriģinālām formātu ilustrācijām. Jauniem projektiem noklusējums ir 600 dpi. Word saglabā dizainu attēlā un piedāvā rediģējamu personīgo ierakstu pielikumu; Excel ietver rediģējamus datumus, notikumus, piezīmes un lapu “Drukas dizains”.

## Lokālās pārbaudes

- 2026-11-12 informācijas lapu pārbaude: visi 286 Node testi sekmīgi. Lokālais HTTP audits pārbaudīja 901 HTML adresi un 7198 attēlu atbildes, ieskaitot favicon; kļūdu nav. Abas XML vietnes kartes atbild ar HTTP 200 un pareizu satura tipu.
- Visas 69 Node pārbaužu datnes un 294 testi sekmīgi. Iepriekšējā Ruby testu pārbaudē 3158 apgalvojumi, kļūdu nav.
- Maršrutu, iekšējo saišu, meklēšanas un izveidotās vietnes audits: 901 HTML fails, 6748 meklēšanas ieraksti, kļūdu nav.
- Kopīgošanas attēlu audits pārbaudīja visus 901 HTML dokumentus, 901 unikālus attēlus un 901 unikālus attēlu satura paneļus, izmērus, kontrolsummas un attēlu dekodēšanu; kļūdu nav.
- Lokālais priekšskatījuma Jekyll būvējums ir sekmīgs. Precīzā produkcijas Ruby 4.0.9 būvēšana šajā macOS datorā neizdevās trūkstošu OpenSSL/Psych priekšnosacījumu dēļ; produkcijas būvējumu pārbauda Linux CI un Cloudflare. Šis ieraksts neapliecina neizpildītu produkcijas pārbaudi.

- Sešām informācijas lapām pārbaudīti pieci ekrānu platumi (30 mērījumi). Visās sešās pārbaudīti drukas faili; BUJ drukā visi 25 jautājumi un atbildes, bez tukšas pēdējās lapas.
- Veidotāja lejupielādes panelim pārbaudīti 320, 390, 768, 1024 un 1440 px platumi: horizontālas pārplūdes un apgriezta teksta nav; kartīšu augstumi katrā platumā sakrīt. No īstajām pogām lejupielādēti visi formāti, pārbaudīti A4 7016 × 4961 px un A3 7016 × 9921 px attēli, 600 dpi metadati un fiziskie PDF izmēri. Word atvērts un renderēts, Excel pārbaudīts ar LibreOffice un datu lasītāju; divpadsmit mēnešu Word ir 12 lapas, PNG arhīvā ir 12 attēli. Sagatavošanas atcelšana neizraisa lejupielādi. Pārbaudes: `docs/studio-export-review.json`.

## Publicēšanas pārbaude

Publiskās versijas stāvoklis jāvērtē pēc konkrētā commit GitHub pārbaudēm, Cloudflare Pages izvietojuma un publiski saņemtā satura kontrolsummām. Publicēšanas rindas ieraksts pats par sevi neapliecina, ka jaunā versija jau ir redzama domēnā.

## Datu un pārbaudes robežas

Astronomiskie laiki ir aprēķini ar norādītu laika joslu un horizonta modeli. Laikapstākļu prognoze un stacijas novērojumi ir atsevišķi avoti; ārēja avota nepieejamība netiek aizstāta ar izdomātiem mērījumiem. Nākamo mācību gadu brīvlaiki netiek norādīti kā oficiāli bez atbilstoša avota. Horoskops ir izklaides saturs. Neatkarīga jurista, dzimtās valodas redaktora vai speciālista sertifikācija nav apgalvota.

Īpašnieka norāde par turpmāku darbu glabāšanu lokāli paliek spēkā, kamēr viņš attiecīgo publicēšanu nav skaidri pieprasījis.

## Informācijas lapu juridiskais papildinājums

Avoti pārskatīti 2026-11-12. Vietnes īpašnieka oficiālā pakalpojuma sniedzēja adrese vēl nav saņemta; tā nav izdomāta. Pirms juridiskā informācijas bloka pilnīgas pabeigšanas jāaizpilda `_data/trust-pages.json` lauks `ownerAddress`. Konkrētā konta datu apstrādes nosacījumi un e-pasta glabāšanas politika jāievēro arī faktiskajā uzturēšanas darbā. Pārbaudes reģistrs: `docs/trust-pages-review.json`.


## Yerel paylaşım düzeltmesi · 12 Kasım 2026

- Sabit “Share 55” düğmesi ortak şablondan kaldırıldı; 901 HTML sayfasında eski düğme kalmadığı doğrulandı.
- Paylaşım takvim kontrolüne, ilgili PDF tasarımına, her burcun tarihli yorumuna ve okul/üniversite kartlarına taşındı. Sınıf, tatil ve seçilen üniversite grafiği bağlantı açılınca geri yükleniyor.
- Yeni düğmeler 44 px; 320 ve 390 px kontrollerinde taşma görülmedi. Paylaşım bağlantılarına kişisel takvim notları ve not/öğrenci parametreleri alınmıyor.
- Son paylaşım testleri: 14 başarılı. Tam test grubu önceki kontrolde 304 başarılı; son tasarım dönemi başlığı düzeltmesinden sonra paylaşım grubu yeniden çalıştırıldı. Son 901 sayfalık metadata ve site denetimlerinde hata yok.
- Yerel kanıtlar: ../reports/contextual-sharing-2026-11-12/task-result.json ve browser-checks.json. Kabul edilmiş indirme dosyaları değiştirilmedi.
- Yayın, push veya dağıtım yapılmadı. Yerel önizleme: http://127.0.0.1:4007/.


## Sağ paylaşım alanı · 12 Kasım 2026

- Gösterilen sağ kaydet/kopyala/paylaş satırı krem çerçeveli, bordo ana düğmeli ortak bir alana dönüştürüldü.
- Yeni simgeler işlemden sonra korunuyor; kaydetme kalıcı, kopyalama temizlenmiş canlı site bağlantısını alıyor.
- 320 ve 390 px kontrolleri, 44 px eşit yükseklik ve sağ içerik kenarı hizası doğrulandı.
- Yerel kanıtlar: ../reports/right-share-dock-2026-11-12/result.json ve desktop-right-share.jpg.
- Yayın veya push yapılmadı; son sahibi talimatı uyarınca yerelde tutuldu.


## Saules simülasyonu ve ekrana sığan oynatıcı · 12 Kasım 2026

- Sahne, altı hızlı zaman düğmesi, saat, hız ve başlat/duraklat denetimi aynı uyarlanan alana taşındı. Oynatma ve an seçimi sahneyi ekrana getiriyor.
- Kamera kadrajı, gökyüzü, bulutlar, ufuk derinliği, su dalgaları, yansıma ve kıyı yeniden işlendi; WebGL2 motoru gerçek tarayıcıda doğrulandı. Panoramik manzara hâlâ açıkça görsel simülasyon olarak tanımlıdır; gerçek şehir haritası ayrı seçenektir.
- 320 × 568, 390 × 844, 740 × 360 ve 1280 × 720 kontrollerinde bütün oynatıcı ekrana sığdı; yatay taşma ve kesilen düğme yazısı yok. Oynatma hızı, duraklatma, gün sonunda duruş, şehir değişimi ve Ay sayfasının tek kontrol takımı doğrulandı.
- 306 Node testi geçti. Üretim ayarlı yerel derleme, 901 HTML site denetimi ve metadata denetimi başarılı. Tarayıcının tam ekranı reddettiği durumda ekrana sığdıran alternatif çalışıyor.
- Kanıtlar: ../reports/sun-viewer-redesign-2026-11-12/result.json, browser-checks.json ve sun-viewer-preview.jpg.
- Yalnızca yerel çalışma; push ve yayın yapılmadı.


## Tekrarlanan kaynak kutularının kaldırılması · 12 Kasım 2026

- Sahibin gösterdiği genel “Avoti un pārbaude” kutusu ortak üretimden ve 622 sayfadan kaldırıldı.
- 901 HTML dosyasında bu kutunun kalmadığı, merkezî kaynak/lisans sayfaları ve alt menü bağlantılarının durduğu doğrulandı. Özel konu atıfları ve kaynak verileri korunuyor.
- Yerel derleme ve site denetimi başarılı; görsel kontrolde bölümler arasında boş kutu kalmadı. Kanıt: ../reports/remove-repeated-sources-2026-11-12/result.json ve after.jpg.
- Değişiklik yerel; push veya yayın yapılmadı.


## Fotoğraf/lisans yönlendirmeleri ve dikey işlem şeridi · 12 Kasım 2026

- Tüm 901 HTML sayfası tarandı. 524 sayfadan 1210 tekrar eden fotoğraf/lisans yönlendirmesi kaldırıldı; içeriklerde bu kataloğa tekrarlanan bağlantı kalmadı. Merkezî kaynak ve lisans sayfaları, alt menü bağlantıları, fotoğraf kayıtları ve dışa aktarılan dosyaların kaynak bilgileri korundu. Şehir değişimi ve filtrelenen kartlar tekrar kaynak düğmesi üretmiyor.
- Uzun otomatik “Šajā lapā” bağlantı kutusu kaldırıldı. 306 ilgili sayfada paylaş/kaydet/kopyala işlemleri sağda SVG simgeli dikey şeritte; 1099 px altında sayfa akışında küçük bir satır olarak gösteriliyor. Ana sayfaya şerit eklenmedi.
- Beş ekran boyutu kontrolü, içeriği örtmeme, kaydet/geri al, temiz bağlantı kopyalama ve ilgili konuya ait 55 seçenekli paylaşım menüsü doğrulandı. Ana sayfa şehir/saat bölümü ve oluşturucunun gerçek takvim önizlemesi çalışıyor.
- Son 306 Node testi başarılı. 901 sayfalık site ve metadata denetimlerinde hata yok; yerel üretim derlemesi başarılı. Kanıtlar: ../reports/inline-credit-cleanup-2026-11-12/ ve ../reports/topic-share-rail-2026-11-12/.
- Değişiklikler yalnızca yerelde; push ve yayın yapılmadı.


## Yıl ve ay gezgini kaydırma düzeltmesi · 12 Kasım 2026

- Bağımsız kayan 12 küçük takvim yerine dört yıl ve 12 ay bağlantılı kompakt seçici eklendi. 48 aya özgü SVG, seçili ay, önce şablonları gösteren düzen ve kabul edilmiş indirmeler korundu.
- Panel yalnızca ekrana sığıyorsa sabit; kısa ekranlarda normal sayfa akışında. Açılır başlık bütün boyutlarda kullanılabiliyor. Sol ve sağ üzerinde tekerlek kaydırmasının aynı belgeyi kaydırdığı doğrulandı.
- 156 takvim/PDF/Ay sayfası bağlantısı, yıl değişiminde ayın korunması, Ay takviminde şehir parametresi ve doğru şablon bağlantıları kontrol edildi. Beş ekran boyutunda yatay taşma, iç kaydırma ve kesilen düğme yok; ay düğmeleri 48 px.
- Son yerel üretim derlemesi ve 306 Node testi başarılı. 901 HTML site ve metadata denetimlerinde hata yok. Kanıtlar: ../reports/collection-navigation-2026-11-12/.
- Değişiklik yalnızca yerelde; push veya yayın yapılmadı. Önizleme: http://127.0.0.1:4007/kalendars/2029/.


## Tüm yıllardaki özel gün bağlantıları · 12 Kasım 2026

- 2027–2030 arasındaki 197 resmî gün kaydı, 45 mevcut özel gün yazısının tam tarih bölümüyle eşleştirildi. Yeni kopya sayfa oluşturulmadı; fotoğraflar, Letonca metinler, kaynaklar, ilgili konular ve lisans kayıtları korundu.
- 60 yıllık, aylık ve anma günü tablosunda 723 satırın tarih ve adları tıklanabilir. Aynı tarihteki farklı günler ayrı yazılara, ek tatiller ilgili bayram açıklamasına gidiyor. Takvimin gün ayrıntıları ve yaklaşan günler de aynı eşleştirmeyi kullanıyor.
- Yazıdaki tarihler, takvimin doğru gün görünümüne ve takvim alanına doğrudan açılıyor. Hedef tarihin yılı görünür kalıyor ve hedef bölüm vurgulanıyor. 320, 390 ve 1280 px kontrollerinde sayfa taşması ve kesilen ad yok; mobil bağlantı alanları en az 44 px.
- Son üretim ayarlı yerel derleme, 309 Node testi, 901 HTML site ve metadata denetimi başarılı. Kanıtlar: ../reports/holiday-topic-links-2026-11-12/.
- Yalnızca yerel çalışma; push veya yayın yapılmadı. Önizleme: http://127.0.0.1:4007/svetku-dienas/2029/.


## Dosya simgeleri, hızlı şehir fotoğrafları ve kişisel takvim · 12 Kasım 2026

- Tüm 901 HTML sayfasının dosya düğmeleri ve bağlantıları tarandı. 1409 eksik SVG kullanımı 361 sayfada tamamlandı; son taramada eksik yok. Excel, Word, ICS, CSV, JSON ve SVG için saf vektör dosya simgeleri eklendi; mevcut PDF, Attēls ve yazdırma görselleri korundu. İlk HTML ve sonradan açılan denetimler aynı kuralları kullanıyor. Görsel önizleme kartları ve kişisel takvim hücreleri bu işlem dışında tutuluyor. Mobil/masaüstü dosya düğmeleri 48 px, taşma yok.
- 82 gerçek şehir fotoğrafına ağ isteği beklemeyen gömülü önizleme ve 164 küçük ekran türevi eklendi. Net fotoğraf arka planda çözülüyor; son 16 fotoğraf önbellekte tutuluyor. Yanlış sırada gelen yanıtlar güncel şehri değiştirmiyor. Dosyalar kaynak kontrol toplamına göre sürümleniyor; kabul edilmiş özgün fotoğraflar korundu. 1,2 s ağ gecikmesiyle doğru şehrin önizlemesinin tam fotoğraftan önce görünmesi ve önbellekten doğrudan dönüş doğrulandı.
- Nottan etkinlik oluşturma düğmesi ve gün hücresine not simgesi eklendi. Notun tarihi ve tam açıklaması korunuyor; aynı nottan aynı etkinlik yeniden açılınca düzenleme yapılıyor. Uzun ICS açıklamalarının geri alım sınırı 20.000 karaktere yükseltildi. Not, etkinlik, görev, yenileme, tarihler arası ayrım ve gerçek ICS/JSON/Excel dosyaları ayrı yerel test alanında kontrol edildi; 4007 üzerindeki mevcut kullanıcı verilerine dokunulmadı.
- Son yerel üretim derlemesi, 318 Node testi, 901 sayfalık site ve metadata denetimi başarılı. Kanıtlar: ../reports/action-icons-2026-11-12/, ../reports/city-photo-speed-2026-11-12/ ve ../reports/personal-calendar-2026-11-12/.
- Değişiklikler yalnızca yerelde; push veya yayın yapılmadı. Önizleme: http://127.0.0.1:4007/.
