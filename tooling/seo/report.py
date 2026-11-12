"""Assemble private Turkish evidence reports from completed local checks. No network or publication."""
from pathlib import Path
import argparse,collections,csv,hashlib,html,json,re,shutil,statistics,tarfile
from urllib.parse import unquote
ROOT=Path(__file__).resolve().parents[2]

def read_json(path):return json.loads(Path(path).read_text())
def write_json(path,data):Path(path).write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
def csv_write(path,rows):
 keys=list(dict.fromkeys(k for row in rows for k in row))
 with Path(path).open('w',newline='') as f:
  writer=csv.DictWriter(f,fieldnames=keys);writer.writeheader();writer.writerows(rows)
def md_table(headers,rows):
 clean=lambda v:str(v).replace('|',' / ').replace('\n',' ')
 return '| '+' | '.join(headers)+' |\n| '+' | '.join(['---']*len(headers))+' |\n'+'\n'.join('| '+' | '.join(clean(v) for v in row)+' |' for row in rows)
def percentile_summary(rows):
 groups=collections.defaultdict(list)
 for row in rows:groups[(row['profile'],row['path'])].append(row)
 result=[]
 for (profile,url),samples in sorted(groups.items()):
  lcp=[s['metrics']['lcp'] for s in samples];cls=[s['metrics']['cls'] for s in samples]
  result.append({'profile':profile,'url':url,'runs':len(samples),'medianLcpMs':statistics.median(lcp),'minLcpMs':min(lcp),'maxLcpMs':max(lcp),'maxCls':max(cls),'longTaskCounts':[s['metrics']['longTasks'] for s in samples]})
 return result

def intent_info(route):
 f,u=route['family'],route['url']
 tasks={
 'year':('Yılın tamamını görmek','12 aylık gün ve ISO hafta düzeni','Tam yılın karşılaştırılabilir HTML tablosu; baskı koleksiyonuyla aynı görev değildir.'),
 'calendar_month':('Belirli ayı incelemek ve planlamak','Gün seçimi, o ayın tatilleri, kişisel notlar','URL yıl ve ayıyla eşleşen HTML takvim ve ilgili indirmeler.'),
 'month_index':('Bir yılın ayını seçmek','12 aya doğrudan erişim','Ay seçimi yapan yıl dizini.'),
 'print_index':('Belirli yıl için baskı tasarımı indirmek','PDF, Attēls, yön ve tasarım','Yıllık takvimin okuma görünümünden farklı olarak dosya seçimine odaklanır.'),
 'print_month':('Belirli ayın baskı tasarımını indirmek','Ay ve tasarım eşleşmesi, PDF ve Attēls','Tek ayın indirilebilir koleksiyonu; sayfa bir filtre kombinasyonu değildir.'),
 'holiday_year':('Yılın resmî tatillerini bulmak','Tarih, izin statüsü, ay bağlantıları','Yıl bazında tatil günleri; anma günleriyle aynı statüde sunulmaz.'),
 'holiday_month':('Ayın resmî tatillerini bulmak','O ayın tarihleri ve kaynakları','Yıl ve ay kapsamına bağlı tatil listesi.'),
 'memorial_year':('Anma ve kutlama günlerini görmek','Anma statüsü, tatille farkı','Bir anma gününün otomatik izin günü olmadığı açıklanır.'),
 'work_year':('Yıllık iş günü hesabını kontrol etmek','Aylık toplamlar, varsayımlar','Beş günlük hafta ve kaynakta kayıtlı tatiller; gelecekteki kararlar tahmin edilmez.'),
 'work_month':('Aylık iş günü hesabını kontrol etmek','Tarih aralığı ve tatil istisnaları','Yıl ve aya özel hesap; bordro/hukuk garantisi değildir.'),
 'lunar_year':('Yıllık Ay döngüsünü incelemek','Faz anları, ay seçimi, baskılar','Görsel Ay takvimi; bahçecilik geleneğinden ayrı astronomi görevi.'),
 'lunar_month':('Ayın günlük Ay görünümünü incelemek','Günlük aydınlanma, kesin faz anları','Ay/yıl verisi, şehir seçimi ve dört baskı tasarımı.'),
 'sun_city':('Seçili şehirde Güneş saatini hesaplamak','Gün doğumu, batımı, gün uzunluğu','Şehrin koordinatları sonuçları değiştirir; mevcut şehir landing korunur.'),
 'moon_city':('Seçili şehirde Ay saatini hesaplamak','Ay doğuşu, batışı, ufuk koşulları','Ayrı konum verisi; bütün şehirler ana sayfaya canonical edilmez.'),
 'name_calendar':('İsim günü takvimini incelemek','VVC geleneksel ve genişletilmiş liste ayrımı','Resmî kalendārvārdu kaynağı; kişinin etnik kimliği hakkında iddia değildir.'),
 'name_day_month':('Ayın isim gününü bulmak','Gün, ad ve liste türü','Aylık resmî liste; kişisel arama sorgusu ayrı bir sayfa oluşturmaz.'),
 'iso_week':('Belirli ISO haftayı planlamak','Haftanın yedi günü, hafta yılı sınırı','209 mevcut hafta adresi; 2031/01, 2030 yılından gün içerdiği için korunur.'),
 'week_index':('Yıldan bir ISO hafta seçmek','Hafta başlangıcı ve bitişi','Yıl/hafta dizini.'),
 'school_academic':('Yayımlanmış öğretim yılı tatillerini bulmak','Sınıf, dönem ve kaynak statüsü','Yayımlanmayan dönemlerde tarih uydurulmaz.'),
 'school_year_calendar':('Bir takvim yılındaki okul tatillerini görmek','Birden çok öğretim yılıyla sınır ilişkisi','Takvim yılı ile öğretim yılı farklı kapsamlar olarak korunur.'),
 'blog_article':('Konu hakkında rehber okumak','Makaleye özgü açıklama, kaynak ve araç bağlantıları','Mevcut özgün makale; araç landing sayfasının kopyası değildir.'),
 'blog_index':('İlgili rehberi seçmek','20 yazı, konu filtresi','Makale keşfi; anahtar kelime varyasyonu için yeni içerik açılmadı.'),
 'horoscope':('Burca özel günlük eğlence içeriğini okumak','Burç ve yükselen hesaplama aracı','Sembolik eğlence içeriği bilimsel tahmin gibi doğrulanmaz.'),
 'garden':('Letonya koşullarında bahçe planlamak','Bitki, sezon, yetiştirme varsayımları','Tarımsal koşullar ve geleneksel Ay yorumları ayrı değerlendirilir.'),
 'garden_month':('Aylık ekim ve dikim işlerini görmek','Mevsim, bitki ve don riski','Letonya ayına bağlı bakım ve dikim görevi.'),
 'long_weekends':('Yıl için izin ve uzun tatil planlamak','Bütçe, izin günleri, tatil dayanağı','Varsayımları belirtilmiş planlama; işveren kararı yerine geçmez.'),
 'occasion':('Özel gün hakkında bilgi bulmak','Tarih, gelenek ve kaynak','Konuya özgü mevcut açıklama; resmî izin statüsü ayrıca gösterilir.'),
 'latvia_cultural':('Letonya geleneğini öğrenmek','Tarih ve kültürel bağlam','Konuya özgü yerel kültür içeriği.'),
 'latvia_special':('Takvimle ilgili özel bilgi veya araç kullanmak','Sayfa başlığına özgü açıklama','Mevcut URL korunur; otomatik yeni keyword sayfası açılmaz.'),
 'sky_hub':('Güneş ve Ay aracını seçmek','Astronomik hesapların ayrımı','Gözlem/hesap görevi ile eğlence içeriği ayrıdır.'),
 'city_photos':('Görsel kaynağını ve lisansını kontrol etmek','Fotoğraf, hak sahibi ve kaynak bağlantısı','Faydalı lisans kaydı; sahibi isteğiyle HTML noindex,follow.'),
 'error_document':('Bozuk adresten doğru içeriğe ulaşmak','Arama ve öneriler','Hata belgesi; sitemap ve indeks kapsamı dışında.')}
 hubs={
 '/':('Günü görmek ve uygun araca geçmek','Güncel takvim, şehir, hava durumu','Saat/API başarısına bağlı olmadan okunabilir takvim.'),
 '/kalendars/':('Yıl ve ay seçmek','2027–2030 yıl kartları ve 48 ay','Sahibi isteğiyle yinelenen 48 ay tanıtım bandı kaldırıldı; 48 bağlantı korundu.'),
 '/pdf-kalendari/':('Baskı dosyası bulmak','Yıl, ay, yön ve tasarım filtresi','İndirme niyeti; yıllık HTML görünümüyle birleştirilmez.'),
 '/izveidot-kalendaru/':('Kişisel takvim oluşturmak','Fotoğraf, etkinlik, renk ve dışa aktarma','Kullanıcının özel dosyaları tarayıcıda üretilir; kişisel taslak indekslenmez.'),
 '/varda-dienas/':('İsim günü aramak','VVC liste türleri, ay ve ad filtresi','İlk HTML’de 60 ad ve aylık liste; arama JS ile geliştirilir.'),
 '/skolas-brivlaiki/':('Okul ve üniversite takvimini bulmak','Sınıf, öğretim yılı ve yayımlanma durumu','Resmî okul verisi ve kurum bazlı akademik takvimler.'),
 '/datumu-kalkulators/':('İki tarih arasını hesaplamak','Gün farkı, tarih ekleme/çıkarma','Etkileşimli hesap; query içinde her örnek anahtarın desteklendiği varsayılmaz.'),
 '/darba-dienu-kalendars/':('İş günlerini görmek','Yıl, ay, tatil ve varsayımlar','Takvim görünümü ile hesap sonuçları.'),
 '/atvalinajuma-planotajs/':('İzin bütçesiyle plan oluşturmak','Aralık, bütçe ve uygun dönem','Kişisel planlama verisi genel cache ve ölçüme taşınmaz.'),
 '/gimenes-kalendars/':('Aile planı hazırlamak','Üye sütunları, notlar, baskı','Kişisel aile planı; haftalık genel görünümden farklı görev.'),
 '/mainu-grafiks/':('Vardiya döngüsü planlamak','Döngü, tarih ve değişiklikler','İşveren kararı yerine geçmeyen kişisel vardiya aracı.'),
 '/stundu-saraksts/':('Ders programı hazırlamak','Gün, saat, ders ve baskı','Okul tatili listesiyle aynı içerik değildir.'),
 '/nedelas-kalendars/':('Haftalık plan oluşturmak','ISO hafta, notlar ve baskı','Hafta görevi; aylık tasarımlardan farklı alan düzeni.'),
 '/saullekts-saulriets/':('Şehre göre Güneş saatini bulmak','Tarih, şehir, ufuk ve yıl grafiği','Koordinata bağlı astronomi aracı.'),
 '/meness-kalendars/':('Yıl ve ay bazında Ay takvimini seçmek','48 ay, aydınlanma, baskılar','Gerçek tarih hesaplarıyla günlük Ay görünümü.'),
 '/meness-fazes/':('Kesin Ay fazı anını bulmak','Faz, tarih, UTC ve Riga zamanı','Günlük Ay çiziminden farklı olarak faz anlarına odaklanır.'),
 '/gadalaiki/':('Mevsim başlangıcını öğrenmek','Astronomik ve takvimsel ayrım','Meteorolojik geleceğin sabit tarih gibi uydurulmaması.'),
 '/horoskops/':('Burcunu seçmek ve günlük yorumu okumak','12 burç, güncel içerik ve yükselen aracı','Eğlence içeriği astronomik kesinlik iddiasına dönüştürülmez.'),
 '/meklesana/':('Site içinde içerik bulmak','Arama önerileri ve ilgili sonuçlar','Genel arama landing sayfası; her q ayrı indeks sayfası değildir.'),
 '/visi-riki/':('Kullanıcı görevine uygun araç seçmek','Araç kategorileri ve açıklamalar','Mevcut araç rehberi.'),
 '/par-projektu/':('Projeyi ve bildirilen sahibini tanımak','Silvis Balodis, amaç ve hizmetler','Yeni uzmanlık veya kurum ilişkisi uydurulmadı.'),
 '/avoti-un-metodika/':('Veri kaynaklarını kontrol etmek','Tarih, astronomi ve belirsizlik','Mevcut metodoloji ve kaynak düzeni korunur.'),
 '/kontakti/':('İletişim kurmak','Mevcut e-posta ve düzeltme kanalı','Resmî adres sahibi isteğiyle boş; hukuk uygunluğu tamamlandı denmez.')}
 if u in hubs:return hubs[u]
 if f in tasks:return tasks[f]
 if u in ['/privatuma-politika/','/sikdatnu-politika/','/lietošanas-noteikumi/','/pieklustamiba/','/biezak-uzdotie-jautajumi/','/labojumi/']:
  return ('Kullanım ve güven bilgisini kontrol etmek',route['title'],'Mevcut güven sayfası; tarih aracı veya makale gibi işaretlenmez.')
 return ('Sayfanın sunduğu takvim bilgisini kullanmak',route.get('title',''),'Mevcut kapsam korunur; ayrı arama hacmi veya sıra iddiası yok.')

