# Yerel doğrulama ve sınırları

12 Kasım 2026. Sonuçlar yerel geliştirme kanıtıdır. Yayın veya arama motoru sonucu değildir.

## Tamamlanan kontroller

| Kontrol | Sonuç | Kanıt |
| --- | --- | --- |
| Node regresyon paketi | 300 geçti; 0 başarısız / atlanan | Özel final-tests.log; test/seo-contract.test.mjs dahil |
| Ruby tarih paketi | 8 test, 3158 assertion; 0 hata | Özel ruby-date-tests.log |
| Bağımsız tarih hesabı | 1461 gün, 48 ay, 209 hafta route’u, 3307 assertion, 4 host saat dilimi | evidence/dates-independent.json |
| Metadata / graph / sitemap | 901 HTML, 901 graph, 898 sitemap landing; 0 hata | evidence/seo-gate.json |
| Yerel HTTP / redirect | 18 HEAD senaryosu, 5 explicit redirect; zincir/döngü yok | evidence/seo-gate.json |
| Ham HTML envanteri | 901 cevap 200; bilinen hata belgeleri ayrı noindex; eksik route yok | URL-INVENTORY.csv; evidence/after-summary.json |
| Gerçek olmayan route | Yerelde 404 + noindex; canlı küçük örnekte 404 | evidence/seo-gate.json; evidence/live-read-only.json |
| DOM örneklemi | 45 URL × masaüstü/mobil = 90; dar ekran ek 16; taşma 0 | evidence/dom-summary.json |
| Raw / DOM metadata | Örneklemde title, description, canonical, robots, dil uyumsuzluğu 0 | evidence/dom-summary.json |
| JavaScript kapalı | Ana sayfa 42 hücre; Şubat 2028 42; yıl sınırı haftası 7; isim dizini 60 kayıt | evidence/no-javascript.json |
| API arızası | 503 stub; takvim 42 günle çalışıyor; hava ve ölçüm yokluğu açıkça yazıyor | evidence/api-unavailable.json |
| Dosya kimliği | 3459 asıl/önizleme dosyası; kaynak/build birebir; hata 0 | DOWNLOAD-MANIFEST.csv; evidence/downloads-validation.json |
| Gerçek UI indirmesi | Şubat 2028 tasarım 01 PDF ve Attēls; indirme SHA eşleşiyor; ICS geçerli | evidence/browser-download-validation.json |
| Kişisel not | 29 Şubat için sentetik not saklandı, yeniden açıldı ve temizlendi | Özel after/note-regression.json; not dış ölçüme gönderilmedi |
| Tarayıcı baskısı | Home ve Şubat 2028 tek A4; takvim dışı blok yok; PNG’ler gözle incelendi | evidence/print-validation.json; images/print-*.png |
| lastmod tekrarı | 899 route revizyonu tekrar üretimde aynı | evidence/preservation-validation.json |
| İç bağlantı koruması | internal-navigation.json başlangıçla veri değerleri düzeyinde aynı | evidence/preservation-validation.json |
| Public dışlama | tooling/seo ve docs/seo public çıktıda yok; local ölçüm scripti inject-only | evidence/preservation-validation.json |
| Event kişisel veri filtresi | Sentetik ad, not, URL ve tarih atıldı; transport yok | test/seo-contract.test.mjs; tooling/seo/event-contract.mjs |
| Repo whitespace kontrolü | git diff --check geçti | Yerel terminal doğrulaması |
| Üretim sürümü | DOĞRULANDI: Ruby 4.0.9 / Jekyll 4.4.1 / Bundler 4.0.20 | evidence/runtime-validation.json |

## Çalıştırma sırası

Aşağıdaki komutlar yayına yazmaz. Önce scriptleri okumak ve çalışma ağacını kaydetmek yine gereklidir. Sabit Ruby ve Node proje cache’inden PATH’e alınmalıdır. Sistem Ruby ile çalışan ilk derleme ile sabit sürüm kanıtı birbirine karıştırılmamalıdır.

