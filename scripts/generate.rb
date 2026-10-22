# frozen_string_literal: true
require 'json'
require 'date'
require 'fileutils'
require 'cgi'
require 'yaml'
require 'digest'
require 'open3'
ROOT = File.expand_path('..', __dir__)
Dir.chdir(ROOT)
ENV['TZ'] = 'Europe/Riga'
revision_date = Date.today.iso8601
previous_revisions = File.exist?('_data/page-revisions.json') ? JSON.parse(File.read('_data/page-revisions.json')) : {}
page_revisions = {}
MONTHS = %w[janvāris februāris marts aprīlis maijs jūnijs jūlijs augusts septembris oktobris novembris decembris].freeze
GEN = %w[janvāra februāra marta aprīļa maija jūnija jūlija augusta septembra oktobra novembra decembra].freeze
SLUGS = %w[janvaris februaris marts aprilis maijs junijs julijs augusts septembris oktobris novembris decembris].freeze
DAYS = %w[P. O. T. C. Pk. S. Sv.].freeze
LAW = 'https://likumi.lv/ta/id/72608-par-svetku-atceres-un-atzimejamam-dienam'
ROUTES = JSON.parse(File.read('_data/routes.json'))
DATA = File.exist?('assets/calendar-data.json') ? JSON.parse(File.read('assets/calendar-data.json')) : {}
HOLIDAYS = DATA.fetch('holidays', [])
planning_json, planning_error, planning_status = Open3.capture3(ENV.fetch('NODE', 'node'), 'scripts/render_planning.cjs')
abort "Planning prerender failed: #{planning_error}" unless planning_status.success?
PLANNING_MARKUP = JSON.parse(planning_json).freeze
def h(s); CGI.escapeHTML(s.to_s); end
def a(url,label,klass=''); "<a class=\"#{klass}\" href=\"#{h(url)}\">#{h(label)}</a>"; end
def planning_panel(type,year=2027)
 "<section data-planning=\"#{type}\" data-server-rendered=\"true\">#{PLANNING_MARKUP.fetch(type).fetch(year.to_s)}</section>"
end
def calculator_markup(work=false)
 '<section class="tool-panel"><h2>Aprēķiniet laiku saviem plāniem</h2><form class="date-calculator"><div class="date-pair"><label>Sākuma datums<input type="date" name="from" required></label><label>Beigu datums<input type="date" name="to" required></label></div><div class="field-grid"><label class="check-label"><input type="checkbox" name="work" '+(work ? 'checked' : '')+'>Skaitīt tikai darba dienas</label><label class="check-label"><input type="checkbox" name="six">Sešu dienu darba nedēļa</label></div><button class="primary">Aprēķināt</button><output class="tool-result" aria-live="polite"></output></form><p class="print-hint">Dienu starpība neietver sākuma datumu. Darba dienu aprēķins ietver abus datumus un izslēdz Latvijas svētku brīvdienas. Darbdienu pārcelšana un jūsu darba devēja īpašie noteikumi jāņem vērā atsevišķi.</p></section><section class="tool-panel"><h2>Pieskaitīt vai atņemt dienas</h2><form class="date-add-form"><div class="field-grid"><label>Datums<input type="date" name="date" data-riga-today value="'+Date.today.iso8601+'" required></label><label>Dienu skaits<input type="number" name="days" value="30" min="-36500" max="36500" required></label></div><button>Aprēķināt datumu</button><output class="tool-result" aria-live="polite"></output></form></section>'
end
def work_widget(year)
 rows=(1..12).map do |month|
  days=(Date.new(year,month,1)..Date.new(year,month,-1)).to_a
  off=days.count{|d|HOLIDAYS.any?{|h|h['date']==d.iso8601&&h['dayOff']}}
  work=days.count{|d|d.cwday<6&&!HOLIDAYS.any?{|h|h['date']==d.iso8601&&h['dayOff']}}
  '<tr><th scope="row">'+a("/darba-dienu-kalendars/#{year}/#{SLUGS[month-1]}/",MONTHS[month-1])+"</th><td>#{days.length}</td><td>#{work}</td><td>#{off}</td><td>#{days.length-work}</td></tr>"
 end.join
 '<section class="widget-panel" data-server-rendered="work"><section class="tool-panel"><h2>'+year.to_s+'. gada darba un atpūtas dienas</h2><div class="table-scroll"><table class="data-table"><thead><tr><th scope="col">Mēnesis</th><th scope="col">Dienas</th><th scope="col">Darba dienas</th><th scope="col">Svētku dienas</th><th scope="col">Brīvdienas</th></tr></thead><tbody>'+rows+'</tbody></table></div><p class="print-hint">Pamataprēķins: pirmdiena–piektdiena, bez oficiālajām svētku brīvdienām. Valsts noteikta darbdienu pārcelšana nav piemērota. Svētku un nedēļas atpūtas dienas var pārklāties.</p></section><div>'+calculator_markup(true)+'</div></section>'