SOURCES=[
 ('G01','Google Search Central','https://developers.google.com/search/docs/crawling-indexing/canonicalization','Canonical tercih sinyali; adres birleştirme kararı.','Resmî belge okundu; Google’ın bu site için seçtiği canonical görülmedi.'),
 ('G02','Google Search Central','https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls','Canonical yöntemlerinin kapsamı ve non-HTML yaklaşımı.','Resmî belge; bütün PDF’lere kör canonical eklenmedi.'),
 ('G03','Google Search Central','https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics','Ham HTML ve JavaScript render ayrımı.','Resmî belge; ilk HTML ve tarayıcı DOM ayrı ölçüldü.'),
 ('G04','Google Search Central','https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap','Sitemap seçimi ve anlamlı lastmod.','Resmî belge; sitemap gönderilmedi.'),
 ('G05','Google Search Central','https://developers.google.com/search/docs/appearance/google-images','Tarayıcıya açık img, alt ve görsel keşfi.','Resmî belge; gerçek Google görsel indeks sonucu ölçülmedi.'),
 ('G06','Google Search Central','https://developers.google.com/search/docs/appearance/structured-data/sd-policies','Görünür içerik ve yapılandırılmış veri tutarlılığı.','Resmî belge; Rich Results Test localhost üzerinde çalıştırılmadı.'),
 ('G07','Google Search Central','https://developers.google.com/search/docs/appearance/structured-data/article','Makale, yazar ve tarih alanları.','Resmî belge; yalnızca mevcut 20 gerçek makale BlogPosting.'),
 ('G08','web.dev','https://web.dev/articles/vitals','LCP, INP ve CLS ayrımı.','Resmî performans kaynağı; yerel örnekler saha CWV değildir.'),
 ('G09','web.dev','https://web.dev/articles/defining-core-web-vitals-thresholds','CWV eşikleri ve gerçek kullanıcı değerlendirmesi.','Resmî belge; INP veya saha 75. yüzdelik ölçülmedi.'),
 ('C01','Cloudflare','https://developers.cloudflare.com/pages/configuration/headers/','Statik başlıklar ve Functions sınırı.','Resmî belge; CDN ayarına yazılmadı.'),
 ('C02','Cloudflare','https://developers.cloudflare.com/pages/configuration/redirects/','Redirect dosyası, zincir ve alan adı kapsamı.','Resmî belge; yeni yönlendirme mimarisi kurulmadı.'),
 ('C03','Cloudflare','https://developers.cloudflare.com/pages/configuration/serving-pages/','index.html normalizasyonu ve statik servis.','Resmî belge ve sınırlı salt okunur canlı HEAD kontrolü.'),
 ('LV01','Valsts valodas centrs','https://www.vvc.gov.lv/lv/kalendarvardu-ekspertu-komisija','Geleneksel ve genişletilmiş takvim adı listeleri.','Kaynak sayfası okundu; etnik köken veya ana dili editör incelemesi iddiası değildir.'),
 ('LV02','Latvijas Atvērto datu portāls','https://data.gov.lv/dati/lv/dataset/latviesu-tradicionalais-un-paplasinatais-kalendarvardu-saraksts','VVC veri setinin kaynağı ve lisansı.','Resmî katalog; katalog tarihi ile güncel VVC liste tarihi birbirine karıştırılmadı.'),
 ('LV03','Izglītības un zinātnes ministrija','https://www.izm.gov.lv/lv/jaunums/apstiprinati-20262027-macibu-gada-sakuma-beigu-un-brivdienu-laiki','2026/2027 için yayımlanmış okul yılı ve tatiller.','Resmî duyuru okundu; yayımlanmamış sonraki yıllar kesinleştirilmedi.'),
 ('LV04','Likumi.lv','https://likumi.lv/ta/id/72608-par-svetku-atceres-un-atzimejamam-dienam','Tatil, anma ve kutlama günü ayrımı.','Bu oturumda güncel tam konsolide metin yeniden doğrulanamadı; depodaki kaynak sürümü korunur.'),
 ('R01','OpenSSL','https://openssl-library.org/source/','Yerel sabit Ruby doğrulaması için eksik bağımlılık.','Yalnızca resmî arşiv, yayımlanmış SHA-256 kontrolü ve proje içi kurulum.'),
 ('R02','LibYAML','https://pyyaml.org/wiki/LibYAML','Yerel Psych bağımlılığı.','Resmî kaynak arşivi; sistem genelinde kurulum yapılmadı.')]

RESEARCH=[
 ('kalendārs 2027','https://ekalendars.lv/year/2027','Yılın tamamını görmek','/kalendars/2027/'),
 ('2027. gada kalendārs','https://ekalendars.lv/year/2027','Yıl düzeni ve tarihler','/kalendars/2027/'),
 ('2027. gada janvāra kalendārs','https://calpdf.com/lv/','Belirli ayın görünümü veya indirmesi','/kalendars/2027/janvaris/'),
 ('kalendārs 2027 ar svētku dienām','https://ekalendars.lv/year/2027','Yıl üzerinde tatil konumları','/kalendars/2027/'),
 ('drukājams kalendārs 2027','https://calpdf.com/lv/','Baskı dosyası seçimi','/pdf-kalendari/2027/'),
 ('darba dienas 2027','https://darbadienas.lv/darba-dienu-kalendars-2027','İş günü ve saat hesabı','/darba-dienu-kalendars/2027/'),
 ('vārda dienas','https://www.vvc.gov.lv/lv/kalendarvardu-ekspertu-komisija','Adı ve tarihini bulmak','/varda-dienas/'),
 ('skolas brīvlaiki','https://www.izm.gov.lv/lv/jaunums/apstiprinati-20262027-macibu-gada-sakuma-beigu-un-brivdienu-laiki','Yayımlanmış okul dönemi ve tatilleri','/skolas-brivlaiki/'),
 ('mēness kalendārs','https://www.menesseja.lv/kalendars/2027/janvaris','Ay görünümü ile geleneksel bahçe niyetlerinin ayrımı','/meness-kalendars/')]

