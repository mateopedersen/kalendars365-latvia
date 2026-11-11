# Svētki un tradīcijas: fotoğraf ve yükleme düzeni

11 Kasım 2026 tarihli değişiklikler yereldir. Yayın izni verilene kadar push veya dağıtım yapılmaz.

## Görseller ve kaynaklar

- 73 konu kartı ve 73 konu ayrıntı sayfasının üst başlığı gerçek fotoğraf kullanır. Her konuya ayrı bir fotoğraf ve ayrı bir Commons kaynak dosyası bağlanır. Aynı fotoğraf içerikte ikinci kez tekrarlanmaz.
- İlk düzenlemedeki 66 farklı fotoğrafa yedi ayrı kaynak eklendi. Anne, baba, öğretmen, devlet dili, yaz gündönümü, işgal anma günü ve yıl sonu konuları artık başka günlerin fotoğrafını paylaşmaz. Toplam 73 farklı fotoğraf ve 250 boyutlandırılmış dosya vardır. Önceden kabul edilmiş özgün kaynak dosyaları korunur.
- `_data/tradition-photos.json`: kaynak URL, yazar, lisans, gerçek piksellerden yazılmış Letonca alt/açıklama, indirilen kaynak kopyasının SHA-256 değeri ve görsel inceleme kaydı.
- `_data/occasion-photo-overrides.json`: yedi yeni gün fotoğrafı, aynı checksum ve görsel inceleme kurallarıyla. `scripts/tradition_links.rb` etkin kaynağı tek yerden çözer; kart, başlık, paylaşım görseli ve kredi aynı kimliği kullanır.
- `_data/tradition-photo-usage.json`: her etkin fotoğrafın kullanıldığı konu başlığı ve URL'si. Kredi kartının başlığı bu etkin kullanımdan gelir.
- `docs/sources/tradition-photos-2026-11-11/`: indirilen fotoğraf kopyaları ve Commons API yanıtları. Bunlar bazen Commons'ın küçültülmüş kopyalarıdır; tam çözünürlüklü özgün dosya oldukları iddia edilmez. Asıl dosyanın URL'si ayrıca saklanır. `docs` yayımlanan siteye kopyalanmaz.
- `scripts/build_tradition_covers.py`: PIL ile en fazla kaynak genişliğine kadar 320/640/960/1280 piksel varyantları üretir. Kaynağı büyütmez. İlgili kaynak değişirse görsel inceleme ve checksum güncellenmeden yeniden üretim başarısız olur. Dosya adları gerçek çıktı checksum'unu içerir.
- `_data/tradition-covers.json`: kullanılan boyutlar, dosya baytları, checksum'lar ve kırpım işlemi. Zemin üzerinde tam disk olarak gösterilen Zeme fotoğrafı dışında 16:9 kırpım kullanılır.
- Yeni kaynak kredileri `_includes/tradition-photo-credits.html` içinde `/pilsetas-un-fotografijas/#tradiciju-fotografijas` bölümünde gösterilir. Ortak `language` görseli mevcut kredi kaydına bağlanır.
- Yedi ek kaynak `_includes/day-photo-credits.html` içinde `/pilsetas-un-fotografijas/#dienu-fotografijas` bölümünde gösterilir. İndirilen kaynak kopyaları ve Commons yanıtları `docs/sources/day-photos-2026-11-11/` içindedir.

## Fotoğraflı konu başlıkları

`tradition_photo_heading_markup` bütün `occasion` ve `latvia_cultural` sayfalarında kullanılır. Fotoğraf üst öncelikle yüklenir; responsive kaynak seçimi için gerçek boyutları ve `srcset` bilgisi vardır. Metin ve fotoğraf ayrı alanlardadır. Dar ekranda fotoğraf üste geçer; uzun başlıklar küçülerek satıra bölünür. Her sayfada tek H1, tek konu fotoğrafı ve gerçek `#datumi` hedefine giden tek tarih düğmesi vardır. Gereksiz alt bölüm çizimi kaldırılmıştır. Paylaşım görseli ve alt metni aynı incelenmiş fotoğrafla eşleştirilir.

Fotoğraflar gelecek yılların etkinlik görüntüleri olarak sunulmaz. Yabancı ülkelerde çekilmiş tematik görsellerin yeri ve maskeli kış fotoğrafının belirli bir Mārtiņi etkinliği olmadığı açıklanır. Her kaynak kendi lisansını korur.

## Sayfa yüklemesi

`scripts/traditions_guide_components.rb`, ortak katalogdaki aynı tarih kurallarıyla 73 kartı başlangıç HTML'ine yazar. Fotoğraf dışındaki küçük filtre modeli sayfanın içindedir. `assets/traditions-guide.mjs` mevcut kartları filtreler; ortak isim/astronomi/planlayıcı kataloğunu veya diğer kategori modüllerini indirmez. Yıl, ay, tür, arama, tarih listesi ve ICS aynı tarih hesaplarını kullanır.

SVG içindeki kullanılmayan `<image>` öğeleri de istek oluşturabildiğinden, bu rehber ve 73 konu sayfasında kullanılmayan 12 ay simgesi `_plugins/tradition_icons.rb` ile sprite tanımlarından çıkarılır. Diğer sayfaların simgeleri ve mevcut çizim kaynak dosyaları korunur.

## Kontroller

- `node --test test/traditions-guide.test.mjs test/tradition-cards.test.mjs test/tradition-links.test.mjs test/tradition-photo-headers.test.mjs test/category-experience.test.mjs`
- Haftalık, aile, vardiya ve atvaļinājuma planlayıcı regresyon dosyaları da aynı yerel test çalıştırmasına dahil edilir.
- `ruby scripts/audit.rb`

Tarayıcı kontrolü gerçek sayfada ve 320/390/768/1440 piksel genişliğindeki aynı kaynaklı çerçevelerde yapılır. Lisans bağlantısı, boş sonuç, filtreli ICS, üst arama ve tek konu yazdırması ayrıca doğrulanır. Yerel ağ ölçümü, mobil saha performansı veya bir Lighthouse puanı olarak sunulmaz.

Son başlık düzenlemesi için 44 otomatik test ve 12 farklı sayfa/genişlik birleşimi doğrulandı. Bunlar insan editör veya bağımsız sertifikasyon iddiası değildir. Sonuçlar çalışma klasöründeki `reports/tradition-hero-photos-2026-11-11/` dizinindedir.
