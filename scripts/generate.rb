# frozen_string_literal: true
require 'json'
require 'date'
require 'fileutils'
require 'cgi'
require 'yaml'
require 'digest'
require 'open3'
require 'uri'
require_relative 'tradition_links'
require_relative 'preview_components'
include PreviewComponents
require_relative 'occasion_components'
require_relative 'garden_components'
require_relative 'garden_experience_components'
require_relative 'organizer_components'
require_relative 'latvia_components'
require_relative 'city_photo_components'
require_relative 'hub_components'
require_relative 'school_components'
require_relative 'work_calendar_components'
require_relative 'vacation_components'
require_relative 'tools_directory_components'
require_relative 'category_experience_components'
require_relative 'traditions_guide_components'
require_relative 'category_redesign'
require_relative 'category_advanced_components'
require_relative 'useful_pages'
require_relative 'calendar_collection_components'
require_relative 'print_library_components'
require_relative 'name_day_sources'
require_relative 'page_reading_notes'
require_relative 'blog_components'
require_relative 'internal_navigation'
require_relative 'indexing_policy'
require_relative 'sitemap'
require_relative 'trust_pages'
require_relative '../lib/seo_contract'
include TrustPages
ROOT = File.expand_path('..', __dir__)
Dir.chdir(ROOT)
action_icons, action_icons_error, action_icons_status = Open3.capture3(ENV.fetch('NODE','node'),'scripts/build_action_icons.mjs')
abort "File action icon build failed: #{action_icons_error}" unless action_icons_status.success?
ENV['TZ'] = 'Europe/Riga'
revision_date = Date.today.iso8601
previous_revisions = File.exist?('_data/page-revisions.json') ? JSON.parse(File.read('_data/page-revisions.json')) : {}
previous_prose = File.exist?('_data/page-guides.json') ? JSON.parse(File.read('_data/page-guides.json')).fetch('pages',{}) : {}
page_revisions = {}
MONTHS = %w[janvāris februāris marts aprīlis maijs jūnijs jūlijs augusts septembris oktobris novembris decembris].freeze
GEN = %w[janvāra februāra marta aprīļa maija jūnija jūlija augusta septembra oktobra novembra decembra].freeze
SLUGS = %w[janvaris februaris marts aprilis maijs junijs julijs augusts septembris oktobris novembris decembris].freeze
DAYS = %w[P. O. T. C. Pk. S. Sv.].freeze
LAW = 'https://likumi.lv/ta/id/72608-par-svetku-atceres-un-atzimejamam-dienam'
ROUTES = JSON.parse(File.read('_data/routes.json'))
SOCIAL_COVERS = File.exist?('_data/social-images.json') ? JSON.parse(File.read('_data/social-images.json')).fetch('pages') : {}
DATA = File.exist?('assets/calendar-data.json') ? JSON.parse(File.read('assets/calendar-data.json')) : {}
CURRENT_NAMES = JSON.parse(File.read('_data/name-days-current.json'))
NameDaySources.validate!(ROOT, CURRENT_NAMES)
DATA['names'] = CURRENT_NAMES.fetch('records').map { |n| n.merge('edition'=>CURRENT_NAMES.fetch('edition'),'source'=>n['kind']=='traditional' ? 'https://www.vvc.gov.lv/lv/media/20847/download?attachment=' : 'https://www.vvc.gov.lv/lv/media/20850/download?attachment=') }
DATA['assumptions']['namesComplete'] = true
DATA['assumptions']['namesEdition'] = CURRENT_NAMES.fetch('edition')
DATA['assumptions']['nameEdition'] = CURRENT_NAMES.fetch('edition')
DATA['assumptions']['namesCheckedAt'] = CURRENT_NAMES.fetch('checkedAt')
DATA['sources'].reject! { |source| %w[names-snapshot names-traditional names-extended].include?(source['id']) }
DATA['sources'].find { |source| source['id'] == 'names' }.merge!(
  'edition'=>CURRENT_NAMES.fetch('edition'), 'checked'=>CURRENT_NAMES.fetch('checkedAt'), 'status'=>'verified',
  'note'=>'VVC aktuālajos avotos pārbaudīti 1032 tradicionālie ieraksti un 4620 paplašinātā saraksta papildu ieraksti. Kopā 5652 ieraksti; saglabāta oriģinālā vārdu rakstība.'
)
DATA['sources'] += [
  {'id'=>'names-traditional','title'=>'VVC aktuālais tradicionālais kalendārvārdu saraksts','url'=>'https://www.vvc.gov.lv/lv/media/20847/download?attachment=','checked'=>CURRENT_NAMES.fetch('checkedAt'),'edition'=>CURRENT_NAMES.fetch('edition'),'status'=>'verified'},
  {'id'=>'names-extended','title'=>'VVC aktuālais paplašinātais kalendārvārdu saraksts','url'=>'https://www.vvc.gov.lv/lv/media/20850/download?attachment=','checked'=>CURRENT_NAMES.fetch('checkedAt'),'edition'=>CURRENT_NAMES.fetch('edition'),'status'=>'verified'}
]
DATA['sources'].each do |source|
  source['title'] = {'moon'=>'USNO galvenās Mēness fāzes','seasons'=>'USNO astronomiskie gadalaiki'}.fetch(source['id'],source['title'])
end
File.write('assets/calendar-data.json', JSON.generate(DATA))
File.write('_data/calendar.json', JSON.pretty_generate(DATA)+"\n")
HOLIDAYS = DATA.fetch('holidays', [])
CITIES = JSON.parse(File.read('_data/cities.json')).fetch('cities')
city_previews, city_previews_error, city_previews_status = Open3.capture3('python3','scripts/build_city_previews.py')
abort "City preview build failed: #{city_previews_error}" unless city_previews_status.success?
CITY_PHOTO_PREVIEWS = JSON.parse(File.read('_data/city-photo-previews.json')).fetch('cities')
EDITORIAL = JSON.parse(File.read('_data/editorial-metadata.json')).fetch('routes').to_h{|r|[r.fetch('url'),r]}
HOROSCOPE_PROFILES = JSON.parse(File.read('_data/horoscope/profiles.json')).fetch('profiles')
zodiac_art_build, zodiac_art_error, zodiac_art_status = Open3.capture3(ENV.fetch('NODE', 'node'), 'scripts/verify_zodiac_art.mjs')
abort "Zodiac artwork verification failed: #{zodiac_art_error}" unless zodiac_art_status.success?
category_art_build, category_art_error, category_art_status = Open3.capture3('ruby', 'scripts/build_category_art.rb')
abort "Category artwork build failed: #{category_art_error}" unless category_art_status.success?
celestial_art, celestial_error, celestial_status = Open3.capture3(ENV.fetch('NODE', 'node'), 'scripts/build_celestial_art.mjs')
abort "Celestial photo art build failed: #{celestial_error}" unless celestial_status.success?
vector_art, vector_error, vector_status = Open3.capture3(ENV.fetch('NODE', 'node'), 'scripts/build_category_vectors.mjs')
abort "Vector artwork build failed: #{vector_error}" unless vector_status.success?
season_art, season_error, season_status = Open3.capture3(ENV.fetch('NODE', 'node'), 'scripts/build_season_scenes.mjs')
abort "Season landscape build failed: #{season_error}" unless season_status.success?
photo_links, photo_links_error, photo_links_status = Open3.capture3(ENV.fetch('NODE', 'node'), 'scripts/link_category_vectors.cjs')
abort "Photographic category links failed: #{photo_links_error}" unless photo_links_status.success?
PHOTOGRAPHIC_ART = JSON.parse(File.read('_data/category-photos.json')).fetch('artworks').map { |item| item.fetch('id') }.freeze
FileUtils.cp('lib/vendor/astronomy.mjs', 'assets/vendor/astronomy-engine.mjs')
FileUtils.cp('lib/vendor/LICENSE-astronomy-engine.txt', 'assets/vendor/LICENSE-astronomy-engine.txt')
LATVIA_EXTRA = JSON.parse(File.read('_data/latvia-extra-pages.json'))
LATVIA_VERIFIED = JSON.parse(File.read('_data/latvia-verified-data.json'))
OCCASIONS = JSON.parse(File.read('_data/occasions.json'))
TRADITION_LINKING = TraditionLinks.new(entries:JSON.parse(File.read('_data/tradition-links.json')),occasions:OCCASIONS,cultural:LATVIA_EXTRA.fetch('culturalPages'),routes:ROUTES)
HOLIDAYS.select { |row| (2027..2030).cover?(row.fetch('date')[0,4].to_i) }.each do |row|
  target = TRADITION_LINKING.holiday_url(row)
  raise "Missing dated holiday topic: #{row['date']} #{row['title']}" unless target&.end_with?("#datums-#{row['date']}")
