# Gelecekteki yayın için işlem kılavuzu

BU DOSYA YAYIN İZNİ DEĞİLDİR. Bu görevde hiçbir adım canlıya uygulanmadı. Kullanıcı bu görevden sonra ayrı ve açık “canlıya al” mesajı vermeden burada yazan uzak işlemler yürütülemez.

## Ön koşullar

1. Yeni açık yayın talimatını al. O zamanki çalışma ağacını kaydet; mevcut görevdeki dosyalarla sonraki değişiklikleri karıştırma.
2. CHANGESET.csv ve özel başlangıç yedeğiyle diff’i gözden geçir. Baskı asıllarını değiştirme. Plan dışı dosya varsa yayın paketine körlemesine ekleme.
3. Sabit Ruby 4.0.9, Bundler 4.0.20, Jekyll 4.4.1 ve Node 24.22.1 ile tüm üretim ayarları derlemesini tekrar doğrula. Bugünkü durum: DOĞRULANDI: Ruby 4.0.9 / Jekyll 4.4.1 / Bundler 4.0.20
4. 300 Node testi, Ruby tarih testleri, 901 sayfalık SEO gate, bağımsız tarih ve dosya manifesti testlerini geç. Yeni değişiklik yapılmışsa eski logu güncelmiş gibi kullanma.
5. Resmî veri güncelliğini tekrar kontrol et. Yayımlanmamış tatil/okul kararını kesin tarih yapma. Operatör adresi sahibi talimatıyla boş kaldı; hukuk uygunluğu tamamlandı iddiası yapılmamalıdır.
6. Rapor, fixture, not, kaynak yedeği, localhost, preview host veya local metrics scripti public çıktıda bulunmamalı. Production’da yanlış preview noindex olmamalı. Lisans HTML’inin noindex,follow kararı korunmalı.

## Yalnızca izin verildikten sonraki yayın sırası

Mevcut GitHub/Cloudflare yayın düzenini kullan; yeni hosting kurma. Günlük içerik workflow’unun push yapabildiğini dikkate al. Çalışma ağacındaki tüm değişiklikleri otomatik push etme. Gözden geçirilmiş tek bir paket ve geri alınabilir önceki sürüm kaydı hazırla.

Önce statik dosyaların ve Functions paketinin doğru sürüme ait olduğunu kontrol et. Cloudflare _headers yalnızca statik cevaplara uygulanır; Functions cevaplarının kendi robots/cache başlıkları ayrıca test edilmelidir. Konum API’si paylaşımlı cache’e girmemelidir. Günlük burç ve gözlem verisinin TTL/edition günleri kaynak zamanıyla uyuşmalıdır. Cache’i topluca temizleme ancak ayrı teknik gerekçe varsa değerlendirilir.

Yayın tamamlandı varsayma. Mevcut hostun gerçek cevaplarını kontrollü örnekle doğrula: ana sayfa, yıl, Şubat 2028, ISO yıl sınırı, isim dizini, okul sayfası, görsel lisansı ve gerçek olmayan route. PDF, Attēls ve ICS dosyalarını indir; yıl/ay/tasarım hash’ini doğrula. Hava API’si çalışmıyorsa bulunmayan veriyi güncel gösterme.

HTTPS ve tercih edilen non-www host; slash/index.html normalizasyonu; canonical; robots; sitemap üyeliği; meta dil/title; JSON-LD yazar/tarih/görsel ilişkileri; public assets Content-Type; mobil görünüm; print; kişisel not ve gün seçimi kontrol edilir. Bugün salt okunur kontrolde mevcut canlı host davranışları doğruydu; gelecekte değişmemiş olduğu varsayılmaz.

## Başarısızlık halinde durma koşulları

Yanlış noindex, yanlış yıl/ay canonical, 404 yerine 200, bozuk indirme, kişisel veri sızıntısı veya temel takvim kırılması varsa yayın başarılı sayılmaz. Yeni dosya eklemeye devam etmek yerine önce ROLLBACK.md ile hedefli geri alma yapılır. Google’ın tarama/indeks değişkenliği tek başına bütün üretimi geri alma sebebi değildir.

## Yayın sonrası 7 / 28 / 56 günlük değerlendirme

Bu bir gelecek planıdır; şu anda otomatik görev kurulmadı ve Search Console’a istek gönderilmedi.

| Zaman | İncelenecek veri | Yorum sınırı |
| --- | --- | --- |
| 7 gün | Yetkili GSC kapsamı, seçili URL inspection, robots/sitemap erişimi, sunucu hata oranı | Kısa süreli keşif gecikmesi sıra kaybı kanıtı değildir. |
| 28 gün | Aile/yıl/cihaz/sorgu niyeti bazında gösterim, tıklama ve sorgu–landing eşleşmesi; varsa CrUX/RUM | Saha CWV p75 ve örnek sayısı ayrıca raporlanır; local LCP yerine geçirilmez. |
| 56 gün | Önceki karşılaştırılabilir dönem ve mevsimsellik; canonical seçimi; yıl/ay/PDF görev ayrımı | Teknik değişimin nedensel trafik etkisi veri olmadan kesinleştirilmez. |

Hacim veya sıralama garantisi yoktur. Mümkün yetkili salt okunur veri gelirse değerlendirme yapılır; hesap ayarları kendiliğinden değiştirilmez.