def main(evidence):
 report=Path(evidence).resolve();dest=ROOT/'docs/seo';dest.mkdir(parents=True,exist_ok=True);ev=dest/'evidence';ev.mkdir(exist_ok=True)
 before=read_json(report/'baseline/summary.json');after=read_json(report/'after/summary.json');inventory=read_json(report/'after/inventory.json');routes=read_json(ROOT/'docs/route-manifest.json');registry={r['url']:r for r in routes}
 for phase in ['baseline','after']:
  samples=[json.loads(s) for s in (report/phase/'performance.jsonl').read_text().splitlines()];write_json(ev/(phase+'-performance.json'),percentile_summary(samples))
 bperf={(r['profile'],r['url']):r for r in read_json(ev/'baseline-performance.json')};aperf={(r['profile'],r['url']):r for r in read_json(ev/'after-performance.json')}
 performance=[]
 for key,b in bperf.items():
  a=aperf[key];performance.append({'profile':key[0],'url':key[1],'beforeMedianMs':b['medianLcpMs'],'beforeRangeMs':[b['minLcpMs'],b['maxLcpMs']],'afterMedianMs':a['medianLcpMs'],'afterRangeMs':[a['minLcpMs'],a['maxLcpMs']],'changePercent':round((a['medianLcpMs']/b['medianLcpMs']-1)*100,2),'afterMaxCls':a['maxCls'],'beforeLongTaskCounts':b['longTaskCounts'],'afterLongTaskCounts':a['longTaskCounts']})
 write_json(ev/'performance-comparison.json',performance)
 # Every built URL is mapped, including explicit nonindexable documents.
 intents=[];policies=[]
 for row in inventory:
  record=registry.get(row['url'],row);task,support,value=intent_info(record)
  intents.append({'url':row['url'],'family':row['family'],'title':row['title'],'primaryIntentContract':record.get('primaryIntent','recover-navigation'),'primaryUserTaskTR':task,'supportingTopicsTR':support,'distinctiveValueTR':value,'canonical':row['canonical'],'classification':'DOĞRULANDI: yerel içerik; OLASI: sorgu eşleşmesi','searchVolume':'DOĞRULANAMADI','difficulty':'DOĞRULANAMADI','gscEvidence':'Yok; yetkili dışa aktarım verilmedi','newPageProposed':False})
  policies.append({'scope':row['url'],'class':'error-document' if row['family']=='error_document' else 'license-document' if row['family']=='city_photos' else 'public-landing','canonical':row['canonical'],'index':'noindex' if 'noindex' in row['robots'] else 'index','follow':'follow','sitemap':row['sitemap'],'httpStatus':row['httpStatus'],'xRobotsTag':row['xRobotsTag'],'parameterPolicy':'_data/seo-parameters.json','imageIndexing':'allow; no noimageindex','reason':'Mevcut tekil landing korunur; hata ve lisans belgesi hariç indekslenebilir.'})
 for rule in read_json(ROOT/'_data/seo-parameters.json')['rules']:
  policies.append({'scope':'?'+','.join(rule['parameters']),'class':rule['class'],'canonical':rule['canonical'],'index':'Mevcut landing kararı; ayrı sitemap girdisi yok','follow':'follow','sitemap':False,'httpStatus':'200 for existing landing; unknown path 404','reason':rule['reason']})
 for scope,kind,reason in [('/downloads/**/*.pdf','public-print-document','Mevcut bağımsız baskı belgeleri taranabilir. Her belge ana sayfaya canonical edilmedi; kişisel çıktı sunucuda tutulmaz.'),('/downloads/**/*.webp','public-print-image','Kayıpsız korunan indirilebilir görüntüler; önizlemeden ayrı dosyalar.'),('/assets/**','public-image-or-code','Gerekli CSS, JS ve görseller robots ile engellenmez.'),('/api/*','api-response','Functions kaynakta noindex; konum API private/no-store, diğer cache süreleri kendi veri sıklığına bağlı.'),('browser-generated blobs','personal-file','Kişisel takvim dosyaları public route/sitemap değildir; analytics aktarımı yok.')]:
  policies.append({'scope':scope,'class':kind,'canonical':'none (document identity retained)' if kind.startswith('public') else 'not applicable','index':'allow' if kind.startswith('public') else 'noindex / not public','follow':'not applicable','sitemap':'Image sitemap where eligible' if kind=='public-print-image' else False,'httpStatus':'type/signatures and representative local download verified','reason':reason})
 csv_write(dest/'SEARCH-INTENT-MAP.csv',intents);csv_write(dest/'INDEXATION-POLICY.csv',policies);shutil.copy2(report/'after/URL-INVENTORY.csv',dest/'URL-INVENTORY.csv');shutil.copy2(report/'artifacts/DOWNLOAD-MANIFEST.csv',dest/'DOWNLOAD-MANIFEST.csv')
 csv_write(dest/'SEARCH-RESEARCH.csv',[{'query':q,'source':url,'observedTask':task,'existingTarget':target,'checkedOn':'2026-11-12','scope':'Arama aracı sonuçları ve sayfa içeriği; Google.lv kontrollü konumlu SERP veya hacim verisi değildir.','classification':'OLASI: niyet çıkarımı; hacim DOĞRULANAMADI'} for q,url,task,target in RESEARCH])
 copy_pairs=[('baseline/summary.json','baseline-summary.json'),('after/summary.json','after-summary.json'),('validation/seo-gate.json','seo-gate.json'),('validation/dates.json','dates-independent.json'),('artifacts/downloads-validation.json','downloads-validation.json'),('preservation-validation.json','preservation-validation.json'),('final-build-validation.json','final-build-validation.json'),('baseline/corrected/parser-correction.json','baseline-parser-correction.json'),('after/no-javascript.json','no-javascript.json'),('after/parameter-matrix.json','parameter-matrix.json'),('after/latvian-filter-parameters.json','latvian-filter-parameters.json'),('after/print-validation.json','print-validation.json'),('after/browser-download-validation.json','browser-download-validation.json'),('after/api-unavailable.json','api-unavailable.json'),('host-read-only.json','host-read-only.json'),('live-read-only.json','live-read-only.json')]
 for src,target in copy_pairs:shutil.copy2(report/src,ev/target)
 runtime=read_json(report/'runtime-validation.json') if (report/'runtime-validation.json').exists() else {'pinnedVerified':False,'actualInitial':'Ruby 2.6.10 / Jekyll 4.2.2','configured':'Ruby 4.0.9 / Jekyll 4.4.1 / Bundler 4.0.20','limitation':'Sabit sürümün eksik yerel bağımlılıkları henüz doğrulanmadı.'}
 write_json(ev/'runtime-validation.json',runtime)
 all_dom={phase:[json.loads(s) for s in (report/phase/'dom.jsonl').read_text().splitlines()] for phase in ['baseline','after','narrow']}
 mismatches=[]
 for row in all_dom['after']:
  raw=next(r for r in inventory if r['url']==row['path'])
  for name in ['title','description','canonical','robots','lang']:
   if (unquote(row.get(name,'')) if name=='canonical' else row.get(name))!=(unquote(raw.get(name,'')) if name=='canonical' else raw.get(name)):mismatches.append({'url':row['path'],'width':row['width'],'field':name,'raw':raw.get(name),'dom':row.get(name)})
 dom_summary={'beforeChecks':len(all_dom['baseline']),'afterChecks':len(all_dom['after']),'narrowChecks':len(all_dom['narrow']),'representativeUrls':len(set(r['path'] for r in all_dom['after'])),'horizontalOverflow':sum(r['documentWidth']>r['width']+1 for phase in ['after','narrow'] for r in all_dom[phase]),'metadataMismatches':mismatches,'method':'Rendered DOM samples; not all 901 pages visually inspected in a browser.'};assert not mismatches,mismatches;write_json(ev/'dom-summary.json',dom_summary)
 image_out=dest/'images';image_out.mkdir(exist_ok=True)
 for src,target in [('baseline/mobile.png','before-mobile.png'),('after/mobile.png','after-mobile.png'),('after/calendar-hub-banner-removed.jpg','calendar-hub-banner-removed.jpg'),('after/print-february-2028.png','print-february-2028.png'),('after/print-home.png','print-home.png')]:shutil.copy2(report/src,image_out/target)
 savings=before['htmlBytes']-after['htmlBytes'];reduction=round(savings/before['htmlBytes']*100,2)
 perf_md=md_table(['Profil / URL','Önce medyan (min–maks) ms','Sonra medyan (min–maks) ms','Değişim','Sonra en büyük CLS'],[(r['profile']+' '+r['url'],str(r['beforeMedianMs'])+' ('+'–'.join(map(str,r['beforeRangeMs']))+')',str(r['afterMedianMs'])+' ('+'–'.join(map(str,r['afterRangeMs']))+')',str(r['changePercent'])+'%',round(r['afterMaxCls'],5)) for r in performance])
 family_md=md_table(['Sayfa ailesi','HTML sayısı'],sorted(after['families'].items()))
 status_runtime='DOĞRULANDI: '+runtime.get('actualPinned','') if runtime.get('pinnedVerified') else 'DOĞRULANAMADI: birebir sabit üretim sürümü; ilk yerel doğrulama eski Jekyll ile yapıldı.'
 # File manifests are deliberately limited to the baseline archive's scope and known new SEO source files.
 changes=[];baseline_hashes={}
 with tarfile.open(report/'baseline/source-before.tar.gz') as archive:
  for member in archive.getmembers():
   if not member.isfile():continue
   old=archive.extractfile(member).read();old_sha=hashlib.sha256(old).hexdigest();baseline_hashes[member.name]=old_sha;current=ROOT/member.name
   new_sha=hashlib.sha256(current.read_bytes()).hexdigest() if current.is_file() else ''
   if new_sha!=old_sha:
    kind='source-change'
    if current.is_file() and current.suffix=='.json':
     try:
      if json.loads(old)==json.loads(current.read_bytes()):kind='format-only; JSON values unchanged'
     except (ValueError,UnicodeError):pass
    changes.append({'path':member.name,'status':'modified' if new_sha else 'deleted','classification':kind,'beforeSha256':old_sha,'afterSha256':new_sha,'rollbackSource':'private baseline/source-before.tar.gz; restore this path only after checksum/concurrency check'})
 new_candidates=[p for p in (ROOT/'tooling/seo').rglob('*') if p.is_file() and '__pycache__' not in p.parts]+[ROOT/p for p in ['lib/seo_contract.rb','_plugins/seo_contract.rb','_data/seo-parameters.json','_data/seo-contract.json','_data/calendar-ssr.json','scripts/render_calendar_snapshot.cjs','test/seo-contract.test.mjs']]
 for p in new_candidates:
  rel=p.relative_to(ROOT).as_posix()
  if rel not in baseline_hashes and p.is_file():changes.append({'path':rel,'status':'new','beforeSha256':'','afterSha256':hashlib.sha256(p.read_bytes()).hexdigest(),'rollbackSource':'remove only this task-created path after checking it still matches this afterSha256'})
 csv_write(dest/'CHANGESET.csv',sorted(changes,key=lambda r:r['path']))
 write_json(ev/'delivery-summary.json',{'htmlPages':after['html'],'registeredRoutes':after['manifest'],'indexable':after['sitemap'],'schemaGraphs':901,'imagesInSitemap':4601,'sourceHtmlBytesBefore':before['htmlBytes'],'sourceHtmlBytesAfter':after['htmlBytes'],'htmlBytesSaved':savings,'htmlReductionPercent':reduction,'calendarSnapshots':262,'tests':300,'independentDateAssertions':3307,'verifiedArtifactFiles':3459,'publicationPerformed':False,'pinnedRuntimeVerified':runtime.get('pinnedVerified',False),'classification':'Local evidence; no ranking or field-CWV guarantee'})
 generate_documents(dest,report,before,after,performance,perf_md,family_md,status_runtime,runtime,changes,savings,reduction,dom_summary)
 # Deliver a standalone local report tree as well as repository-excluded documentation.
 for p in dest.iterdir():
  if p.is_file():shutil.copy2(p,report/p.name)
 for folder in ['images','evidence']:shutil.copytree(dest/folder,report/folder,dirs_exist_ok=True)
 print(json.dumps({'reports':str(dest),'pages':len(inventory),'intentRows':len(intents),'policyRows':len(policies),'changes':len(changes),'metadataDomMismatches':len(mismatches),'publicationPerformed':False},ensure_ascii=False))