end
def widget(type,year=2027)
 return planning_panel('leave',year) if type=='leave'
 return work_widget(year) if type=='work'
 return '<section class="widget-panel" data-server-rendered="calculator">'+calculator_markup+'</section>' if %w[calculator date].include?(type)
 "<section class=\"widget-panel\" data-widget=\"#{type}\"></section>"
end
def card(title,body); "<section class=\"content-card\"><h2>#{h(title)}</h2>#{body}</section>"; end
def year_links(prefix); "<nav class=\"year-pills\" aria-label=\"Gada izvēle\">#{(2027..2030).map{|y|a("/#{prefix}/#{y}/",y.to_s)}.join}</nav>"; end
def month_links(y,prefix='kalendars'); "<div class=\"link-grid\">#{(1..12).map{|m|a("/#{prefix}/#{y}/#{SLUGS[m-1]}/",MONTHS[m-1].capitalize,'link-card')}.join}</div>"; end
def dates(y,m=nil)
 HOLIDAYS.select{|v|v['date'].to_s.start_with?(m ? format('%04d-%02d',y,m) : y.to_s)}
end
def holiday_table(y,m=nil,memorial=false)
 records=dates(y,m).select{|d| memorial ? !d['dayOff'] : true}
 return '<p class="empty-state">Šajā periodā sarakstā nav atzīmētu svētku. Personīgos notikumus varat pievienot kalendārā.</p>' if records.empty?
 '<div class="table-scroll"><table class="data-table"><thead><tr><th>Datums</th><th>Diena</th><th>Veids</th></tr></thead><tbody>'+records.map{|d|"<tr><td><time datetime=\"#{d['date']}\">#{Date.parse(d['date']).strftime('%d.%m.%Y.')}</time></td><td>#{h(d['title']||d['name'])}</td><td>#{h({'holiday'=>'Svētku diena','substitute'=>'Papildu brīvdiena','commemoration'=>'Atceres diena','observance'=>'Atzīmējama diena'}[d['type']]||d['type'])}</td></tr>"}.join+'</tbody></table></div>'
end
def calendar(y,m,mini=false)
 first=Date.new(y,m,1); last=Date.new(y,m,-1); start=first-(first.cwday-1); ending=last+(7-last.cwday)
 rows=(start..ending).each_slice(7).map{|week|'<tr><th scope="row">'+a(format('/nedelas-kalendars/%d/%02d/',week[3].cwyear,week[3].cweek),week[3].cweek)+'</th>'+week.map{|d|holiday=HOLIDAYS.any?{|z|z['date']==d.iso8601&&z['dayOff']}; label="#{d.year}. gada #{d.day}. #{MONTHS[d.month-1]}"; "<td class=\"#{d.month!=m ? 'outside' : ''} #{d.cwday>5 ? 'weekend' : ''} #{holiday ? 'holiday' : ''}\"><a class=\"calendar-date-link\" href=\"/?date=#{d.iso8601}&amp;view=day\" aria-label=\"#{h(label)}\" style=\"display:block;color:inherit;text-decoration:none\"><time datetime=\"#{d.iso8601}\">#{d.day}</time></a></td>"}.join+'</tr>'}.join
 "<section class=\"#{mini ? 'mini-calendar' : 'static-calendar'}\"><h2>#{a("/kalendars/#{y}/#{SLUGS[m-1]}/",MONTHS[m-1].capitalize)}</h2><table><thead><tr><th scope=\"col\">Ned.</th>#{DAYS.map{|d|"<th scope=\"col\">#{d}</th>"}.join}</tr></thead><tbody>#{rows}</tbody></table></section>"
end
def source_panel(extra='')
 '<aside class="source-panel"><strong>Avoti un pārbaude</strong><p>Datumi aprēķināti pēc Gregora kalendāra; nedēļas sākas pirmdienā. Svētku dienas un atceres dienas ir dažādas kategorijas. '+extra+'</p>'+a(LAW,'Likums „Par svētku, atceres un atzīmējamām dienām”')+' · '+a('/avoti-un-metodika/','Avoti un metodika')+'</aside>'
end
def print_panel(type, y, m=nil, name=nil)
 "<section class=\"content-card print-section\" data-print-type=\"#{type}\" data-print-year=\"#{y}\" data-print-month=\"#{m}\" data-print-name=\"#{h(name)}\"><h2>Kalendārs uz papīra. Tavā stilā.</h2><p>Izvēlies vienu no 15 kompozīcijām. PDF ar vektoru tekstu vai atbilstošs A4 WebP attēls 600 ppi izšķirtspējā. Faila veidošana notiek tavā ierīcē.</p>#{widget('print')}</section>"