~~~sh
ruby scripts/generate.rb
JEKYLL_ENV=production bundle exec jekyll build --trace
node --test test/*.mjs test/*.cjs
ruby test/date_test.rb
ruby scripts/audit.rb
node tooling/seo/verify.mjs --output=docs/seo/validation
python3 tooling/seo/downloads.py --output=docs/seo/artifacts
~~~

Yalnızca localhost üzerinde önizleme:

~~~sh
node tooling/seo/serve.mjs --port=4013 --mode=preview
~~~

Production ayarlarını yerelde simüle etme:

~~~sh
node tooling/seo/serve.mjs --port=4013 --mode=production-simulation
~~~

Bu sunucu API’lere dış istek yapmaz; 503 senaryosu bilinçli kullanılır. Gerçek Cloudflare Functions çalışma ortamı değildir. Preview cevabı noindex,nofollow ve no-store alır; production simülasyonunda bu güvenlik etiketi ana sayfaya taşınmaz. Lisans/hata belgelerinin kendi kararı korunur.

## Tarayıcı ölçüm koşulları

Masaüstü: 1440×900 CSS piksel, CPU 1×, ek gecikme yok. Mobil laboratuvar: 390×844 CSS piksel, CPU 4× yavaşlatma, 150 ms gecikme, 200000 bayt/sn indirme ve 93750 bayt/sn yükleme. Her URL için üç yeniden yükleme; HTTP cache devre dışı. Yerel sunucu gzip kullanır. Ölçüm HUD’u load sonrası 1500 ms’de örneklenir; performans API’sinin buffer’lı LCP/CLS ve uzun görev olaylarını okur.

İlk envanter aracının SVG içindeki title düğümlerini belge başlığına eklediği fark edilince parser yalnızca head/title okuyacak şekilde düzeltildi ve regresyon testi eklendi. İlk ham kayıt korunur; özel baseline/corrected altındaki 182 başlık düzeltmesi değişmez eski HTML arşivinden yeniden hesaplandı. Bu bir site metadata hatası değildi. İlk HTTP taramasının diakritikli bir URL’yi encode etmemesi de araçta giderildi; eski UNVERIFIED kaydı geçmişe dönük 200 gibi değiştirilmedi.

Başlangıç ve son ana ölçümde çerez bildirimi açıktı. Daha sonraki fonksiyonel testte “Sapratu” tıklandı; son ekran görüntülerinde bu bildirim kapalıdır. Bu görüntü farkı CSS değişikliği veya hız kanıtı olarak gösterilmez. Bir yerel sürümde ilk 12 masaüstü örneği CPU kullanan doğrulama süreçleriyle çakıştığı için ayrı saklandı ve bütün masaüstü seti tekrar ölçüldü. Ham örnekler özel raporda saklıdır.

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

## Parametre matrisi

Tarih/görünüm, şehir/tarih, VVC ad araması, katalog, hesap girdisi, isimli taslak, blog filtresi, desteklenmeyen page ve takip parametreleri sınırlı örneklerle incelendi. Canonical ve görünür metadata sabit kaldı. Şubat 29 seçimi ve Liepāja/tarih seçimi açıldı. PDF kataloğunda gerçek Letonca parametrelerle 2028 Şubat / 15 tasarım doğrulandı.

Örnek İngilizce year/period anahtarları PDF filtresini değiştirmez; bu bug olarak uydurulmadı. Tarih hesaplayıcısının from/to örneği de mevcut UI tarafından URL’den başlangıç girdisi olarak okunmuyor; mevcut hesaplama işlevi çalışır, ancak URL’den her girdiyi geri yükleme özelliği vaat edilmez. Blog konu değeri, görünür mevcut kategori adıyla eşleşmelidir. Bu sınırlar policy dosyasında belirtilir.

## Sınırlar

JSON parse ve yerel alan/tip/URL/kimlik kontrolleri geçti; bu bağımsız schema.org sertifikası veya Google Rich Results Test sonucu değildir. Localhost dış validator’a açılmadı. Saha CWV/INP, Google indeks sayısı, Googlebot’un seçtiği canonical, GSC sorguları ve AdSense onayı ölçülmedi. Hukuk, astronomi ve ana dili editör onayı otomatik testler yerine geçirilmedi.
