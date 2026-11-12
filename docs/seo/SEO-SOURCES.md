# Kaynaklar ve kanıt kullanımı

Kontrol tarihi: 12 Kasım 2026. Kaynak sayfasını okumak bu siteye dış onay verildiği anlamına gelmez. Teknik kararlar için birincil dokümantasyon kullanıldı. Arama sonucu örnekleri yalnızca kullanıcı görevi çıkarımı içindir; hukuki veri kaynağı değildir.

| Kimlik | Kaynak | Adres | Karardaki rolü | Doğrulama sınırı |
| --- | --- | --- | --- | --- |
| G01 | Google Search Central | https://developers.google.com/search/docs/crawling-indexing/canonicalization | Canonical tercih sinyali; adres birleştirme kararı. | Resmî belge okundu; Google’ın bu site için seçtiği canonical görülmedi. |
| G02 | Google Search Central | https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls | Canonical yöntemlerinin kapsamı ve non-HTML yaklaşımı. | Resmî belge; bütün PDF’lere kör canonical eklenmedi. |
| G03 | Google Search Central | https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics | Ham HTML ve JavaScript render ayrımı. | Resmî belge; ilk HTML ve tarayıcı DOM ayrı ölçüldü. |
| G04 | Google Search Central | https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap | Sitemap seçimi ve anlamlı lastmod. | Resmî belge; sitemap gönderilmedi. |
| G05 | Google Search Central | https://developers.google.com/search/docs/appearance/google-images | Tarayıcıya açık img, alt ve görsel keşfi. | Resmî belge; gerçek Google görsel indeks sonucu ölçülmedi. |
| G06 | Google Search Central | https://developers.google.com/search/docs/appearance/structured-data/sd-policies | Görünür içerik ve yapılandırılmış veri tutarlılığı. | Resmî belge; Rich Results Test localhost üzerinde çalıştırılmadı. |
| G07 | Google Search Central | https://developers.google.com/search/docs/appearance/structured-data/article | Makale, yazar ve tarih alanları. | Resmî belge; yalnızca mevcut 20 gerçek makale BlogPosting. |
| G08 | web.dev | https://web.dev/articles/vitals | LCP, INP ve CLS ayrımı. | Resmî performans kaynağı; yerel örnekler saha CWV değildir. |
| G09 | web.dev | https://web.dev/articles/defining-core-web-vitals-thresholds | CWV eşikleri ve gerçek kullanıcı değerlendirmesi. | Resmî belge; INP veya saha 75. yüzdelik ölçülmedi. |
| C01 | Cloudflare | https://developers.cloudflare.com/pages/configuration/headers/ | Statik başlıklar ve Functions sınırı. | Resmî belge; CDN ayarına yazılmadı. |
| C02 | Cloudflare | https://developers.cloudflare.com/pages/configuration/redirects/ | Redirect dosyası, zincir ve alan adı kapsamı. | Resmî belge; yeni yönlendirme mimarisi kurulmadı. |
| C03 | Cloudflare | https://developers.cloudflare.com/pages/configuration/serving-pages/ | index.html normalizasyonu ve statik servis. | Resmî belge ve sınırlı salt okunur canlı HEAD kontrolü. |
| LV01 | Valsts valodas centrs | https://www.vvc.gov.lv/lv/kalendarvardu-ekspertu-komisija | Geleneksel ve genişletilmiş takvim adı listeleri. | Kaynak sayfası okundu; etnik köken veya ana dili editör incelemesi iddiası değildir. |
| LV02 | Latvijas Atvērto datu portāls | https://data.gov.lv/dati/lv/dataset/latviesu-tradicionalais-un-paplasinatais-kalendarvardu-saraksts | VVC veri setinin kaynağı ve lisansı. | Resmî katalog; katalog tarihi ile güncel VVC liste tarihi birbirine karıştırılmadı. |
| LV03 | Izglītības un zinātnes ministrija | https://www.izm.gov.lv/lv/jaunums/apstiprinati-20262027-macibu-gada-sakuma-beigu-un-brivdienu-laiki | 2026/2027 için yayımlanmış okul yılı ve tatiller. | Resmî duyuru okundu; yayımlanmamış sonraki yıllar kesinleştirilmedi. |
| LV04 | Likumi.lv | https://likumi.lv/ta/id/72608-par-svetku-atceres-un-atzimejamam-dienam | Tatil, anma ve kutlama günü ayrımı. | Bu oturumda güncel tam konsolide metin yeniden doğrulanamadı; depodaki kaynak sürümü korunur. |
| R01 | OpenSSL | https://openssl-library.org/source/ | Yerel sabit Ruby doğrulaması için eksik bağımlılık. | Yalnızca resmî arşiv, yayımlanmış SHA-256 kontrolü ve proje içi kurulum. |
| R02 | LibYAML | https://pyyaml.org/wiki/LibYAML | Yerel Psych bağımlılığı. | Resmî kaynak arşivi; sistem genelinde kurulum yapılmadı. |

## Arama niyeti araştırması

SEARCH-RESEARCH.csv, Letonca başlangıç sorgularını, görülen kaynak örneklerini ve mevcut hedef URL’yi içerir. Sorgular arama aracı üzerinden incelendi; konumu sabitlenmiş gerçek Google.lv hesabı veya Search Console verisi alınmadı. Arama hacmi, zorluk, CTR, trafik veya sıralama uydurulmadı. Rakip metinleri kopyalanmadı. Ek alan adı projesi hreflang alternatifi sayılmadı.

## Depo kanıtları

Route matrisi, gerçek build HTML’i, _data/page-revisions.json, _data/social-images.json, isim günü kaynak kayıtları, astronomi verisi, dört download manifesti ve ilgili testler esas alındı. Ham HTML, HTTP başlığı, render edilmiş DOM ve dış arama motoru sonucu ayrı kanıt sınıflarıdır. Gözle görülmeyen bir Google sonucuna başarılı denmedi.

VVC’nin resmî liste kaydı, otomatik olarak “bütün adlar yalnızca etnik Leton adıdır” iddiası vermez. Geleneksel ve genişletilmiş takvim listeleri ayrı tutulur. Astronomik hesaplar, horoskop eğlencesi ve tarımsal gelenek aynı bilimsel güvenilirlik iddiasıyla birleştirilmez.

Letonya Eğitim ve Bilim Bakanlığının yayımlanmış okul yılı duyurusu doğrulandı. Hukuk metinlerinin eksik alınabilen güncel sürümleri için DOĞRULANAMADI kaydı korundu; gelecekteki resmî kararlar rakip sitelerden kesinleştirilmedi. İş günü yer değiştirme kararları yeni bir resmî belge yayımlandığında tekrar incelenmelidir.