end
# The small topic map is shared by browser lists and prerendered calendar details.
# The original legal date records and accepted downloadable calendars stay intact.
runtime = DATA.merge('holidayTopics'=>TRADITION_LINKING.calendar_topics,'names'=>DATA.fetch('names').map { |n| n.select { |k,_v| %w[name month day kind].include?(k) } })
File.write('assets/calendar-runtime.json', JSON.generate(runtime))
summary = runtime.merge('names'=>runtime.fetch('names').select { |n| n['kind']=='traditional' })
File.write('assets/calendar-summary.json', JSON.generate(summary))
calendar_snapshot, calendar_snapshot_error, calendar_snapshot_status = Open3.capture3(ENV.fetch('NODE','node'),'scripts/render_calendar_snapshot.cjs')
abort "Calendar snapshot failed: #{calendar_snapshot_error}" unless calendar_snapshot_status.success?
CALENDAR_SNAPSHOTS = JSON.parse(File.read('_data/calendar-ssr.json')).fetch('pages')
LATVIA_EXTRA_PAGES = (LATVIA_EXTRA.fetch('directTargets') + [LATVIA_EXTRA.fetch('educationPage')] + LATVIA_EXTRA.fetch('culturalPages')).to_h { |item| [item.fetch('url'), item] }
horoscope_build, horoscope_build_error, horoscope_build_status = Open3.capture3(ENV.fetch('NODE', 'node'), 'scripts/build_horoscope_data.mjs')
abort "Horoscope data build failed: #{horoscope_build_error}" unless horoscope_build_status.success?
horoscope_snapshot_json, horoscope_snapshot_error, horoscope_snapshot_status = Open3.capture3(ENV.fetch('NODE', 'node'), 'scripts/render_horoscope_snapshot.mjs')
abort "Horoscope snapshot failed: #{horoscope_snapshot_error}" unless horoscope_snapshot_status.success?
HOROSCOPE_SNAPSHOT = JSON.parse(horoscope_snapshot_json).freeze
weekend_json, weekend_error, weekend_status = Open3.capture3(ENV.fetch('NODE', 'node'), 'scripts/render_long_weekends.mjs')
abort "Long-weekend rendering failed: #{weekend_error}" unless weekend_status.success?
LONG_WEEKEND_MARKUP = JSON.parse(weekend_json).freeze
HOROSCOPE_DAY = HOROSCOPE_SNAPSHOT.fetch('edition').fetch('date')
astronomy_build, astronomy_error, astronomy_status = Open3.capture3(ENV.fetch('NODE', 'node'), 'scripts/build_latvia_astronomy.mjs')
abort "Latvia astronomy build failed: #{astronomy_error}" unless astronomy_status.success?
File.write('assets/horoscopes.json', JSON.generate(HOROSCOPE_SNAPSHOT.fetch('edition')))
planning_json, planning_error, planning_status = Open3.capture3(ENV.fetch('NODE', 'node'), 'scripts/render_planning.cjs')
abort "Planning prerender failed: #{planning_error}" unless planning_status.success?
PLANNING_MARKUP = JSON.parse(planning_json).freeze
work_calendar_json, work_calendar_error, work_calendar_status = Open3.capture3(ENV.fetch('NODE', 'node'), 'scripts/render_work_calendar.cjs')
abort "Work calendar prerender failed: #{work_calendar_error}" unless work_calendar_status.success?
WORK_CALENDAR_SNAPSHOTS = JSON.parse(work_calendar_json).freeze
studio_data, studio_error, studio_status = Open3.capture3(ENV.fetch('NODE', 'node'), 'scripts/build_studio_data.cjs')
abort "Studio Latvia data build failed: #{studio_error}" unless studio_status.success?
garden_calendar_json, garden_calendar_error, garden_calendar_status = Open3.capture3(ENV.fetch('NODE', 'node'), 'scripts/render_garden_calendar.cjs')
abort "Garden calendar prerender failed: #{garden_calendar_error}" unless garden_calendar_status.success?
GARDEN_CALENDAR_DATA = JSON.parse(garden_calendar_json).freeze
def h(s); CGI.escapeHTML(s.to_s); end
def icon_for(url)
 sign_slug=url.to_s.match(%r{\A/horoskops/([a-z]+)/\z})&.captures&.first
 return 'zodiac-'+sign_slug if sign_slug && HOROSCOPE_PROFILES.any?{|profile|profile['slug']==sign_slug}
 month_index=%w[janvaris februaris marts aprilis maijs junijs julijs augusts septembris oktobris novembris decembris].index(url.to_s.split('/').reject(&:empty?).last)
 if month_index
  period_year=url.to_s.split('/').find{|part|part.match?(/\A(?:2027|2028|2029|2030)\z/)}
  return period_year ? "month-#{period_year}-#{month_index+1}" : "month-#{month_index+1}"
 end
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
def ui_icon(name)
 if name.start_with?('zodiac-') && HOROSCOPE_PROFILES.any?{|profile|profile['slug']==name.delete_prefix('zodiac-')}
  return %(<img class="icon zodiac-link-illustration" src="/assets/zodiac/#{h(name.delete_prefix('zodiac-'))}.svg?v={{ site.data.build.asset_version }}" alt="" aria-hidden="true" width="128" height="128" decoding="async" loading="lazy">)
 end
 if name.match?(/\Amonth-(?:(?:2027|2028|2029|2030)-)?(?:[1-9]|1[0-2])\z/)
  return %(<img class="icon month-illustration" src="/assets/category-vector/#{h(name)}.svg?v={{ site.data.build.asset_version }}" alt="" aria-hidden="true" width="320" height="260" decoding="async" loading="lazy">)
 end
 %(<svg class="icon" aria-hidden="true"><use href="#i-#{name}"/></svg>)
