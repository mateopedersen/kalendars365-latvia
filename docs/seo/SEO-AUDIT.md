# Kalendars365.lv yerel SEO denetimi

12 Kasım 2026. Bu çalışma yalnızca yereldir. Canlıya yayın yapılmadı. Yeni yayın izni yoktur.

## Sonuç ve kapsam

901 HTML belge, 899 kayıtlı route, 898 indekslenmesi amaçlanan landing ve hata belgeleri dahil 33 sınıf incelendi. İçerik route manifestinde 32 aile vardır; iki hata belgesi envanterde ek error_document sınıfını oluşturur. Mevcut iç/dış bağlantı çalışması baştan yapılmadı. İç navigasyon planı başlangıçla veri değerleri düzeyinde aynı kaldı. Sabit Ruby 4 JSON biçimlendirmesi boş dizileri tek satıra topladığı için dosya baytları farklıdır; hedef, sıra ve açıklama değerleri aynı kaldı.

Kodla doğrulanan sorunlar düzeltildi. 300 Node testi, 8 Ruby testi / 3.158 assertion, bağımsız 3.307 tarih assertion’ı ve 901 sayfalık SEO kapısı geçti. İndirilebilir mevcut 3.459 dosyanın kaynak/build eşleşmesi doğrulandı. Açık bir yerel P0 hata bulunmadı; bu ifade üretim CDN’si, Google veya hukuk sertifikası anlamına gelmez.

## Başlangıç kaydı ve güvenlik

Başlangıç branch: main. Commit: 563c798d2fdd3c8dce90c567a1b0d8a92941957f. Daha önce yapılmış çok sayıda değiştirilmiş ve izlenmeyen dosya vardı. Bunlar korunarak 1.180 kaynak dosyası ile 901 eski HTML özel yedeğe alındı. Başlangıç diff’i özel rapor klasöründedir. İndirilebilir asıl baskı dosyaları yeniden üretilmedi veya sıkıştırılmadı.

Build/test scriptleri önce okundu. Günlük içerik workflow’unun commit/push yaptığı görüldüğü için çalıştırılmadı. Kullanılan yeni araçlar loopback sınırı, yerel dosya yazımı ve kapalı dış analytics aktarımıyla sınırlıdır. Raporlar docs/seo ve özel work/reports altında; Jekyll public build’ine dahil değildir.

## Gerçek mimari

Ruby üretici, Jekyll SSG ve route’a göre eklenen tarayıcı JavaScript’i kullanılıyor. 899 route docs/route-manifest.json ile _data/routes.json kaynağından üretiliyor. Ortak layout _layouts/default.html. Cloudflare Pages statik servis; hava, gözlem, IP konumu ve günlük burç için mevcut Pages Functions var. Yeni framework veya hosting sistemi eklenmedi.

Mevcut hesap motoru assets/calendar-core.js, astronomi modülleri ve doğrulanmış yerel veri dosyaları korunur. Basılı yıllık/aylık dosyalar manifestlerle yönetilir. Kişisel takvim verisi tarayıcı krātuvesinde tutulur. Genel çıktıya kişi notu veya yüklenen fotoğraf eklenmedi.

Yapılandırılan sürümler: Ruby 4.0.9, Bundler 4.0.20, Jekyll 4.4.1 ve Node 24.22.1. İlk çalışan yerel derleme Ruby 2.6.10 / Jekyll 4.2.2 ileydi. Sabit Ruby/Jekyll/Bundler sürümleriyle ek derleme ve test doğrulaması yapıldı. Ayrıntı: evidence/runtime-validation.json.

## Bulgular

