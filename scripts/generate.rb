# frozen_string_literal: true
require 'json'
require 'date'
require 'fileutils'
require 'cgi'
require 'yaml'
require 'digest'
require 'open3'
require 'uri'
require_relative 'occasion_components'
require_relative 'garden_components'
require_relative 'organizer_components'
require_relative 'latvia_components'
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
CITIES = JSON.parse(File.read('_data/cities.json')).fetch('cities')
EDITORIAL = JSON.parse(File.read('_data/editorial-metadata.json')).fetch('routes').to_h{|r|[r.fetch('url'),r]}
HOROSCOPE_PROFILES = JSON.parse(File.read('_data/horoscope/profiles.json')).fetch('profiles')
zodiac_art_build, zodiac_art_error, zodiac_art_status = Open3.capture3(ENV.fetch('NODE', 'node'), 'scripts/build_zodiac_art.mjs')
abort "Zodiac artwork build failed: #{zodiac_art_error}" unless zodiac_art_status.success?
category_art_build, category_art_error, category_art_status = Open3.capture3('ruby', 'scripts/build_category_art.rb')
abort "Category artwork build failed: #{category_art_error}" unless category_art_status.success?
celestial_art, celestial_error, celestial_status = Open3.capture3(ENV.fetch('NODE', 'node'), 'scripts/build_celestial_art.mjs')
abort "Celestial photo art build failed: #{celestial_error}" unless celestial_status.success?
FileUtils.cp('lib/vendor/astronomy.mjs', 'assets/vendor/astronomy-engine.mjs')
FileUtils.cp('lib/vendor/LICENSE-astronomy-engine.txt', 'assets/vendor/LICENSE-astronomy-engine.txt')
LATVIA_EXTRA = JSON.parse(File.read('_data/latvia-extra-pages.json'))
LATVIA_VERIFIED = JSON.parse(File.read('_data/latvia-verified-data.json'))
LATVIA_EXTRA_PAGES = (LATVIA_EXTRA.fetch('directTargets') + [LATVIA_EXTRA.fetch('educationPage')] + LATVIA_EXTRA.fetch('culturalPages')).to_h { |item| [item.fetch('url'), item] }
horoscope_build, horoscope_build_error, horoscope_build_status = Open3.capture3(ENV.fetch('NODE', 'node'), 'scripts/build_horoscope_data.mjs')
abort "Horoscope data build failed: #{horoscope_build_error}" unless horoscope_build_status.success?
horoscope_snapshot_json, horoscope_snapshot_error, horoscope_snapshot_status = Open3.capture3(ENV.fetch('NODE', 'node'), 'scripts/render_horoscope_snapshot.mjs')
abort "Horoscope snapshot failed: #{horoscope_snapshot_error}" unless horoscope_snapshot_status.success?
HOROSCOPE_SNAPSHOT = JSON.parse(horoscope_snapshot_json).freeze
HOROSCOPE_DAY = HOROSCOPE_SNAPSHOT.fetch('edition').fetch('date')
astronomy_build, astronomy_error, astronomy_status = Open3.capture3(ENV.fetch('NODE', 'node'), 'scripts/build_latvia_astronomy.mjs')
abort "Latvia astronomy build failed: #{astronomy_error}" unless astronomy_status.success?
File.write('assets/horoscopes.json', JSON.generate(HOROSCOPE_SNAPSHOT.fetch('edition')))
planning_json, planning_error, planning_status = Open3.capture3(ENV.fetch('NODE', 'node'), 'scripts/render_planning.cjs')
abort "Planning prerender failed: #{planning_error}" unless planning_status.success?
PLANNING_MARKUP = JSON.parse(planning_json).freeze
def h(s); CGI.escapeHTML(s.to_s); end
def icon_for(url)
 month_index=%w[janvaris februaris marts aprilis maijs junijs julijs augusts septembris oktobris novembris decembris].index(url.to_s.split('/').reject(&:empty?).last)
 return "month-#{month_index+1}" if month_index
 case url
 when /privatum|sikdatnu/ then 'shield'
 when /kontakti|par-projektu|avoti/ then 'info'
 when /meness|pilnmeness|jaunmeness|astronom/ then 'moon'
 when /saullekts|gadalaiki/ then 'sun'
 when /skola|stundu|studiju|macibu|parbaudes/ then 'school'
 when /gimenes/ then 'family'
 when /atvalinajuma|garas-brivdienas/ then 'vacation'
 when /svetki|svetku|atceres/ then 'gift'
 when /varda/ then 'sprout'
 when /darba|mainu/ then 'briefcase'
 when /kalkulator|skaititajs/ then 'calculator'
 when /pdf/ then 'print'
 when /horoskop|zodiaka/ then 'star'
 when /sejas|darza/ then 'sprout'
 else 'calendar'
 end