end
def metrics(y,m=nil)
 first=Date.new(y,m||1,1); last=m ? Date.new(y,m,-1) : Date.new(y,12,31)
 days=(first..last).to_a; work=days.count{|d|d.cwday<6&&!HOLIDAYS.any?{|x|x['date']==d.iso8601&&x['dayOff']}}
 "<div class=\"metrics-grid\"><div><b>#{days.length}</b><span>Kalendāra dienas</span></div><div><b>#{work}</b><span>Darba dienas*</span></div><div><b>#{m ? (first..last).map(&:cweek).uniq.length : Date.new(y,12,28).cweek}</b><span>ISO nedēļas</span></div><div><b>#{Date.gregorian_leap?(y) ? '366' : '365'}</b><span>Dienas gadā</span></div></div><p class=\"fineprint\">* Piecu dienu darba nedēļa, izņemot svētku dienas. Pārceltās darba dienas piemērojamas tikai pēc atsevišķa oficiāla lēmuma.</p>"
end
TOOL_INFO={
'datumu-kalkulators'=>['calculator','Aprēķini dienu skaitu starp datumiem. Sākuma datums netiek ieskaitīts, beigu datums tiek ieskaitīts.'],
'dienu-skaititajs'=>['countdown','Izvēlies svarīgu datumu un uzzini, cik dienu līdz tam atlicis.'],
'atvalinajuma-planotajs'=>['leave','Salīdzini brīvdienu periodu ar nepieciešamo atvaļinājuma darba dienu skaitu.'],
'darba-laika-kalendars'=>['work','Aprēķini darba dienas un pārbaudi izvēlētos darba nedēļas pieņēmumus.'],
'mainu-grafiks'=>['shift','Ievadi cikla sākumu un maiņu secību, lai izveidotu savu darba grafiku.'],
'horoskopa-zimes-kalkulators'=>['zodiac','Nosaki tradicionālo Rietumu zodiaka zīmi pēc dzimšanas mēneša un dienas.'],
'saullekts-saulriets'=>['sun','Saules lēkta un rieta aptuvens aprēķins desmit Latvijas pilsētās.'],
'varda-dienas'=>['names','Meklē vārdu un atšķir tradicionālo sarakstu no paplašinātā kalendārvārdu saraksta.'],
'meness-fazes'=>['moon','Galvenās Mēness fāzes pēc ASV Jūras observatorijas datiem, pārrēķinātas Rīgas laikā.'],
'pilnmeness'=>['moon','Pilnmēness brīži un to vietējie datumi Latvijā.'],
'jaunmeness'=>['moon','Jaunmēness brīži un to vietējie datumi Latvijā.']}.freeze
TRUST={
'par-projektu'=>['Plānošana ar skaidriem avotiem.','Kalendārs365 ir neatkarīgs Latvijas kalendāru un plānošanas projekts. Projekta uzturētājs ir Mateo Pedersen. Mēs apvienojam kalendāra aprēķinus, publiskus avotus un personīgos plānus vienā vietā. Vietne nav valsts iestādes pakalpojums.','Katram datumam ir pamats','Svētku datumu pamatā ir Latvijas normatīvie akti. Astronomiskie notikumi ir nodalīti no astroloģiskām interpretācijām. Ja avots nav pieejams vai nākamā mācību gada brīvlaiks nav izziņots, šo robežu norādām.'],
'privatuma-politika'=>['Tavi plāni paliek tavā ierīcē.','Notikumi, uzdevumi, piezīmes un iestatījumi tiek saglabāti pārlūka lokālajā krātuvē. Tie netiek nosūtīti Kalendārs365 serverim. Izdzēšot pārlūka datus, šī informācija var pazust; pirms tam lejupielādē JSON dublējumu.','Vietnes darbība un saziņa','Vietni piegādā Cloudflare. Pieprasījumu apstrādei tiek izmantota tehniskā informācija, piemēram, IP adrese. Nosūtot e-pastu uz kalendars365@gmail.com, ziņa nonāk Gmail pakalpojumā. Saziņas datus izmantojam atbildes sniegšanai; dzēšanu vari pieprasīt tajā pašā adresē. Pārzinis: Mateo Pedersen. Šobrīd vietnē nav reklāmu vai trešo pušu analītikas.'],
'sikdatnu-politika'=>['Izvēle bez slēptas izsekošanas.','Vietne neizmanto reklāmas un analītikas sīkdatnes. Plānotāja dati un saskarnes izvēles glabājas lokāli pārlūkā. Privātuma izvēli vari mainīt iestatījumos.','Kontrole ir tavās rokās','Vari pieņemt vai noraidīt papildu sīkdatnes; pašlaik neviena šāda tehnoloģija nav aktivizēta. Izvēle neierobežo kalendāra funkcijas. Datu dzēšana ir pieejama iestatījumos, un dublējumu vari saglabāt savā ierīcē.'],
'lietošanas-noteikumi'=>['Lieto pārdomāti. Plāno droši.','Kalendāri ir informatīvi plānošanas rīki. Pirms darba laika, skolas vai ceļojumu lēmumiem pārbaudi attiecīgo iestāžu paziņojumus un savas darbavietas kārtību. Aprēķinu pieņēmumi ir norādīti pie rīka.','Personīgais saturs un lejupielādes','Augšupielādē tikai attēlus, kurus drīksti izmantot. Personīgās fotogrāfijas tiek apstrādātas tavā ierīcē. Astroloģiskais saturs ir izklaide un pašrefleksija, nevis zinātniska prognoze vai profesionāls padoms. Par konstatētu kļūdu raksti uzturētājam Mateo Pedersen.'],
'pieklustamiba'=>['Kalendārs dažādiem lietotājiem.','Vietni veidojam ar semantisku HTML, tastatūras vadību, redzamu fokusu un skaidru gaišo saskarni. Darbojas saite pārejai uz galveno saturu un formas lauku nosaukumi.','Palīdzi novērst šķēršļus','Ja kāda darbība nav pieejama, nosūti lapas adresi, ierīces un pārlūka aprakstu uz kalendars365@gmail.com. Atbilstību WCAG standartam neapgalvojam bez pilna neatkarīga audita.'],
'labojumi'=>['Precizitāte sākas ar pārbaudi.','Pamanīji nepareizu datumu, vārda dienu vai formulējumu? Atsūti lapas adresi, pareizo informāciju un, ja iespējams, saiti uz sākotnējo avotu.','Kā labojam','Pārbaudām norādīto avotu, precizējam kopīgo datu kopu un atkārtoti veidojam ar to saistītos kalendārus. Izmaiņas glabājam publiskā projekta versiju vēsturē. Nepārbaudīti datumi netiek pasniegti kā oficiāli.']}.freeze

