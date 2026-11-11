# frozen_string_literal: true
# Calendar grids and their generated year/month/week/download variants are outside
# this enrichment pass. Informational articles and purpose-built tools are included.
CALENDAR_PAGE_FAMILIES = %w[year calendar_month month_index lunar_year lunar_month week_index iso_week print_index print_month name_calendar name_day_month work_year work_month holiday_year holiday_month memorial_year garden_month school_academic school_year_calendar].freeze
CALENDAR_PAGE_ROOTS = %w[/ /kalendars/ /menesa-kalendars/ /nedelas-kalendars/ /meness-kalendars/ /pdf-kalendari/ /kalendars-ar-vardu/ /tukss-kalendars/ /dzimsanas-dienu-kalendars/ /dienas-kalendars/ /dienas-planotajs/ /skolas-kalendars/ /izveidot-kalendaru/].freeze
def useful_page?(url,family)
 !CALENDAR_PAGE_FAMILIES.include?(family) && !CALENDAR_PAGE_ROOTS.include?(url)
end
def useful_kind(url,family)
 return 'weeks' if url=='/nedelu-numuri/'
 return 'phase' if %w[/pilnmeness/ /jaunmeness/].include?(url)
 return 'city' if %w[sun_city moon_city sky_hub].include?(family) || %w[/saullekts-saulriets/ /dienas-garums/].include?(url)
 return 'observances' if url.start_with?('/atceres-dienas/') || %w[/svetku-dienas/ /nozimigas-dienas/].include?(url)
 return 'occasion' if %w[occasion latvia_cultural].include?(family)
 return 'garden' if family=='garden'
 return 'reflection' if family=='horoscope' || %w[/horoskops/ /zodiaka-zimes/ /horoskopa-zimes-kalkulators/].include?(url)
 return 'sources' if url=='/avoti-un-metodika/'
 return 'licenses' if url=='/pilsetas-un-fotografijas/'
 return 'contact' if %w[/kontakti/ /labojumi/].include?(url)
 return 'directory' if url=='/visi-riki/'
 'reading'
