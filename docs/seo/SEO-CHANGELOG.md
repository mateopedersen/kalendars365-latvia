# Yerel değişiklik kaydı

Bütün işlemler yalnızca yerel çalışma alanında yapıldı. Bu liste bu SEO görevindeki değişiklikleri açıklar; başlangıçta zaten değiştirilmiş dosyalar görevimize aitmiş gibi gösterilmez. Kontrol özetleri CHANGESET.csv içindedir. Kabul edilmiş baskı asılları ve kaynak CSS/font dosyaları yeniden üretilmedi.

| Değişiklik | Sorun / kanıt | Kaynaklar | Risk / test | Geri alma grubu |
| --- | --- | --- | --- | --- |
| Public SSG takvim ve isim dizini | 258 ilk-HTML eksikliği; isim grid’i boştu | scripts/render_calendar_snapshot.cjs; generate.rb; app.html; collection-calendar.html; calendar-workbench.html; category_experience_components.rb | Render çiftini aynı veriyle tutmak: bağımsız 1461 gün + JS açık/kapalı + not/ICS/print | R1: üretici, include ve snapshot birlikte |
| Tek tam blocking CSS | Yinelenen inline blok 129979293 bayt | tooling/critical-css/inline.mjs; test/critical-css.test.mjs; test/seo-performance.test.cjs | CSS sırası korunuyor; 41 bundle, 90 DOM örneği, tekrarlı LCP/CLS | R2: CSS üretim politikası ve testi |
| SEO route sözleşmesi | Bağımsız adres ve schema üretimi | lib/seo_contract.rb; _plugins/seo_contract.rb; _layouts/default.html; scripts/generate.rb | Canonical, olmayan asset/tarih ve entity ilişkileri bütün 901 sayfada doğrulanıyor | R3: layout, plugin, lib, generate bir bütün |
| Anlamlı blog lastmod | Yayın günü sabitleniyor, body değişimi izlenmiyordu | scripts/blog_components.rb; scripts/generate.rb; _data/page-revisions.json | Hash bootstrap önceki/published tarihi korur; sonraki gözlem tarihi 2030 olsa da aynı içerik tarihi korunur | R4: içerik özeti ve revizyon kaydı |
| Studio görsel boyutları | 5 img için boyut rezervi eksikti | _includes/calendar-studio.html | Gerçek 4 kaynak boyutu + gizli upload slot; görüntü değişmedi | R5: ilgili include |
| Query ve ölçüm kontratı | Yazılı parametre ayrımı / kişisel veri filtresi | _data/seo-parameters.json; tooling/seo/event-contract.mjs | Dış transport yok; kişisel alan allowlist dışında | R6: yalnızca görev dosyaları |
| Yıl/ay tanıtım bandı kaldırma | Kullanıcının son açık isteği | scripts/hub_components.rb | 4 yıl, 48 ay linki ve filtre yerinde; ekran kaydı var | R7: bu section kaldırma diff’i |
| Denetim araçları ve belgeler | Tekrar çalıştırılabilir yerel kanıt | tooling/seo/*; test/seo-contract.test.mjs; docs/seo/*; scripts/package.json | Loopback; preview ayrımı; private/public sızıntı kontrolleri | R8: yalnızca yeni QA dosyaları |

## Değişmeyen kapsam

İç/dış link mimarisi, URL matrisi, yönlendirme dosyaları, hosting/DNS/CDN ayarları, mevcut renk ve tipografi, resim/PDF asılları, kabul edilmiş tasarımlar ve içerik sahipliği değişmedi. Takvim ana değerinin ham HTML’e gelmesi için gerekli görünür markup eklendi; yeni görünmez SEO metni oluşturulmadı. Başlıklar düzeltme bahanesiyle topluca yeniden yazılmadı. İlgili metadata merkezi kaynaktan aynı içerikle üretildi.

Bütün CSS veya 901 sayfa için yeni tasarım yapıldığı iddia edilmez. Kullanıcının son bandı kaldırma talimatı dışında tasarım korunur. Çalışmanın toplam ham HTML etkisi 128,166,946 bayt azalmadır. İndirilebilir baskı orijinallerinde yeniden kodlama: 0.

## Yerel kurulum

Sistem geneli paket yöneticisi veya makine ayarı değiştirilmedi. Node önceden mevcut proje cache’inden kullanıldı. Sabit Ruby doğrulaması için gerekiyorsa resmî OpenSSL/LibYAML bileşenleri yalnızca node_modules/.cache altında hazırlanmıştır; son durum evidence/runtime-validation.json içindedir. Kaynak indirme hiçbir yayın veya uzak hesap yazması değildir.