end
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
 elsif family=='horoscope' || url=='/horoskops/'
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
def horoscope_heading_markup(heading,description,url,slug)
 sign=HOROSCOPE_PROFILES.find{|p|p['slug']==slug} if url.start_with?('/horoskops/') && url!='/horoskops/'
 art=sign ? "/assets/zodiac/#{sign['slug']}.svg" : '/assets/zodiac/atlas.svg'
 ascendant_link=url=='/zodiaka-zimes/' ? '/horoskops/#ascendenta-kalkulators' : '#ascendenta-kalkulators'
 %(<header class="horoscope-hero"><div class="horoscope-hero-copy"><span class="eyebrow">ZODIAKS · KALENDĀRS365</span><h1>#{h(heading)}</h1><p>#{h(description)}</p><div class="horoscope-hero-tags"><span>12 zodiaka zīmes</span><span>Dienas lasījums</span><a href="#{ascendant_link}">Tavs ascendents ↘</a></div></div><div class="horoscope-hero-art#{sign ? ' horoscope-hero-art--sign' : ''}"><div class="horoscope-hero-orbit" aria-hidden="true"></div><img src="#{art}?v={{ site.data.build.asset_version }}" width="#{sign ? 256 : 640}" height="#{sign ? 256 : 440}" alt="#{sign ? h(sign['name'])+' oriģināla zodiaka skulptūra' : 'Oriģināls telpisks zodiaka atlants ar visu 12 zīmju skulptūrām'}" decoding="async" fetchpriority="high">#{sign ? '<button type="button" class="zodiac-model-open" data-zodiac-model="'+h(sign['slug'])+'">Apskatīt 3D <span aria-hidden="true">↗</span></button>' : '<span class="horoscope-hero-art-label">Zodiaka aplis · 12 zīmes</span>'}</div></header>)
end
def page_heading_markup(family,url,heading,description,year,month,slug)
 return horoscope_heading_markup(heading,description, url,slug) if family=='horoscope' || %w[/horoskops/ /horoskopa-zimes-kalkulators/ /zodiaka-zimes/].include?(url)
 return tradition_photo_heading_markup(heading,description,url.split('/').last) if %w[occasion latvia_cultural].include?(family)
 return work_hero_markup(heading,description,year,month) if url.start_with?('/darba-dienu-kalendars/')
 return garden_heading_markup(heading,description,slug) if %w[garden garden_month].include?(family)
 visual=visual_family(family,url)
 symbol=visual_icon(visual)
 context=hero_context(family,url,year,month,slug)
 art_name=family=='calendar_month' && year && month ? "month-#{year}-#{month}" : visual
 %(<header class="page-heading page-heading--#{h(visual)}"><div class="page-heading-copy"><span class="eyebrow">LATVIJA · KALENDĀRS365</span><h1><span class="page-heading-mark">#{ui_icon(icon_for(url))}</span><span>#{h(heading)}</span></h1><p class="page-heading-deck">#{h(description)}</p><span class="page-heading-context">#{ui_icon(symbol)}<span>#{h(context)}</span></span></div><div class="page-heading-art" aria-hidden="true"><img class="page-heading-art-icon" src="/assets/#{PHOTOGRAPHIC_ART.include?(visual) ? 'category-vector' : 'category-art'}/#{h(art_name)}.svg?v={{ site.data.build.asset_version }}" alt="" width="320" height="260" loading="eager" decoding="async"><span class="page-heading-art-chip">#{h(context)}</span></div></header>)
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
def a(url,label,klass='')
 symbol=klass=='link-card' ? icon_for(url) : nil
 month_card=symbol && symbol.start_with?('month-')
 classes=klass+(month_card ? ' month-link-card' : '')
 %(<a class="#{classes}" href="#{h(url)}">#{symbol ? ui_icon(symbol) : ''}#{month_card ? '<span class="month-link-label">'+h(label)+'</span>' : h(label)}</a>)
end
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
 return '{% include ascendant-calculator.html %}<section class="widget-panel" data-widget="zodiac"></section>' if type=='zodiac'
 return '{% include sky-tool.html %}' if type=='sun'
 return planning_panel('leave',year) if type=='leave'
 return work_widget(year) if type=='work'
 return '<section class="widget-panel" data-server-rendered="calculator">'+calculator_markup+'</section>' if %w[calculator date].include?(type)
 "<section class=\"widget-panel\" data-widget=\"#{type}\"></section>"
end
def card(title,body); "<section class=\"content-card\"><h2>#{h(title)}</h2>#{body}</section>"; end
def year_links(prefix); "<nav class=\"year-pills\" aria-label=\"Gada izvēle\">#{(2027..2030).map{|y|a("/#{prefix}/#{y}/",y.to_s)}.join}</nav>"; end
def month_links(y,prefix='kalendars'); "<div class=\"link-grid month-link-grid\">#{(1..12).map{|m|a("/#{prefix}/#{y}/#{SLUGS[m-1]}/",MONTHS[m-1].capitalize,'link-card')}.join}</div>"; end
def dates(y,m=nil)
 HOLIDAYS.select{|v|v['date'].to_s.start_with?(m ? format('%04d-%02d',y,m) : y.to_s)}
end
def holiday_table(y,m=nil,memorial=false)
 records=dates(y,m).select{|d| memorial ? !d['dayOff'] : true}
 return '<p class="empty-state">Šajā periodā sarakstā nav atzīmētu svētku. Personīgos notikumus varat pievienot kalendārā.</p>' if records.empty?
 rows=records.map do |d|
  url=TRADITION_LINKING.holiday_url(d)
  raise "Unlinked holiday: #{d['date']} #{d['title']}" unless url
  %(<tr data-holiday-date="#{d['date']}"><td><a class="holiday-date-link" href="#{h(url)}"><time datetime="#{d['date']}">#{Date.parse(d['date']).strftime('%d.%m.%Y.')}</time></a></td><td><a class="holiday-topic-link" href="#{h(url)}"><span>#{h(d['title']||d['name'])}</span>#{ui_icon('arrow')}</a></td><td>#{h({'holiday'=>'Svētku diena','substitute'=>'Papildu brīvdiena','commemoration'=>'Atceres diena','observance'=>'Atzīmējama diena'}[d['type']]||d['type'])}</td></tr>)
 end.join
 '<div class="table-scroll"><table class="data-table holiday-topic-table"><thead><tr><th scope="col">Datums</th><th scope="col">Diena</th><th scope="col">Veids</th></tr></thead><tbody>'+rows+'</tbody></table></div>'
end
def calendar(y,m,mini=false)
 first=Date.new(y,m,1); last=Date.new(y,m,-1); start=first-(first.cwday-1); ending=last+(7-last.cwday)
 rows=(start..ending).each_slice(7).map{|week|'<tr><th scope="row">'+a(week[3].cwyear >= 2027 ? format('/nedelas-kalendars/%d/%02d/',week[3].cwyear,week[3].cweek) : "/?date=#{week.first.iso8601}&view=week",week[3].cweek)+'</th>'+week.map{|d|holiday=HOLIDAYS.any?{|z|z['date']==d.iso8601&&z['dayOff']}; label="#{d.year}. gada #{d.day}. #{MONTHS[d.month-1]}"; "<td class=\"#{d.month!=m ? 'outside' : ''} #{d.cwday>5 ? 'weekend' : ''} #{holiday ? 'holiday' : ''}\"><a class=\"calendar-date-link\" href=\"/?date=#{d.iso8601}&amp;view=day\" aria-label=\"#{h(label)}\" style=\"display:block;color:inherit;text-decoration:none\"><time datetime=\"#{d.iso8601}\">#{d.day}</time></a></td>"}.join+'</tr>'}.join
 "<section class=\"#{mini ? 'mini-calendar' : 'static-calendar'}\"><h2>#{a("/kalendars/#{y}/#{SLUGS[m-1]}/",MONTHS[m-1].capitalize)}</h2><table><thead><tr><th scope=\"col\">Ned.</th>#{DAYS.map{|d|"<th scope=\"col\">#{d}</th>"}.join}</tr></thead><tbody>#{rows}</tbody></table></section>"
end
def print_panel(type, y, m=nil, name=nil)
 "<section class=\"content-card print-section\" data-print-type=\"#{type}\" data-print-year=\"#{y}\" data-print-month=\"#{m}\" data-print-name=\"#{h(name)}\"><h2>Kalendārs uz papīra. Tavā stilā.</h2><p>Izvēlies vienu no 15 kompozīcijām. PDF ar vektoru tekstu vai atbilstošs A4 attēls 600 ppi izšķirtspējā. Faila veidošana notiek tavā ierīcē.</p>#{widget('print')}</section>"
end
def a3_year_gallery(year)
  return '' unless (2027..2030).cover?(year)
  items=JSON.parse(File.read('downloads/gada-a3/manifest.json')).fetch('items').select{|item|item['year']==year}.sort_by{|item|item['design']}
  raise "A3 year #{year} missing designs" unless items.length==15
  arrow='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4"/></svg>'
  cards=items.each_with_index.map do |item,index|
    orientation=item['orientation']=='portrait' ? 'Vertikāli' : 'Horizontāli'
    holiday=item['holidays'] ? 'Ar svētku dienām' : 'Bez svētku atzīmēm'
    %(<article class="a3-design-card"><a class="a3-design-preview" href="#{h(item['image'])}" target="_blank" rel="noopener">#{preview_image(item, alt: "#{year}. gada kalendārs: #{item['title']}", loading: index<3 ? 'eager' : 'lazy', priority: index==0)}<span>#{format('%02d',item['design'])} / 15</span></a><div class="a3-design-copy"><h3>#{h(item['title'])}</h3><p>A3 · #{orientation} · #{holiday}</p><div class="a3-design-actions"><a href="#{h(item['pdf'])}" download><img src="/assets/file-pdf.svg" alt="" width="24" height="24"><span>PDF</span>#{arrow}</a><a href="#{h(item['image'])}" download><img src="/assets/file-image.svg" alt="" width="24" height="24"><span>Attēls</span>#{arrow}</a></div></div></article>)
  end.join
  %(<section class="a3-year-gallery" id="gada-a3-kalendari"><div class="a3-gallery-heading"><div><span class="eyebrow">#{year} · LATVIJAS KALENDĀRS</span><h2>15 kalendāri A3 drukai</h2><p>Izvēlies dizainu un saglabā PDF vai attēlu 600 dpi izšķirtspējā.</p></div><span class="a3-gallery-badge">15 dizaini · A3</span></div><div class="a3-design-grid">#{cards}</div><p class="a3-gallery-note">Katrs kalendārs ietver visu #{year}. gadu. Dizainiem bez svētku atzīmēm datumi paliek redzami. <a href="/avoti-un-metodika/">Datumu avoti un metodika</a>.</p></section>)
end
def a3_month_gallery(year,month)
  return '' unless (2027..2030).cover?(year) && month
  items=JSON.parse(File.read('downloads/menesa-a3/manifest.json')).fetch('items').select{|item|item['year']==year && item['month']==month}.sort_by{|item|item['design']}
  raise "A3 month #{year}-#{month} missing designs" unless items.length==15
  arrow='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4"/></svg>'
  cards=items.each_with_index.map do |item,index|
    orientation=item['orientation']=='portrait' ? 'Vertikāli' : 'Horizontāli'
    holiday=item['holidays'] ? 'Ar svētku dienām' : 'Bez svētku atzīmēm'
    %(<article class="a3-design-card"><a class="a3-design-preview" href="#{h(item['image'])}" target="_blank" rel="noopener">#{preview_image(item, alt: "#{year}. gada #{GEN[month-1]} kalendārs: #{item['title']}", loading: index<3 ? 'eager' : 'lazy', priority: index==0)}<span>#{format('%02d',item['design'])} / 15</span></a><div class="a3-design-copy"><h3>#{h(item['title'])}</h3><p>A3 · #{orientation} · #{holiday}</p><div class="a3-design-actions"><a href="#{h(item['pdf'])}" download><img src="/assets/file-pdf.svg" alt="" width="24" height="24"><span>PDF</span>#{arrow}</a><a href="#{h(item['image'])}" download><img src="/assets/file-image.svg" alt="" width="24" height="24"><span>Attēls</span>#{arrow}</a></div></div></article>)
  end.join
  %(<section class="a3-year-gallery a3-month-gallery" id="menesa-a3-kalendari"><div class="a3-gallery-heading"><div><span class="eyebrow">#{year} · #{MONTHS[month-1].upcase} · LATVIJA</span><h2>15 #{GEN[month-1]} kalendāri A3 drukai</h2><p>Izvēlies dizainu un saglabā PDF vai attēlu 600 dpi izšķirtspējā.</p></div><span class="a3-gallery-badge">15 dizaini · A3</span></div><div class="a3-design-grid">#{cards}</div><p class="a3-gallery-note">Katrs fails rāda tikai #{year}. gada #{GEN[month-1]} mēnesi. Daļā dizainu svētku dienas nav atzīmētas. <a href="/avoti-un-metodika/">Datumu avoti un metodika</a>.</p></section>)
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
'saullekts-saulriets'=>['sun','Saules lēkta un rieta aprēķins 82 Latvijas pilsētās.'],
'varda-dienas'=>['names','Meklē vārdu un atšķir tradicionālo sarakstu no paplašinātā kalendārvārdu saraksta.'],
'meness-fazes'=>['moon','Galvenās Mēness fāzes pēc ASV Jūras observatorijas datiem, pārrēķinātas Rīgas laikā.'],
'pilnmeness'=>['moon','Pilnmēness brīži un to vietējie datumi Latvijā.'],
'jaunmeness'=>['moon','Jaunmēness brīži un to vietējie datumi Latvijā.']}.freeze
TRUST={
'lietošanas-noteikumi'=>['Lieto pārdomāti. Plāno droši.','Kalendāri ir informatīvi plānošanas rīki. Pirms darba laika, skolas vai ceļojumu lēmumiem pārbaudi attiecīgo iestāžu paziņojumus un savas darbavietas kārtību. Aprēķinu pieņēmumi ir norādīti pie rīka.','Personīgais saturs un lejupielādes','Augšupielādē tikai attēlus, kurus drīksti izmantot. Personīgās fotogrāfijas tiek apstrādātas tavā ierīcē. Astroloģiskais saturs ir izklaide un pašrefleksija, nevis zinātniska prognoze vai profesionāls padoms. Par konstatētu kļūdu raksti vietnes uzturētājam Silvim Balodim.'],
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
 when 'print_month' then "#{y}. gada #{GEN[m-1]} kalendāri A3 drukai"
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

reading_sky_json, reading_sky_error, reading_sky_status = Open3.capture3(ENV.fetch('NODE', 'node'), 'scripts/render_reading_sky.mjs')
abort "Reading-note astronomy examples failed: #{reading_sky_error}" unless reading_sky_status.success?
READING_NOTES = PageReadingNotes.new(data:DATA,cities:CITIES,sky:JSON.parse(reading_sky_json),cultural_dates:method(:cultural_calendar_dates),garden_actions:method(:garden_calendar_actions))
manifest=[]
ROUTES.each do |r|
 p=r['URL path'];f=r['Page family'];y=r['Year'].to_i;y=2027 if y==0;m=(SLUGS.index(r['URL path'].split('/').last)||-1)+1;m=nil if m==0;slug=p.split('/').last;title=title_for(r);title='Tava diena. Tavi plāni.' if p=='/'
 week=f=='iso_week' ? slug.to_i : nil
 noindex=false;reason='ready';body='';desc=''
 if p=='/'
  body='{% include app.html %}'
  desc='Latvijas kalendārs, svētku dienas un ikdienas plānošana. 2027.–2030. gada kalendāri, personīgie notikumi un lejupielādējami PDF.'
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
  desc="Sējas un stādīšanas orientieri Latvijā #{locative}. Pārbaudi avotos norādītos augsnes, šķirnes un salnu nosacījumus."
  body=garden_hub_markup(m)
 elsif f=='year'
  printable="<section class=\"collection-print-year\"><h2>#{y}. gada kalendārs</h2><div class=\"year-calendar-grid\">#{(1..12).map{|n|calendar(y,n,true)}.join}</div></section>"
  body=calendar_collection(y,nil,f,a3_year_gallery(y),metrics(y)+printable+card('Svētki un atzīmējamās dienas',holiday_table(y)))
 elsif %w[calendar_month iso_week].include?(f)
  body=if f=='calendar_month'
   calendar_collection(y,m,f,a3_month_gallery(y,m),'{% include collection-calendar.html %}')
  else
   '{% include app.html %}'+card('Kalendārs drukai',"<p>#{Date.commercial(y,week,1).strftime('%d.%m.%Y.')}–#{Date.commercial(y,week,7).strftime('%d.%m.%Y.')}</p>")+print_panel('weekly',y,m)
  end
 elsif f=='month_index'
  body=year_links('menesa-kalendars')+month_links(y)+metrics(y)
 elsif f=='week_index'
  body=year_links('nedelas-kalendars')+'<div class="link-grid">'+(1..Date.new(y,12,28).cweek).map{|w|a(format('/nedelas-kalendars/%d/%02d/',y,w),"#{w}. nedēļa · #{Date.commercial(y,w).strftime('%d.%m.')}–#{Date.commercial(y,w,7).strftime('%d.%m.')}",'link-card')}.join+'</div>'
 elsif %w[print_index print_month].include?(f)
  printable=m ? calendar(y,m) : "<section class=\"collection-print-year\"><h2>#{y}. gada kalendārs</h2><div class=\"year-calendar-grid\">#{(1..12).map{|n|calendar(y,n,true)}.join}</div></section>"
  body=calendar_collection(y,m,f,m ? a3_month_gallery(y,m) : a3_year_gallery(y),metrics(y,m)+printable)
 elsif %w[holiday_month holiday_year memorial_year].include?(f)
  body=year_links(f=='memorial_year' ? 'atceres-dienas' : 'svetku-dienas')+metrics(y,m)+card('Datumi un dienu veidi',holiday_table(y,m,f=='memorial_year'))+month_links(y,'svetku-dienas')
 elsif %w[work_year work_month].include?(f)
  body=work_calendar_markup(y,m)+work_print_gallery(y,m)
 elsif f=='long_weekends'
  body=LONG_WEEKEND_MARKUP.fetch(y.to_s)
 elsif %w[lunar_month lunar_year].include?(f)
  phases=DATA.fetch('moon',[]).select{|v|v['date'].to_s.start_with?(m ? format('%04d-%02d',y,m) : y.to_s)}
  noindex=phases.empty?;reason='moon_source_pending' if noindex
  body=if m
   calendar_collection(y,m,f,lunar_print_gallery(y,m),lunar_month_markup(y,m))
  else
   calendar_collection(y,nil,f,lunar_print_gallery(y),lunar_year_markup(y))
  end
 elsif %w[school_academic school_year_calendar].include?(f)
  school_years = {'2027-28'=>'2027./2028.','2028-29'=>'2028./2029.','2029-30'=>'2029./2030.','2030-31'=>'2030./2031.'}
  reason='school_dates_pending'
  academic_slug = f == 'school_academic' ? slug : "#{y}-#{(y+1).to_s[-2,2]}"
  academic_label = school_years[academic_slug] || "#{y}./#{y+1}."
  body="<section class=\"content-card school-pending\"><p class=\"eyebrow\">#{h(academic_label)} mācību gads</p><h2>Oficiālais brīvlaiku grafiks vēl nav publicēts</h2><p>Šajā lapā nav apstiprinātu datumu. Iepriekšējā mācību gada brīvlaikus nepārceļam uz nākamo gadu. Tiklīdz grafiku publicēs Izglītības un zinātnes ministrija, šeit būs norādīta datumu kopa un tās pirmavots.</p></section>"+card('Izvēlies mācību gadu','<div class="link-grid">'+school_years.map{|year,label|a("/skolas-brivlaiki/#{year}/","#{label} mācību gads",'link-card')}.join+'</div>')+verified_sources_panel(['school-2027'],'Skolas datumi attiecas tikai uz attiecīgo oficiāli publicēto mācību gadu; nākamo gadu termiņi netiek prognozēti.')
 elsif %w[name_calendar name_day_month].include?(f)
  names=DATA.fetch('names',[]);matching=f=='name_calendar' ? names.select{|n|n['name']==r['Latvian title/topic']} : names.select{|n|n['month'].to_i==m}
  noindex=matching.empty? || !DATA.fetch('assumptions',{}).fetch('namesComplete',false);reason='name_source_pending' if noindex
  body=(noindex ? '<div class="notice">Vārda dienas datums vēl nav pārbaudīts oficiālajā sarakstā. Personalizētu kalendāru vari izveidot bez vārda dienas atzīmes.</div>' : card('Vārda diena',matching.map{|n|"<p>#{h(n['name'])} · #{n['day']}. #{MONTHS[n['month'].to_i-1]}</p>"}.join))+widget('names')+(f=='name_calendar' ? print_panel('named',2027,nil,r['Latvian title/topic']) : '')
 elsif f=='sky_hub'
  body='{% include sky-tool.html kind="moon" %}'+city_photo_directory('moon')
 elsif f=='moon_city'
  body='{% include sky-tool.html kind="moon" %}'
 elsif f=='sun_city'
  city=CITIES.find{|c|c['id']==slug}
  desc="Saullēkts, saulriets un dienas garums pilsētā #{city.fetch('name')}. Europe/Riga laiks un aptuvens astronomisks aprēķins pilsētas centram."
  body=widget('sun')+card('Kā lasīt Saules laikus','<p>Aprēķins attiecas uz pilsētas koordinātām un standarta horizontu. Vietējais reljefs, laikapstākļi un atmosfēras laušana var mainīt novērojumu. Laiks parādīts Europe/Riga joslā.</p>')
 elsif f=='horoscope'
  profile=HOROSCOPE_PROFILES.find{|item|item['slug']==slug}
  if profile
   issue=HOROSCOPE_SNAPSHOT.fetch('dailyMarkup').fetch(slug)
   body="<div class=\"horoscope-article-layout\"><section class=\"horoscope-page\" data-sign=\"#{h(slug)}\"><div class=\"horoscope-daily-feature\"><!--K365-HOROSCOPE-BEGIN:#{h(slug)}--><div data-horoscope-view=\"#{h(slug)}\" data-edition-date=\"#{HOROSCOPE_DAY}\">#{issue}</div><!--K365-HOROSCOPE-END:#{h(slug)}--></div>#{HOROSCOPE_SNAPSHOT.fetch('profileMarkup').fetch(slug)}</section><aside class=\"horoscope-ascendant-sidebar\" aria-label=\"Ascendenta kalkulators\">{% include ascendant-calculator.html compact=true %}<a class=\"horoscope-full-calculator\" href=\"/horoskopa-zimes-kalkulators/\">Atvērt pilnu kalkulatoru <span aria-hidden=\"true\">↗</span></a></aside></div>"
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
   unless extra_page || %w[nozimigas-dienas].include?(slug)
    noindex=true
    reason='latvia_special_missing'
   end
  end
 elsif f=='occasion'
  article=JSON.parse(File.read('_data/occasions.json')).find{|x|x['slug']==slug}
  noindex=article.nil? || !article['verified'];reason='editorial_review_pending' if noindex
  body=article ? occasion_page(article,JSON.parse(File.read('_data/occasions.json'))) : '<p class="empty-state">Šīs tēmas apraksts vēl tiek pārbaudīts.</p>'
  desc=article['description'] if article
 elsif slug=='garas-brivdienas'
  body=LONG_WEEKEND_MARKUP.fetch('root')
 elsif trust_page?(p)
  body=trust_page_markup(p)
 elsif TRUST.key?(slug)
  t=TRUST[slug];body="<p class=\"lead\">#{h(t[0])}</p><div class=\"editorial-grid\">#{card('Kas jāzina',"<p>#{h(t[1])}</p>")}#{card(t[2],"<p>#{h(t[3])}</p>")}</div>"+card('Sazinies ar uzturētāju',a('mailto:kalendars365@gmail.com','kalendars365@gmail.com')+'<p>Silvis Balodis · Kalendārs365</p>')
 elsif slug=='kontakti'
  body='<div class="contact-layout"><section><span class="eyebrow">Raksti mums</span><h2>Labs kalendārs kļūst labāks ar sarunu.</h2><p>Projekta uzturētājs: <strong>Silvis Balodis</strong></p>'+a('mailto:kalendars365@gmail.com','kalendars365@gmail.com','contact-email')+'<p>Norādi lapas adresi un apraksti jautājumu. Neiekļauj savu privāto kalendāru vai sensitīvus datus.</p></section>'+card('Īss ceļš līdz precizējumam','<ol><li>Atver lapu, kurā redzi problēmu.</li><li>Pievieno datumu un avota saiti.</li><li>Nosūti ziņu ar savu e-pasta lietotni.</li></ol>'+a('mailto:kalendars365@gmail.com?subject=Kalendars365%20jautajums','Atvērt e-pasta lietotni','primary-button'))+'</div>'
 elsif slug=='avoti-un-metodika'
  source_rows=DATA.fetch('sources',[]).map do |source|
   status={'verified'=>'Pārbaudīts','snapshot'=>'Vēsturiska versija','pending'=>'Apstiprinājums vēl nav publicēts','snapshot_verified'=>'Pārbaudīta arhīva versija'}.fetch(source['status'],'Avota statuss norādīts aprakstā')
   dates=[]
   dates << "Vietnē fiksētā pārbaude: <time datetime=\"#{h(source['checked'])}\">#{h(source['checked'])}</time>" if source['checked']
   dates << "Avota redakcija: #{h(source['edition'])}" if source['edition']
   %(<li id="avots-#{h(source.fetch('id'))}">#{a(source['url']||source['URL']||'#',source['title']||source['name']||source['id'])}<p><strong>#{h(status)}</strong>#{dates.empty? ? '' : ' · '+dates.join(' · ')}</p>#{source['note'] ? '<p>'+h(source['note'])+'</p>' : ''}</li>)
  end.join
  body=card('Kalendāra aprēķini','<p>Gregora kalendārs, ISO 8601 nedēļas, pirmdiena kā nedēļas pirmā diena. Europe/Riga laika josla. Viena datu kopa baro kalendārus un drukājamos failus.</p>')+card('Oficiālie avoti','<p>Norādīts vietnē izmantotais avots un tā fiksētās pārbaudes datums. Vēlāki grozījumi var mainīt nākotnes kalendārus; pirms būtiska lēmuma atver avota aktuālo redakciju.</p><ul class="source-evidence-list">'+source_rows+'</ul>')+card('Attēli un licences','<p id="atteli">Rīgas pilsētas kartītes fotogrāfija: '+h(CITIES.find{|c|c['id']=='riga'}.fetch('photo').fetch('author'))+'. '+a(CITIES.find{|c|c['id']=='riga'}.fetch('photo').fetch('sourceUrl'),'Oriģinālais attēls')+' · '+a(CITIES.find{|c|c['id']=='riga'}.fetch('photo').fetch('licenseUrl'),CITIES.find{|c|c['id']=='riga'}.fetch('photo').fetch('license'))+'. Vietnei izveidotas samazinātas WebP kopijas; tās pieejamas ar to pašu licenci. Interfeisā attēls var tikt apgriezts. Pilsētu kartē izmantotas 82 atsevišķas īstu pilsētu fotogrāfijas. '+a('/pilsetas-un-fotografijas/','Visu fotogrāfiju autori un licences')+'. Saskarnes ilustrācijas izstrādātas Kalendāram365.</p>')+card('Burtveidols un licence','<p>Vietnes interfeiss izmanto Avenir vai Avenir Next, ja tas ir instalēts apmeklētāja ierīcē; citādi tiek izmantots sistēmas sans-serif fonts. Licencēti Avenir failu dati netiek izplatīti. Sociālajās kartītēs un drukājamajos kalendāros izmantots DM Sans Regular un DM Sans Bold. Dizains: Colophon Foundry; autortiesības: The DM Sans Project Authors. '+a('https://github.com/google/fonts/tree/main/ofl/dmsans','DM Sans — oficiālais Google Fonts avots')+' · '+a('/assets/fonts/DM-Sans-OFL.txt','SIL Open Font License 1.1')+'. Fonti tiek ielādēti no šīs vietnes servera; fontu pieprasījumi netiek sūtīti Google serveriem.</p>')+card('Prognoze un stacijas mērījums','<p>MET Norway prognoze ir aprēķināta pilsētas centram. Atsevišķā kartītē rāda tuvākās LVĢMC stacijas stundas vidējo temperatūru: norādīts attālums, stacijas nosaukums un stundas sākums Latvijas laikā. Der tikai pēdējo 3 stundu mērījumi līdz 50 km attālumā. LVĢMC portāla dati ir operatīvi, ar pamata kvalitātes pārbaudi; tie nav galīgi verificēti. '+a('https://data.gov.lv/dati/dataset/hidrometeorologiskie-noverojumi','LVĢMC avots un CC0 licence')+'. Kartīte nerāda radaru, un stacijas mērījums nav katras pilsētas ielas novērojums.</p>')+card('Pārbaudes robežas','<p>Automatizēti datumu, izvades un valodas paraugu testi neaizstāj neatkarīgu jurista vai dzimtās valodas redaktora pārbaudi. Jauna avota publikācija var mainīt nākotnes datus. '+a('/redakcijas-politika/','Kā sagatavojam saturu')+' · '+a('/labojumi/','Paziņot par neprecizitāti')+'</p>')
 elsif TOOL_INFO.key?(slug)
  t=TOOL_INFO[slug];body="<p class=\"lead\">#{h(t[1])}</p>"+(slug=='darba-laika-kalendars' ? planning_panel('work',y) : '')+widget(t[0],y)
 elsif slug=='gimenes-kalendars'
  body=family_planner_markup
 elsif slug=='stundu-saraksts'
  body=timetable_planner_markup
 elsif slug=='izveidot-kalendaru'
  title='Izveido savu kalendāru';heading=title
  desc='Izveido personīgu Latvijas kalendāru: 6 dizaini, fotogrāfijas, teksti un notikumi. Lejupielādē PDF, attēlu vai SVG un saglabā savu projektu.'
  body='{% include calendar-studio.html %}'
 elsif %w[tukss-kalendars dzimsanas-dienu-kalendars].include?(slug)
  type={'tukss-kalendars'=>'blank','dzimsanas-dienu-kalendars'=>'named'}[slug]||'monthly';body=print_panel(type,2027)+card('Personīgi. Privāti. Izdrukājami.','<p>Izvēlies gadu, mēnesi, dizainu un vārdu. Fotoattēli netiek augšupielādēti serverī. A4 izmēra attēla izveide var prasīt vairāk atmiņas; uzgaidi, līdz fails ir gatavs.</p>')
 elsif %w[dienas-kalendars dienas-planotajs].include?(slug)
  body='{% include app.html %}'+print_panel('daily',2027)
 elsif slug=='zodiaka-zimes'
  cards=HOROSCOPE_PROFILES.map do |profile|
   element=profile.fetch('element');name=profile.fetch('name');sign_slug=profile.fetch('slug')
   %(<article class="zodiac-index-card">#{zodiac_art(profile,'zodiac-index-symbol',80)}<div class="zodiac-index-heading"><span class="eyebrow">#{h(element.fetch('label'))} · #{h(profile.fetch('modality').fetch('label'))}</span><h2>#{h(name)}</h2></div><p>#{h(profile.fetch('summary'))}</p>#{a("/horoskops/#{h(sign_slug)}/","Atvērt #{h(profile.fetch('genitive').downcase)} horoskopu →")}</article>)
  end.join
  method=JSON.parse(File.read('_data/horoscope/method.json'))
  body=%(<section class="zodiac-index"><p class="lead">Iepazīsti 12 populārās Rietumu tropiskā zodiaka zīmes, to simbolus, elementus un tradicionālo simboliku.</p>)+a('/horoskops/#ascendenta-kalkulators','Uzzināt savu ascendentu →','primary-button')+%(<div class="zodiac-index-grid">#{cards}</div>)+card('Kā lasīt zīmju aprakstus',"<p>#{h(method.fetch('selectionExplanation'))}</p><p>#{h(method.fetch('astronomyNotice'))}</p><p>#{h(method.fetch('shortDisclosure'))}</p>")+a('/horoskops/','Lasīt šodienas horoskopu →','primary-button')+'</section>'
 elsif slug=='horoskops'
  body="<!--K365-HOROSCOPE-BEGIN:collection--><section data-horoscope-collection data-edition-date=\"#{HOROSCOPE_DAY}\">#{HOROSCOPE_SNAPSHOT.fetch('collectionMarkup')}</section><!--K365-HOROSCOPE-END:collection-->"+widget('zodiac')+card(HOROSCOPE_PROFILES.first['seo']['title'].split(':').first,'<p>'+h(JSON.parse(File.read('_data/horoscope/method.json')).fetch('selectionExplanation'))+'</p><p>'+h(JSON.parse(File.read('_data/horoscope/method.json')).fetch('astronomyNotice'))+'</p><p>'+h(JSON.parse(File.read('_data/horoscope/method.json')).fetch('shortDisclosure'))+'</p>')+'<div class="link-grid">'+ROUTES.select{|s|s['Page family']=='horoscope'}.map{|s|a(s['URL path'],s['Latvian title/topic'],'link-card')}.join+'</div>'
 elsif slug=='meklesana'
  body=widget('search')
 elsif %w[gadalaiki astronomiskais-kalendars].include?(slug)
  noindex=DATA.fetch('seasons',[]).empty?;reason='season_ephemeris_pending' if noindex;body=card('Meteoroloģiskie un astronomiskie gadalaiki','<p>Meteoroloģiskais pavasaris sākas 1. martā, vasara — 1. jūnijā, rudens — 1. septembrī, ziema — 1. decembrī. Astronomiskās robežas nosaka ekvinokcijas un saulgrieži; to precīzos brīžus pievienojam tikai no pārbaudīta efemerīdu avota.</p>')+card('Astronomiskie gadalaiki Rīgas laikā','<div class="phase-list">'+DATA.fetch('seasons',[]).map{|z|"<article><b>#{h(z['event']||z['title'])}</b><time>#{h(z['date'])} #{h(z['time'])}</time></article>"}.join+'</div>')+widget('sun')+widget('moon')
 elsif slug=='kalendars'
  body=calendar_hub_markup
 elsif slug=='pdf-kalendari'
  body=print_library_markup
 elsif slug=='svetku-dienas'
  body=holiday_hub_markup
 elsif slug=='skolas-brivlaiki'
  title='Skolas brīvlaiki Latvijā';heading=title;desc='Latvijas skolēnu oficiālie brīvlaiki, mācību semestru datumi un klašu beigu termiņi. Katram mācību gadam norādīts atsevišķs avots.'
  body=school_hub_markup
 elsif slug=='darba-dienu-kalendars'
  body=work_calendar_markup(2027)+work_print_gallery(2027)
 elsif slug=='meness-kalendars'
  noindex=DATA.fetch('moon',[]).empty?;reason='moon_source_pending' if noindex
  body=lunar_year_index_markup
 else
  children=ROUTES.select{|s|s['URL path']!=p&&s['URL path'].start_with?(p)&&s['URL path'].split('/').length<=p.split('/').length+1}
  children=ROUTES.select{|s|s['Page family']=='hub'&&s['URL path']!='/' } if children.empty?
  body='<div class="link-grid">'+children.map{|s|a(s['URL path'],title_for(s),'link-card')}.join+'</div>'
  body+=widget('moon') if slug=='meness-kalendars'
 end
 editorial=EDITORIAL[p] || {}
 if p=='/nozimigas-dienas/'
  title='Nozīmīgas dienas Latvijā';heading='Nozīmīgas dienas Latvijā';desc='Latvijas svētku dienas, gadskārtu notikumi un citas avotos pārbaudītas kultūras tēmas. Pārbaudi datumu un atšķir to no likumā noteiktas brīvdienas.'
 end
 heading=editorial.fetch('h1',title)
 title=editorial.fetch('title',title)
 title="Kalendārs #{y}" if f=='year'
 desc=editorial.fetch('description',desc)
 if p.start_with?('/darba-dienu-kalendars/')
  month_locative=%w[janvārī februārī martā aprīlī maijā jūnijā jūlijā augustā septembrī oktobrī novembrī decembrī]
  title=m ? "Darba dienas #{y}. gada #{month_locative[m-1]}" : f=='work_year' ? "Darba dienas un stundas #{y}" : 'Darba dienu kalendārs Latvijā'
  heading=m ? "Darba dienas #{y}. gada #{month_locative[m-1]}" : f=='work_year' ? "#{y}. gada darba dienas un stundas" : 'Darba dienu kalendārs Latvijā'
  desc="Darba dienas, plānotās stundas un Latvijas svētku brīvdienas #{m ? "#{y}. gada #{month_locative[m-1]}" : f=='work_year' ? "#{y}. gadā" : '2027.–2030. gadā'}. Pielāgo nedēļas grafiku, pirmssvētku saīsinājumu un aprēķini savu periodu."
  desc='Aprēķini darba dienas un stundas, salīdzini datumus vai pieskaiti laiku. Latvijas svētki un tavs darba grafiks vienā vietā.' unless m || f=='work_year'
 end
 if f=='print_month' && (2027..2030).cover?(y)
  desc="15 #{y}. gada #{GEN[m-1]} kalendāru dizaini A3 formātā. Lejupielādē PDF vai attēlu 600 dpi izšķirtspējā."
 end
 if f=='horoscope' && (profile=HOROSCOPE_PROFILES.find{|item|item['slug']==slug})
  title=profile.fetch('seo').fetch('title');heading="#{profile.fetch('genitive')} horoskops";desc=profile.fetch('seo').fetch('description')
 elsif slug=='horoskops'
  collection_seo=JSON.parse(File.read('_data/horoscope/method.json')).fetch('collectionSeo')
  title=collection_seo.fetch('title');heading='Dienas horoskops latviešu valodā';desc=collection_seo.fetch('description')
 elsif slug=='zodiaka-zimes'
  title='Zodiaka zīmes: nosaukumi un simbolika';heading='12 zodiaka zīmes un to elementi';desc='Iepazīsti Aunu, Vērsi, Dvīņus un pārējās zodiaka zīmes, to elementus un simbolisko nozīmi. Dienas horoskopi katrai zīmei.'
 end
 if slug=='horoskopa-zimes-kalkulators'
  title='Ascendenta un zodiaka zīmes kalkulators';heading='Ascendenta un zodiaka zīmes kalkulators'
  desc='Aprēķini ascendentu pēc dzimšanas datuma, precīza laika un vietas. Vēsturiskās laika joslas, vasaras laiks un zodiaka zīmes latviski.'
 end
 desc="#{title}. #{m ? "#{Date.new(y,m,-1).day} #{Date.new(y,m,-1).day == 31 ? 'diena' : 'dienas'}, ISO nedēļas un izvēlētā mēneša plānošana." : 'Pārskatāmi datumi, plānošanas rīki un saites uz avotiem.'} Kalendārs365 Latvijai." if desc.empty?
 CalendarIndexingPolicy.validate!(p,noindex)
 front={'layout'=>'default','title'=>title,'description'=>desc,'permalink'=>p,'family'=>f,'city_id'=>(%w[sun_city moon_city].include?(f) ? slug : nil),'year'=>(r['Year'].empty? ? nil : y),'month'=>m,'week'=>week,'calendar_name'=>(f=='name_calendar' ? r['Latvian title/topic'] : nil),'view'=>(f=='iso_week' ? 'week' : f=='year' ? 'year' : nil),'noindex'=>noindex,'og_image'=>(File.file?("assets/og/#{Digest::SHA1.hexdigest(p)[0,16]}.webp") ? "/assets/og/#{Digest::SHA1.hexdigest(p)[0,16]}.webp" : '/assets/og/home.png')}
 front.delete_if{|_,value|value.nil?}
 if %w[occasion latvia_cultural].include?(f)
  day_photo=tradition_cover(tradition_photo_for(p.split('/').last))
  social_photo=day_photo.fetch('files').max_by{|image|image.fetch('width')}
  front['og_image']=social_photo.fetch('src');front['og_image_width']=social_photo.fetch('width');front['og_image_height']=social_photo.fetch('height');front['og_image_alt']=day_photo.fetch('alt')
 end
 if (cover=SOCIAL_COVERS[p])
  front.merge!('og_image'=>cover.fetch('src'),'og_image_width'=>cover.fetch('width'),'og_image_height'=>cover.fetch('height'),'og_image_alt'=>cover.fetch('alt'))
 end
 front['calendar_collection']=true if CALENDAR_COLLECTION_FAMILIES.include?(f)
 front['reading_notes']=false if p=='/pdf-kalendari/'
 if trust_page?(p)
  front['trust_page']=true
  front['reading_notes']=false
 end
 if slug=='saullekts-saulriets'
  body += city_photo_directory('sun')
 end
 if CATEGORY_EXPERIENCES.key?(slug) && p=="/#{slug}/"
  body=category_v2_finish(slug,category_advanced_controls(slug,category_body_markup(slug,body)))
  front['category']=slug
  if %w[menesa-kalendars nedelas-kalendars].include?(slug)
   front['year']=2027;front['view']=slug=='nedelas-kalendars' ? 'week' : 'month'
  end
 end
 if useful_page?(p,f) && !trust_page?(p)
  body=useful_pages_markup(p,f,title,body)
  front['useful']=true
 end
 visual=visual_family(f,p)
 if trust_page?(p)
  content=body
 elsif front['category']
  content="<div class=\"category-page category-page--#{h(slug)} category-v2\"><nav class=\"breadcrumbs\" aria-label=\"Atrašanās vieta\">#{breadcrumb_markup(p,title)}</nav>#{category_hero_markup(slug,heading)}#{body}</div>"
 elsif slug=='izveidot-kalendaru'
  content="<div class=\"page-shell page-shell--studio\"><nav class=\"breadcrumbs\" aria-label=\"Atrašanās vieta\">#{breadcrumb_markup(p,title)}</nav>#{body}</div>"
 elsif p.start_with?('/garas-brivdienas/')
  content="<div class=\"page-shell page-shell--long-weekends\"><nav class=\"breadcrumbs\" aria-label=\"Atrašanās vieta\">#{breadcrumb_markup(p,title)}</nav>#{body}</div>"
 elsif p=='/pdf-kalendari/'
  content="<div class=\"page-shell page-shell--print-library\"><nav class=\"breadcrumbs\" aria-label=\"Atrašanās vieta\">#{breadcrumb_markup(p,title)}</nav>#{body}</div>"
 else
 content=p=='/' ? body : "<div class=\"page-shell page-shell--#{h(f)} page-shell--visual-#{h(visual)}#{front['calendar_collection'] ? ' page-shell--calendar-collection' : ''}\"><nav class=\"breadcrumbs\" aria-label=\"Atrašanās vieta\">#{breadcrumb_markup(p,title)}</nav>#{page_heading_markup(f,p,heading,desc,y,m,slug)}#{body}</div>"
 end
 path=p=='/' ? 'index.html' : "generated#{p}index.html";FileUtils.mkdir_p(File.dirname(path));File.write(path,front.to_yaml+"---\n"+content)
 # A rebuild alone does not change lastmod. Only meaningful page content does.
 reading_note = READING_NOTES.for_route(r)
 revision_body=body.gsub(/(data-riga-today\s+value=")[^"]*(")/, '\\1CURRENT_RIGA_DATE\\2')
 revision_content=[title,desc,revision_body,reading_note]
 revision_content << CALENDAR_SNAPSHOTS[p]['contentFingerprint'] if CALENDAR_SNAPSHOTS[p]
 revision_content << Digest::SHA256.hexdigest(JSON.generate([CURRENT_NAMES['edition'],CURRENT_NAMES['records']])) if %w[name_calendar name_day_month].include?(f) || p=='/varda-dienas/'
 revision_content << day_photo if %w[occasion latvia_cultural].include?(f)
 content_hash = Digest::SHA256.hexdigest(JSON.generate(revision_content))
 previous_revision = previous_revisions.fetch(p,{})
 lastmod = previous_revision['sha256']==content_hash ? previous_revision['lastmod'] : revision_date
 page_revisions[p] = {sha256:content_hash,lastmod:lastmod}
 manifest << {url:p,title:title,family:f,indexable:!noindex,status:reason,description:desc,lastmod:lastmod}
end
category_export_data
# ISO boundary weeks are valid support routes; absent from the four-year matrix.
[[2031,1]].each do |y,w|
 READING_NOTES.for_route({'URL path'=>format('/nedelas-kalendars/%d/%02d/',y,w),'Page family'=>'iso_week','Year'=>y.to_s})
 url=format('/nedelas-kalendars/%d/%02d/',y,w)
 description='Apskati 2031. gada ISO 1. nedēļas datumus, kas sākas 2030. gada decembra pēdējās dienās.'
 path="generated/nedelas-kalendars/#{y}/#{format('%02d',w)}/index.html";FileUtils.mkdir_p(File.dirname(path));File.write(path,{'layout'=>'default','title'=>"#{y}. gada #{w}. nedēļa",'description'=>description,'permalink'=>url,'family'=>'iso_week','year'=>y,'week'=>w,'noindex'=>false}.to_yaml+"---\n<div class=\"page-shell\"><h1>#{y}. gada #{w}. nedēļa</h1>{% include app.html %}</div>")
 manifest << {url:url,title:"#{y}. gada #{w}. nedēļa",family:'iso_week',indexable:true,status:'ready',description:description,lastmod:previous_revisions.dig(url,'lastmod') || revision_date}
end
File.write('_includes/useful-license-tools.html',useful_pages_markup('/pilsetas-un-fotografijas/','city_photos','Fotogrāfijas un licences',''))
File.write('404.html',{'layout'=>'default','title'=>'Lapa nav atrasta','description'=>'Atrodi vajadzīgo Latvijas kalendāru, svētku dienu vai plānošanas rīku.','permalink'=>'/404.html','family'=>'not_found','noindex'=>true}.to_yaml+"---\n{% include not-found.html %}")
File.write('500.html',{'layout'=>'default','title'=>'Īslaicīga kļūda','description'=>'Lapa īslaicīgi nav pieejama. Mēģini vēlreiz vai atver Latvijas plānošanas rīkus.','permalink'=>'/500.html','family'=>'temporary_error','noindex'=>true}.to_yaml+"---\n{% include temporary-error.html %}")
photo_page_frontmatter = YAML.safe_load(File.read('pilsetas-un-fotografijas.html').split(/^---\s*$/,3).fetch(1))
photo_page_indexable = !photo_page_frontmatter.fetch('noindex',false)
CalendarIndexingPolicy.validate!('/pilsetas-un-fotografijas/',!photo_page_indexable)
license_sources=['pilsetas-un-fotografijas.html']+Dir.glob('_includes/*credits.html').sort
license_data=%w[cities occasions university-calendars astronomy-photos].map { |key| JSON.parse(File.read("_data/#{key}.json")) }
license_hash=Digest::SHA256.hexdigest(JSON.generate([license_sources.map { |path| File.read(path) },license_data]))
license_prior=previous_revisions.fetch('/pilsetas-un-fotografijas/',{})
license_modified=CalendarSeoContract.revision_date(license_prior,license_hash,license_prior['lastmod'] || revision_date,revision_date)
page_revisions['/pilsetas-un-fotografijas/']={sha256:license_hash,contentSha256:license_hash,lastmod:license_modified}
manifest << {url:'/pilsetas-un-fotografijas/',title:'Fotogrāfijas un licences',family:'city_photos',indexable:photo_page_indexable,status:(photo_page_indexable ? 'ready' : 'owner_noindex'),description:'82 Latvijas pilsētu, 42 svētku, 9 valsts augstskolu un 16 kultūraugu fotogrāfijas ar autoriem, avota failiem un licencēm.',lastmod:license_modified}
%w[/pilsetas-un-fotografijas/ /404.html /500.html].each do |url|
 READING_NOTES.for_route({'URL path'=>url,'Page family'=>'informational','Year'=>''})
end
File.write('_data/page-guides.json',JSON.pretty_generate({schemaVersion:1,locale:'lv-LV',editorial:{aiAssisted:true,nativeEditorReviewed:false},pages:READING_NOTES.pages})+"\n")
manifest.concat(BlogComponents.generate(ROOT))
manifest.map!{|record|CalendarSeoContract.enrich(record).transform_keys(&:to_sym)}
navigation_records=manifest+[
 {url:'/404.html',title:'Lapa nav atrasta',family:'not_found',indexable:false},
 {url:'/500.html',title:'Īslaicīga kļūda',family:'temporary_error',indexable:false}
]
internal_navigation=InternalNavigation.new(records:navigation_records,notes:READING_NOTES.pages,
 blogs:JSON.parse(File.read('_data/blog.json')).fetch('posts'),
 crops:JSON.parse(File.read('_data/garden-crops.json')).fetch('crops'),garden_actions:method(:garden_calendar_actions))
raise 'Related page previews failed' unless system(ENV.fetch('K365_IMAGE_PYTHON','python3'),'scripts/build_related_previews.py')
internal_navigation.write
File.write('_data/page-guides.json',JSON.pretty_generate({schemaVersion:1,locale:'lv-LV',editorial:{aiAssisted:true,nativeEditorReviewed:false},pages:READING_NOTES.pages})+"\n")
manifest.each do |record|
 url=record[:url];plan=internal_navigation.pages.fetch(url)
 navigation_hash=Digest::SHA256.hexdigest(JSON.generate(plan))
 prior=previous_revisions.fetch(url,{})
 if record[:contentSha256]
  record[:lastmod]=CalendarSeoContract.revision_date(prior,record[:contentSha256],record[:lastmod],revision_date)
 end
 prose=READING_NOTES.pages.dig(url,'linkedParagraphs')
 prose_hash=Digest::SHA256.hexdigest(JSON.generate(prose))
 previous_prose_hash=prior['proseLinksSha256'] || Digest::SHA256.hexdigest(JSON.generate(previous_prose.dig(url,'linkedParagraphs')))
 record[:lastmod]=revision_date if prior['navigationSha256']!=navigation_hash || prose_hash!=previous_prose_hash
 page_revisions[url]||={sha256:Digest::SHA256.hexdigest(JSON.generate(record)),lastmod:record[:lastmod]}
 page_revisions[url][:navigationSha256]=navigation_hash
 page_revisions[url][:proseLinksSha256]=prose_hash
 page_revisions[url][:contentSha256]=record[:contentSha256] if record[:contentSha256]
 page_revisions[url][:lastmod]=record[:lastmod]
 record[:significantModifiedAt]=record[:lastmod]
end
# Owner-excluded information pages remain useful in the site's own search.
search_pages=manifest.select{|r|r[:indexable] || r[:status]=='owner_noindex'}.map do |page|
 city=CITIES.find{|c|page[:url].end_with?("/#{c['id']}/")}
 keywords=city ? city['name'] : ''
 keywords+=' ascendents ascendenta uzlecošā zīme ascendant rising sign dzimšanas laiks' if page[:url]=='/horoskopa-zimes-kalkulators/'
 page.merge(keywords: keywords)
end
DATA.fetch('names',[]).each do |name|
 search_pages << {url:'/varda-dienas/?q='+URI.encode_www_form_component(name['name']),title:name['name'],kind:'Vārda diena',nameKind:name['kind'],description:"#{name['day']}. #{MONTHS[name['month'].to_i-1]} · Vārda diena (VVC #{name['edition']})",keywords:"vārda diena vārdi #{MONTHS[name['month'].to_i-1]}"}
end
DATA.fetch('holidays',[]).each do |holiday|
 date=Date.parse(holiday['date'])
  next unless date.year.between?(2027,2030)
 search_pages << {url:"/kalendars/#{date.year}/#{SLUGS[date.month-1]}/?date=#{date.iso8601}",title:"#{holiday['title']} #{date.year}",kind:'Kalendāra diena',description:"#{date.day}. #{GEN[date.month-1]} #{date.year} · #{holiday['dayOff'] ? 'Brīvdiena' : 'Atzīmējama diena'}",keywords:"svētki #{date.day} #{MONTHS[date.month-1]} #{date.iso8601}"}
end
File.write('assets/search-index.json',JSON.generate(search_pages))
File.write('docs/route-manifest.json',JSON.pretty_generate(manifest))
File.write('_data/page-revisions.json',JSON.pretty_generate(page_revisions)+"\n")
CalendarSitemap.write_source!(manifest)
File.write('_redirects',"/avoti/ /avoti-un-metodika/ 301\n/sikdatnes/ /sikdatnu-politika/ 301\n/lietošanas-noteikumi /lietošanas-noteikumi/ 301\n/lietosanas-noteikumi/ /lietošanas-noteikumi/ 301\n/darba-dienu-kalkulators/ /darba-laika-kalendars/ 301\n")
# Serialize the shared city catalog as JavaScript before hashing assets.
public_cities = CITIES.map do |c|
 preview=CITY_PHOTO_PREVIEWS.fetch(c.fetch('id'))
 fast=preview.fetch('files')
 version=preview.fetch('sourceSha256')[0,12]
 photo=c.fetch('photo').slice('src','srcset','alt','author','license').merge('preview'=>preview.fetch('preview'),'fastSrc'=>fast.first.fetch('src')+"?v=#{version}",'fastSrcset'=>(fast.map{|file|"#{file.fetch('src')}?v=#{version} #{file.fetch('width')}w"}+["#{c.fetch('photo').fetch('src')}?v=#{version} #{c.fetch('photo').fetch('width')}w"]).join(', '))
 c.slice('id','name','locative','lat','lon','timeZone').merge('photo'=>photo)
end
File.write('assets/cities.js', 'window.K365Cities = '+JSON.generate(public_cities)+";\n")
# Public sharing catalog uses the same reviewed covers and their photo credits.
share_catalog=JSON.parse(File.read('_data/social-images.json')).fetch('pages').transform_values do |row|
 {title:row.fetch('title'),image:row.fetch('src'),credits:row.fetch('sources').map{|photo|[photo['author']||photo['credit'],photo['license']].compact.join(' · ')}.join(' · ')}
end
File.write('assets/share-pages.json',JSON.generate(share_catalog))
# Content-addressed global asset revision; local user data is never involved.
asset_files = (Dir.glob('assets/**/*').select{|path|File.file?(path)} + ['downloads/manifest.json','downloads/meness/manifest.json','downloads/gada-a3/manifest.json','downloads/menesa-a3/manifest.json'].select{|path|File.file?(path)}).sort
asset_hashes = asset_files.to_h{|path|[path,Digest::SHA256.file(path).hexdigest]}
asset_sha256 = Digest::SHA256.hexdigest(JSON.generate(asset_hashes))
File.write('_data/build.json',JSON.pretty_generate({asset_version:asset_sha256[0,16],sha256:asset_sha256,files:asset_hashes})+"\n")
puts JSON.generate({routes:manifest.length,indexable:manifest.count{|r|r[:indexable]},pending:manifest.count{|r|!r[:indexable]}})