end
def ui_icon(name); %(<svg class="icon" aria-hidden="true"><use href="#i-#{name}"/></svg>); end
def visual_family(family, url = '')
 case family
 when 'sun_city' then 'sun'
 when 'sky_hub' then url.include?('meness') ? 'moon' : 'sun'
 when 'moon_city','lunar_year','lunar_month' then 'moon'
 when 'garden','garden_month' then 'garden'
 when 'horoscope' then 'zodiac'
 when 'school_academic','school_year_calendar' then 'school'
 when 'work_year','work_month','long_weekends' then 'work'
 when 'holiday_year','holiday_month' then 'holiday'
 when 'memorial_year' then 'memorial'
 when 'latvia_cultural','occasion' then 'culture'
 when 'latvia_special'
  case url
  when /atceres/ then 'memorial'
  when /skolas|studiju|parbaudes/ then 'school'
  when /pabalstu|pensiju/ then 'work'
  when /redakcijas/ then 'about'
  when /dienas-garums/ then 'sun'
  when /gada-diena|garais-gads/ then 'calendar'
  when /pulkstena/ then 'tools'
  when /nozimigas/ then 'culture'
  else 'astronomy'
  end
 when 'city_photos' then 'city'
 when 'name_calendar','name_day_month' then 'names'
 when 'print_index','print_month' then 'print'
 when 'iso_week','week_index' then 'week'
 when 'year','calendar_month','month_index' then 'calendar'
 else
  url_visual = url.to_s
  case url_visual
  when /privacy|legal|terms|cookie|privatum|sikdatnu|lietošanas/ then 'privacy'
  when /about|contact|source|edit|par-projektu|kontakti|avoti|labojumi/ then 'about'
  when /astronom|aptums|perseidas/ then 'astronomy'
  when /meness-fazes/ then 'phases'
  when /meness|pilnmeness|jaunmeness|mēness/ then 'moon'
  when /gadalaiki/ then 'seasons'
  when /saullekts|saulriets|dienas-garums/ then 'sun'
  when /horoskop|zodiak/ then 'zodiac'
  when /stundu-saraksts/ then 'timetable'
  when /skola|studiju|macibu|parbaudes/ then 'school'
  when /atceres/ then 'memorial'
  when /svetk|tradici/ then 'holiday'
  when /mainu/ then 'shift'
  when /darba/ then 'work'
  when /gimenes|dzimsanas|family|birthday/ then 'family'
  when /sejas|darza/ then 'garden'
  when /varda/ then 'names'
  when /pdf|print/ then 'print'
  when /nedelas-kalendars/ then 'week'
  when /atvalinajuma/ then 'vacation'
  when /visi-riki/ then 'alltools'
  when /atvalinajuma|garas-brivdienas|kalkulator|skaititajs|visi-riki|planotajs|riki/ then 'tools'
  else 'calendar'
  end
 end
end
def visual_icon(family)
 {'phases'=>'moon-phases','seasons'=>'seasons','timetable'=>'timetable','shift'=>'shift','vacation'=>'vacation','alltools'=>'alltools','sun'=>'sun','moon'=>'moon','garden'=>'garden','zodiac'=>'star','school'=>'school','work'=>'briefcase','culture'=>'gift','holiday'=>'gift','memorial'=>'flower','astronomy'=>'star','city'=>'pin','names'=>'sprout','print'=>'print','week'=>'week','calendar'=>'calendar','family'=>'family','tools'=>'calculator','privacy'=>'shield','about'=>'info'}.fetch(family,'calendar')
end
def hero_context(family,url,year,month,slug)
 if family=='latvia_special'
  {'school'=>'Latvijas mācību un studiju datumi','memorial'=>'Latvijas atceres dienas','work'=>'Latvijas maksājumu kalendārs','about'=>'Avoti un redakcionālie principi','sun'=>'Saules laiki Latvijā','calendar'=>'Latvijas datumi · Europe/Riga','tools'=>'Latvijas laiks · Europe/Riga','culture'=>'Latvijas svētki un tradīcijas','astronomy'=>'Debesu notikumi Latvijā'}.fetch(visual_family(family,url))
 elsif %w[sun_city moon_city].include?(family)
  city=CITIES.find{|item|item['id']==slug}
  "#{city ? city['name'] : 'Latvija'} · Europe/Riga"
 elsif %w[garden garden_month].include?(family)
  'Latvijas audzēšanas apstākļi'
 elsif family=='horoscope'
  '12 zodiaka zīmes · dienas lasījums'
 elsif %w[occasion latvia_cultural memorial_year holiday_year holiday_month latvia_special].include?(family)
  'Latvijas svētki · atceres · tradīcijas'
 elsif %w[school_academic school_year_calendar].include?(family)
  'Latvijas mācību gada kalendārs'
 elsif year && month
  "#{year}. gads · #{MONTHS[month-1]}"
 elsif year
  "#{year}. gada kalendārs Latvijai"
 elsif url.start_with?('/privatuma','/sikdatnu')
  'Vienkārši un pārskatāmi privātuma noteikumi'
 else
  'Latvijas datumi · Europe/Riga'
 end
