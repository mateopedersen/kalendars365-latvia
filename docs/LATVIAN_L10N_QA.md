# Letonca tarih ve dil kontrolü

Kontrol tarihi: 22 Ekim 2026.

240 tarih ifadesi, dört yılın her ayı ve ayın 1, 2, 5, 10, 21. günleri için bağımsız Node/ICU lv-LV biçimlendiricisinin çıktısıyla karşılaştırıldı. Her tarih için hafta günü ayrıca karşılaştırıldı: 480 karşılaştırma geçti. Ayrıntı: L10N_DATE_SAMPLES.csv. ICU sürümü: 78.3; Unicode sürümü: 17.0; CLDR sürümü: 48.0.

Doğrulama kaynağı: https://unicode.org/cldr/charts/49/summary/lv.html ve https://unicode.org/cldr/charts/43/verify/dates/lv.html.

Düzeltilen hata: tek başına tarih etiketinde ilgi hali yerine yalın ay adı kullanıldı (2027. gada 1. janvāris). Cümle içinde tarih için ayrı locative biçim (janvārī), aylık sayfa başlığında genitive (janvāra kalendārs) korunuyor. Yeni Ay etiketi paket sözlüğündeki Jaunmēness olarak birleştirildi.

Bu test tarih biçimleri ve haftanın günleri içindir; sitenin tüm cümleleri, kişi adı çekimleri veya editoryal doğal dil kalitesini kanıtlamaz. Ana dili Letonca olan bağımsız bir editörün incelemesi yapılmadı. Bu nedenle uzman editör onayı varmış gibi sunulmamalıdır.