end
def useful_pages_markup(url,family,title,body)
 return body unless useful_page?(url,family)
 kind=useful_kind(url,family);slug=url.split('/').last
 config={url:url,kind:kind,title:title,city:(%w[sun_city moon_city].include?(family) ? slug : 'riga'),sky:(family=='moon_city' || family=='sky_hub' ? 'moon' : 'sun')}
 if kind=='phase'
  phase=url=='/pilnmeness/' ? 'Full Moon' : 'New Moon'
  config[:dates]=DATA.fetch('moon',[]).select{|r|r['phaseKey']==phase && r['date']>='2027-01-01' && r['date']<='2030-12-31'}
  body=''
 end
 body=planning_panel('leave',2027)+body if url=='/garas-brivdienas/'
 if kind=='observances'
  month=SLUGS.index(slug)
  config[:dates]=HOLIDAYS.select{|r|r['date']>='2027-01-01' && r['date']<='2030-12-31' && (month.nil? || r['date'][5,2].to_i==month+1) && (url.start_with?('/atceres-dienas/') ? !r['dayOff'] : url=='/svetku-dienas/' ? r['dayOff'] : true)}
 end
 if kind=='occasion'
  original=JSON.parse(File.read('_data/occasions.json')).find{|r|r['slug']==slug}
  cultural=LATVIA_EXTRA_PAGES[url]
  config[:dates]=original ? original.fetch('dates',[]) : cultural ? (2027..2030).flat_map{|year|cultural_calendar_dates(cultural,year)} : []
  config[:sources]=original ? original.fetch('sourceUrls',[]) : Array(cultural && cultural['sourceIds']).map{|id|LATVIA_VERIFIED['sources'].find{|r|r['id']==id}&.fetch('url',nil)}.compact
  config[:dayOff]=original ? original['dayOff']==true : false
 end
 head='<div class="useful-heading"><div><span class="eyebrow">PRAKTISKI TEV</span>'
 panel=case kind
 when 'weeks'
  head+'<h2>No datuma uz ISO nedēļu — un atpakaļ</h2><p>ISO nedēļa sākas pirmdienā. Gada pirmā nedēļa satur 4. janvāri; gada mijā ISO gads var atšķirties no datuma gada.</p></div></div><form data-useful-iso-date><label>Datums<input name="date" type="date" value="2027-01-01" min="1901-01-01" max="2099-12-31" required></label><button type="submit">Noteikt nedēļu</button></form><form data-useful-iso-week><label>ISO gads<input name="year" type="number" min="1901" max="2099" value="2027" required></label><label>Nedēļa<input name="week" type="number" min="1" max="53" value="1" required></label><button type="submit">Atrast septiņus datumus</button></form><div data-useful-iso-result></div>'
 when 'phase'
  head+'<h2>'+h(url=='/pilnmeness/' ? 'Pilnmēness brīži Latvijas laikā' : 'Jaunmēness brīži Latvijas laikā')+'</h2><p>USNO precīzie fāžu brīži, pārrēķināti Europe/Riga. Fāzes brīdis ir kopīgs visai Latvijai.</p></div></div><form data-useful-phase><label>Gads<select name="year">'+(2027..2030).map{|year|"<option>#{year}</option>"}.join+'</select></label><label>Mēnesis<select name="month"><option value="0">Viss gads</option>'+MONTHS.each_with_index.map{|month,i|"<option value=\"#{i+1}\">#{h(month.capitalize)}</option>"}.join+'</select></label><button type="submit">Atlasīt</button><button type="button" data-useful-phase-ics>Atlasītie brīži (ICS) ↓</button><button type="button" data-useful-phase-csv>Tabula (CSV) ↓</button></form><div data-useful-phase-list></div>'
 when 'city'
  head+'<h2>Salīdzini divas Latvijas pilsētas</h2><p>Vienas dienas vietējie laiki un tuvāko septiņu dienu pārskats.</p></div></div><form data-useful-city><label>Datums<input name="date" type="date" min="1901-01-01" max="2099-12-25" value="'+Date.today.iso8601+'" required></label><label>Pirmā pilsēta<select name="first"></select></label><label>Otrā pilsēta<select name="second"></select></label><button type="submit">Salīdzināt</button></form><div data-useful-city-result></div><div class="useful-actions"><button type="button" data-useful-city-csv>Septiņas dienas (CSV) ↓</button><button type="button" data-useful-city-link>Kopēt salīdzinājuma saiti</button></div><p class="useful-note">Astronomisks aprēķins pilsētas centram, Europe/Riga. Vietējais reljefs un laikapstākļi nav modelēti. Mēness fāze abās pilsētās ir kopīga; lēkta un rieta laiki atšķiras.</p>'
 when 'observances'
  head+'<h2>Atrodi datumu un izveido savu atlasi</h2><p>Latvijas likumā norādītie svētki, atceres un atzīmējamās dienas. Atlasi savu gadu un nosaukumu.</p></div></div><form data-useful-observances><label>Gads<select name="year">'+(2027..2030).map{|year|"<option>#{year}</option>"}.join+'</select></label><label>Meklēt nosaukumu<input name="q" type="search"></label><button type="button" data-useful-observance-all>Atzīmēt redzamos</button><button type="submit">Lejupielādēt atzīmētos (ICS) ↓</button></form><div data-useful-observance-list></div>'
 when 'occasion'
  head+'<h2>Ieplāno šo dienu</h2><p>Izvēlies tikai avotā noteiktu datumu. Pievieno savu atgādinājumu pirms notikuma.</p></div></div><form data-useful-event><label>Notikuma datums<select name="event" required></select></label><label>Atgādināt iepriekš<select name="lead"><option value="0">Notikuma dienā</option><option value="1">1 dienu</option><option value="7">7 dienas</option><option value="14">14 dienas</option><option value="30">30 dienas</option></select></label><button type="submit">Lejupielādēt atgādinājumu (ICS) ↓</button></form><div data-useful-event-result></div><p class="useful-note">Atgādinājums ir visas dienas ieraksts. Ierīces paziņojumu laiku iestati savā kalendāra lietotnē.</p>'
 when 'garden'
  head+'<h2>Cik vietas un sēklu vajadzēs?</h2><p>Ievadi savas šķirnes ieteiktos attālumus. Aprēķins neveido audzēšanas ieteikumus.</p></div></div><form data-useful-spacing><label>Dobes garums (m)<input type="number" name="length" min="0.1" max="1000" step="0.01" required></label><label>Dobes platums (m)<input type="number" name="width" min="0.1" max="1000" step="0.01" required></label><label>Attālums starp rindām (cm)<input type="number" name="rows" min="1" max="1000" step="0.1" required></label><label>Attālums rindā (cm)<input type="number" name="plants" min="1" max="1000" step="0.1" required></label><label>Dīgstspēja no paciņas (%)<input type="number" name="germination" min="1" max="100" step="1" value="100" required></label><button type="submit">Aprēķināt</button></form><div data-useful-spacing-result></div><p class="useful-note">Taisnstūra dobe, rindas garenvirzienā, malās puse no izvēlētā attāluma. Taciņas un rezerves platība nav iekļautas. Dīgstspējas procents ir tavs ievadītais pieņēmums.</p>'
 when 'reflection'
  head+'<h2>Mans dienas pieraksts</h2><p>Simbolisko lasījumu izmanto pārdomām: uzraksti vienu īstenojamu soli savai dienai.</p></div></div><form data-useful-journal><label>Datums<input type="date" name="date" value="'+Date.today.iso8601+'" required></label><label class="useful-wide">Ko es šodien izvēlos izdarīt?<textarea name="note" maxlength="2000" rows="3" required></textarea></label><button type="submit">Saglabāt šajā ierīcē</button><button type="button" data-useful-journal-export>Mani pieraksti (TXT) ↓</button></form><div data-useful-journal-list></div><p class="useful-note">Pieraksti netiek nosūtīti serverim. Horoskops ir izklaide un simboliska interpretācija, nevis notikumu prognoze.</p>'
 when 'contact'
  head+'<h2>Sagatavo precīzu jautājumu</h2><p>Nosaukums, lapas adrese un avots palīdzēs saprast tavu ziņu. Tā netiek automātiski nosūtīta.</p></div></div><form data-useful-report><label>Par ko raksti?<select name="kind"><option>Datuma precizējums</option><option>Rīks nedarbojas</option><option>Teksta vai piekļūstamības kļūda</option><option>Fotogrāfija un licence</option><option>Cits jautājums</option></select></label><label>Lapas adrese<input name="url" type="url" placeholder="https://kalendars365.lv/"></label><label>Avota saite, ja ir<input name="source" type="url"></label><label class="useful-wide">Apraksts<textarea name="message" rows="4" maxlength="4000" required></textarea></label><button type="submit">Sagatavot ziņu</button></form><div data-useful-report-result></div>'
 when 'directory'
  head+'<h2>Manas saglabātās lapas</h2><p>Pilsētas, svētku stāsti, dārza ceļveži un citi šajā ierīcē saglabātie raksti.</p></div></div><label>Meklēt saglabātajās lapās<input type="search" data-useful-saved-query></label><div data-useful-saved-list></div>'
 when 'sources','licenses'
  head+'<h2>'+(kind=='sources' ? 'Atrodi vajadzīgo avotu' : 'Atrodi attēlu un tā licenci')+'</h2><p>Meklē pēc nosaukuma, autora, izdevēja vai licences. Pārējais lapas saturs saglabājas.</p></div></div><label>Meklēt lapas avotos<input type="search" data-useful-source-query placeholder="Piemēram, USNO, Rīga vai CC BY"></label><div data-useful-source-results></div>'
 else
  ''
 end
 # Every included page gets an actionable, section-specific reading navigator.
 nav='<nav class="useful-outline" data-useful-outline aria-label="Šajā lapā"><div><strong>Šajā lapā</strong><div class="useful-actions"><button type="button" data-useful-save aria-pressed="false">Saglabāt lasīšanai</button><button type="button" data-useful-copy-link>Kopēt lapas saiti</button></div></div><div data-useful-outline-links></div></nav>'
 section=panel.empty? ? '' : '<section class="useful-panel" id="praktiski-tev" data-useful-panel>'+panel+'<p class="useful-status" role="status" data-useful-status></p></section>'
 data='<script type="application/json" data-useful-config>'+JSON.generate(config).gsub('<','\\u003c')+'</script>'
 nav+body+section+data
end