end
def page_heading_markup(family,url,heading,description,year,month,slug)
 visual=visual_family(family,url)
 symbol=visual_icon(visual)
 context=hero_context(family,url,year,month,slug)
 %(<header class="page-heading page-heading--#{h(visual)}"><div class="page-heading-copy"><span class="eyebrow">LATVIJA · KALENDĀRS365</span><h1><span class="page-heading-mark">#{ui_icon(icon_for(url))}</span><span>#{h(heading)}</span></h1><p class="page-heading-deck">#{h(description)}</p><span class="page-heading-context">#{ui_icon(symbol)}<span>#{h(context)}</span></span></div><div class="page-heading-art" aria-hidden="true"><img class="page-heading-art-icon" src="/assets/category-art/#{h(visual)}.svg?v={{ site.data.build.asset_version }}" alt="" width="320" height="260" loading="eager" decoding="async"><span class="page-heading-art-chip">#{h(context)}</span></div></header>)
end

def phase_svg(name, date, index)
 ident="moon-photo-#{date.to_s.gsub(/[^0-9]/,'')}-#{index}"
 shadow = case name
 when /Jaunmēness/i then '<circle cx="50" cy="50" r="43" fill="#03060d" opacity=".97"/>'
 when /Pirmais ceturksnis/i then '<path d="M50 7 A43 43 0 0 0 50 93Z" fill="#03060d" opacity=".98"/>'
 when /Pēdējais ceturksnis/i then '<path d="M50 7 A43 43 0 0 1 50 93Z" fill="#03060d" opacity=".98"/>'
 else ''
 end
 %(<svg class="phase-moon" viewBox="0 0 100 100" role="img" aria-label="#{h(name)}"><defs><clipPath id="#{ident}"><circle cx="50" cy="50" r="43"/></clipPath></defs><g clip-path="url(##{ident})"><image href="/assets/astronomy/moon-disc.webp" x="7" y="7" width="86" height="86"/>#{shadow}</g></svg>)
end
def zodiac_art(profile,klass='zodiac-index-symbol',size=80)
 slug=profile.fetch('slug')
 %(<img class="#{h(klass)}" src="/assets/zodiac/#{h(slug)}.svg?v={{ site.data.build.asset_version }}" alt="" aria-hidden="true" width="#{size}" height="#{size}" loading="eager" decoding="async">)
end
def a(url,label,klass=''); %(<a class="#{klass}" href="#{h(url)}">#{klass=='link-card' ? ui_icon(icon_for(url)) : ''}#{h(label)}</a>); end
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
 return '{% include sky-tool.html %}' if type=='sun'
 return planning_panel('leave',year) if type=='leave'
 return work_widget(year) if type=='work'
 return '<section class="widget-panel" data-server-rendered="calculator">'+calculator_markup+'</section>' if %w[calculator date].include?(type)
 "<section class=\"widget-panel\" data-widget=\"#{type}\"></section>"
end
def card(title,body); "<section class=\"content-card\"><h2>#{h(title)}</h2>#{body}</section>"; end
def year_links(prefix); "<nav class=\"year-pills\" aria-label=\"Gada izvēle\">#{(2026..2030).map{|y|a("/#{prefix}/#{y}/",y.to_s)}.join}</nav>"; end
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
 "<section class=\"content-card print-section\" data-print-type=\"#{type}\" data-print-year=\"#{y}\" data-print-month=\"#{m}\" data-print-name=\"#{h(name)}\"><h2>Kalendārs uz papīra. Tavā stilā.</h2><p>Izvēlies vienu no 15 kompozīcijām. PDF ar vektoru tekstu vai atbilstošs A4 attēls 600 ppi izšķirtspējā. Faila veidošana notiek tavā ierīcē.</p>#{widget('print')}</section>"
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
 when 'year' then "Kalendārs #{y}"
 when 'calendar_month' then "#{y}. gada #{GEN[m-1]} kalendārs"
 when 'iso_week' then "#{y}. gada #{p.split('/').last.to_i}. nedēļa"
 when 'lunar_month' then "#{y}. gada #{GEN[m-1]} Mēness kalendārs"
 when 'work_month' then "Darba dienas #{y}. gada #{GEN[m-1]} mēnesī"
 when 'holiday_month' then "Svētku dienas #{y}. gada #{GEN[m-1]} mēnesī"
 when 'print_month' then "#{y}. gada #{GEN[m-1]} kalendārs PDF un attēli formātā"
 when 'moon_city' then "Mēness lēkts un riets — #{t}"
 when 'sun_city' then "Saullēkts un saulriets — #{t}"
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
 when 'latvia_cultural', 'latvia_special' then t
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
  desc='Latvijas kalendārs, svētku dienas un ikdienas plānošana. 2026.–2030. gada kalendāri, personīgie notikumi un lejupielādējami PDF.'
 elsif f=='garden'
  if slug=='sejas-kalendars'
   title='Sējas un stādīšanas kalendārs Latvijā'
   heading=title
   desc='Latvijas dārzeņu sējas un stādīšanas orientieri, avoti, salnu un augsnes apstākļi. Izveido personiskus atgādinājumus savam dārzam.'
   body=garden_hub_markup
  else
   crop=GARDEN_CROPS[slug]
   if crop
    title=crop.fetch('title');heading=crop.fetch('h1');desc=crop.fetch('description');body=garden_profile_markup(crop)
   else
    noindex=true;reason='garden_profile_missing';body='<section class="content-card"><h2>Šī dārzeņa apraksts nav pieejams.</h2><p>Atver sējas kalendāra pārskatu.</p>'+a('/sejas-kalendars/','Sējas kalendārs')+'</section>'
   end
  end
 elsif f=='garden_month'
  locative=GARDEN_MONTH_LOCATIVE[m-1]
  title="Sējas kalendārs #{locative}"
  heading="Dārza darbi #{locative}"
  desc="#{GARDEN_MONTHS[m-1]} sējas un stādīšanas orientieri Latvijā. Pārbaudi avotos norādītos augsnes, šķirnes un salnu nosacījumus."
  body=garden_hub_markup(m)
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
  body=if m
   lunar_month_markup(y,m)+print_panel('lunar',y,m)+source_panel('Redzamā Mēness diska apgaismojums un virziena leņķis tiek aprēķināts izvēlētās pilsētas koordinātām plkst. 12.00 Europe/Riga laikā ar Astronomy Engine DE421 efemerīdām. Mēness lēkta un rieta brīžus aprēķina lokāls novērotāja modelis, ņemot vērā Mēness diska malu un atmosfēras refrakciju. Galveno fāžu precīzie brīži ņemti no USNO, bet virsmas attēla mozaīka — no NASA LRO/LROC.')
  else
   lunar_year_markup(y)
  end
 elsif %w[school_academic school_year_calendar].include?(f)
  school_years = {'2026-27'=>'2026./2027.','2027-28'=>'2027./2028.','2028-29'=>'2028./2029.','2029-30'=>'2029./2030.','2030-31'=>'2030./2031.'}
  if f == 'school_academic' && slug == '2026-27'
   body=school_calendar_markup+widget('countdown')+print_panel('school',2027)
  else
   noindex=true;reason='school_dates_pending'
   academic_slug = f == 'school_academic' ? slug : (y <= 2026 ? '2026-27' : "#{y}-#{(y+1).to_s[-2,2]}")
   academic_label = school_years[academic_slug] || "#{y}./#{y+1}."
   body="<section class=\"content-card school-pending\"><p class=\"eyebrow\">#{h(academic_label)} mācību gads</p><h2>Oficiālais brīvlaiku grafiks vēl nav publicēts</h2><p>Šajā lapā nav apstiprinātu datumu. Iepriekšējā mācību gada brīvlaikus nepārceļam uz nākamo gadu. Tiklīdz grafiku publicēs Izglītības un zinātnes ministrija, šeit būs norādīta datumu kopa un tās pirmavots.</p><p>Pašlaik publicētais grafiks: #{a('/skolas-brivlaiki/2026-27/','2026./2027. mācību gada skolas brīvlaiki')}.</p></section>"+card('Izvēlies mācību gadu','<div class="link-grid">'+school_years.map{|year,label|a("/skolas-brivlaiki/#{year}/","#{label} mācību gads",'link-card')}.join+'</div>')+verified_sources_panel(['school-2027'],'Skolas datumi attiecas tikai uz attiecīgo oficiāli publicēto mācību gadu; nākamo gadu termiņi netiek prognozēti.')
  end
 elsif %w[name_calendar name_day_month].include?(f)
  names=DATA.fetch('names',[]);matching=f=='name_calendar' ? names.select{|n|n['name']==r['Latvian title/topic']} : names.select{|n|n['month'].to_i==m}
  noindex=matching.empty? || !DATA.fetch('assumptions',{}).fetch('namesComplete',false);reason='name_source_pending' if noindex
  body=(noindex ? '<div class="notice">Vārda dienas datums vēl nav pārbaudīts oficiālajā sarakstā. Personalizētu kalendāru vari izveidot bez vārda dienas atzīmes.</div>' : card('Vārda diena',matching.map{|n|"<p>#{h(n['name'])} · #{n['day']}. #{MONTHS[n['month'].to_i-1]}</p>"}.join))+widget('names')+(f=='name_calendar' ? print_panel('named',2027,nil,r['Latvian title/topic']) : '')+source_panel('Kalendārvārdu avots: Valsts valodas centrs. Pie katra ieraksta norādīta avota versija. Vēsturiskā saraksta salīdzināšana ar jaunāko izdevumu vēl turpinās; pilnu aktuālā saraksta pārklājumu neapgalvojam.')
 elsif f=='sky_hub'
  body='{% include sky-tool.html kind="moon" %}'+'<section class="sun-city-options"><h2>Mēness laiki visās Latvijas pilsētās</h2><div class="link-grid">'+CITIES.map{|c|a('/meness-lekts-un-riets/'+c['id']+'/',c['name'],'link-card')}.join+'</div></section>'
 elsif f=='moon_city'
  body='{% include sky-tool.html kind="moon" %}'+source_panel('Mēness fāzes apgaismojums ir aprēķināts izvēlētās dienas plkst. 12.00 Europe/Riga laikā. Lēkts un riets atkarīgs no pilsētas koordinātām.')
 elsif f=='sun_city'
  city=CITIES.find{|c|c['id']==slug}
  desc="Saullēkts, saulriets un dienas garums pilsētā #{city.fetch('name')}. Europe/Riga laiks un aptuvens astronomisks aprēķins pilsētas centram."
  body=widget('sun')+card('Kā lasīt Saules laikus','<p>Aprēķins attiecas uz pilsētas koordinātām un standarta horizontu. Vietējais reljefs, laikapstākļi un atmosfēras laušana var mainīt novērojumu. Laiks parādīts Europe/Riga joslā.</p>')+source_panel
 elsif f=='horoscope'
  profile=HOROSCOPE_PROFILES.find{|item|item['slug']==slug}
  if profile
   issue=HOROSCOPE_SNAPSHOT.fetch('dailyMarkup').fetch(slug)
   body="<section class=\"horoscope-page\" data-sign=\"#{h(slug)}\"><div class=\"horoscope-daily-feature\"><!--K365-HOROSCOPE-BEGIN:#{h(slug)}--><div data-horoscope-view=\"#{h(slug)}\" data-edition-date=\"#{HOROSCOPE_DAY}\">#{issue}</div><!--K365-HOROSCOPE-END:#{h(slug)}--></div>#{HOROSCOPE_SNAPSHOT.fetch('profileMarkup').fetch(slug)}</section>"
  else
   noindex=true;reason='horoscope_profile_missing';body='<section class="content-card"><h2>Zīmes apraksts nav pieejams.</h2>'+a('/horoskops/','Horoskopu pārskats')+'</section>'
  end
 elsif f=='latvia_cultural'
  article=LATVIA_EXTRA_PAGES[p]
  if article
   body=cultural_page_markup(article);desc=article['description'];noindex=false;reason='ready'
  else
   body='<section class="content-card"><p>Šīs kultūras tēmas saturs vēl tiek pārbaudīts.</p></section>';noindex=true;reason='culture_source_pending'
  end
 elsif f=='latvia_special'
  if p.start_with?('/atceres-dienas/')
   month_index=SLUGS.index(slug)
   if month_index
    title="Atceres un atzīmējamās dienas #{GARDEN_MONTH_LOCATIVE[month_index]}"
    heading=title
    desc="Latvijas atceres un atzīmējamo dienu datumi #{GARDEN_MONTH_LOCATIVE[month_index]}. Pārbaudi gadam atbilstošo ierakstu un tā juridisko statusu."
    body=memorial_month_markup(month_index+1)+verified_sources_panel(['holiday-law'],'Atceres diena pati par sevi nav likumā noteikta brīvdiena.')
   else
    noindex=true;reason='memorial_month_missing';body='<p>Šī mēneša saraksts nav pieejams.</p>'
   end
  else
   extra_page=LATVIA_EXTRA_PAGES[p]
   body=latvia_special_markup(p,extra_page)
   desc=extra_page['description'] if extra_page
   noindex=true;reason='latvia_special_missing' unless extra_page || %w[nozimigas-dienas].include?(slug)
  end
 elsif f=='occasion'
  article=JSON.parse(File.read('_data/occasions.json')).find{|x|x['slug']==slug}
  noindex=article.nil? || !article['verified'];reason='editorial_review_pending' if noindex
  body=article ? occasion_page(article,JSON.parse(File.read('_data/occasions.json'))) : source_panel('Šīs tēmas apraksts vēl tiek pārbaudīts.')
  desc=article['description'] if article
 elsif TRUST.key?(slug)
  t=TRUST[slug];body="<p class=\"lead\">#{h(t[0])}</p><div class=\"editorial-grid\">#{card('Kas jāzina',"<p>#{h(t[1])}</p>")}#{card(t[2],"<p>#{h(t[3])}</p>")}</div>"+card('Sazinies ar uzturētāju',a('mailto:kalendars365@gmail.com','kalendars365@gmail.com')+'<p>Mateo Pedersen · Kalendārs365</p>')
 elsif slug=='kontakti'
  body='<div class="contact-layout"><section><span class="eyebrow">Raksti mums</span><h2>Labs kalendārs kļūst labāks ar sarunu.</h2><p>Projekta uzturētājs: <strong>Mateo Pedersen</strong></p>'+a('mailto:kalendars365@gmail.com','kalendars365@gmail.com','contact-email')+'<p>Norādi lapas adresi un apraksti jautājumu. Neiekļauj savu privāto kalendāru vai sensitīvus datus.</p></section>'+card('Īss ceļš līdz precizējumam','<ol><li>Atver lapu, kurā redzi problēmu.</li><li>Pievieno datumu un avota saiti.</li><li>Nosūti ziņu ar savu e-pasta lietotni.</li></ol>'+a('mailto:kalendars365@gmail.com?subject=Kalendars365%20jautajums','Atvērt e-pasta lietotni','primary-button'))+'</div>'
 elsif slug=='avoti-un-metodika'
  body=card('Kalendāra aprēķini','<p>Gregora kalendārs, ISO 8601 nedēļas, pirmdiena kā nedēļas pirmā diena. Europe/Riga laika josla. Viena datu kopa baro kalendārus un drukājamos failus.</p>')+card('Oficiālie avoti','<ul>'+DATA.fetch('sources',[]).map{|s|"<li>#{a(s['url']||s['URL']||'#',s['title']||s['name']||s['id'])} — #{h({'verified'=>'Pārbaudīts','snapshot'=>'Vēsturiska versija','pending'=>'Pārbaude turpinās','snapshot_verified'=>'Pārbaudīta arhīva versija'}.fetch(s['status'],'Avota statuss norādīts aprakstā'))}</li>"}.join+'</ul>')+source_panel+card('Attēli un licences','<p id="atteli">Rīgas panorāma: Marcin Szala (Pudelek), 2011. '+a('https://commons.wikimedia.org/wiki/File:Riga_and_Daugava_-_panorama.jpg','Oriģinālais attēls')+' · '+a('https://creativecommons.org/licenses/by-sa/3.0/','CC BY-SA 3.0')+'. Vietnei izveidotas samazinātas WebP kopijas; tās pieejamas ar to pašu licenci. Interfeisā attēls var tikt apgriezts. Pilsētu kartē izmantotas 82 atsevišķas īstu pilsētu fotogrāfijas. '+a('/pilsetas-un-fotografijas/','Visu fotogrāfiju autori un licences')+'. Saskarnes ilustrācijas izstrādātas Kalendāram365.</p>')+card('Burtveidols un licence','<p>Vietnes interfeiss izmanto Avenir vai Avenir Next, ja tas ir instalēts apmeklētāja ierīcē; citādi tiek izmantots sistēmas sans-serif fonts. Licencēti Avenir failu dati netiek izplatīti. Sociālajās kartītēs un drukājamajos kalendāros izmantots DM Sans Regular un DM Sans Bold. Dizains: Colophon Foundry; autortiesības: The DM Sans Project Authors. '+a('https://github.com/google/fonts/tree/main/ofl/dmsans','DM Sans — oficiālais Google Fonts avots')+' · '+a('/assets/fonts/DM-Sans-OFL.txt','SIL Open Font License 1.1')+'. Fonti tiek ielādēti no šīs vietnes servera; fontu pieprasījumi netiek sūtīti Google serveriem.</p>')+card('Prognoze un stacijas mērījums','<p>MET Norway prognoze ir aprēķināta pilsētas centram. Atsevišķā kartītē rāda tuvākās LVĢMC stacijas stundas vidējo temperatūru: norādīts attālums, stacijas nosaukums un stundas sākums Latvijas laikā. Der tikai pēdējo 3 stundu mērījumi līdz 50 km attālumā. LVĢMC portāla dati ir operatīvi, ar pamata kvalitātes pārbaudi; tie nav galīgi verificēti. '+a('https://data.gov.lv/dati/dataset/hidrometeorologiskie-noverojumi','LVĢMC avots un CC0 licence')+'. Kartīte nerāda radaru, un stacijas mērījums nav katras pilsētas ielas novērojums.</p>')+card('Pārbaudes robežas','<p>Automatizēti datumu, izvades un valodas paraugu testi neaizstāj neatkarīgu jurista vai dzimtās valodas redaktora pārbaudi. Jauna avota publikācija var mainīt nākotnes datus.</p>')
 elsif TOOL_INFO.key?(slug)
  t=TOOL_INFO[slug];body="<p class=\"lead\">#{h(t[1])}</p>"+(slug=='darba-laika-kalendars' ? planning_panel('work',y) : '')+widget(t[0],y)+source_panel
 elsif slug=='gimenes-kalendars'
  body=family_planner_markup
 elsif slug=='stundu-saraksts'
  body=timetable_planner_markup
 elsif %w[tukss-kalendars izveidot-kalendaru dzimsanas-dienu-kalendars].include?(slug)
  type={'tukss-kalendars'=>'blank','dzimsanas-dienu-kalendars'=>'named'}[slug]||'monthly';body=print_panel(type,2027)+card('Personīgi. Privāti. Izdrukājami.','<p>Izvēlies gadu, mēnesi, dizainu un vārdu. Fotoattēli netiek augšupielādēti serverī. A4 izmēra attēla izveide var prasīt vairāk atmiņas; uzgaidi, līdz fails ir gatavs.</p>')
 elsif %w[dienas-kalendars dienas-planotajs].include?(slug)
  body='{% include app.html %}'+print_panel('daily',2027)
 elsif slug=='zodiaka-zimes'
  cards=HOROSCOPE_PROFILES.map do |profile|
   element=profile.fetch('element');name=profile.fetch('name');sign_slug=profile.fetch('slug')
   %(<article class="zodiac-index-card">#{zodiac_art(profile,'zodiac-index-symbol',80)}<div class="zodiac-index-heading"><span class="eyebrow">#{h(element.fetch('label'))} · #{h(profile.fetch('modality').fetch('label'))}</span><h2>#{h(name)}</h2></div><p>#{h(profile.fetch('summary'))}</p>#{a("/horoskops/#{h(sign_slug)}/","Atvērt #{h(profile.fetch('genitive').downcase)} horoskopu →")}</article>)
  end.join
  method=JSON.parse(File.read('_data/horoscope/method.json'))
  body=%(<section class="zodiac-index"><p class="lead">Iepazīsti 12 populārās Rietumu tropiskā zodiaka zīmes, to simbolus, elementus un tradicionālo simboliku.</p><div class="zodiac-index-grid">#{cards}</div>)+card('Kā lasīt zīmju aprakstus',"<p>#{h(method.fetch('selectionExplanation'))}</p><p>#{h(method.fetch('astronomyNotice'))}</p><p>#{h(method.fetch('shortDisclosure'))}</p>")+a('/horoskops/','Lasīt šodienas horoskopu →','primary-button')+'</section>'
 elsif slug=='horoskops'
  body=widget('zodiac')+"<!--K365-HOROSCOPE-BEGIN:collection--><section data-horoscope-collection data-edition-date=\"#{HOROSCOPE_DAY}\">#{HOROSCOPE_SNAPSHOT.fetch('collectionMarkup')}</section><!--K365-HOROSCOPE-END:collection-->"+card(HOROSCOPE_PROFILES.first['seo']['title'].split(':').first,'<p>'+h(JSON.parse(File.read('_data/horoscope/method.json')).fetch('selectionExplanation'))+'</p><p>'+h(JSON.parse(File.read('_data/horoscope/method.json')).fetch('astronomyNotice'))+'</p><p>'+h(JSON.parse(File.read('_data/horoscope/method.json')).fetch('shortDisclosure'))+'</p>')+'<div class="link-grid">'+ROUTES.select{|s|s['Page family']=='horoscope'}.map{|s|a(s['URL path'],s['Latvian title/topic'],'link-card')}.join+'</div>'
 elsif slug=='meklesana'
  noindex=true;reason='internal_search';body=widget('search')
 elsif %w[gadalaiki astronomiskais-kalendars].include?(slug)
  noindex=DATA.fetch('seasons',[]).empty?;reason='season_ephemeris_pending' if noindex;body=card('Meteoroloģiskie un astronomiskie gadalaiki','<p>Meteoroloģiskais pavasaris sākas 1. martā, vasara — 1. jūnijā, rudens — 1. septembrī, ziema — 1. decembrī. Astronomiskās robežas nosaka ekvinokcijas un saulgrieži; to precīzos brīžus pievienojam tikai no pārbaudīta efemerīdu avota.</p>')+card('Astronomiskie gadalaiki Rīgas laikā','<div class="phase-list">'+DATA.fetch('seasons',[]).map{|z|"<article><b>#{h(z['event']||z['title'])}</b><time>#{h(z['date'])} #{h(z['time'])}</time></article>"}.join+'</div>')+widget('sun')+widget('moon')
 elsif slug=='skolas-brivlaiki'
  title='Skolas brīvlaiki Latvijā';heading=title;desc='Latvijas skolēnu oficiālie brīvlaiki, mācību semestru datumi un klašu beigu termiņi. Katram mācību gadam norādīts atsevišķs avots.'
  body=school_calendar_markup+card('Mācību gadi','<div class="link-grid">'+[['2026-27','2026./2027.'],['2027-28','2027./2028.'],['2028-29','2028./2029.'],['2029-30','2029./2030.'],['2030-31','2030./2031.']].map{|year,label|a("/skolas-brivlaiki/#{year}/","#{label} mācību gads",'link-card')}.join+'</div>')
 elsif slug=='meness-kalendars'
  noindex=DATA.fetch('moon',[]).empty?;reason='moon_source_pending' if noindex
  body=lunar_year_index_markup
 else
  children=ROUTES.select{|s|s['URL path']!=p&&s['URL path'].start_with?(p)&&s['URL path'].split('/').length<=p.split('/').length+1}
  children=ROUTES.select{|s|s['Page family']=='hub'&&s['URL path']!='/' } if children.empty?
  body='<div class="link-grid">'+children.map{|s|a(s['URL path'],title_for(s),'link-card')}.join+'</div>'
  body+=widget('moon') if slug=='meness-kalendars'
  body+=planning_panel('work',y)+widget('work',y) if slug=='darba-dienu-kalendars'
 end
 editorial=EDITORIAL[p] || {}
 if p=='/nozimigas-dienas/'
  title='Nozīmīgas dienas Latvijā';heading='Nozīmīgas dienas Latvijā';desc='Latvijas svētku dienas, gadskārtu notikumi un citas avotos pārbaudītas kultūras tēmas. Pārbaudi datumu un atšķir to no likumā noteiktas brīvdienas.'
 end
 heading=editorial.fetch('h1',title)
 title=editorial.fetch('title',title)
 title="Kalendārs #{y}" if f=='year'
 desc=editorial.fetch('description',desc)
 if f=='horoscope' && (profile=HOROSCOPE_PROFILES.find{|item|item['slug']==slug})
  title=profile.fetch('seo').fetch('title');heading="#{profile.fetch('genitive')} horoskops";desc=profile.fetch('seo').fetch('description')
 elsif slug=='horoskops'
  collection_seo=JSON.parse(File.read('_data/horoscope/method.json')).fetch('collectionSeo')
  title=collection_seo.fetch('title');heading='Dienas horoskops latviešu valodā';desc=collection_seo.fetch('description')
 elsif slug=='zodiaka-zimes'
  title='Zodiaka zīmes: nosaukumi un simbolika';heading='12 zodiaka zīmes un to elementi';desc='Iepazīsti Aunu, Vērsi, Dvīņus un pārējās zodiaka zīmes, to elementus un simbolisko nozīmi. Dienas horoskopi katrai zīmei.'
 end
 desc="#{title}. #{m ? "#{Date.new(y,m,-1).day} dienas, ISO nedēļas un izvēlētā mēneša plānošana." : 'Pārskatāmi datumi, plānošanas rīki un saites uz avotiem.'} Kalendārs365 Latvijai." if desc.empty?
 front={'layout'=>'default','title'=>title,'description'=>desc,'permalink'=>p,'family'=>f,'city_id'=>(%w[sun_city moon_city].include?(f) ? slug : nil),'year'=>(r['Year'].empty? ? nil : y),'month'=>m,'week'=>week,'calendar_name'=>(f=='name_calendar' ? r['Latvian title/topic'] : nil),'view'=>(f=='iso_week' ? 'week' : f=='year' ? 'year' : nil),'noindex'=>noindex,'og_image'=>(File.file?("assets/og/#{Digest::SHA1.hexdigest(p)[0,16]}.webp") ? "/assets/og/#{Digest::SHA1.hexdigest(p)[0,16]}.webp" : File.file?("assets/og/#{f}.png") ? "/assets/og/#{f}.png" : '/assets/og/home.png')}
 front.delete_if{|_,value|value.nil?}
 if slug=='saullekts-saulriets'
  body += '<section class="sun-city-options"><h2>Saules laiki visās Latvijas pilsētās</h2><div class="link-grid">'+CITIES.map{|c|a('/saullekts-saulriets/'+c['id']+'/',c['name'],'link-card')}.join+'</div></section>'
 end
 visual=visual_family(f,p)
 content=p=='/' ? body : "<div class=\"page-shell page-shell--#{h(f)} page-shell--visual-#{h(visual)}\"><nav class=\"breadcrumbs\" aria-label=\"Atrašanās vieta\">#{breadcrumb_markup(p,title)}</nav>#{page_heading_markup(f,p,heading,desc,y,m,slug)}#{body}<nav class=\"related-links\">#{a('/kalendars/2026/','2026. gada kalendārs')}#{a('/kalendars/2027/','2027. gada kalendārs')}#{a('/kalendars/2028/','2028. gada kalendārs')}#{a('/kalendars/2029/','2029. gada kalendārs')}#{a('/kalendars/2030/','2030. gada kalendārs')}#{a('/visi-riki/','Visi rīki')}</nav></div>"
 path=p=='/' ? 'index.html' : "generated#{p}index.html";FileUtils.mkdir_p(File.dirname(path));File.write(path,front.to_yaml+"---\n"+content)
 # A rebuild alone does not change lastmod. Only meaningful page content does.
 content_hash = Digest::SHA256.hexdigest(JSON.generate([title,desc,body]))
 previous_revision = previous_revisions.fetch(p,{})
 lastmod = previous_revision['sha256']==content_hash ? previous_revision['lastmod'] : revision_date
 page_revisions[p] = {sha256:content_hash,lastmod:lastmod}
 manifest << {url:p,title:title,family:f,indexable:!noindex,status:reason,description:desc,lastmod:lastmod}
end
# ISO boundary weeks are valid support routes; absent from the four-year matrix.
[[2031,1]].each do |y,w|
 path="generated/nedelas-kalendars/#{y}/#{format('%02d',w)}/index.html";FileUtils.mkdir_p(File.dirname(path));File.write(path,{'layout'=>'default','title'=>"#{y}. gada #{w}. nedēļa",'description'=>'Apskati 2031. gada ISO 1. nedēļas datumus, kas sākas 2030. gada decembra pēdējās dienās.','permalink'=>"/nedelas-kalendars/#{y}/#{format('%02d',w)}/",'family'=>'iso_week','year'=>y,'week'=>w,'noindex'=>true}.to_yaml+"---\n<div class=\"page-shell\"><h1>#{y}. gada #{w}. nedēļa</h1>{% include app.html %}</div>")
end
File.write('404.html',{'layout'=>'default','title'=>'Lapa nav atrasta','description'=>'Šo lapu neizdevās atrast. Atver Latvijas kalendāru, meklē svētku dienas vai izvēlies kādu no plānošanas rīkiem.','permalink'=>'/404.html','noindex'=>true}.to_yaml+"---\n<section class=\"error-page\"><span>404</span><h1>Šī diena kalendārā nav ierakstīta.</h1><p>Lapas adrese, iespējams, ir mainījusies. Izvēlies savu nākamo soli.</p>#{a('/','Atvērt kalendāru','primary-button')} #{a('/visi-riki/','Apskatīt visus rīkus')}</section>")
File.write('500.html',{'layout'=>'default','title'=>'Īslaicīga kļūda','description'=>'Kalendāra lapa īslaicīgi nav pieejama. Pamēģini vēlreiz vai atver Latvijas kalendāra sākumlapu.','permalink'=>'/500.html','noindex'=>true}.to_yaml+"---\n<section class=\"error-page\"><span>500</span><h1>Plānos gadījies pārtraukums.</h1><p>Lūdzu, mēģini vēlreiz pēc brīža.</p>#{a('/','Atvērt kalendāru','primary-button')}</section>")
manifest << {url:'/pilsetas-un-fotografijas/',title:'Latvijas vietu un svētku fotogrāfijas: avoti un licences',family:'city_photos',indexable:true,status:'ready',description:'82 Latvijas pilsētu, 42 svētku foto un 9 valsts augstskolu fotogrāfijas ar norādītiem autoriem, avota failiem un licencēm.',lastmod:revision_date}
File.write('assets/search-index.json',JSON.generate(manifest.select{|r|r[:indexable]}))
File.write('docs/route-manifest.json',JSON.pretty_generate(manifest))
File.write('_data/page-revisions.json',JSON.pretty_generate(page_revisions)+"\n")
File.write('sitemap.xml',"---\nlayout: null\n---\n<?xml version=\"1.0\" encoding=\"UTF-8\"?><urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">"+manifest.select{|r|r[:indexable]}.map{|r|"<url><loc>{{ site.url }}#{h(r[:url])}</loc><lastmod>#{r[:lastmod]}</lastmod></url>"}.join+'</urlset>')
File.write('robots.txt',"---\nlayout: null\n---\nUser-agent: *\nAllow: /\nSitemap: {{ site.url }}/sitemap.xml\n")
File.write('_redirects',"/avoti/ /avoti-un-metodika/ 301\n/sikdatnes/ /sikdatnu-politika/ 301\n/lietošanas-noteikumi /lietošanas-noteikumi/ 301\n/lietosanas-noteikumi/ /lietošanas-noteikumi/ 301\n/darba-dienu-kalkulators/ /darba-laika-kalendars/ 301\n")
# Serialize the shared city catalog as JavaScript before hashing assets.
public_cities = CITIES.map{|c| c.slice('id','name','locative','lat','lon','timeZone').merge('photo'=>c.fetch('photo').slice('src','srcset','alt','author','license'))}
File.write('assets/cities.js', 'window.K365Cities = '+JSON.generate(public_cities)+";\n")
# Content-addressed global asset revision; local user data is never involved.
asset_files = (Dir.glob('assets/**/*').select{|path|File.file?(path)} + ['downloads/manifest.json'].select{|path|File.file?(path)}).sort
asset_hashes = asset_files.to_h{|path|[path,Digest::SHA256.file(path).hexdigest]}
asset_sha256 = Digest::SHA256.hexdigest(JSON.generate(asset_hashes))
File.write('_data/build.json',JSON.pretty_generate({asset_version:asset_sha256[0,16],sha256:asset_sha256,files:asset_hashes})+"\n")
puts JSON.generate({routes:manifest.length,indexable:manifest.count{|r|r[:indexable]},pending:manifest.count{|r|!r[:indexable]}})
