# Visi rīki: yerel düzenleme

11 Kasım 2026. Bu çalışma yereldir; canlı dağıtım ve push yapılmamıştır.

- `_data/tools-directory.json` 24 gerçek araç bağlantısının, Letonca başlık/açıklamanın ve farklı SVG konusunun ortak kaynağıdır. `category_export_data` da aynı kataloğu kullanır.
- `scripts/tools_directory_components.rb` kartları ilk HTML'e yazar. JavaScript kapalıyken 24 bağlantı kullanılabilir; çalışamayacak filtre/kaydetme düğmeleri gizli kalır.
- `assets/tools-directory.mjs` mevcut kartları filtreler. Büyük `category-data.json`, şehir listesi, planlayıcı dışa aktarma veya astronomi modüllerini indirmez. Letonca aksanları normalleştirir, çok sözcüklü sorguları ve kategori/kaydedilen kesişimini destekler.
- Önceki `k365-favorite-tools-v1` anahtarı korunur. Hatalı kayıtlar ve katalog dışı adresler güvenle yok sayılır. Depolama engelliyse seçimler oturumda çalışır ve kullanıcıya açıklama gösterilir.
- `assets/tools-directory.css` yalnızca bu sayfayı hedefler. Düğmeler 44 × 44, arama ve seçim alanları 50 piksel yüksekliğinde; kart metni 16 piksel, başlıklar 20–22 pikseldir. Aynı satırdaki açma bağlantıları hizalıdır. Metin kesilmez.
- `scripts/build_tools_art.mjs`, 24 özgün SVG üretir. Kağıt, metal, cam, kumaş, yaprak ve gök cismi çizimlerinde perspektif, malzeme geçişleri, kenar ışıkları ve gölgeler kullanılır. Fotoğraf/piksel gömülmez; bunlar gerçek zamanlı 3B modeller veya gözlem verileri olarak sunulmaz. Zemin/ay çizimleri ilustratiftir. Dünya kontur yardımcı işlevi mevcut vektör kitaplığından paylaşılır.
- `_data/tools-art.json` kimlik, dosya, bayt ve SHA-256 içerir. Kaynak açıklaması `/pilsetas-un-fotografijas/#tools-directory-art` bölümündedir. Önceki kategori/ay çizim dosyaları korunur.

## Doğrulama

48 araç/konu/planlayıcı testi ve 25 ortak kategori, stil, SEO ve performans koruma testi geçti. 24 SVG'nin XML, checksum ve derlenmiş kopya eşitliği kontrol edildi. 320, 390, 768, 1024, 1440 genişliklerinde bütün 24 kartın başlıkları/açıklamaları, yatay taşma ve satır içi düğme alt hizaları kontrol edildi. Arama, boş sonuç, kategori seçimi, kaydetme ve yenileme sonrası kalıcılık gerçek tarayıcıda doğrulandı; testte eklenen yer imi kaldırıldı.

`test/tools-directory.test.mjs` normalleştirme, kesişen filtreler, eski kayıtlar, ilk HTML bağlantıları ve ayrı vektör kaynaklarını doğrular. Çıktılar ve resimli Türkçe rapor çalışma klasörünün `reports/tools-directory-2026-11-11/` dizinindedir. Bu değişiklik için Lighthouse 100 veya bağımsız sertifikasyon iddiası yoktur.