def generate_documents(dest,report,before,after,performance,perf_md,family_md,status_runtime,runtime,changes,savings,reduction,dom_summary):
 def doc(name,text):(dest/name).write_text(text.strip()+'\n')
 runtime_note=('Sabit Ruby/Jekyll/Bundler sürümleriyle ek derleme ve test doğrulaması yapıldı. Ayrıntı: evidence/runtime-validation.json.' if runtime.get('pinnedVerified') else 'Sabit üretim sürümünün yerel doğrulaması henüz tamamlanmadı; bu durum yayın öncesi açık kontroldür. Eski yerel Jekyll ile geçen kontroller, sabit sürümden geçmiş gibi raporlanmaz.')
 findings=[
 ('P0','DOĞRULANDI','Yayın sınırı korundu','Uzak yazma, push, PR, CI, DNS, cache, sitemap gönderimi yapılmadı.','Yerel başlangıç kaydı, publicationPerformed:false; canlıya yalnızca kaydedilmiş 9 düşük hacimli salt okunur istek.'),
 ('P0','DOĞRULANDI','Canonical ve indeks politikası zaten büyük ölçüde tutarlıydı','Hatalı oldukları varsayılmadı; 898 indekslenebilir landing, lisans sayfası noindex ve iki hata belgesi korunuyor.','901 HTML; 18 yerel HTTP senaryosu; gerçek eksik adreste 404.'),
 ('P1','DOĞRULANDI','258 temel takvim ilk HTML’de boştu','262 public takvim görünümü SSG ile dolduruldu; kişisel notlar eklenmedi. İsim dizinine 60 resmî kayıt ve aylık liste eklendi.','Önce ham HTML bulguları; bağımsız tarih testi; dört gerçek tarayıcı JS kapalı kontrolü.'),
 ('P1','DOĞRULANDI','Tam CSS yanında büyük yinelenen inline CSS vardı','Tam ve engelleyici stil dosyası kaldı; yinelenen alt küme kaldırıldı. 41 mevcut stil birleşimi ve kaynak CSS korunuyor.','Inline CSS toplamı 129.979.293 bayttan 0’a; HTML toplamı %55,02 azaldı.'),
 ('P1','DOĞRULANDI','SEO adresleri birden çok yerde üretiliyordu','Küçük merkezi route/metadata sözleşmesi eklendi; canonical, sitemap ve JSON-LD aynı adres doğrulamasına bağlı.','901 sözleşme; 901 entity graph; yok asset/geçersiz tarih için açık hata.'),
 ('P1','DOĞRULANDI','Blog ve lisans lastmod hesabı anlamlı kaynağa bağlı değildi','Blog içerik özeti ve lisans/kaynak özeti kullanılıyor; değişmeyen içerik sonraki gün derlendiğinde tarih korunuyor.','Tekrarlanan üretimde 899 route revizyonu değişmedi; kontrol tarihi tek başına yenileme sayılmıyor.'),
 ('P2','DOĞRULANDI','Bloglarda farklı yayıncı tanımları bulunuyordu','20 makalenin ve genel sayfaların yayıncısı mevcut bildirilen kişi Silvis Balodis kimliğine bağlandı.','Görünür yazar/gün ile BlogPosting eşleşmesi; uydurma Organization/adres/puan yok.'),
 ('P2','DOĞRULANDI','Studio görsellerinin boyutları eksikti','Gerçek dört görsel boyutu ve gizli yükleme alanı rezervi eklendi. Görüntü dosyaları değiştirilmedi.','Son ham taramada eksik boyut veya alt yok; görsel dosyaları kaynaklarıyla eşleşiyor.'),
 ('P2','DOĞRULANDI','Parametre kararları yazılı sözleşmeye bağlı değildi','Tarih/görünüm, astronomi, ad arama, gerçek Letonca PDF filtreleri, kişisel durum, takip ve desteklenmeyen page ayrıldı.','10 örnek query + gerçek gads/periods/menesis testi; canonical aynı landing.'),
 ('P2','DOĞRULANDI','Gelecek ölçüm ihtiyacı','Aktarım yapmayan, kişisel veri alanlarını reddeden event sözleşmesi hazırlandı.','Ad, not, URL, tam tarih ve serbest etiketler payload’a alınmıyor; yeni servis yok.'),
 ('P2','DOĞRULANDI','Sahibi tanıtım bandını istemedi','Yalnızca /kalendars/ içindeki 48 ay tanıtım bandı kaldırıldı.','Dört yıl kartı, 48 ay bağlantısı ve filtreler duruyor; yeni tasarım veya link mimarisi yapılmadı.'),
 ('İzleme','OLASI','Arama niyeti çakışması','Yıl, ay, baskı, tatil ve rehber görevleri ayrıştırıldı; benzer kelime tek başına cannibalization sayılmadı.','SEARCH-INTENT-MAP.csv; GSC sorgu/sayfa verisi olmadan trafik etkisi doğrulanamaz.'),
 ('Dış teyit','DOĞRULANAMADI','Saha CWV, Google indeks seçimi ve rich result','Yerel ölçümler ve kod kontrolleri mevcut; Google’ın canlı değerlendirmesi yerine geçmez.','Search Console/CrUX/Rich Results Test verisi yok; hiçbir indeks gönderimi yapılmadı.'),
 ('Dış teyit','DOĞRULANAMADI','Hukuk ve tüm Letonca metinlerin bağımsız onayı','Resmî adres sahibi talimatıyla boş; yeni uzman, hukuk/WCAG sertifikası veya ana dili editör onayı uydurulmadı.','Kaynak sürümleri korundu; güncel tüm hukuk metinleri bu oturumda eksiksiz yeniden doğrulanamadı.')]
 findings_md=md_table(['Öncelik','Durum','Bulgu','Uygulama / karar','Kanıt'],findings)
 doc('SEO-AUDIT.md',f'''
# Kalendars365.lv yerel SEO denetimi

12 Kasım 2026. Bu çalışma yalnızca yereldir. Canlıya yayın yapılmadı. Yeni yayın izni yoktur.

## Sonuç ve kapsam

901 HTML belge, 899 kayıtlı route, 898 indekslenmesi amaçlanan landing ve hata belgeleri dahil 33 sınıf incelendi. İçerik route manifestinde 32 aile vardır; iki hata belgesi envanterde ek error_document sınıfını oluşturur. Mevcut iç/dış bağlantı çalışması baştan yapılmadı. İç navigasyon planı başlangıçla veri değerleri düzeyinde aynı kaldı. Sabit Ruby 4 JSON biçimlendirmesi boş dizileri tek satıra topladığı için dosya baytları farklıdır; hedef, sıra ve açıklama değerleri aynı kaldı.

Kodla doğrulanan sorunlar düzeltildi. 300 Node testi, 8 Ruby testi / 3.158 assertion, bağımsız 3.307 tarih assertion’ı ve 901 sayfalık SEO kapısı geçti. İndirilebilir mevcut 3.459 dosyanın kaynak/build eşleşmesi doğrulandı. Açık bir yerel P0 hata bulunmadı; bu ifade üretim CDN’si, Google veya hukuk sertifikası anlamına gelmez.

## Başlangıç kaydı ve güvenlik

Başlangıç branch: main. Commit: 563c798d2fdd3c8dce90c567a1b0d8a92941957f. Daha önce yapılmış çok sayıda değiştirilmiş ve izlenmeyen dosya vardı. Bunlar korunarak 1.180 kaynak dosyası ile 901 eski HTML özel yedeğe alındı. Başlangıç diff’i özel rapor klasöründedir. İndirilebilir asıl baskı dosyaları yeniden üretilmedi veya sıkıştırılmadı.

Build/test scriptleri önce okundu. Günlük içerik workflow’unun commit/push yaptığı görüldüğü için çalıştırılmadı. Kullanılan yeni araçlar loopback sınırı, yerel dosya yazımı ve kapalı dış analytics aktarımıyla sınırlıdır. Raporlar docs/seo ve özel work/reports altında; Jekyll public build’ine dahil değildir.

## Gerçek mimari

Ruby üretici, Jekyll SSG ve route’a göre eklenen tarayıcı JavaScript’i kullanılıyor. 899 route docs/route-manifest.json ile _data/routes.json kaynağından üretiliyor. Ortak layout _layouts/default.html. Cloudflare Pages statik servis; hava, gözlem, IP konumu ve günlük burç için mevcut Pages Functions var. Yeni framework veya hosting sistemi eklenmedi.

Mevcut hesap motoru assets/calendar-core.js, astronomi modülleri ve doğrulanmış yerel veri dosyaları korunur. Basılı yıllık/aylık dosyalar manifestlerle yönetilir. Kişisel takvim verisi tarayıcı krātuvesinde tutulur. Genel çıktıya kişi notu veya yüklenen fotoğraf eklenmedi.

Yapılandırılan sürümler: Ruby 4.0.9, Bundler 4.0.20, Jekyll 4.4.1 ve Node 24.22.1. İlk çalışan yerel derleme Ruby 2.6.10 / Jekyll 4.2.2 ileydi. {runtime_note}

## Bulgular

{findings_md}

## Ham HTML ve çalışan DOM ayrımı

Bütün 901 sayfanın ham HTML’i ayrı tarandı. 45 temsilî adresin hem 1.440 hem 390 CSS piksel genişlikte çalışan DOM’u incelendi. Sekiz kritik adres ayrıca 320 ve 360 pikselde kontrol edildi. Sonraki 106 tarayıcı kontrolünde yatay taşma bulunmadı. Bu, 901 sayfanın tümünün tek tek gözle incelendiği iddiası değildir.

İlk HTML’e yerleştirilen takvimler genel tatilleri içerir; kullanıcı notlarını içermez. JavaScript kişisel işlevler ve seçimlerle görünümü geliştirir. Botlara ayrı içerik sunulmaz. Home, Şubat 2028, ISO 2031/01 ve isim dizini gerçek tarayıcıda JavaScript kapalıyken incelendi.

## Sayfa aileleri

{family_md}

## Korunan SEO kararları

Yıl takvimi, aylık görünüm ve PDF koleksiyonu farklı kullanıcı görevleri olarak kalır. Mevcut şehir sayfaları koordinata bağlı hesap değerini korur. Takip parametreleri yeni sitemap girdisi oluşturmaz. Gerçek sayfalama mevcut olmadığı için page=2 yeni içerik gibi sunulmaz; gelecekte gerçek sayfalama eklenirse politika tekrar incelenmelidir.

Kişisel name, seçili gün ve filtre değerleri title, description, canonical, JSON-LD veya analytics içine taşınmaz. Bilinen tarih ve şehir seçimleri URL’den geri açılır. Her örnek query anahtarının bir UI özelliği olduğu varsayılmaz: PDF kataloğunun gerçek anahtarları gads, periods, menesis, virziens, svetki ve dizains’tir. İngilizce year/period örneği bu aracı değiştirmez.

Fotoğraf/lisans HTML belgesi sahibi isteğiyle noindex,follow kalır; resimlere noimageindex eklenmez. Genel resimler ve baskı dosyaları taranabilir. Eşdeğer formatların tamamını ana sayfaya canonical eden kör başlık kuralı eklenmedi. Kişisel blob dosyaları public landing değildir.

## Görsel, veri ve kaynak güveni

4601 resim URL’si mevcut resim sitemap’inde doğrulanır. Her HTML’in kendisine özgü kabul edilmiş 1200×630 paylaşım kapağı korunur. Gereksiz yeni kapak üretimi yapılmadı. Son HTML taramasında eksik alt veya intrinsic boyut bulgusu yoktur. Dekoratif alt metinler anahtar kelime alanına çevrilmedi.

Gregorian gün/ay/hafta hesapları Python datetime, calendar ve zoneinfo ile bağımsız karşılaştırıldı. Bu kontrol bir hükümetin gelecekteki tatil kararını doğrulamaz. Tatil, anma, izin ikamesi ve okul dönemi ayrı veri türleri olarak kalır. İsim günlerinin kaynağı VVC’nin resmî listeleridir; listede yer almak etnik köken hakkında %100 iddia anlamına gelmez.

2026/2027 okul duyurusu ve VVC resmî kaynakları yeniden okundu. Bütün hukuk metinlerinin güncel konsolide halleri bu oturumda eksiksiz teyit edilemedi; kaynak sürümleri gerçeğe aykırı biçimde bugün onaylı gösterilmedi. Bağımsız ana dili editörü, hukukçu veya erişilebilirlik sertifikasyonu yapılmış sayılmaz. Resmî adres sahibi talimatıyla boş bırakıldı.

## Performans ve korunan görünüm

Toplam ham HTML {before['htmlBytes']:,} bayttan {after['htmlBytes']:,} bayta indi: {savings:,} bayt, %{reduction} azalma. Esas neden aynı tam stil dosyasının yanında yinelenen inline bloğun kaldırılmasıdır. 41 tam stil dosyası hâlâ ilk renderı bekletir; geç gelen CSS veya gizlenen body yoktur. Kaynak stil ve fontlar değiştirilmedi.

{perf_md}

Her hücre aynı URL/cihaz koşulunda üç ölçümün medyanı ve aralığıdır. Mobilde dört örnek LCP medyanı iyileşti; masaüstünde medyanlar 12–56 ms arttı. Masaüstü için hızlanma iddia edilmiyor. İlk eşzamanlı test süreçleriyle çakışan 12 masaüstü örneği ayrı saklandı; yalnızca en iyi örnek seçilmedi, bütün masaüstü seti boşta yeniden ölçüldü. Yerel ölçüm cihaz/OS gürültüsünü ve CDN farkını ortadan kaldırmaz.

Bu ölçümler Lighthouse puanı, gerçek kullanıcı 75. yüzdelik CWV, INP veya TBT değildir. Uzun görev sayısı ayrıca kaydedildi. Bazı mobil yüklemelerde uzun görev kaldı; bunlar kullanıcı etkileşimi ölçümü gibi yorumlanmadı. Rapor scripti kişisel verileri okumaz ve dış servise ölçüm göndermez.

## Açık teyitler ve yayın durumu

{status_runtime}

Canlı host yönlendirmeleri yalnızca dört HEAD isteğiyle incelendi: HTTP ve www girişleri tercih edilen HTTPS köke 301, index.html adresi slash adresine 308 dönüyor. Asıl denetim yerelde yapıldı. Mevcut canlı sayfaya ilk beş salt okunur istek eski yayının durumunu gösterir; bu yerel düzeltmelerin yayımlandığı anlamına gelmez.

Search Console, CrUX ve analytics verisi sunulmadı; sorgu hacmi, zorluk, trafik artışı veya Google canonical seçimi doğrulanamadı. Bir site: sorgusu tam indeks sayımı yerine kullanılmadı. İçerik niteliği ve niyet ayrımı incelendi; yeni anahtar kelime sayfası üretilmedi.

Yerel düzeltmeler uygulanmış ve raporlanmıştır. Canlı ortama yayın yapılmadı. Yayın için bu görevden sonra ayrı ve açık “canlıya al” talimatı gerekir. Yayın adımları DEPLOY-RUNBOOK.md içinde yalnızca geleceğe dönük plandır.
''')
 doc('SEO-VALIDATION.md',f'''
# Yerel doğrulama ve sınırları

12 Kasım 2026. Sonuçlar yerel geliştirme kanıtıdır. Yayın veya arama motoru sonucu değildir.

## Tamamlanan kontroller

{md_table(['Kontrol','Sonuç','Kanıt'],[
 ('Node regresyon paketi','300 geçti; 0 başarısız / atlanan','Özel final-tests.log; test/seo-contract.test.mjs dahil'),
 ('Ruby tarih paketi','8 test, 3158 assertion; 0 hata','Özel ruby-date-tests.log'),
 ('Bağımsız tarih hesabı','1461 gün, 48 ay, 209 hafta route’u, 3307 assertion, 4 host saat dilimi','evidence/dates-independent.json'),
 ('Metadata / graph / sitemap','901 HTML, 901 graph, 898 sitemap landing; 0 hata','evidence/seo-gate.json'),
 ('Yerel HTTP / redirect','18 HEAD senaryosu, 5 explicit redirect; zincir/döngü yok','evidence/seo-gate.json'),
 ('Ham HTML envanteri','901 cevap 200; bilinen hata belgeleri ayrı noindex; eksik route yok','URL-INVENTORY.csv; evidence/after-summary.json'),
 ('Gerçek olmayan route','Yerelde 404 + noindex; canlı küçük örnekte 404','evidence/seo-gate.json; evidence/live-read-only.json'),
 ('DOM örneklemi','45 URL × masaüstü/mobil = 90; dar ekran ek 16; taşma 0','evidence/dom-summary.json'),
 ('Raw / DOM metadata','Örneklemde title, description, canonical, robots, dil uyumsuzluğu 0','evidence/dom-summary.json'),
 ('JavaScript kapalı','Ana sayfa 42 hücre; Şubat 2028 42; yıl sınırı haftası 7; isim dizini 60 kayıt','evidence/no-javascript.json'),
 ('API arızası','503 stub; takvim 42 günle çalışıyor; hava ve ölçüm yokluğu açıkça yazıyor','evidence/api-unavailable.json'),
 ('Dosya kimliği','3459 asıl/önizleme dosyası; kaynak/build birebir; hata 0','DOWNLOAD-MANIFEST.csv; evidence/downloads-validation.json'),
 ('Gerçek UI indirmesi','Şubat 2028 tasarım 01 PDF ve Attēls; indirme SHA eşleşiyor; ICS geçerli','evidence/browser-download-validation.json'),
 ('Kişisel not','29 Şubat için sentetik not saklandı, yeniden açıldı ve temizlendi','Özel after/note-regression.json; not dış ölçüme gönderilmedi'),
 ('Tarayıcı baskısı','Home ve Şubat 2028 tek A4; takvim dışı blok yok; PNG’ler gözle incelendi','evidence/print-validation.json; images/print-*.png'),
 ('lastmod tekrarı','899 route revizyonu tekrar üretimde aynı','evidence/preservation-validation.json'),
 ('İç bağlantı koruması','internal-navigation.json başlangıçla veri değerleri düzeyinde aynı','evidence/preservation-validation.json'),
 ('Public dışlama','tooling/seo ve docs/seo public çıktıda yok; local ölçüm scripti inject-only','evidence/preservation-validation.json'),
 ('Event kişisel veri filtresi','Sentetik ad, not, URL ve tarih atıldı; transport yok','test/seo-contract.test.mjs; tooling/seo/event-contract.mjs'),
 ('Repo whitespace kontrolü','git diff --check geçti','Yerel terminal doğrulaması'),
 ('Üretim sürümü',status_runtime,'evidence/runtime-validation.json')])}

## Çalıştırma sırası

Aşağıdaki komutlar yayına yazmaz. Önce scriptleri okumak ve çalışma ağacını kaydetmek yine gereklidir. Sabit Ruby ve Node proje cache’inden PATH’e alınmalıdır. Sistem Ruby ile çalışan ilk derleme ile sabit sürüm kanıtı birbirine karıştırılmamalıdır.

~~~sh
ruby scripts/generate.rb
JEKYLL_ENV=production bundle exec jekyll build --trace
node --test test/*.mjs test/*.cjs
ruby test/date_test.rb
ruby scripts/audit.rb
node tooling/seo/verify.mjs --output=docs/seo/validation
python3 tooling/seo/downloads.py --output=docs/seo/artifacts
~~~

Yalnızca localhost üzerinde önizleme:

~~~sh
node tooling/seo/serve.mjs --port=4013 --mode=preview
~~~

Production ayarlarını yerelde simüle etme:

~~~sh
node tooling/seo/serve.mjs --port=4013 --mode=production-simulation
~~~

Bu sunucu API’lere dış istek yapmaz; 503 senaryosu bilinçli kullanılır. Gerçek Cloudflare Functions çalışma ortamı değildir. Preview cevabı noindex,nofollow ve no-store alır; production simülasyonunda bu güvenlik etiketi ana sayfaya taşınmaz. Lisans/hata belgelerinin kendi kararı korunur.

## Tarayıcı ölçüm koşulları

Masaüstü: 1440×900 CSS piksel, CPU 1×, ek gecikme yok. Mobil laboratuvar: 390×844 CSS piksel, CPU 4× yavaşlatma, 150 ms gecikme, 200000 bayt/sn indirme ve 93750 bayt/sn yükleme. Her URL için üç yeniden yükleme; HTTP cache devre dışı. Yerel sunucu gzip kullanır. Ölçüm HUD’u load sonrası 1500 ms’de örneklenir; performans API’sinin buffer’lı LCP/CLS ve uzun görev olaylarını okur.

İlk envanter aracının SVG içindeki title düğümlerini belge başlığına eklediği fark edilince parser yalnızca head/title okuyacak şekilde düzeltildi ve regresyon testi eklendi. İlk ham kayıt korunur; özel baseline/corrected altındaki 182 başlık düzeltmesi değişmez eski HTML arşivinden yeniden hesaplandı. Bu bir site metadata hatası değildi. İlk HTTP taramasının diakritikli bir URL’yi encode etmemesi de araçta giderildi; eski UNVERIFIED kaydı geçmişe dönük 200 gibi değiştirilmedi.

Başlangıç ve son ana ölçümde çerez bildirimi açıktı. Daha sonraki fonksiyonel testte “Sapratu” tıklandı; son ekran görüntülerinde bu bildirim kapalıdır. Bu görüntü farkı CSS değişikliği veya hız kanıtı olarak gösterilmez. Bir yerel sürümde ilk 12 masaüstü örneği CPU kullanan doğrulama süreçleriyle çakıştığı için ayrı saklandı ve bütün masaüstü seti tekrar ölçüldü. Ham örnekler özel raporda saklıdır.

{perf_md}

## Parametre matrisi

Tarih/görünüm, şehir/tarih, VVC ad araması, katalog, hesap girdisi, isimli taslak, blog filtresi, desteklenmeyen page ve takip parametreleri sınırlı örneklerle incelendi. Canonical ve görünür metadata sabit kaldı. Şubat 29 seçimi ve Liepāja/tarih seçimi açıldı. PDF kataloğunda gerçek Letonca parametrelerle 2028 Şubat / 15 tasarım doğrulandı.

Örnek İngilizce year/period anahtarları PDF filtresini değiştirmez; bu bug olarak uydurulmadı. Tarih hesaplayıcısının from/to örneği de mevcut UI tarafından URL’den başlangıç girdisi olarak okunmuyor; mevcut hesaplama işlevi çalışır, ancak URL’den her girdiyi geri yükleme özelliği vaat edilmez. Blog konu değeri, görünür mevcut kategori adıyla eşleşmelidir. Bu sınırlar policy dosyasında belirtilir.

## Sınırlar

JSON parse ve yerel alan/tip/URL/kimlik kontrolleri geçti; bu bağımsız schema.org sertifikası veya Google Rich Results Test sonucu değildir. Localhost dış validator’a açılmadı. Saha CWV/INP, Google indeks sayısı, Googlebot’un seçtiği canonical, GSC sorguları ve AdSense onayı ölçülmedi. Hukuk, astronomi ve ana dili editör onayı otomatik testler yerine geçirilmedi.
''')
 doc('SEO-CHANGELOG.md',f'''
# Yerel değişiklik kaydı

Bütün işlemler yalnızca yerel çalışma alanında yapıldı. Bu liste bu SEO görevindeki değişiklikleri açıklar; başlangıçta zaten değiştirilmiş dosyalar görevimize aitmiş gibi gösterilmez. Kontrol özetleri CHANGESET.csv içindedir. Kabul edilmiş baskı asılları ve kaynak CSS/font dosyaları yeniden üretilmedi.

{md_table(['Değişiklik','Sorun / kanıt','Kaynaklar','Risk / test','Geri alma grubu'],[
 ('Public SSG takvim ve isim dizini','258 ilk-HTML eksikliği; isim grid’i boştu','scripts/render_calendar_snapshot.cjs; generate.rb; app.html; collection-calendar.html; calendar-workbench.html; category_experience_components.rb','Render çiftini aynı veriyle tutmak: bağımsız 1461 gün + JS açık/kapalı + not/ICS/print','R1: üretici, include ve snapshot birlikte'),
 ('Tek tam blocking CSS','Yinelenen inline blok 129979293 bayt','tooling/critical-css/inline.mjs; test/critical-css.test.mjs; test/seo-performance.test.cjs','CSS sırası korunuyor; 41 bundle, 90 DOM örneği, tekrarlı LCP/CLS','R2: CSS üretim politikası ve testi'),
 ('SEO route sözleşmesi','Bağımsız adres ve schema üretimi','lib/seo_contract.rb; _plugins/seo_contract.rb; _layouts/default.html; scripts/generate.rb','Canonical, olmayan asset/tarih ve entity ilişkileri bütün 901 sayfada doğrulanıyor','R3: layout, plugin, lib, generate bir bütün'),
 ('Anlamlı blog lastmod','Yayın günü sabitleniyor, body değişimi izlenmiyordu','scripts/blog_components.rb; scripts/generate.rb; _data/page-revisions.json','Hash bootstrap önceki/published tarihi korur; sonraki gözlem tarihi 2030 olsa da aynı içerik tarihi korunur','R4: içerik özeti ve revizyon kaydı'),
 ('Studio görsel boyutları','5 img için boyut rezervi eksikti','_includes/calendar-studio.html','Gerçek 4 kaynak boyutu + gizli upload slot; görüntü değişmedi','R5: ilgili include'),
 ('Query ve ölçüm kontratı','Yazılı parametre ayrımı / kişisel veri filtresi','_data/seo-parameters.json; tooling/seo/event-contract.mjs','Dış transport yok; kişisel alan allowlist dışında','R6: yalnızca görev dosyaları'),
 ('Yıl/ay tanıtım bandı kaldırma','Kullanıcının son açık isteği','scripts/hub_components.rb','4 yıl, 48 ay linki ve filtre yerinde; ekran kaydı var','R7: bu section kaldırma diff’i'),
 ('Denetim araçları ve belgeler','Tekrar çalıştırılabilir yerel kanıt','tooling/seo/*; test/seo-contract.test.mjs; docs/seo/*; scripts/package.json','Loopback; preview ayrımı; private/public sızıntı kontrolleri','R8: yalnızca yeni QA dosyaları')])}

## Değişmeyen kapsam

İç/dış link mimarisi, URL matrisi, yönlendirme dosyaları, hosting/DNS/CDN ayarları, mevcut renk ve tipografi, resim/PDF asılları, kabul edilmiş tasarımlar ve içerik sahipliği değişmedi. Takvim ana değerinin ham HTML’e gelmesi için gerekli görünür markup eklendi; yeni görünmez SEO metni oluşturulmadı. Başlıklar düzeltme bahanesiyle topluca yeniden yazılmadı. İlgili metadata merkezi kaynaktan aynı içerikle üretildi.

Bütün CSS veya 901 sayfa için yeni tasarım yapıldığı iddia edilmez. Kullanıcının son bandı kaldırma talimatı dışında tasarım korunur. Çalışmanın toplam ham HTML etkisi {savings:,} bayt azalmadır. İndirilebilir baskı orijinallerinde yeniden kodlama: 0.

## Yerel kurulum

Sistem geneli paket yöneticisi veya makine ayarı değiştirilmedi. Node önceden mevcut proje cache’inden kullanıldı. Sabit Ruby doğrulaması için gerekiyorsa resmî OpenSSL/LibYAML bileşenleri yalnızca node_modules/.cache altında hazırlanmıştır; son durum evidence/runtime-validation.json içindedir. Kaynak indirme hiçbir yayın veya uzak hesap yazması değildir.
''')
 doc('SEO-SOURCES.md','''
# Kaynaklar ve kanıt kullanımı

Kontrol tarihi: 12 Kasım 2026. Kaynak sayfasını okumak bu siteye dış onay verildiği anlamına gelmez. Teknik kararlar için birincil dokümantasyon kullanıldı. Arama sonucu örnekleri yalnızca kullanıcı görevi çıkarımı içindir; hukuki veri kaynağı değildir.

'''+md_table(['Kimlik','Kaynak','Adres','Karardaki rolü','Doğrulama sınırı'],SOURCES)+'''

## Arama niyeti araştırması

SEARCH-RESEARCH.csv, Letonca başlangıç sorgularını, görülen kaynak örneklerini ve mevcut hedef URL’yi içerir. Sorgular arama aracı üzerinden incelendi; konumu sabitlenmiş gerçek Google.lv hesabı veya Search Console verisi alınmadı. Arama hacmi, zorluk, CTR, trafik veya sıralama uydurulmadı. Rakip metinleri kopyalanmadı. Ek alan adı projesi hreflang alternatifi sayılmadı.

## Depo kanıtları

Route matrisi, gerçek build HTML’i, _data/page-revisions.json, _data/social-images.json, isim günü kaynak kayıtları, astronomi verisi, dört download manifesti ve ilgili testler esas alındı. Ham HTML, HTTP başlığı, render edilmiş DOM ve dış arama motoru sonucu ayrı kanıt sınıflarıdır. Gözle görülmeyen bir Google sonucuna başarılı denmedi.

VVC’nin resmî liste kaydı, otomatik olarak “bütün adlar yalnızca etnik Leton adıdır” iddiası vermez. Geleneksel ve genişletilmiş takvim listeleri ayrı tutulur. Astronomik hesaplar, horoskop eğlencesi ve tarımsal gelenek aynı bilimsel güvenilirlik iddiasıyla birleştirilmez.

Letonya Eğitim ve Bilim Bakanlığının yayımlanmış okul yılı duyurusu doğrulandı. Hukuk metinlerinin eksik alınabilen güncel sürümleri için DOĞRULANAMADI kaydı korundu; gelecekteki resmî kararlar rakip sitelerden kesinleştirilmedi. İş günü yer değiştirme kararları yeni bir resmî belge yayımlandığında tekrar incelenmelidir.
''')
 doc('DEPLOY-RUNBOOK.md',f'''
# Gelecekteki yayın için işlem kılavuzu

BU DOSYA YAYIN İZNİ DEĞİLDİR. Bu görevde hiçbir adım canlıya uygulanmadı. Kullanıcı bu görevden sonra ayrı ve açık “canlıya al” mesajı vermeden burada yazan uzak işlemler yürütülemez.

## Ön koşullar

1. Yeni açık yayın talimatını al. O zamanki çalışma ağacını kaydet; mevcut görevdeki dosyalarla sonraki değişiklikleri karıştırma.
2. CHANGESET.csv ve özel başlangıç yedeğiyle diff’i gözden geçir. Baskı asıllarını değiştirme. Plan dışı dosya varsa yayın paketine körlemesine ekleme.
3. Sabit Ruby 4.0.9, Bundler 4.0.20, Jekyll 4.4.1 ve Node 24.22.1 ile tüm üretim ayarları derlemesini tekrar doğrula. Bugünkü durum: {status_runtime}
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
''')
 doc('ROLLBACK.md',f'''
# Hedefli yerel geri alma

Başlangıçta çok sayıda önceki kullanıcı değişikliği vardı. git reset --hard, git clean, tüm checkout’u eski commit’e döndürme veya toplu dosya silme kullanılmamalıdır. Bu kılavuz yürütülmüş bir geri alma değildir.

## Kanıt ve özel yedek

Özel yedek klasörü: {report/'baseline'}

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
''')
 generate_html(dest,performance,after,savings,reduction,runtime,dom_summary)

