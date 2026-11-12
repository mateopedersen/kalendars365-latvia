# Hedefli yerel geri alma

Başlangıçta çok sayıda önceki kullanıcı değişikliği vardı. git reset --hard, git clean, tüm checkout’u eski commit’e döndürme veya toplu dosya silme kullanılmamalıdır. Bu kılavuz yürütülmüş bir geri alma değildir.

## Kanıt ve özel yedek

Özel yedek klasörü: /Users/melihozcan/Documents/Codex/2026-11-09/kalendars365-i-yapacagiz-github-dan-bakarsin/work/reports/seo-engineering-2026-11-12/baseline

Kaynak arşivi: source-before.tar.gz, SHA-256 25930c9f9964e8d3102a975353494721a3cb9c61d5814005ed1690bf77637c99.
Eski HTML arşivi: html-before.tar.gz, SHA-256 ee73b70d7ac9de4bc0885710e47f9f8728966dd72a143eff47d4b154ad62d988.

Kaynak arşivi 1180 seçilmiş kaynak/QA dosyasını kapsar. Yüksek çözünürlüklü baskı asıllarının yeni bir tam yedeği değildir; bu görev o dosyaları değiştirmedi. Generated route dosyaları üreticiden yeniden kurulabilir. Başlangıç branch/commit ve önceki patch özel klasörde korunur; kullanıcı verisi veya token rapora eklenmez.

## Güvenli sıra

1. Güncel çalışma ağacını yeni özel klasöre kopyala. Bu görevin tesliminden sonra değişmiş dosyaları tespit et.
2. CHANGESET.csv içindeki afterSha256 ile mevcut dosyayı karşılaştır. Fark varsa otomatik üzerine yazma; yeni kullanıcı değişikliğini birleştir.
3. Başlangıçta var olan dosya için sadece ilgili yolun source-before.tar.gz içindeki sürümünü geçici klasöre çıkar. Bütün arşivi checkout’un üzerine boşaltma. Önce beforeSha256 doğrula.
4. Yeni SEO dosyası kaldırılacaksa gerçekten bu görevde yaratıldığını ve hâlâ afterSha256 ile eşleştiğini doğrula. Başlangıçtaki izlenmeyen dosyaları silme. Yeni QA raporlarını kaybetmeden ayrı tut.
5. Birlikte bağlı değişiklikleri atomik geri al: R1 takvim üretici/include/snapshot; R2 CSS politikası; R3 layout/SEO plugin/lib/generate; R4 blog revizyonu; R5 Studio boyutları. Üreticiyi yeni plugin ile yarım eski bırakma.
6. Kabul edilmiş downloads/gada-a3, downloads/menesa-a3 ve diğer asıl PDF/WebP dosyalarını geri alma bahanesiyle değiştirme. Bunların hash eşleşmesi zaten doğrulandı.
7. Sadece yerelde generate ve production ayarlı build yap. Sonra tüm tarih/metadata/indirme/print kontrollerini tekrar çalıştır. Eski duplike CSS’nin geri geleceğini ve SSG iyileştirmelerinin kaybolacağını bilerek karar ver.
8. Canlı geri alma ancak o sırada kullanıcı ayrıca yetki verdiyse, mevcut hosting’in önceki doğrulanmış sürümüyle yapılır. Yerel rollback yetkisi uzaktaki cache, DNS veya deploy yetkisi değildir.

## Çalışma zamanı bileşenleri

Yerel bağımlılıklar node_modules/.cache altındadır; sistem Ruby veya global paketler değiştirilmedi. Bunları kaldırmak için bütün node_modules klasörünü silmek gerekmez; daha önce mevcut cache’leri koru. Bu görevde üretilmiş geçici bileşenler kendi sahiplik/versiyon kaydıyla ayrılmalıdır. Canlı ortamın runtime’ı bu yerel cache’den değiştirilmiş sayılmaz.