def title_for(r)
 f=r['Page family'];y=r['Year'].to_i;m=(SLUGS.index(r['URL path'].split('/').last)||-1)+1;t=r['Latvian title/topic'];p=r['URL path']
 case f
 when 'year' then "#{y}. gada kalendārs"
 when 'calendar_month' then "#{y}. gada #{GEN[m-1]} kalendārs"
 when 'iso_week' then "#{y}. gada #{p.split('/').last.to_i}. nedēļa"
 when 'lunar_month' then "#{y}. gada #{GEN[m-1]} Mēness kalendārs"
 when 'work_month' then "Darba dienas #{y}. gada #{GEN[m-1]} mēnesī"
 when 'holiday_month' then "Svētku dienas #{y}. gada #{GEN[m-1]} mēnesī"
 when 'print_month' then "#{y}. gada #{GEN[m-1]} kalendārs PDF un WebP formātā"
 when 'name_calendar' then "Kalendārs ar vārdu #{t}"
 when 'month_index' then "#{y}. gada mēnešu kalendāri"
 when 'week_index' then "#{y}. gada nedēļu kalendāri"
 when 'print_index' then "#{y}. gada PDF kalendāri"
 when 'lunar_year' then "#{y}. gada Mēness kalendārs"
 when 'work_year' then "#{y}. gada darba dienu kalendārs"
 when 'holiday_year' then "#{y}. gada svētku dienas"
 when 'memorial_year' then "#{y}. gada atceres dienas"
 when 'long_weekends' then "#{y}. gada garās brīvdienas"
 when 'school_year_calendar' then "Skolas brīvlaiki #{y}. gadā"
 else t
 end
end

