# Kaynak ve erişilebilirlik incelemesi | 10 Kasım 2026

## Bu pakette fiilen tamamlanan kontroller

- 1.001 HTML sayfasında `lang=lv`, tek ana içerik alanı, tek H1, tüm img alt alanları ve benzersiz HTML kimlikleri: hata yok. `MARKUP_REVIEW_RESULTS.json`.
- 240 Letonca tarih ve 240 hafta günü karşılaştırması, bağımsız ICU/CLDR verisiyle geçti. Bu, tüm cümlelerin ana dili Letonca olan insan tarafından düzeltildiği anlamına gelmez.
- 34 ayrı sayfada axe-core 4.14.0 ile WCAG A/AA 2.0/2.1/2.2 etiketli otomatik kurallar: tespit edilen ihlal yok. Araç tarafından sonuçlandırılamayan kontroller raporda saklanır. `ACCESSIBILITY_BROWSER_RESULTS.json`.
- Aynı 34 sayfada 390×844 mobil genişlikte yatay sayfa taşması yok. `MOBILE_REVIEW_RESULTS.json`.
- Klavye kontrolü: Ay takviminde 28 Şubat 2028'den sağ okla 29 Şubat'a geçildi; odak ve seçili durum doğru kaldı. Aynı tarihte Rīga→Liepāja değişimi Ay doğuşunu 07:38→07:52 olarak güncelledi. Arama penceresi Escape ile kapandı ve odak açan düğmeye döndü.
- 12 USNO şehir/tarih yanıtı dosya ve SHA-256 ile saklandı. 198 ana faz olayı ayrıca karşılaştırıldı; toplam 268 kontrol. Örneklerde en büyük Güneş zamanı farkı 26 s, Ay doğuş/batışı farkı 31 s, aydınlanma farkı 0,48 yüzde puanı, ana faz farkı 78 s. Toleranslar Güneş 120 s, Ay doğuş/batışı 600 s, aydınlanma 2,5 yüzde puanı, faz anı 120 s. `ASTRONOMY_REFERENCE_RESULTS.json`.
- Altı gerçek NASA misyon fotoğrafı: özgün dosya ve site kopyası kontrol toplamları, kaynak sayfası, görev adı, açıklama ve NASA kullanım kuralları kaydedildi. 2026–2030 için beş farklı yıl kapağı; Ay/fazlar/Dünya-Ay simgeleri gerçek fotoğraf tabanlı SVG. Fotoğraflar NASA'ya aittir; bize özel çekim veya gelecekte çekilmiş gözlem gibi sunulmaz.
- LVĢMC gerçek istasyon gözlemleri ayrı API ve ayrı kart ile eklendi. 34 resmî istasyon koordinatı, en yakın uygun istasyon, azami 50 km, azami 3 saat, UTC→Europe/Riga, gerçek °C ve saatlik ortalama açıklaması. Kaynak CC0. Sıfır değer, negatif sıcaklık, eski/gelecek/boş veri, uzak istasyon ve servis hatası durumları test edildi.
- MET Norway tahmininden gerçek istasyon ölçümü ayrılır. Eski model ve geçerliliğini kaybetmiş zaman adımı reddedilir; 1/6 saatlik yağış biriktirme süresi gösterilir. Bu kart radar değildir. Toplam 24 hava-verisi kontrolü.
- Gizlilik/çerez açıklamaları ayrı sayfalardadır. Takvim notları, etkinlikler ve kullanıcı fotoğrafları istemcide kalır; hava API'lerine yalnızca seçili şehir kodu gider. GPS istenmez. Kaynak dosyalar, güvenlik başlıkları, yerel saklama ve dış istek akışı kontrol edildi. Cloudflare teknik istek verisi ile e-posta iletişimi, kişisel takvim içeriğinden ayrı belirtilir.

## Bağımsız insan onayı durumu

Bu çalışma teknik, editoryal ve birincil kaynak karşılaştırmasıdır. Ana dili Letonca olan bağımsız bir insan editör, avukat, astronom/meteorolog veya yetkili erişilebilirlik denetçisi bu paketi imzalamadı. Bu kişilerin kimliğini veya onayını üretmek, otomatik testi sertifika diye adlandırmak doğru olmaz.

İnsan editör için 5.609 farklı statik metin bloğu, örnek URL ve inceleme durumu ile raporun yanındaki `letonca-editor-inceleme.tsv` dosyasına çıkarıldı. Dinamik arayüzün kaynak metinleri ayrıca assets/scripts ve veri dosyalarındadır. TSV, insan incelemesinin tamamlandığına dair kayıt değildir.

W3C, otomatik araçların tek başına erişilebilirlik uygunluğunu belirleyemediğini açıklar. Bağımsız hukuk görüşü, bilimsel uzman imzası ve WCAG uygunluk değerlendirmesi dışarıdan gerçek bir yetkin kişi/kuruluşun çalışmasını gerektirir. Bu oturumda bu hizmet satın alınmadı veya üçüncü kişilere mesaj gönderilmedi.

## Birincil kaynaklar

- USNO API: https://aa.usno.navy.mil/data/api.html
- LVĢMC gözlemleri ve CC0: https://data.gov.lv/dati/dataset/hidrometeorologiskie-noverojumi
- NASA fotoğraf kullanımı: https://www.nasa.gov/nasa-brand-center/images-and-media/
- W3C erişilebilirlik değerlendirmesi: https://www.w3.org/WAI/test-evaluate/
- Letonya DVI çerez ve gizlilik rehberi: https://www.dvi.gov.lv/lv/sikdatnes-un-privatuma-politika
- Unicode CLDR Letonca: https://unicode.org/cldr/charts/49/summary/lv.html