| Öncelik | Durum | Bulgu | Uygulama / karar | Kanıt |
| --- | --- | --- | --- | --- |
| P0 | DOĞRULANDI | Yayın sınırı korundu | Uzak yazma, push, PR, CI, DNS, cache, sitemap gönderimi yapılmadı. | Yerel başlangıç kaydı, publicationPerformed:false; canlıya yalnızca kaydedilmiş 9 düşük hacimli salt okunur istek. |
| P0 | DOĞRULANDI | Canonical ve indeks politikası zaten büyük ölçüde tutarlıydı | Hatalı oldukları varsayılmadı; 898 indekslenebilir landing, lisans sayfası noindex ve iki hata belgesi korunuyor. | 901 HTML; 18 yerel HTTP senaryosu; gerçek eksik adreste 404. |
| P1 | DOĞRULANDI | 258 temel takvim ilk HTML’de boştu | 262 public takvim görünümü SSG ile dolduruldu; kişisel notlar eklenmedi. İsim dizinine 60 resmî kayıt ve aylık liste eklendi. | Önce ham HTML bulguları; bağımsız tarih testi; dört gerçek tarayıcı JS kapalı kontrolü. |
| P1 | DOĞRULANDI | Tam CSS yanında büyük yinelenen inline CSS vardı | Tam ve engelleyici stil dosyası kaldı; yinelenen alt küme kaldırıldı. 41 mevcut stil birleşimi ve kaynak CSS korunuyor. | Inline CSS toplamı 129.979.293 bayttan 0’a; HTML toplamı %55,02 azaldı. |
| P1 | DOĞRULANDI | SEO adresleri birden çok yerde üretiliyordu | Küçük merkezi route/metadata sözleşmesi eklendi; canonical, sitemap ve JSON-LD aynı adres doğrulamasına bağlı. | 901 sözleşme; 901 entity graph; yok asset/geçersiz tarih için açık hata. |
| P1 | DOĞRULANDI | Blog ve lisans lastmod hesabı anlamlı kaynağa bağlı değildi | Blog içerik özeti ve lisans/kaynak özeti kullanılıyor; değişmeyen içerik sonraki gün derlendiğinde tarih korunuyor. | Tekrarlanan üretimde 899 route revizyonu değişmedi; kontrol tarihi tek başına yenileme sayılmıyor. |
| P2 | DOĞRULANDI | Bloglarda farklı yayıncı tanımları bulunuyordu | 20 makalenin ve genel sayfaların yayıncısı mevcut bildirilen kişi Silvis Balodis kimliğine bağlandı. | Görünür yazar/gün ile BlogPosting eşleşmesi; uydurma Organization/adres/puan yok. |
| P2 | DOĞRULANDI | Studio görsellerinin boyutları eksikti | Gerçek dört görsel boyutu ve gizli yükleme alanı rezervi eklendi. Görüntü dosyaları değiştirilmedi. | Son ham taramada eksik boyut veya alt yok; görsel dosyaları kaynaklarıyla eşleşiyor. |
| P2 | DOĞRULANDI | Parametre kararları yazılı sözleşmeye bağlı değildi | Tarih/görünüm, astronomi, ad arama, gerçek Letonca PDF filtreleri, kişisel durum, takip ve desteklenmeyen page ayrıldı. | 10 örnek query + gerçek gads/periods/menesis testi; canonical aynı landing. |
| P2 | DOĞRULANDI | Gelecek ölçüm ihtiyacı | Aktarım yapmayan, kişisel veri alanlarını reddeden event sözleşmesi hazırlandı. | Ad, not, URL, tam tarih ve serbest etiketler payload’a alınmıyor; yeni servis yok. |
| P2 | DOĞRULANDI | Sahibi tanıtım bandını istemedi | Yalnızca /kalendars/ içindeki 48 ay tanıtım bandı kaldırıldı. | Dört yıl kartı, 48 ay bağlantısı ve filtreler duruyor; yeni tasarım veya link mimarisi yapılmadı. |
| İzleme | OLASI | Arama niyeti çakışması | Yıl, ay, baskı, tatil ve rehber görevleri ayrıştırıldı; benzer kelime tek başına cannibalization sayılmadı. | SEARCH-INTENT-MAP.csv; GSC sorgu/sayfa verisi olmadan trafik etkisi doğrulanamaz. |
| Dış teyit | DOĞRULANAMADI | Saha CWV, Google indeks seçimi ve rich result | Yerel ölçümler ve kod kontrolleri mevcut; Google’ın canlı değerlendirmesi yerine geçmez. | Search Console/CrUX/Rich Results Test verisi yok; hiçbir indeks gönderimi yapılmadı. |
| Dış teyit | DOĞRULANAMADI | Hukuk ve tüm Letonca metinlerin bağımsız onayı | Resmî adres sahibi talimatıyla boş; yeni uzman, hukuk/WCAG sertifikası veya ana dili editör onayı uydurulmadı. | Kaynak sürümleri korundu; güncel tüm hukuk metinleri bu oturumda eksiksiz yeniden doğrulanamadı. |