manifest=[]
ROUTES.each do |r|
 p=r['URL path'];f=r['Page family'];y=r['Year'].to_i;y=2027 if y==0;m=(SLUGS.index(r['URL path'].split('/').last)||-1)+1;m=nil if m==0;slug=p.split('/').last;title=title_for(r);title='Tava diena. Tavi plāni.' if p=='/'
 week=f=='iso_week' ? slug.to_i : nil
 noindex=false;reason='ready';body='';desc=''
 if p=='/'
  body='{% include app.html %}'
  desc='Latvijas kalendārs, svētku dienas un ikdienas plānošana. 2027.–2030. gada kalendāri, personīgie notikumi un lejupielādējami PDF.'
 elsif f=='year'
  body=year_links('kalendars')+metrics(y)+"<div class=\"year-calendar-grid\">#{(1..12).map{|n|calendar(y,n,true)}.join}</div>"+print_panel('yearly',y)+card('Svētki un atzīmējamās dienas',holiday_table(y))+source_panel
 elsif %w[calendar_month iso_week].include?(f)
  body='{% include app.html %}'+card('Kalendārs drukai',f=='calendar_month' ? calendar(y,m) : "<p>#{Date.commercial(y,week,1).strftime('%d.%m.%Y.')}–#{Date.commercial(y,week,7).strftime('%d.%m.%Y.')}</p>")+print_panel(f=='iso_week' ? 'weekly' : 'monthly',y,m)+source_panel
 elsif f=='month_index'
  body=year_links('menesa-kalendars')+month_links(y)+metrics(y)
 elsif f=='week_index'
  body=year_links('nedelas-kalendars')+'<div class="link-grid">'+(1..Date.new(y,12,28).cweek).map{|w|a(format('/nedelas-kalendars/%d/%02d/',y,w),"#{w}. nedēļa · #{Date.commercial(y,w).strftime('%d.%m.')}–#{Date.commercial(y,w,7).strftime('%d.%m.')}",'link-card')}.join+'</div>'+source_panel
 elsif %w[print_index print_month].include?(f)
  body=year_links('pdf-kalendari')+(m ? calendar(y,m) : month_links(y,'pdf-kalendari'))+print_panel(m ? 'monthly' : 'yearly',y,m)+source_panel
 elsif %w[holiday_month holiday_year memorial_year].include?(f)
  body=year_links(f=='memorial_year' ? 'atceres-dienas' : 'svetku-dienas')+metrics(y,m)+card('Datumi un dienu veidi',holiday_table(y,m,f=='memorial_year'))+month_links(y,'svetku-dienas')+source_panel('Atceres diena pati par sevi nav brīvdiena.')
 elsif %w[work_year work_month long_weekends].include?(f)
  rows=(m ? [m] : (1..12).to_a).map{|n|"<tr><td>#{a("/darba-dienu-kalendars/#{y}/#{SLUGS[n-1]}/",MONTHS[n-1])}</td><td>#{Date.new(y,n,-1).day}</td><td>#{(Date.new(y,n,1)..Date.new(y,n,-1)).count{|d|d.cwday<6&&!HOLIDAYS.any?{|v|v['date']==d.iso8601&&v['dayOff']}}}</td></tr>"}.join
  body=year_links('darba-dienu-kalendars')+metrics(y,m)+(f=='long_weekends' ? widget('leave',y) : planning_panel('work',y))+widget('work',y)+card('Mēnešu pārskats','<table class="data-table"><thead><tr><th>Mēnesis</th><th>Kalendāra dienas</th><th>Darba dienas*</th></tr></thead><tbody>'+rows+'</tbody></table>')+print_panel(m ? 'work' : 'work-year',y,m)+source_panel('Darba laika aprēķinā jāpārbauda Darba likuma 133. un 135. pants, pirms svētkiem saīsinātais laiks un darba devēja noteikumi.')
 elsif %w[lunar_month lunar_year].include?(f)
  phases=DATA.fetch('moon',[]).select{|v|v['date'].to_s.start_with?(m ? format('%04d-%02d',y,m) : y.to_s)}
  noindex=phases.empty?;reason='moon_source_pending' if noindex
  body=year_links('meness-kalendars')+widget('moon')+card('Galvenās Mēness fāzes','<div class="phase-list">'+phases.map{|z|"<article><span class=\"moon-dot\">◐</span><time>#{h(z['date'])} #{h(z['time'])}</time><b>#{h(z['phase'])}</b></article>"}.join+'</div>')+month_links(y,'meness-kalendars')+print_panel(m ? 'lunar' : 'lunar-year',y,m)+source_panel('Avots: USNO. Precīzs fāzes brīdis ir astronomisks notikums; dienas apgaismotā daļa mainās nepārtraukti.')
 elsif %w[school_academic school_year_calendar].include?(f)
  school=DATA.fetch('school',[]); matching=school.select{|s| f=='school_academic' ? s['academicYear']==slug.split('-').then{|v| v[0]+'-20'+v[1]} : (s['start'].start_with?(y.to_s)||s['end'].start_with?(y.to_s))}
  noindex=matching.empty? || f=='school_year_calendar';reason='school_dates_pending' if noindex
  body='<div class="notice"><b>'+(noindex ? 'Datumi vēl nav apstiprināti šajā datu kopā.' : 'Oficiāli publicētie datumi')+'</b><p>Neizmantojam iepriekšējā gada datumus kā nākamā gada prognozi. Pārbaudi arī savas skolas paziņojumus.</p></div>'+card('Mācību gada plānošana',matching.map{|s|"<p>#{h(s['title']||s['name'])} · #{h(s['start']||s['start_date'])}–#{h(s['end']||s['end_date'])}</p>"}.join)+widget('countdown')+print_panel('school',y)+source_panel
 elsif %w[name_calendar name_day_month].include?(f)
  names=DATA.fetch('names',[]);matching=f=='name_calendar' ? names.select{|n|n['name']==r['Latvian title/topic']} : names.select{|n|n['month'].to_i==m}
  noindex=matching.empty? || !DATA.fetch('assumptions',{}).fetch('namesComplete',false);reason='name_source_pending' if noindex
  body=(noindex ? '<div class="notice">Vārda dienas datums vēl nav pārbaudīts oficiālajā sarakstā. Personalizētu kalendāru vari izveidot bez vārda dienas atzīmes.</div>' : card('Vārda diena',matching.map{|n|"<p>#{h(n['name'])} · #{n['day']}. #{MONTHS[n['month'].to_i-1]}</p>"}.join))+widget('names')+(f=='name_calendar' ? print_panel('named',2027,nil,r['Latvian title/topic']) : '')+source_panel('Kalendārvārdu avots: Valsts valodas centrs. Pie katra ieraksta norādīta avota versija. Vēsturiskā saraksta salīdzināšana ar jaunāko izdevumu vēl turpinās; pilnu aktuālā saraksta pārklājumu neapgalvojam.')
 elsif f=='sun_city'
  body=widget('sun')+card('Kā lasīt Saules laikus','<p>Aprēķins attiecas uz pilsētas koordinātām un standarta horizontu. Vietējais reljefs, laikapstākļi un atmosfēras laušana var mainīt novērojumu. Laiks parādīts Europe/Riga joslā.</p>')+source_panel
 elsif f=='horoscope'
  body="<section class=\"horoscope-card\" data-sign=\"#{slug}\"><span class=\"eyebrow\">Izklaide un pašrefleksija</span><h2>#{h(r['Latvian title/topic'])}: dienas pārdomas</h2><div data-horoscope=\"#{slug}\"></div><p class=\"fineprint\">Astroloģijai nav zinātniski pierādīta prognozēšanas pamata. Šis teksts nav veselības, finanšu vai attiecību lēmumu ieteikums.</p></section>"+widget('zodiac')
 elsif f=='occasion'
  article=JSON.parse(File.read('_data/occasions.json')).find{|x|x['slug']==slug}
  noindex=article.nil? || !article['verified'];reason='editorial_review_pending' if noindex
  body=article ? '<article class="occasion-article">'+article['bodyHtml']+'</article>'+card('Plāno savu svētku laiku',year_links('svetku-dienas')+widget('countdown')) : source_panel('Šīs tēmas apraksts vēl tiek pārbaudīts.')
  desc=article['description'] if article
 elsif TRUST.key?(slug)
  t=TRUST[slug];body="<p class=\"lead\">#{h(t[0])}</p><div class=\"editorial-grid\">#{card('Kas jāzina',"<p>#{h(t[1])}</p>")}#{card(t[2],"<p>#{h(t[3])}</p>")}</div>"+card('Sazinies ar uzturētāju',a('mailto:kalendars365@gmail.com','kalendars365@gmail.com')+'<p>Mateo Pedersen · Kalendārs365</p>')
 elsif slug=='kontakti'
  body='<div class="contact-layout"><section><span class="eyebrow">Raksti mums</span><h2>Labs kalendārs kļūst labāks ar sarunu.</h2><p>Projekta uzturētājs: <strong>Mateo Pedersen</strong></p>'+a('mailto:kalendars365@gmail.com','kalendars365@gmail.com','contact-email')+'<p>Norādi lapas adresi un apraksti jautājumu. Neiekļauj savu privāto kalendāru vai sensitīvus datus.</p></section>'+card('Īss ceļš līdz precizējumam','<ol><li>Atver lapu, kurā redzi problēmu.</li><li>Pievieno datumu un avota saiti.</li><li>Nosūti ziņu ar savu e-pasta lietotni.</li></ol>'+a('mailto:kalendars365@gmail.com?subject=Kalendars365%20jautajums','Atvērt e-pasta lietotni','primary-button'))+'</div>'
 elsif slug=='avoti-un-metodika'
  body=card('Kalendāra aprēķini','<p>Gregora kalendārs, ISO 8601 nedēļas, pirmdiena kā nedēļas pirmā diena. Europe/Riga laika josla. Viena datu kopa baro kalendārus un drukājamos failus.</p>')+card('Oficiālie avoti','<ul>'+DATA.fetch('sources',[]).map{|s|"<li>#{a(s['url']||s['URL']||'#',s['title']||s['name']||s['id'])} — #{h({'verified'=>'Pārbaudīts','snapshot'=>'Vēsturiska versija','pending'=>'Pārbaude turpinās','snapshot_verified'=>'Pārbaudīta arhīva versija'}.fetch(s['status'],'Avota statuss norādīts aprakstā'))}</li>"}.join+'</ul>')+source_panel+card('Attēli un licences','<p id="atteli">Rīgas panorāma: Marcin Szala (Pudelek), 2011. '+a('https://commons.wikimedia.org/wiki/File:Riga_and_Daugava_-_panorama.jpg','Oriģinālais attēls')+' · '+a('https://creativecommons.org/licenses/by-sa/3.0/','CC BY-SA 3.0')+'. Vietnei izveidotas samazinātas WebP kopijas; tās pieejamas ar to pašu licenci. Interfeisā attēls var tikt apgriezts. Dekoratīvās ilustrācijas veidotas šim projektam.</p>')+card('Burtveidols un licence','<p>Vietnē, sociālajās kartītēs un drukājamajos kalendāros izmantots DM Sans Regular un DM Sans Bold. Dizains: Colophon Foundry; autortiesības: The DM Sans Project Authors. '+a('https://github.com/google/fonts/tree/main/ofl/dmsans','DM Sans — oficiālais Google Fonts avots')+' · '+a('/assets/fonts/DM-Sans-OFL.txt','SIL Open Font License 1.1')+'. Fonti tiek ielādēti no šīs vietnes servera; fontu pieprasījumi netiek sūtīti Google serveriem.</p>')+card('Pārbaudes robežas','<p>Automatizēti datumu, izvades un valodas paraugu testi neaizstāj neatkarīgu jurista vai dzimtās valodas redaktora pārbaudi. Jauna avota publikācija var mainīt nākotnes datus.</p>')
 elsif TOOL_INFO.key?(slug)
  t=TOOL_INFO[slug];body="<p class=\"lead\">#{h(t[1])}</p>"+(slug=='darba-laika-kalendars' ? planning_panel('work',y) : '')+widget(t[0],y)+source_panel
 elsif %w[tukss-kalendars izveidot-kalendaru gimenes-kalendars stundu-saraksts dzimsanas-dienu-kalendars].include?(slug)
  type={'tukss-kalendars'=>'blank','gimenes-kalendars'=>'family','stundu-saraksts'=>'school','dzimsanas-dienu-kalendars'=>'named'}[slug]||'monthly';body=print_panel(type,2027)+card('Personīgi. Privāti. Izdrukājami.','<p>Izvēlies gadu, mēnesi, dizainu un vārdu. Fotoattēli netiek augšupielādēti serverī. A4 izmēra attēla izveide var prasīt vairāk atmiņas; uzgaidi, līdz fails ir gatavs.</p>')
 elsif %w[dienas-kalendars dienas-planotajs].include?(slug)
  body='{% include app.html %}'+print_panel('daily',2027)
 elsif %w[horoskops zodiaka-zimes].include?(slug)
  body=widget('zodiac')+'<div class="link-grid">'+ROUTES.select{|s|s['Page family']=='horoscope'}.map{|s|a(s['URL path'],s['Latvian title/topic'],'link-card')}.join+'</div><p>Saturs paredzēts izklaidei. Dienas pārdomām ir konkrēts publicēšanas datums; novecojušu tekstu nerādām kā šodienas horoskopu.</p>'
 elsif slug=='meklesana'
  noindex=true;reason='internal_search';body=widget('search')
 elsif %w[gadalaiki astronomiskais-kalendars].include?(slug)
  noindex=DATA.fetch('seasons',[]).empty?;reason='season_ephemeris_pending' if noindex;body=card('Meteoroloģiskie un astronomiskie gadalaiki','<p>Meteoroloģiskais pavasaris sākas 1. martā, vasara — 1. jūnijā, rudens — 1. septembrī, ziema — 1. decembrī. Astronomiskās robežas nosaka ekvinokcijas un saulgrieži; to precīzos brīžus pievienojam tikai no pārbaudīta efemerīdu avota.</p>')+card('Astronomiskie gadalaiki Rīgas laikā','<div class="phase-list">'+DATA.fetch('seasons',[]).map{|z|"<article><b>#{h(z['event']||z['title'])}</b><time>#{h(z['date'])} #{h(z['time'])}</time></article>"}.join+'</div>')+widget('sun')+widget('moon')
 else
  children=ROUTES.select{|s|s['URL path']!=p&&s['URL path'].start_with?(p)&&s['URL path'].split('/').length<=p.split('/').length+1}
  children=ROUTES.select{|s|s['Page family']=='hub'&&s['URL path']!='/' } if children.empty?
  body='<div class="link-grid">'+children.map{|s|a(s['URL path'],title_for(s),'link-card')}.join+'</div>'
  body+=widget('moon') if slug=='meness-kalendars'
  body+=planning_panel('work',y)+widget('work',y) if slug=='darba-dienu-kalendars'
 end
 desc="#{title}. #{m ? "#{Date.new(y,m,-1).day} dienas, ISO nedēļas un izvēlētā mēneša plānošana." : 'Pārskatāmi datumi, plānošanas rīki un saites uz avotiem.'} Kalendārs365 Latvijai." if desc.empty?
 front={'layout'=>'default','title'=>title,'description'=>desc,'permalink'=>p,'family'=>f,'year'=>(r['Year'].empty? ? nil : y),'month'=>m,'week'=>week,'calendar_name'=>(f=='name_calendar' ? r['Latvian title/topic'] : nil),'view'=>(f=='iso_week' ? 'week' : f=='year' ? 'year' : nil),'noindex'=>noindex,'og_image'=>"/assets/og/#{Digest::SHA1.hexdigest(p)[0,16]}.webp"}
 content=p=='/' ? body : "<div class=\"page-shell\"><nav class=\"breadcrumbs\" aria-label=\"Atrašanās vieta\">#{a('/','Sākums')} <span>/</span> #{a('/visi-riki/','Kalendāri un rīki')}</nav><header class=\"page-heading\"><span class=\"eyebrow\">LATVIJA · KALENDĀRS365</span><h1>#{h(title)}</h1></header>#{body}<nav class=\"related-links\">#{a('/kalendars/2027/','2027. gada kalendārs')}#{a('/kalendars/2028/','2028. gada kalendārs')}#{a('/kalendars/2029/','2029. gada kalendārs')}#{a('/kalendars/2030/','2030. gada kalendārs')}#{a('/visi-riki/','Visi rīki')}</nav></div>"
 path=p=='/' ? 'index.html' : "generated#{p}index.html";FileUtils.mkdir_p(File.dirname(path));File.write(path,front.to_yaml+"---\n"+content)
 # A rebuild alone does not change lastmod. Only meaningful page content does.
 content_hash = Digest::SHA256.hexdigest(JSON.generate([title,desc,body]))
 previous_revision = previous_revisions.fetch(p,{})
 lastmod = previous_revision['sha256']==content_hash ? previous_revision['lastmod'] : revision_date
 page_revisions[p] = {sha256:content_hash,lastmod:lastmod}
 manifest << {url:p,title:title,family:f,indexable:!noindex,status:reason,description:desc,lastmod:lastmod}
end
# ISO boundary weeks are valid support routes; absent from the four-year matrix.
[[2026,53],[2031,1]].each do |y,w|
 path="generated/nedelas-kalendars/#{y}/#{format('%02d',w)}/index.html";FileUtils.mkdir_p(File.dirname(path));File.write(path,{'layout'=>'default','title'=>"#{y}. gada #{w}. nedēļa",'description'=>'ISO nedēļa pie kalendārā gada robežas.','permalink'=>"/nedelas-kalendars/#{y}/#{format('%02d',w)}/",'family'=>'iso_week','year'=>y,'week'=>w,'noindex'=>true}.to_yaml+"---\n<div class=\"page-shell\"><h1>#{y}. gada #{w}. nedēļa</h1>{% include app.html %}</div>")
end
File.write('404.html',{'layout'=>'default','title'=>'Lapa nav atrasta','description'=>'Atgriezies kalendārā vai atrodi vajadzīgo rīku.','permalink'=>'/404.html','noindex'=>true}.to_yaml+"---\n<section class=\"error-page\"><span>404</span><h1>Šī diena kalendārā nav ierakstīta.</h1><p>Lapas adrese, iespējams, ir mainījusies. Izvēlies savu nākamo soli.</p>#{a('/','Atvērt kalendāru','primary-button')} #{a('/visi-riki/','Apskatīt visus rīkus')}</section>")
File.write('500.html',{'layout'=>'default','title'=>'Īslaicīga kļūda','description'=>'Lūdzu, mēģini vēlreiz.','permalink'=>'/500.html','noindex'=>true}.to_yaml+"---\n<section class=\"error-page\"><span>500</span><h1>Plānos gadījies pārtraukums.</h1><p>Lūdzu, mēģini vēlreiz pēc brīža.</p>#{a('/','Atvērt kalendāru','primary-button')}</section>")
File.write('assets/search-index.json',JSON.generate(manifest.select{|r|r[:indexable]}))
File.write('docs/route-manifest.json',JSON.pretty_generate(manifest))
File.write('_data/page-revisions.json',JSON.pretty_generate(page_revisions)+"\n")
File.write('sitemap.xml',"---\nlayout: null\n---\n<?xml version=\"1.0\" encoding=\"UTF-8\"?><urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">"+manifest.select{|r|r[:indexable]}.map{|r|"<url><loc>{{ site.url }}#{h(r[:url])}</loc><lastmod>#{r[:lastmod]}</lastmod></url>"}.join+'</urlset>')
File.write('robots.txt',"---\nlayout: null\n---\nUser-agent: *\nAllow: /\nSitemap: {{ site.url }}/sitemap.xml\n")
File.write('_redirects',"/avoti/ /avoti-un-metodika/ 301\n/sikdatnes/ /sikdatnu-politika/ 301\n/lietošanas-noteikumi /lietošanas-noteikumi/ 301\n/lietosanas-noteikumi/ /lietošanas-noteikumi/ 301\n")
# Content-addressed global asset revision; local user data is never involved.
asset_files = (Dir.glob('assets/**/*').select{|path|File.file?(path)} + ['downloads/manifest.json'].select{|path|File.file?(path)}).sort
asset_hashes = asset_files.to_h{|path|[path,Digest::SHA256.file(path).hexdigest]}
asset_sha256 = Digest::SHA256.hexdigest(JSON.generate(asset_hashes))
File.write('_data/build.json',JSON.pretty_generate({asset_version:asset_sha256[0,16],sha256:asset_sha256,files:asset_hashes})+"\n")
puts JSON.generate({routes:manifest.length,indexable:manifest.count{|r|r[:indexable]},pending:manifest.count{|r|!r[:indexable]}})
