# XML sitemap bakımı

12 Kasım 2026 yerel düzenlemesi. Yayın, Search Console gönderimi veya indeksleme isteği yapılmaz.

## Yapı ve kapsam

- `/sitemap.xml`: yalnızca indekslenebilir canonical HTML adresleri ve kayda bağlı anlamlı `lastmod` tarihleri.
- `/image-sitemap.xml`: aynı sayfalar ve o sayfalardaki gerçek içerik görselleri, responsive kaynaklar, sosyal kapaklar ve indirilebilir Image dosyaları.
- `/robots.txt`: her iki XML dosyasını tam HTTPS adresiyle bildirir.

898 sayfa için mevcut iki düz dosya korunur. Mevcut sitemap adresi bir index dosyasına çevrilmez; gereksiz bölümleme veya paralel kopyalar eklenmez. URL sırası arama önceliği anlamına gelmez. Sıralama yalnızca çıktının tekrar üretilebilirliği içindir.

Lisans belgesi `/pilsetas-un-fotografijas/` ile `/404.html` ve `/500.html` sitemap dışında kalır. 2030 sonundaki haftanın çalışan `/nedelas-kalendars/2031/01/` destek adresi korunur. Bir okulun gelecek dönem tarihlerini henüz yayımlamamış olması, faydalı açıklama sunan mevcut sayfasının otomatik noindex yapılması anlamına gelmez.

PDF koleksiyonlarının canonical tanıtım/indirme sayfaları kapsanır. Eşdeğer PDF ve Image dosyaları ayrı HTML sayfaları gibi çoğaltılmaz; orijinal Image dosyaları görsel sitemap'inde ilgili içeriğe bağlanır. Dosyaların mevcut taranabilirliği ve lisans bilgileri korunur. Tarayıcıda oluşturulan kişisel takvimler, notlar, blob/data adresleri ve arama parametreleri sitemap'e girmez.

## Üretim

`scripts/sitemap.rb`, `docs/route-manifest.json` ile aynı kayıt nesnelerinden sayfa XML'ini ve robots.txt dosyasını üretir. Letonca URL karakterleri UTF-8 percent encoding ile yazılır; gerçek route veya canonical kimliği değiştirilmez. Örnek: `lietošanas-noteikumi` sitemap'te `lieto%C5%A1anas-noteikumi` olur.

`lastmod`, `significantModifiedAt` ve revizyon kaydıyla eşleşmelidir. Yeni derleme tarihi, takvimde gösterilen gelecek yıl, telif yılı veya dosyanın kopyalanma zamanı sayfanın güncellenme tarihi yerine kullanılmaz. Aynı kayıtların sırası veya kontrol günü değişse de üretilen XML aynı kalır.

`scripts/image_sitemap.rb` görselleri tamamlanmış HTML'den toplar. Navigasyon simgeleri ve boş alt metinli dekorasyonlar içerik görseli gibi eklenmez. Görsel başlıkları ve lisanslar için kullanımdan kaldırılmış XML etiketleri eklenmez; mevcut HTML ve yapılandırılmış veriler korunur.

## Her derlemede çalışan kontrol

`_plugins/indexability.rb`, iki XML yazıldıktan sonra `scripts/audit_sitemaps.py` dosyasını çalıştırır. Python standart kitaplığı kullanılır; dış hizmet çağrısı yapılmaz. Başarısız doğrulama derlemeyi durdurur. Kanıt dosyası `docs/sitemap-audit.json` içindedir; `docs` yayın çıktısına dahil değildir.

Kontrol; bütün HTML belgelerini, registry kaydını, canonical ve robots politikasını, gerçek ana içerik görsellerini, dosyaların varlığını/boyutunu, yönlendirme kurallarını, botlara özel robots engellerini ve statik X-Robots-Tag kurallarını karşılaştırır. XML namespace, UTF-8, URL kaçışları, tekrarlar, tarih doğruluğu, 50.000 URL / 50 MB ve sayfa başına 1.000 görsel sınırı denetlenir. Sınır aşımında sessizce kayıt atılmaz; bölümleme gerektiğini belirten hata üretilir.

Sitemap yanıtları için XML MIME türü ve 15 dakikalık yeniden doğrulama önbelleği `_headers` içinde hazırlanmıştır. Bu yerel ayar, canlı CDN'de uygulanmış olduğu anlamına gelmez.

## Yeniden doğrulama komutları

Projenin sabitlenmiş Ruby/Node çalışma ortamını kullan:

```sh
bundle exec ruby scripts/generate.rb
JEKYLL_ENV=production bundle exec jekyll build --trace
python3 scripts/audit_sitemaps.py --output docs/sitemap-audit.json
node --test test/sitemaps.test.mjs
node tooling/sitemap/verify-http.mjs /tmp/kalendars365-sitemap-http.json
```

HTTP aracı yalnızca kendisinin açtığı loopback sunucuda bütün sitemap sayfalarını ve benzersiz görselleri kontrol eder; sunucuyu bitince kapatır. Canlı siteye veya arama motoruna istek göndermez. Bu test canlı Cloudflare davranışını veya Google indeksleme sonucunu doğrulamaz.

Yerel `xmllint` kuruluysa resmi şemalarla ek kontrol:

```sh
xmllint --nonet --noout --schema tooling/sitemap/schemas/combined.xsd _site/sitemap.xml
xmllint --nonet --noout --schema tooling/sitemap/schemas/combined.xsd _site/image-sitemap.xml
```

Şemaların kaynağı, indirme tarihi ve SHA-256 değerleri `tooling/sitemap/schemas/sources.json` içindedir. Resmî görsel şemasında tarihsel olarak tanımlı ama güncel Google belgesinde kaldırılmış alanlar bulunabilir; üretici yalnızca güncel gerekli `image:image` ve `image:loc` etiketlerini yazar.

## Kaynaklar

- [Google: sitemap oluşturma](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)
- [Google: görsel sitemap'i](https://developers.google.com/search/docs/crawling-indexing/sitemaps/image-sitemaps)
- [Sitemaps XML protokolü](https://www.sitemaps.org/protocol.html)

Google `priority` ve `changefreq` alanlarını kullanmadığını belirtir. Uydurma öncelik puanları veya günlük tarih yenilemeleri eklenmez. Sitemap keşfe yardımcı olur; indekslenme veya sıralama garantisi değildir. Ayrı bir yayın talimatı olmadan hiçbir gönderim, ping veya uzak ayar değişikliği yapılmaz.