## Ham HTML ve çalışan DOM ayrımı

Bütün 901 sayfanın ham HTML’i ayrı tarandı. 45 temsilî adresin hem 1.440 hem 390 CSS piksel genişlikte çalışan DOM’u incelendi. Sekiz kritik adres ayrıca 320 ve 360 pikselde kontrol edildi. Sonraki 106 tarayıcı kontrolünde yatay taşma bulunmadı. Bu, 901 sayfanın tümünün tek tek gözle incelendiği iddiası değildir.

İlk HTML’e yerleştirilen takvimler genel tatilleri içerir; kullanıcı notlarını içermez. JavaScript kişisel işlevler ve seçimlerle görünümü geliştirir. Botlara ayrı içerik sunulmaz. Home, Şubat 2028, ISO 2031/01 ve isim dizini gerçek tarayıcıda JavaScript kapalıyken incelendi.

## Sayfa aileleri

| Sayfa ailesi | HTML sayısı |
| --- | --- |
| blog_article | 20 |
| blog_index | 1 |
| calendar_month | 48 |
| city_photos | 1 |
| error_document | 2 |
| garden | 17 |
| garden_month | 12 |
| holiday_month | 48 |
| holiday_year | 4 |
| horoscope | 12 |
| hub | 47 |
| iso_week | 209 |
| latvia_cultural | 25 |
| latvia_special | 26 |
| long_weekends | 4 |
| lunar_month | 48 |
| lunar_year | 4 |
| memorial_year | 4 |
| month_index | 4 |
| moon_city | 82 |
| name_calendar | 20 |
| name_day_month | 12 |
| occasion | 48 |
| print_index | 4 |
| print_month | 48 |
| school_academic | 4 |
| school_year_calendar | 4 |
| sky_hub | 1 |
| sun_city | 82 |
| week_index | 4 |
| work_month | 48 |
| work_year | 4 |
| year | 4 |

## Korunan SEO kararları

Yıl takvimi, aylık görünüm ve PDF koleksiyonu farklı kullanıcı görevleri olarak kalır. Mevcut şehir sayfaları koordinata bağlı hesap değerini korur. Takip parametreleri yeni sitemap girdisi oluşturmaz. Gerçek sayfalama mevcut olmadığı için page=2 yeni içerik gibi sunulmaz; gelecekte gerçek sayfalama eklenirse politika tekrar incelenmelidir.

Kişisel name, seçili gün ve filtre değerleri title, description, canonical, JSON-LD veya analytics içine taşınmaz. Bilinen tarih ve şehir seçimleri URL’den geri açılır. Her örnek query anahtarının bir UI özelliği olduğu varsayılmaz: PDF kataloğunun gerçek anahtarları gads, periods, menesis, virziens, svetki ve dizains’tir. İngilizce year/period örneği bu aracı değiştirmez.

Fotoğraf/lisans HTML belgesi sahibi isteğiyle noindex,follow kalır; resimlere noimageindex eklenmez. Genel resimler ve baskı dosyaları taranabilir. Eşdeğer formatların tamamını ana sayfaya canonical eden kör başlık kuralı eklenmedi. Kişisel blob dosyaları public landing değildir.

## Görsel, veri ve kaynak güveni

4601 resim URL’si mevcut resim sitemap’inde doğrulanır. Her HTML’in kendisine özgü kabul edilmiş 1200×630 paylaşım kapağı korunur. Gereksiz yeni kapak üretimi yapılmadı. Son HTML taramasında eksik alt veya intrinsic boyut bulgusu yoktur. Dekoratif alt metinler anahtar kelime alanına çevrilmedi.

Gregorian gün/ay/hafta hesapları Python datetime, calendar ve zoneinfo ile bağımsız karşılaştırıldı. Bu kontrol bir hükümetin gelecekteki tatil kararını doğrulamaz. Tatil, anma, izin ikamesi ve okul dönemi ayrı veri türleri olarak kalır. İsim günlerinin kaynağı VVC’nin resmî listeleridir; listede yer almak etnik köken hakkında %100 iddia anlamına gelmez.

