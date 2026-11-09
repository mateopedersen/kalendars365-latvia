# Letonya şehir verisi ve gerçek fotoğraflar

Hazırlama ve görsel inceleme: 9 Kasım 2026.

## Kapsam

82 şehir/kasaba, 82 farklı şehir fotoğrafı ve 164 yerel WebP dosyası tamamlandı. Her şehir Europe/Riga saat dilimindedir. Koordinatlar Wikidata P625 şehir merkezi noktalarıdır; gözlemevi ölçüm noktaları değildir. Güneş saati uygulaması yaklaşık astronomik hesap açıklamasını korumalıdır.

Güncel toplamın 81 yerine 82 olması doğrulandı: Carnikava 22 Ağustos 2026 tarihinde şehir statüsü kazandı. Resmi Parlamento duyurusu ve güncel kanun eki bunu gösterir.

- https://saeima.lv/en/news/saeima-news/36055-saeima-approves-city-status-for-carnikava
- https://likumi.lv/ta/id/315654-administrativo-teritoriju-un-apdzivoto-vietu-likums
- https://en.wikipedia.org/wiki/List_of_cities_and_towns_in_Latvia

## Dosyalar

- `cities.json`: 82 şehir; ad/slug/koordinat/saat dilimi ve fotoğraf alt/yazar/lisans/kaynak verileri.
- `assets/cities/`: her şehir için 480 ve en çok 960 piksel genişliğinde yerel WebP.
- `photo-checksums.json`: yayımlanacak 164 dosyanın SHA-256 değerleri.
- `contact-sheets/01.jpg` … `06.jpg`: bütün fotoğrafların gerçek piksellerle incelendiği kanıt görselleri.
- `contact-sheets/replacements.jpg`: tek fotoğrafla değiştirilen Viesīte ve yatay fotoğrafla değiştirilen Rēzekne.
- `cache/`: Commons lisans metadatası, Wikidata kayıtları, Wikipedia sayfa özetleri ve resmi kaynak HTML'leri.
- `originals/`: işleme için indirilmiş Commons küçük resimleri. Bunlar kaynak fotoğrafın tam çözünürlüklü aslı değildir. `photo.originalUrl` tam kaynak adresini, `downloadedFrom` gerçekten indirilen adresi gösterir.

## Görsel inceleme

Bütün 82 final fotoğrafı ve dört alternatifin gerçek pikselleri görüldü. Kent/landmark tanımları ilgili Commons dosya metadatası ve şehir Wikidata P18 kaydıyla karşılaştırıldı. Viesīte'nin P18 kolajı kullanılmadı; şehrin karlı kültür sarayı fotoğrafı seçildi. Rēzekne'nin dikey kale kemeri yerine şehrin yatay hava fotoğrafı seçildi. Fotoğraflara yapay bina, gökyüzü veya şehir manzarası eklenmedi. Yalnız yeniden boyutlandırma ve WebP dönüşümü uygulandı.

Bunlar arşiv fotoğraflarıdır; canlı kamera veya o anki hava durumunu göstermez. Alt metinlerde mevcut görünen sahneye göre özel kısa açıklama yazıldı. Kaynak, lisans ve yazar bilgisi kullanıcıya erişilebilir fotoğraf lisansları sayfasında korunmalıdır. CC BY-SA görsellerinin türevleri aynı kaynak lisansıyla sunulmalıdır.

## Doğrulama

82 benzersiz slug, Letonya sınırları içinde 82 koordinat, 164 mevcut ve açılabilir WebP ve 82 tam atıf kaydı kontrol edildi. Lisanslar CC BY 3.0/4.0, CC BY-SA 2.0/3.0/3.0 DE/4.0, CC0 veya Public domain. Lisans URL'si olmayan public-domain kaydında Commons kamu malı açıklaması bağlandı; kaynak dosya sayfası ayrıca korunur.

Alūksne ve Salaspils'in seçilen kaynak görüntüleri 640 piksel, Auce'nin kaynağı 909 piksel genişliğindedir. Yapay büyütme yapılmadı; `srcset` gerçek dosya genişliğini bildirir. Dosya adındaki `-960` üst sınırı belirtir. Diğer kaynaklar 960 piksel türev üretimine uygundur. Final resim toplamı 16,278,914 byte.

Yayımlanmayı engelleyen eksik şehir, eksik fotoğraf veya lisansı belirsiz kayıt kalmadı. Ana depo dosyaları bu araştırma görevinde değiştirilmedi.