def generate_html(dest,performance,after,savings,reduction,runtime,dom_summary):
 esc=html.escape
 perf_rows=''.join('<tr><td>'+esc(r['profile'])+'<small>'+esc(r['url'])+'</small></td><td>'+str(r['beforeMedianMs'])+' ms<small>'+str(r['beforeRangeMs'])+'</small></td><td>'+str(r['afterMedianMs'])+' ms<small>'+str(r['afterRangeMs'])+'</small></td><td class="'+('better' if r['changePercent']<0 else 'neutral')+'">'+str(r['changePercent'])+'%</td></tr>' for r in performance)
 files=[('SEO-AUDIT.md','Denetim ve bulgular'),('SEO-VALIDATION.md','Testler ve ölçüm koşulları'),('SEO-CHANGELOG.md','Değişiklik kaydı'),('SEO-SOURCES.md','Resmî kaynaklar'),('URL-INVENTORY.csv','901 URL envanteri'),('SEARCH-INTENT-MAP.csv','Arama niyeti haritası'),('INDEXATION-POLICY.csv','İndeks ve query politikası'),('DOWNLOAD-MANIFEST.csv','Baskı dosyası eşleşmeleri'),('CHANGESET.csv','Kaynak dosyası kontrol özetleri'),('DEPLOY-RUNBOOK.md','Gelecekteki yayın kılavuzu'),('ROLLBACK.md','Hedefli geri alma')]
 file_links=''.join('<a class="file" href="'+name+'"><span>'+label+'</span><small>'+name+'</small><b aria-hidden="true">↗</b></a>' for name,label in files)
 runtime_text=('Ruby 4.0.9, Bundler 4.0.20 ve Jekyll 4.4.1 ile ek üretim ayarlı yerel derleme ve regresyon kontrolleri geçti.' if runtime.get('pinnedVerified') else 'Sabit üretim sürümünün birebir yerel kontrolü açık. İlk yerel derleme Ruby 2.6.10 / Jekyll 4.2.2 ile geçti; bu fark gizlenmedi.')
 page='''<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Kalendars365 | Yerel SEO doğrulama raporu</title><style>
:root{--ink:#302931;--red:#842b48;--muted:#6e626a;--line:#e6d9d2;--paper:#fffdf8;--green:#246d5e}*{box-sizing:border-box}body{margin:0;background:#f4f0e9;color:var(--ink);font:16px/1.65 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}a{color:var(--red);text-underline-offset:4px}header,main,footer{max-width:1240px;margin:auto;padding:32px 36px}.badge{display:inline-flex;align-items:center;gap:10px;border:1px solid #d9bdc4;background:#fff8f4;border-radius:40px;padding:8px 16px;color:var(--red);font-size:12px;font-weight:800;letter-spacing:1px}.badge:before{content:"";width:8px;height:8px;background:var(--red);border-radius:50%}.hero{padding-block:38px 20px}.hero h1{font-size:clamp(34px,5vw,66px);line-height:1.1;letter-spacing:-2px;max-width:960px;margin:22px 0}.hero p{font-size:19px;max-width:850px;color:var(--muted)}.date{font-weight:700;font-size:14px;color:var(--muted)}nav{display:flex;gap:10px;flex-wrap:wrap;margin:22px 0}nav a,.button{padding:10px 16px;border-radius:12px;background:#fffdf8;border:1px solid var(--line);font-weight:700;text-decoration:none;font-size:14px}.metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin:24px 0}.metric{background:var(--paper);border:1px solid var(--line);padding:24px;border-radius:22px}.metric strong{display:block;color:var(--red);font-size:38px;letter-spacing:-1px}.metric span{display:block;font-size:14px;color:var(--muted)}section{scroll-margin-top:20px;margin:28px 0 42px;padding:32px;background:var(--paper);border:1px solid var(--line);border-radius:26px}h2{font-size:29px;line-height:1.25;margin:0 0 18px;letter-spacing:-.6px}h3{font-size:20px;margin:22px 0 10px}.kicker{color:var(--red);font-size:12px;font-weight:800;letter-spacing:1.8px;text-transform:uppercase;display:block;margin-bottom:10px}.summary-list{display:grid;grid-template-columns:1fr 1fr;gap:15px}.finding{padding:20px;background:#f6efeb;border-radius:18px;border:1px solid #eadbd7}.finding strong{display:block;color:var(--red);margin-bottom:8px}.finding p{margin:0;color:#5d5159;font-size:15px}.notice{border-left:4px solid var(--red);padding:14px 18px;background:#f6ebed;color:#583847;border-radius:0 12px 12px 0}.table-scroll{overflow:auto}table{border-collapse:collapse;width:100%;font-size:14px}th{text-align:left;background:#f5edeb;color:#653b4d}th,td{padding:14px 16px;border-bottom:1px solid var(--line);vertical-align:top}td small{display:block;color:var(--muted);font-size:11px}td.better{color:var(--green);font-weight:800}td.neutral{color:#8c613d;font-weight:750}.compare{display:grid;grid-template-columns:1fr 1fr;gap:18px}.compare figure{margin:0;min-width:0}.compare img,.wide-shot{display:block;width:100%;height:auto;border:1px solid var(--line);border-radius:14px}.compare.mobile img{max-width:310px;margin:auto}figcaption{font-size:13px;color:var(--muted);padding:12px 3px}.files{display:grid;grid-template-columns:1fr 1fr;gap:12px}.file{display:grid;grid-template-columns:1fr auto;gap:2px 10px;text-decoration:none;padding:16px 18px;border:1px solid var(--line);border-radius:14px;background:#fdf9f4}.file span{font-weight:750}.file small{grid-column:1;color:var(--muted);font-size:12px}.file b{grid-column:2;grid-row:1/3;align-self:center}ul{padding-left:23px}li{margin:8px 0}details{border:1px solid var(--line);border-radius:14px;padding:15px 18px;margin-top:14px}summary{font-weight:700;cursor:pointer}.small{font-size:13px;color:var(--muted)}footer{text-align:center;font-size:14px;color:var(--muted);padding-bottom:50px}code{font:13px ui-monospace,monospace;background:#f3ece8;border-radius:4px;padding:2px 5px;overflow-wrap:anywhere}
@media(max-width:700px){header,main,footer{padding:22px 16px}.hero h1{letter-spacing:-1px}.hero p{font-size:17px}.metrics{grid-template-columns:1fr 1fr}.metric{padding:18px}.metric strong{font-size:30px}section{padding:23px 18px;border-radius:20px}.summary-list,.compare,.files{grid-template-columns:1fr}h2{font-size:25px}.compare.mobile{grid-template-columns:1fr 1fr;gap:12px}th,td{padding:10px}.file{padding:14px}}
@media print{body{background:white;font-size:11pt}header,main,footer{padding:12px;max-width:none}nav,.files{display:none}section{break-inside:avoid;border:0;padding:12px;margin:12px 0}a{color:inherit}h1{font-size:30pt!important}.compare img{max-height:300px;object-fit:contain}.compare.mobile img{max-height:330px}.metric strong{font-size:24pt}.notice{background:transparent}.hero{padding:0}.metrics{margin:10px 0}}
</style></head><body><header><div class="badge">YALNIZCA YEREL · YAYIN KAPALI</div><div class="hero"><p class="date">12 Kasım 2026 · Kalendars365.lv</p><h1>Takvim ilk yanıtta görünür.<br>SEO kararları aynı kaynağa bağlı.</h1><p>Mevcut görünüm, bağlantı planı ve kabul edilmiş baskı dosyaları korunarak kanıtlanan teknik sorunlar düzeltildi. Bu rapor yerel değişiklikleri ve gerçek test sınırlarını gösterir.</p></div><nav><a href="#sonuc">Yapılanlar</a><a href="#hiz">Önce / sonra ölçümler</a><a href="#gorsel">Ekranlar</a><a href="#baski">Baskı kontrolü</a><a href="#dosyalar">Tüm belgeler</a></nav><div class="metrics"><div class="metric"><strong>901</strong><span>HTML belgesi tarandı</span></div><div class="metric"><strong>300</strong><span>Node regresyon testi geçti</span></div><div class="metric"><strong>3.459</strong><span>Dosya kimliği doğrulandı</span></div><div class="metric"><strong>55,02%</strong><span>Toplam ham HTML azaldı</span></div></div></header><main>
<section id="sonuc"><span class="kicker">Uygulanan düzeltmeler</span><h2>Kullanıcı ve tarayıcı aynı temel takvimi görüyor.</h2><div class="summary-list"><article class="finding"><strong>İlk HTML’de 262 takvim görünümü</strong><p>Boş kalan ana takvimler; ay, hafta ve gün görünümüyle genel veriyi sunuyor. İsim dizininde 60 kayıt ve aylık liste var. Kişisel notlar bu HTML’e eklenmiyor.</p></article><article class="finding"><strong>Yinelenen stil bloğu kaldırıldı</strong><p>41 tam stil birleşimi ve mevcut CSS sırası korunuyor. Yaklaşık 130 MB toplam inline tekrar kaldırıldı; body gizleme veya geç CSS takası yok.</p></article><article class="finding"><strong>Tek metadata ve adres sözleşmesi</strong><p>Canonical, sitemap ve JSON-LD aynı doğrulanabilir route kaynağını kullanıyor. 901 belge ve görsel kimliği birbirini tutuyor.</p></article><article class="finding"><strong>Anlamlı lastmod</strong><p>Blog içeriği değişince tarih izleniyor. Sadece saat, sayaç veya kontrol zamanı değişti diye bütün arşiv yenilenmiş gösterilmiyor.</p></article><article class="finding"><strong>Bağımsız tarih kontrolü</strong><p>1.461 gün, 48 ay, ISO hafta yılı sınırları ve dört saat diliminde 3.307 bağımsız assertion geçti. 29 Şubat 2028 doğrulandı.</p></article><article class="finding"><strong>Dosyalar ve bağlantılar korundu</strong><p>1.153 PDF, 1.153 yüksek kalite Attēls ve 1.153 önizleme kaynak/build eşleşmesi geçti. İç navigasyon planı başlangıçla aynı bağlantıları ve sıralamayı içeriyor.</p></article></div><p class="notice">Canlı ortama yayın yapılmadı. Bu rapordaki sonuçlar yeni canlı sürüm veya Google indeksleme sonucu değildir.</p></section>
<section id="band"><span class="kicker">Son isteğiniz</span><h2>“Yıl seç, ay bul” ve 48 ay tanıtım bandı kaldırıldı.</h2><p>Takvim rehberinin dört yıl kartı, 48 ay bağlantısı ve filtreleri yerinde. Yalnızca işaretlediğiniz yinelenen tanıtım bölümü çıkarıldı.</p><img class="wide-shot" src="images/calendar-hub-banner-removed.jpg" alt="Yerel takvim rehberinde tanıtım bandı olmadan yıl seçimi" width="1378" height="1580"></section>
<section id="hiz"><span class="kicker">Ölçülmüş sonuçlar</span><h2>Mobil örneklerde içerik daha erken görünmeye başladı.</h2><p>Her sayfada üç ölçümün medyanı ve min–maks aralığı kaydedildi. Mobil örneklerde LCP %11–18 iyileşti. Masaüstü medyanları 12–56 ms yükseldi; masaüstü için hızlanma iddia edilmiyor.</p><div class="table-scroll"><table><thead><tr><th>Profil ve sayfa</th><th>Önce · medyan / aralık</th><th>Sonra · medyan / aralık</th><th>Fark</th></tr></thead><tbody>PERFORMANCE_ROWS</tbody></table></div><details><summary>Koşullar ve ölçümün sınırı</summary><p>Masaüstü 1440×900; mobil 390×844, 4× CPU yavaşlatma, 150 ms ağ gecikmesi ve 200.000 bayt/sn indirme. HTTP cache devre dışı; loopback gzip. İlk eşzamanlı işlemlerle çakışan 12 masaüstü örneği ayrı saklandı ve bütün set tekrar ölçüldü.</p><p>Bu bir Lighthouse skoru veya gerçek kullanıcı CWV değildir. INP ölçülmedi. Uzun görevler ayrıca kaydedildi; bazılarında devam ediyor. İyileşme trafik, sıra veya AdSense garantisi değildir.</p></details><p class="small">Ham HTML toplamı: 232.950.374 → 104.783.428 bayt. Azalma: 128.166.946 bayt. Baskı dosyalarının çözünürlüğü değişmedi.</p></section>
<section id="gorsel"><span class="kicker">Görünüm ve dar ekran</span><h2>Marka, tipografi ve sayfa düzeni korunuyor.</h2><p>Aşağıdaki karşılaştırma aynı 390 piksel mobil görünümünü gösterir. Masaüstü düzeni ayrıca DOM kontrolleri ve yukarıdaki normal tarayıcı görüntüsüyle doğrulandı.</p><div class="compare mobile"><figure><img src="images/before-mobile.png" alt="Önce 390 pikselde okul takvimi görünümü" width="390" height="844"><figcaption>Önce · 390×844</figcaption></figure><figure><img src="images/after-mobile.png" alt="Sonra 390 pikselde okul takvimi görünümü" width="390" height="844"><figcaption>Sonra · 390×844</figcaption></figure></div><p class="small">Fonksiyonel testte “Sapratu” seçildiği için son ekranlarda bildirim kapalıdır. Bu fark tasarım değişikliği veya hız kanıtı olarak kullanılmaz. Performans ana setleri bildirim açıkken alındı. Ekrandaki küçük yerel ölçüm etiketi public build’e dahil değildir.</p><p>45 temsilî adres masaüstü ve mobilde, sekiz kritik adres ayrıca 320 ve 360 pikselde incelendi. Sonraki 106 görünüm kontrolünde yatay taşma yok. 901 sayfanın her birinin tarayıcıda görsel olarak tek tek incelendiği iddia edilmez.</p></section>
<section id="baski"><span class="kicker">Gerçek tarayıcı çıktısı</span><h2>Takvim tek A4’e sığıyor.</h2><p>Ana sayfa ve Şubat 2028 tarayıcıdan PDF olarak basıldı, PNG’ye çevrilip kontrol edildi. Başlık ve tam takvim aynı sayfada; gezinme, hava kartı ve alt bölüm basılmıyor. İndirilebilir kabul edilmiş tasarımlar yeniden çizilmedi.</p><div class="compare"><figure><img src="images/print-home.png" alt="Ana sayfanın yalnızca takvimi gösteren tek A4 baskısı" width="778" height="1100"><figcaption>Ana sayfa · geçerli günün ayı</figcaption></figure><figure><img src="images/print-february-2028.png" alt="29 Şubat gününü içeren Şubat 2028 tek A4 takvim baskısı" width="778" height="1100"><figcaption>Şubat 2028 · 29 gün</figcaption></figure></div><p>Gerçek PDF, Attēls ve ICS düğmelerinden indirilen dosyalar doğrulandı. Şubat 29’a sentetik not eklenip tekrar açıldı, ardından temizlendi. Not, genel HTML veya ölçüm payload’una taşınmadı.</p></section>
<section id="sinir"><span class="kicker">Doğrulama sınırı</span><h2>Yerel başarı ile dış onay ayrı tutuldu.</h2><ul><li>RUNTIME_TEXT</li><li>898 indekslenebilir landing, 4.601 görsel sitemap URL’si, lisans sayfası için noindex,follow ve gerçek 404 davranışı korunuyor.</li><li>HTTPS/non-www yönlendirmeleri mevcut canlı ortamda yalnızca salt okunur HEAD istekleriyle kontrol edildi. Bu değişiklikler canlıya gönderilmedi.</li><li>Search Console, CrUX ve canlı Google rich result verisi yok. Sıralama, indekslenme ve trafik garantisi verilmedi.</li><li>Resmî adres talimatınızla boş bırakıldı. Ana dili editörü, hukuk veya WCAG sertifikası yapılmış sayılmaz.</li><li>Güncel tüm konsolide hukuk metinleri eksiksiz yeniden doğrulanamadı; gelecekteki resmî kararlar tahminle kesinleştirilmedi.</li></ul><p class="notice">Yayın, bu görevden sonra ayrı ve açık “canlıya al” talimatınızı gerektirir. Yayın ve 7/28/56 günlük takip kılavuzu hazır; şu anda hiçbir uzak adım yürütülmedi.</p></section>
<section id="dosyalar"><span class="kicker">Tam teslim</span><h2>Kanıtlarıyla birlikte bütün çalışma dosyaları.</h2><div class="files">FILE_LINKS</div><p class="small">Bu dosyalar docs/seo altında public build’den dışlanır. Başlangıç kaynak yedeği ve ayrıntılı ham kayıtlar özel çalışma alanında korunur.</p></section></main><footer>Kalendars365.lv · Türkçe yerel SEO raporu · Yayın yapılmadı.</footer></body></html>'''
 page=page.replace('PERFORMANCE_ROWS',perf_rows).replace('FILE_LINKS',file_links).replace('RUNTIME_TEXT',esc(runtime_text));(dest/'index.html').write_text(page)

if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('--evidence',required=True);args=parser.parse_args();main(args.evidence)