2026/2027 okul duyurusu ve VVC resmî kaynakları yeniden okundu. Bütün hukuk metinlerinin güncel konsolide halleri bu oturumda eksiksiz teyit edilemedi; kaynak sürümleri gerçeğe aykırı biçimde bugün onaylı gösterilmedi. Bağımsız ana dili editörü, hukukçu veya erişilebilirlik sertifikasyonu yapılmış sayılmaz. Resmî adres sahibi talimatıyla boş bırakıldı.

## Performans ve korunan görünüm

Toplam ham HTML 232,950,374 bayttan 104,783,428 bayta indi: 128,166,946 bayt, %55.02 azalma. Esas neden aynı tam stil dosyasının yanında yinelenen inline bloğun kaldırılmasıdır. 41 tam stil dosyası hâlâ ilk renderı bekletir; geç gelen CSS veya gizlenen body yoktur. Kaynak stil ve fontlar değiştirilmedi.

| Profil / URL | Önce medyan (min–maks) ms | Sonra medyan (min–maks) ms | Değişim | Sonra en büyük CLS |
| --- | --- | --- | --- | --- |
| desktop / | 184 (172–196) | 240 (228–272) | 30.43% | 0.00284 |
| desktop /kalendars/2027/ | 168 (168–236) | 216 (212–216) | 28.57% | 0 |
| desktop /kalendars/2028/februaris/ | 124 (116–156) | 136 (128–136) | 9.68% | 0.0118 |
| desktop /skolas-brivlaiki/ | 108 (100–136) | 120 (108–148) | 11.11% | 0.0064 |
| mobile-lab / | 1932 (1908–1968) | 1584 (1572–1592) | -18.01% | 0 |
| mobile-lab /kalendars/2027/ | 1428 (1424–1488) | 1180 (1172–1216) | -17.37% | 0 |
| mobile-lab /kalendars/2028/februaris/ | 1300 (1284–1312) | 1076 (1016–1088) | -17.23% | 0 |
| mobile-lab /skolas-brivlaiki/ | 1476 (1464–1480) | 1320 (1284–1364) | -10.57% | 0 |

Her hücre aynı URL/cihaz koşulunda üç ölçümün medyanı ve aralığıdır. Mobilde dört örnek LCP medyanı iyileşti; masaüstünde medyanlar 12–56 ms arttı. Masaüstü için hızlanma iddia edilmiyor. İlk eşzamanlı test süreçleriyle çakışan 12 masaüstü örneği ayrı saklandı; yalnızca en iyi örnek seçilmedi, bütün masaüstü seti boşta yeniden ölçüldü. Yerel ölçüm cihaz/OS gürültüsünü ve CDN farkını ortadan kaldırmaz.

Bu ölçümler Lighthouse puanı, gerçek kullanıcı 75. yüzdelik CWV, INP veya TBT değildir. Uzun görev sayısı ayrıca kaydedildi. Bazı mobil yüklemelerde uzun görev kaldı; bunlar kullanıcı etkileşimi ölçümü gibi yorumlanmadı. Rapor scripti kişisel verileri okumaz ve dış servise ölçüm göndermez.

## Açık teyitler ve yayın durumu

DOĞRULANDI: Ruby 4.0.9 / Jekyll 4.4.1 / Bundler 4.0.20

Canlı host yönlendirmeleri yalnızca dört HEAD isteğiyle incelendi: HTTP ve www girişleri tercih edilen HTTPS köke 301, index.html adresi slash adresine 308 dönüyor. Asıl denetim yerelde yapıldı. Mevcut canlı sayfaya ilk beş salt okunur istek eski yayının durumunu gösterir; bu yerel düzeltmelerin yayımlandığı anlamına gelmez.

Search Console, CrUX ve analytics verisi sunulmadı; sorgu hacmi, zorluk, trafik artışı veya Google canonical seçimi doğrulanamadı. Bir site: sorgusu tam indeks sayımı yerine kullanılmadı. İçerik niteliği ve niyet ayrımı incelendi; yeni anahtar kelime sayfası üretilmedi.

Yerel düzeltmeler uygulanmış ve raporlanmıştır. Canlı ortama yayın yapılmadı. Yayın için bu görevden sonra ayrı ve açık “canlıya al” talimatı gerekir. Yayın adımları DEPLOY-RUNBOOK.md içinde yalnızca geleceğe dönük plandır.
