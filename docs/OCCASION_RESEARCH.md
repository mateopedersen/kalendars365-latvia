# Letonya özel günleri ve fotoğraflar

Tamamlama ve kontrol: 10 Kasım 2026.

## Tam kapsam

48 makale hazırdır: mevcut 28 adres korunmuştur, eksik 20 resmi başlık için özgün Letonca metin yazılmıştır. Her kayıtta giriş, kaynaklı anlam/tarih/planlama notları, tarih kuralı, 2027–2030 tarihleri ve fotoğraf bulunur. Yeni makaleler mevcut sayfalarla aynı tarih tablosu yapısını kullanır.

Kanunun yıllık kapsamı 15 svētku tarih girdisi ve 33 atceres/atzīmējamās tarih girdisidir. Bunlara koşullu genel Dziesmu un deju svētku kapanış günü eklenir. Var olan ortak Lieldienas, Ziemassvētki ve iki Komunistiskā genocīda upuru piemiņas diena sayfası korunmuştur; her tarih yine ayrı veri girdisi olarak kapsanır. Böylece 44 yıllık resmi gün makalesi, bir koşullu festival makalesi ve mevcut üç astronomi makalesi toplam 48 eder.

Kanunda kalan 24.09.2018 Papa ziyareti ve 29.05.2023 hokey bronzu günü sadece `historicalNotes` içinde tek seferlik geçmiş tatil olarak tutulur; gelecek yılların takvimine eklenmez.

Ana kaynak: https://likumi.lv/ta/id/72608-par-svetku-atceres-un-atzimejamam-dienam

## Festival için gerçek doğrulama

XXVIII Vispārējie latviešu dziesmu un XVIII Deju svētki dönemi 30 Haziran–9 Temmuz 2028 olarak 14 Nisan 2026 tarihli208sayılı hükümet kararıyla belirlenmiştir. Kapanış günü9Temmuz2028 ve hafta sonu kuralından doğan10Temmuz2028 tatili mevcut veride korunur.2027ve diğer yıllar için festival tarihi uydurulmamıştır. Kesinleşmiş dönem, bütün konser ve bilet programının kesinleştiği anlamına gelmez.

https://likumi.lv/ta/id/367734-par-xxviii-visparejo-latviesu-dziesmu-un-xviiideju-svetku-norises-laiku

## İncelenen mevcut içerik ve onarımlar

28 mevcut makalenin gövdeleri okundu. Tarih/statü iddiaları güncel resmi kanuna göre kontrol edildi. Skolotāju diena5Ekim olarak doğrudur; eski ilk pazar kuralı geri getirilmemiştir.4Mayıs metnine1990deklarasyonundaki geçiş dönemi ve21Ağustos1991de facto tamamlanması ayrımı eklenmiştir.

Mevcut4Mayıs/18Kasım metinlerinin bağladığı `neatkaribas-atjaunosanas-deklaracijai-35/` Saeima adresi404döndüğü için Likumi.lv üzerindeki deklarasyonun gerçek özgün metniyle değiştirilmiştir. İlk durum `source-checks-initial.json` içinde saklanır. HTTP200dönmesi tek başına iddia doğrulaması olarak sunulmaz; tarih ve tarihçe notları okunan kanun ve ilgili kaynak açıklamalarından yazılmıştır. Native editör incelemesi yapıldığı iddia edilmemiştir.

## Gerçek fotoğraflar

48 makalede42farklı fotoğraf ve84yerelWebP bulunur. Toplam dosya boyutu8,422,722byte. Anne/baba/aile sayfaları aynı gerçek aile portresini; okulun iki günü aynı Olaines skolas fotoğrafını; iki tarih yazısı aynı müze fotoğrafını paylaşır. Her paylaşım gerçekten ilgili konuya dayanır. Hiçbir fotoğraf yapay olarak üretilmemiş, kolaj yapılmamış veya içine bina/insan eklenmemiştir.

Bütün42finalfotoğrafın gerçek pikselleri4kontak sayfası ve alternatif karşılaştırmasıyla incelendi. Līgo için23Haziran2014 tarihli gerçek pūdele yakma fotoğrafı seçildi. Dziesmu svētki için2008RigaMežaparks kitlesel koro fotoğrafı seçildi. Eiropas diena için9Mayıs2013Rigaetkinliğinin gerçek fotoğrafı kullanıldı; yabancı kent adları taşıyan yön levhası alternatifi elendi.

17fotoğraf ilgili günün/kültürel olayın gerçek arşiv görüntüsü;25fotoğraf portre, mekan, yiyecek veya ilgili çalışma hayatını gösteren tematik fotoğraftır. Tematik görüntüler `isIllustrative:true` ve açık Letonca `caption` taşır. Bir fotoğraf2027etkinliği, canlı görüntü veya kesin gelecek programı gibi sunulmaz. Aile portresinin ve Jāņu siers fotoğrafının çekildiği ülke kaynakta ayrıca doğrulanmadığından `locationCountry:null` tutulur; bunlar Letonya'da çekilmiş belirli bir etkinlik olarak etiketlenmez. Diğer40görsel Letonya yeri/etkinliğiyle kaynaklandırılmıştır.

Fotoğraf yazarı, lisans, lisans bağlantısı ve Commons kaynak sayfası korunmalıdır. CC BY-SA türevleri kaynakla aynı lisans kapsamında sunulmalıdır. İndirilenler çalışma için alınmış Commons küçük resimleridir; kaynak fotoğrafın tam çözünürlüklü orijinalleri indirildiği iddia edilmez. `originalUrl` tam kaynak adresini, `downloadedFrom` gerçek indirilen adresi gösterir. Piksel incelemesi gerçek indirilen kaynak/türev SHA-256 değerlerine bağlıdır.

## Entegrasyon

- `occasions.json`: doğrudan48kayıt listesi; mevcut `_data/occasions.json` yapısını genişletir.
- `occasions-content.json`: `articles`, `historicalNotes` ve kapsam bilgileri.
- `photos.json`:42fotoğraf ve atıf kaydı.
- `assets/occasions/`:84WebP, siteye aynı göreli klasörle kopyalanır.
- `verification.json`:49resmi tekrar/kural satırının48makaledeki karşılığı, dosya ve sağlama sonuçları.
- `photo-checksums.json`: yayımlanacak dosya SHA-256 kayıtları.
- `contact-sheets/`: gerçek piksel inceleme kanıtı.
- `primary-sources/` ve `source-checks.json`: kaynaklar ve erişim kaydı.

Ana repo dosyaları bu alt görevde değiştirilmemiştir. Kalan eksik makale, fotoğraf veya lisans kaydı yoktur. Ücretli servis kullanılmamıştır. Üretilen kamu metinlerinde Slovence/Slovenya referansı yoktur.
