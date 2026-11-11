# frozen_string_literal: true

def verified_source_link(id)
  source = LATVIA_VERIFIED.fetch('sources', []).find { |item| item['id'] == id }
  return '' unless source && source['url'].to_s.start_with?('https://')
  %(<a href="#{h(source['url'])}" target="_blank" rel="noopener noreferrer">#{h(source['title'])}</a>)
end

def verified_sources_panel(ids, note = '')
  links = ids.uniq.map { |id| verified_source_link(id) }.reject(&:empty?)
  return '' if links.empty? && note.empty?
  %(<aside class="source-panel"><strong>Avoti un datu tvērums</strong>#{note.empty? ? '' : "<p>#{h(note)}</p>"}<ul>#{links.map { |link| "<li>#{link}</li>" }.join}</ul></aside>)
end

def breadcrumb_markup(path, current_title)
  parents = ROUTES.select do |route|
    url = route['URL path']
    url != path && url != '/' && path.start_with?(url) && url.end_with?('/')
  end.sort_by { |route| route['URL path'].length }
  items = [a('/', 'Sākums')]
  parents.each do |route|
    editorial = EDITORIAL[route['URL path']] || {}
    label = editorial['h1'] || editorial['title'] || title_for(route)
    items << a(route['URL path'], label)
  end
  items << %(<span aria-current="page">#{h(current_title)}</span>)
  items.join(' <span aria-hidden="true">/</span> ')
end

def memorial_month_markup(month)
  records = HOLIDAYS.select do |item|
    date = Date.parse(item['date'])
    date.month == month && date.year.between?(2027, 2030) && item['dayOff'] == false
  end.sort_by { |item| item['date'] }
  if records.empty?
    return '<section class="content-card"><p>Avotā nav šim periodam atzīmētu ierakstu.</p></section>'
  end
  rows = records.map do |item|
    date = Date.parse(item['date'])
    day = %w[Svētdiena Pirmdiena Otrdiena Trešdiena Ceturtdiena Piektdiena Sestdiena][date.wday]
    type = { 'commemoration' => 'Atceres diena', 'observance' => 'Atzīmējama diena', 'holiday' => 'Svētku diena' }.fetch(item['type'], item['type'])
    %(<tr><td><time datetime="#{date.iso8601}">#{date.strftime('%d.%m.%Y.')}</time></td><td>#{day}</td><td>#{h(item['title'] || item['name'])}</td><td>#{type}</td></tr>)
  end.join
  %(<section class="content-card"><p>Datumi uzskaitīti tikai pēc publicētajiem ierakstiem par 2027.–2030. gadu. Šajā lapā atceres un atzīmējamās dienas netiek pasniegtas kā brīvdienas.</p><div class="table-scroll"><table class="data-table"><thead><tr><th>Datums</th><th>Diena</th><th>Notikums</th><th>Kategorija</th></tr></thead><tbody>#{rows}</tbody></table></div></section>)
end

def day_of_year_markup
  today = Date.today.iso8601
  %(<section class="tool-panel extra-tool" data-day-of-year><h2>Nosaki datuma vietu gadā</h2><form class="extra-tool-form"><label>Datums pēc Latvijas laika<input type="date" name="date" data-riga-today value="#{today}" required></label><button class="primary">Aprēķināt</button></form><div class="extra-result" aria-live="polite"></div><p class="print-hint">Dienas kārtas numurs tiek skaitīts no 1. janvāra. Atlikušajā dienu skaitā izvēlēto datumu neieskaita.</p></section>)
end

def leap_year_markup
  %(<section class="tool-panel extra-tool" data-leap-year><h2>Pārbaudi jebkuru Gregora kalendāra gadu</h2><form class="extra-tool-form"><label>Gads<input type="number" name="year" min="1" max="9999" value="#{Date.today.year}" required></label><button class="primary">Pārbaudīt gadu</button></form><div class="extra-result" aria-live="polite"></div><p class="print-hint">Gads dalās ar 4, izņemot gadsimta gadus, kas dalās ar 100; gadsimta gads ir garais tikai tad, ja tas dalās arī ar 400.</p></section>)
end

def payment_reminder_markup(kind)
  title = kind == 'pension' ? 'Pensijas atgādinājums' : 'Pabalsta atgādinājums'
  %(<section class="tool-panel extra-tool" data-payment-reminder="#{kind}"><h2>Izveido savu privāto atgādinājumu</h2><p>Norādi datumu no sava VSAA lēmuma vai cita personīga paziņojuma. Kalendārs nepiedāvā visiem saņēmējiem kopīgu izmaksas dienu.</p><form class="extra-tool-form"><label>Atgādinājuma nosaukums<input name="title" maxlength="90" value="#{h(title)}" required></label><label>Personīgais datums<input type="date" name="date" required></label><button class="primary">Saglabāt šajā pārlūkā</button></form><div class="extra-result" aria-live="polite"></div><div class="payment-reminder-list"></div><button type="button" data-reminder-export>Lejupielādēt atgādinājumus (.ics)</button><p class="print-hint">Datums un nosaukums tiek glabāts tikai šajā ierīcē. Tie netiek nosūtīti Kalendārs365 vai VSAA. Sākotnējā izmaksas diena un vēlākā regulārā diena var atšķirties; pārlasi individuālo lēmumu.</p></section>)
end

def clock_change_markup
  rows = LATVIA_VERIFIED.fetch('clockChange').fetch('rows')
  options = rows.map { |row| %(<option value="#{row['year']}"#{row['year'] == Date.today.year ? ' selected' : ''}>#{row['year']}</option>) }.join
  embedded_rows = rows.map do |row|
    status = row['year'] == 2026 ? 'Oficiāli publicēts 2026. gadam' : 'Aprēķināts pēc pašlaik spēkā esošā noteikuma'
    %(<span hidden data-dst-row data-year="#{row['year']}" data-start-date="#{row['startDate']}" data-start-before="#{row['startBefore']}" data-start-after="#{row['startAfter']}" data-end-date="#{row['endDate']}" data-end-before="#{row['endBefore']}" data-end-after="#{row['endAfter']}" data-status="#{status}"></span>)
  end.join
  %(<section class="tool-panel extra-tool" data-clock-change>#{embedded_rows}<div class="field-grid"><label>Gads<select name="year">#{options}</select></label><button type="button" data-clock-export>Lejupielādēt pārejas atgādinājumus (.ics)</button></div><div class="clock-change-result" aria-live="polite"></div><p>Vasaras laika pāreja: marta pēdējā svētdienā plkst. 03.00 pulkstenis pārlec uz 04.00. Ziemas laika pāreja: oktobra pēdējā svētdienā plkst. 04.00 tas atgriežas uz 03.00. Visa Latvija lieto vienu Europe/Riga laika joslu.</p><p class="print-hint">2026. gada pārejas datumi ir publicēti oficiāli. 2027.–2030. gada datumi izriet no pašlaik spēkā esošā noteikuma; nākotnes likuma grozījums var tos mainīt.</p></section>)
end

def school_calendar_markup
  school = LATVIA_VERIFIED.fetch('education').fetch('school')
  break_cards = school.fetch('breaks').map do |item|
    %(<article class="holiday-card"><strong>#{h(item['label'])}</strong><time datetime="#{item['start']}">#{h(Date.parse(item['start']).strftime('%d.%m.%Y.'))}#{item['end'] ? "–#{h(Date.parse(item['end']).strftime('%d.%m.%Y.'))}" : ''}</time><small>#{h(item['scope'] || '1.–12. klase')}</small></article>)
  end.join
  %(<section class="content-card"><p class="lead">2026./2027. mācību gads: no #{Date.parse(school['start']).strftime('%d.%m.%Y.')} līdz 1.–8. un 10.–11. klasei #{Date.parse(school['endByGrade']['1–8, 10–11']).strftime('%d.%m.%Y.')}. 9. un 12. klašu beigu datumi ir atšķirīgi.</p><div class="metrics-grid"><div><b>#{Date.parse(school['endByGrade']['9']).strftime('%d.%m.')}</b><span>9. klasei</span></div><div><b>#{Date.parse(school['endByGrade']['12']).strftime('%d.%m.')}</b><span>12. klasei</span></div><div><b>#{Date.parse(school['firstSemester']['start']).strftime('%d.%m.')}</b><span>1. semestra sākums</span></div><div><b>#{Date.parse(school['secondSemesterStart']).strftime('%d.%m.')}</b><span>2. semestra sākums</span></div></div><h2>Publicētie brīvlaiki</h2><div class="holiday-card-grid">#{break_cards}</div><p>1. klasei papildu brīvlaika nedēļu otrajā semestrī nosaka konkrētā skola. Skolas vadība publicētajā kārtībā var noteikt lokālas izmaiņas; seko savas skolas paziņojumiem.</p></section>)+verified_sources_panel(['school-2027'],'Datumi attiecas tikai uz 2026./2027. mācību gadu; nepublicētiem gadiem netiek kopēti iepriekšējā gada termiņi.')
end

def exam_calendar_markup
  exams = LATVIA_VERIFIED.fetch('education').fetch('exams')
  records = exams.flat_map do |exam|
    one_off = exam.fetch('dates', []).map { |date| { 'start' => date, 'end' => date, 'range' => false } }
    range = exam['start'] ? [{ 'start' => exam['start'], 'end' => exam['end'] || exam['start'], 'range' => true }] : []
    (one_off + range).map do |date|
      exam.merge(date).merge('id' => Digest::SHA1.hexdigest(JSON.generate([exam, date]))[0, 14])
    end
  end.sort_by { |item| [item['start'], item['grade'].to_i, item['subject'].to_s] }
  rows = records.map do |item|
    date_label = item['range'] ? "#{Date.parse(item['start']).strftime('%d.%m.%Y.')}–#{Date.parse(item['end']).strftime('%d.%m.%Y.')}" : Date.parse(item['start']).strftime('%d.%m.%Y.')
    %(<tr data-exam-row data-id="#{item['id']}" data-start="#{item['start']}" data-end="#{item['end']}" data-grade="#{item['grade']}" data-kind="#{h(item['kind'])}" data-session="#{h(item['session'])}" data-search="#{h([item['scope'], item['grade'], item['subject'], item['kind'], item['session'], item['level'], item['component']].compact.join(' ').downcase)}"><td><input aria-label="Iekļaut #{h(item['subject'])} kalendāra failā" type="checkbox" data-exam-select></td><td><time datetime="#{item['start']}">#{date_label}</time></td><td>#{item['grade']}.</td><td>#{h(item['subject'])}#{item['level'] ? " · #{h(item['level'])}" : ''}#{item['component'] ? " · #{h(item['component'])}" : ''}</td><td>#{h(item['kind'])}</td><td>#{h(item['session'])}</td></tr>)
  end.join
  %(<section class="content-card extra-tool" data-exam-table><p class="lead">2026./2027. mācību gada oficiālajā grafikā ir monitoringa darbi, 9. klases pārbaudes darbi un vidējās izglītības centralizētie eksāmeni. Atsevišķi norādīti pamatlaiki un attaisnotas kavēšanas norises periodi.</p><div class="exam-filter-grid"><label>Meklēt priekšmetu<input type="search" data-exam-search placeholder="Piemēram, matemātika"></label><label>Klase<select data-exam-grade><option value="">Visas klases</option>#{(2..12).map { |grade| "<option value=\"#{grade}\">#{grade}. klase</option>" }.join}</select></label><label>Darba veids<select data-exam-kind><option value="">Visi veidi</option>#{records.map { |item| item['kind'] }.uniq.sort.map { |kind| "<option>#{h(kind)}</option>" }.join}</select></label><label>Norise<select data-exam-session><option value="">Visi periodi</option>#{records.map { |item| item['session'] }.uniq.sort.map { |session| "<option>#{h(session)}</option>" }.join}</select></label></div><p data-exam-count role="status">Parādīti #{records.length} ieraksti.</p><div class="table-scroll"><table class="data-table exam-table"><thead><tr><th>Iekļaut</th><th>Datums vai periods</th><th>Klase</th><th>Priekšmets</th><th>Darba veids</th><th>Norise</th></tr></thead><tbody>#{rows}</tbody></table></div><div class="actions"><button type="button" data-exam-export>Eksportēt atlasītos ierakstus (.ics)</button><button type="button" data-exam-select-all>Atlasīt redzamos</button></div><p class="print-hint">Kalendāra fails satur tikai atlasītos oficiālos ierakstus. Ārkārtas papildu sesijām un sertifikātu izsniegšanas datumam nav pievienoti neizziņoti termiņi.</p></section>)+verified_sources_panel(['exam-2027','exam-programs'],'Mācību gada grafikā atsevišķi saglabātas darba daļas, līmeņi un attaisnotas kavēšanas norises periodi. Tie nav 88 dažādi eksāmeni.')
end

def study_calendar_markup
  university_explorer_markup
end

def lunar_print_gallery(year, month=nil)
  path = 'downloads/meness/manifest.json'
  return '' unless File.file?(path)
  items = JSON.parse(File.read(path)).fetch('items').select { |item| item['year'] == year && item['month'] == month }.sort_by { |item| item['design'] }
  raise "Incomplete lunar prints for #{year}/#{month}" unless items.length == 4
  arrow = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/></svg>'
  file_icon = '<img src="/assets/file-pdf.svg" width="26" height="26" alt="" aria-hidden="true">'
  image_icon = '<img src="/assets/file-image.svg" width="26" height="26" alt="" aria-hidden="true">'
  cards = items.each_with_index.map do |item,index|
    orientation = item['orientation'] == 'portrait' ? 'Vertikāli' : 'Horizontāli'
    mb = format('%.1f', item['pdfBytes'] / 1_000_000.0).tr('.', ',')
    %(<article class="moon-print-card"><a class="moon-print-preview" href="#{h(item['image'])}" target="_blank" rel="noopener" aria-label="Priekšskatīt: #{h(item['name'])}"><img src="#{h(item['preview'])}" alt="#{h(item['name'])} · #{month ? h(MONTHS[month-1])+' ' : ''}#{year}. gada Mēness kalendārs" width="#{item['width']}" height="#{item['height']}" loading="#{index<2 ? 'eager' : 'lazy'}"#{index==0 ? ' fetchpriority="high"' : ''}><span>Priekšskatīt ↗</span></a><div class="moon-print-details"><h3>#{h(item['name'])}</h3><p>#{item['paper']} · #{orientation} · 600 dpi</p><div class="moon-print-downloads"><a href="#{h(item['pdf'])}" download aria-label="Lejupielādēt PDF: #{h(item['name'])}">#{file_icon}<span>PDF</span>#{arrow}</a><a href="#{h(item['image'])}" download aria-label="Lejupielādēt attēlu: #{h(item['name'])}">#{image_icon}<span>Attēls</span>#{arrow}</a></div><small>PDF #{mb} MB · Attēls #{item['width']} × #{item['height']} px</small></div></article>)
  end.join
  %(<section class="moon-print-section" id="meness-drukai" aria-labelledby="moon-print-title"><header class="moon-print-heading"><div><span class="eyebrow">SAGLABĀ UN IZDRUKĀ</span><h2 id="moon-print-title">#{month ? 'Mēneša' : 'Gada'} Mēness kalendārs drukai</h2><p>Četri dizaini. PDF vai augstas izšķirtspējas attēls.</p></div><span class="moon-print-quality">600 dpi</span></header><div class="moon-print-grid">#{cards}</div><p class="moon-print-note">Mēness izskats aprēķināts katrai dienai plkst. 12.00 pēc Latvijas laika; debess ziemeļi augšā. Virsma: <a href="https://svs.gsfc.nasa.gov/4720/" target="_blank" rel="noopener">NASA SVS / LRO / LROC</a>. <a href="/avoti-un-metodika/">Aprēķinu avoti</a>.</p></section>)
end

def lunar_month_markup(year, month)
  data = JSON.parse(File.read('assets/calendar-data.json'))
  all_phases = data.fetch('moon', [])
  start_date = Date.new(year, month, 1)
  end_date = Date.new(year, month, -1)
  phases = all_phases.select do |event|
    date = Date.parse(event.fetch('date'))
    date >= (start_date << 1) && date <= (end_date >> 1)
  end
  phase_by_date = all_phases.select { |event| event['date'].start_with?(format('%04d-%02d', year, month)) }.to_h { |event| [event['date'], event] }
  blanks = Array.new(start_date.cwday - 1) { '<span class="lunar-day-empty" aria-hidden="true"></span>' }
  days = (1..end_date.day).map do |day|
    date = Date.new(year, month, day)
    key = date.iso8601
    event = phase_by_date[key]
    holiday = HOLIDAYS.find { |item| item['date'] == key && item['dayOff'] }
    phase_short = event && { 'Jaunmēness' => 'Jaunmēness', 'Pirmais ceturksnis' => '1. ceturksnis', 'Pilnmēness' => 'Pilnmēness', 'Pēdējais ceturksnis' => 'Pēd. ceturksnis' }.fetch(event['phase'], event['phase'])
    phase_mark = event ? %(<span class="lunar-phase-mark" title="#{h(event['phase'])} · #{h(event['time'])}">#{h(phase_short)}</span>) : ''
    holiday_mark = holiday ? %(<span class="lunar-holiday-mark" title="#{h(holiday['title'] || holiday['name'])}">Brīvdiena</span>) : ''
    label = "#{day}. #{MONTHS[month - 1]} #{year}."
    %(<button type="button" class="lunar-day#{date.cwday > 5 ? ' is-weekend' : ''}#{event ? ' has-exact-phase' : ''}" data-lunar-day="#{key}" aria-pressed="false" aria-label="#{h(label)} · Mēness apgaismojums tiek aprēķināts izvēlētajam datumam" title="#{h([event && "#{event['phase']} · #{event['time']} Rīgas laikā", holiday && (holiday['title'] || holiday['name'])].compact.join(' · '))}"><span class="lunar-day-number">#{day}</span><canvas class="lunar-day-moon" width="90" height="90" data-moon-canvas data-moon-date="#{key}" aria-hidden="true"></canvas><span class="lunar-day-percent" data-lunar-percent>—%</span>#{phase_mark}#{holiday_mark}</button>)
  end
  day_names = %w[P. O. T. C. Pk. S. Sv.].map { |name| %(<span class="lunar-weekday">#{name}</span>) }.join
  month_slug = SLUGS[month - 1]
  previous_date = start_date << 1
  next_date = start_date >> 1
  previous_path = "/meness-kalendars/#{previous_date.year}/#{SLUGS[previous_date.month - 1]}/"
  next_path = "/meness-kalendars/#{next_date.year}/#{SLUGS[next_date.month - 1]}/"
  previous_link = previous_date.year >= 2027 ? a(previous_path, '← Iepriekšējais mēnesis', 'lunar-nav-button') : %(<span class="lunar-nav-button is-disabled" aria-disabled="true" title="Pieejamie Mēness kalendāri sākas 2027. gadā">← Iepriekšējais mēnesis</span>)
  next_link = next_date.year <= 2030 ? a(next_path, 'Nākamais mēnesis →', 'lunar-nav-button') : %(<span class="lunar-nav-button is-disabled" aria-disabled="true" title="Pieejamie Mēness kalendāri beidzas 2030. gadā">Nākamais mēnesis →</span>)
  year_path = "/meness-kalendars/#{year}/"
  city_options = CITIES.map { |city| %(<option value="#{h(city['id'])}"#{city['id'] == 'riga' ? ' selected' : ''}>#{h(city['name'])}</option>) }.join
  phases_json = JSON.generate(phases)
  %(<section class="lunar-page" data-lunar-calendar data-lunar-year="#{year}" data-lunar-month="#{month}" data-lunar-source="/assets/moon-lro-mosaic.jpg">
    <div class="lunar-action-banner"><span class="lunar-action-icon" aria-hidden="true">↓</span><div><strong>Mēness kalendārs PDF un attēla formātā.</strong><p>Četras drukas veidnes 600 dpi kvalitātē.</p></div><a class="lunar-template-link" href="#meness-drukai">Drukas veidnes ↓</a></div>
    <nav class="lunar-month-nav" aria-label="Mēneša navigācija">#{previous_link}#{a(year_path, 'Gada pārskats', 'lunar-nav-button lunar-nav-year')}#{next_link}</nav>
    <div class="lunar-calendar-layout">
      <section class="lunar-calendar-card" aria-label="#{h(MONTHS[month - 1])} #{year}. gada Mēness kalendārs">
        <header class="lunar-calendar-heading"><div><span class="eyebrow">MĒNESS CIKLS · EUROPE/RIGA</span><h2>#{h(MONTHS[month - 1].capitalize)} #{year}</h2></div><span class="lunar-calendar-clock" data-lunar-local-label>Plkst. 12.00 · Rīga</span></header>
        <div class="lunar-weekdays" aria-hidden="true">#{day_names}</div>
        <div class="lunar-day-grid" role="group" aria-label="#{h(MONTHS[month - 1])} kalendāra dienas">#{(blanks + days).join}</div>
        <div class="lunar-legend"><span><i class="lunar-legend-phase"></i> Precīzs fāzes brīdis</span><span><i class="lunar-legend-holiday"></i> Latvijas brīvdiena</span></div>
      </section>
      <aside class="lunar-detail-card" data-lunar-detail aria-live="polite" aria-label="Izvēlētās dienas Mēness fāze">
        <span class="eyebrow">IZVĒLĒTĀ DIENA</span><h2 data-lunar-date-label>#{h(start_date.strftime('%d.'))} #{h(MONTHS[month - 1])} #{year}</h2>
        <div class="lunar-moon-scene"><canvas class="lunar-detail-moon" width="420" height="420" data-lunar-large-moon role="img" aria-label="Mēness virsmas fotomozaīka; izvēlētā datuma fāze ielādējas"></canvas><span class="lunar-scene-star lunar-scene-star-a"></span><span class="lunar-scene-star lunar-scene-star-b"></span><span class="lunar-scene-star lunar-scene-star-c"></span><span class="lunar-scene-caption">NASA LRO · LROC</span></div>
        <div class="lunar-phase-reading"><div><span class="eyebrow">FĀZE</span><strong data-lunar-phase-label>Aprēķina…</strong></div><b class="lunar-illumination" data-lunar-illumination>—%</b></div>
        <p class="lunar-phase-description" data-lunar-description>Izvēlētās dienas Mēness apgaismojums tiek aprēķināts Rīgas vietējā laikā.</p>
        <label class="lunar-city-picker">Pilsēta Mēness aprēķinam<select data-lunar-city>#{city_options}</select></label>
        <dl class="lunar-event-details"><div><dt>Nākamā galvenā fāze</dt><dd data-lunar-next-phase>—</dd></div><div><dt>Mēness lēkts</dt><dd data-lunar-rise>—</dd></div><div><dt>Mēness riets</dt><dd data-lunar-set>—</dd></div></dl>
        <p class="lunar-visual-credit">Virsmas fotomozaīka: <a href="https://svs.gsfc.nasa.gov/5001/" target="_blank" rel="noopener">NASA Scientific Visualization Studio, LRO/LROC</a>. Izvēlētā datuma apgaismojums tiek modelēts astronomiski; fāzes precīzie brīži: <a href="https://aa.usno.navy.mil/data/api" target="_blank" rel="noopener">USNO</a>.</p>
      </aside>
    </div>
    <script type="application/json" data-lunar-exact-phases>#{phases_json}</script>
  </section>)
end

def lunar_cover(year)
  key = {2026=>'moon-apollo8-earthrise',2027=>'moon-apollo17',2028=>'moon-keeler',2029=>'moon-bruce',2030=>'moon-artemis-earthrise'}.fetch(year, 'moon-apollo17')
  JSON.parse(File.read('_data/astronomy-photos.json')).fetch('photos').find { |photo| photo['id'] == key }
end

def lunar_year_markup(year)
  data = JSON.parse(File.read('assets/calendar-data.json'))
  phases = data.fetch('moon', []).select { |event| event['date'].start_with?(year.to_s) }
  return '<section class="content-card"><h2>Šī gada Mēness dati vēl nav pieejami.</h2><p>Precīzus fāžu brīžus pievienojam tikai pēc avota datu pārbaudes.</p></section>' if phases.empty?
  months = (1..12).map do |month|
    month_phases = phases.select { |event| Date.parse(event['date']).month == month }
    new_moons = month_phases.count { |event| event['phase'] == 'Jaunmēness' }
    full_moons = month_phases.count { |event| event['phase'] == 'Pilnmēness' }
    path = "/meness-kalendars/#{year}/#{SLUGS[month - 1]}/"
    %(<a class="lunar-year-month" href="#{path}"><span class="lunar-month-index">#{format('%02d', month)}</span><strong>#{h(MONTHS[month - 1].capitalize)}</strong><span>#{Date.new(year, month, -1).day} #{Date.new(year, month, -1).day == 31 ? 'diena' : 'dienas'}</span><small>#{new_moons} jaunmēness · #{full_moons} pilnmēness</small><b>Atvērt mēnesi <i aria-hidden="true">↗</i></b></a>)
  end.join
  days = Date.gregorian_leap?(year) ? 366 : 365
  cover = lunar_cover(year)
  %(<section class="lunar-year-page" data-lunar-year-overview><nav class="lunar-year-switch" aria-label="Gada izvēle">#{(2027..2030).map { |item| a("/meness-kalendars/#{item}/", item.to_s, item == year ? 'is-current' : '') }.join}</nav><header class="lunar-year-hero" data-cover="#{h(cover['id'])}"><img src="#{h(cover['src'])}" alt="#{h(cover['alt'])}" width="#{cover['width']}" height="#{cover['height']}"><div class="lunar-year-hero-copy"><span class="eyebrow">GADA MĒNESS PĀRSKATS · LATVIJA</span><h2>#{year}</h2><p>#{days} dienas · #{phases.length} precīzi galveno fāžu brīži</p><a href="#lunar-months-#{year}">Izvēlies mēnesi ↓</a></div><span class="lunar-year-source">#{h(cover['credit'])}</span></header><section class="lunar-year-months" id="lunar-months-#{year}"><div class="lunar-year-section-heading"><div><span class="eyebrow">Dienu pa dienai</span><h2>Izvēlies mēnesi</h2></div><p>Atver kalendāru, lai izvēlētos jebkuru dienu un apskatītu tās Mēness fāzi.</p></div><div class="lunar-year-grid">#{months}</div></section><p class="lunar-year-credit">Vākiem izmantotas īstas NASA Apollo un Artemis I misiju fotogrāfijas. Tās ir vēsturiskas misiju fotogrāfijas, nevis attiecīgajā nākotnes gadā uzņemti attēli. <a href="/pilsetas-un-fotografijas/#astronomijas-fotografijas">Katra attēla avots un izmantošanas noteikumi</a>. Fāžu aprēķinu brīžus publicē <a href="https://aa.usno.navy.mil/data/api" target="_blank" rel="noopener">ASV Jūras observatorija (USNO)</a>.</p></section>)
end

def lunar_year_index_markup
  data = JSON.parse(File.read('assets/calendar-data.json'))
  years = data.fetch('moon', []).map { |event| Date.parse(event['date']).year }.uniq.sort.select { |year| year >= 2027 }
  cards = years.map do |year|
    phases = data.fetch('moon', []).select { |event| event['date'].start_with?(year.to_s) }
    cover = lunar_cover(year)
    %(<article class="lunar-year-card"><a class="lunar-year-card-image" data-cover="#{h(cover['id'])}" href="/meness-kalendars/#{year}/" aria-label="Atvērt #{year}. gada Mēness pārskatu"><img src="#{h(cover['src'])}" alt="#{h(cover['alt'])}" loading="lazy" width="#{cover['width']}" height="#{cover['height']}"><span>#{h(cover['credit'])}</span><b>#{year}</b></a><div class="lunar-year-card-body"><p>#{Date.gregorian_leap?(year) ? 366 : 365} dienas <i></i> #{phases.length} precīzi fāžu brīži</p><a href="/meness-kalendars/#{year}/" class="lunar-year-open">Atvērt gada pārskatu <span aria-hidden="true">↗</span></a><h3>Izvēlies mēnesi</h3><nav aria-label="#{year}. gada mēneši" class="lunar-year-mini-months">#{(1..12).map { |month| a("/meness-kalendars/#{year}/#{SLUGS[month - 1]}/", format('%02d %s', month, MONTHS[month - 1].capitalize)) }.join}</nav></div></article>)
  end.join
  %(<section class="lunar-year-index"><p class="lead">Izvēlies gadu, tad mēnesi. Katrā kalendāra dienā redzams attiecīgā datuma aprēķinātais Mēness apgaismojums; pieskaries dienai, lai atvērtu plašāku skatu.</p><div class="lunar-year-index-grid">#{cards}</div><p class="lunar-year-credit">Vākiem izmantotas īstas NASA Apollo un Artemis I misiju fotogrāfijas. Tās ir vēsturiskas misiju fotogrāfijas, nevis attiecīgajā nākotnes gadā uzņemti attēli. <a href="/pilsetas-un-fotografijas/#astronomijas-fotografijas">Katra attēla avots un izmantošanas noteikumi</a>. Precīzie fāžu brīži: <a href="https://aa.usno.navy.mil/data/api" target="_blank" rel="noopener">USNO</a>.</p></section>)
end

def observance_collection_markup
  statutory = JSON.parse(File.read('_data/occasions.json')).select { |article| article['verified'] }
  cultural = LATVIA_EXTRA.fetch('culturalPages')
  statutory_cards = statutory.map do |article|
    photo = article['photo'] || {}
    image = photo['src'] ? %(<img src="#{h(photo['src'])}" alt="#{h(photo['alt'])}" loading="lazy" width="#{photo['width'] || 640}" height="#{photo['height'] || 640}">) : ''
    caption = photo['caption'] ? %(<small>#{h(photo['caption'])}</small>) : ''
    %(<a class="observance-card" href="/svetki-un-tradicijas/#{h(article['slug'])}/">#{image}<span><strong>#{h(article['title'])}</strong><small>#{article['dayOff'] ? 'Likumā noteikta brīvdiena' : 'Latvijas kalendāra ieraksts'}</small>#{caption}</span></a>)
  end.join
  cultural_cards = cultural.map do |article|
    %(<a class="observance-card cultural-card" href="#{h(article['url'])}"><span><strong>#{h(article['h1'])}</strong><small>Kultūras, gadskārtu vai astronomijas tēma</small></span></a>)
  end.join
  %(<section class="content-card"><p class="lead">Atrodi Latvijas svētku dienas, gadskārtu notikumus un citas nozīmīgas tēmas. Likumā noteiktās brīvdienas, piemiņas dienas un kultūras tradīcijas ir nodalītas pēc to faktiskā statusa.</p><label class="observance-filter-label">Meklēt nosaukumu<input type="search" data-observance-search placeholder="Meklē Latvijas svētku kalendārā"></label><h2>Latvijas svētki un atzīmējamās dienas</h2><div class="observance-grid" data-observance-grid>#{statutory_cards}#{cultural_cards}</div><p class="print-hint">Fotoattēlu paraksti norāda, vai redzams konkrētais notikums, vēsturisks arhīvs vai ilustratīvs attēls.</p></section>)
end

def advent_sundays(year)
  last = Date.new(year,12,24)
  last -= last.wday
  (0..3).map { |i| last - 21 + 7*i }
end

def cultural_calendar_dates(article,year)
  model=article.fetch('dateModel',{})
  make=->(date,title,scope=nil) { {'date'=>date.iso8601,'title'=>title,'scope'=>scope}.compact }
  case model['type']
  when 'fixed'
    [make.call(Date.new(year,model.fetch('month'),model.fetch('day')),article['h1'],model['confessionScope'])]
  when 'gregorian-relative'
    return [] unless article['url'].include?('/advente/')
    advent_sundays(year).each_with_index.map { |date,i| make.call(date,"#{i+1}. adventes svētdiena",model['confessionScope']) }
  when 'easter-relative'
    easter=DATA.fetch('holidays').find { |r| r['date'].start_with?(year.to_s) && r['title']=='Pirmās Lieldienas' }
    easter ? [make.call(Date.parse(easter['date'])+model.fetch('offsetDays'),article['h1'],model['confessionScope'])] : []
  when 'confession-specific'
    model.fetch('variants',[]).flat_map do |variant|
      date=if variant['month'] && variant['day']
        Date.new(year,variant['month'],variant['day'])
      elsif variant['ruleId']=='advent-minus-seven-days'
        advent_sundays(year).first-7
      end
      date ? [make.call(date,variant['name'],variant['scope'])] : []
    end
  when 'astronomical'
    DATA.fetch('seasons',[]).select { |r| r['date'].start_with?(year.to_s) && model.fetch('typicalMonths',[]).include?(Date.parse(r['date']).month) && r['phenomenon']=='Equinox' }
  else
    []
  end
end

def cultural_page_markup(article)
  slug = article.fetch('url').split('/').last
  model = article['dateModel'] || {}
  intro = %(<p class="lead">#{tradition_text_markup(slug,article['intro'],'intro')}</p>)+tradition_context_markup(slug)
  date_markup = case model['type']
  when 'fixed'
    years = (2027..2030).map do |year|
      date = Date.new(year, model['month'], model['day'])
      label=%(<time datetime="#{date.iso8601}">#{year}. gada #{date.day}. #{h(MONTHS[date.month - 1])}</time>)
      %(<article class="holiday-card">#{tradition_date_link(date,label)}<small>#{%w[Svētdiena Pirmdiena Otrdiena Trešdiena Ceturtdiena Piektdiena Sestdiena][date.wday]}</small></article>)
    end.join
    local_date = article['localDate']
    local_markup = if local_date
      local_years = (2027..2030).map do |year|
        date = Date.new(year, local_date['month'], local_date['day'])
        label=%(<time datetime="#{date.iso8601}">#{year}. gada #{date.day}. #{h(MONTHS[date.month - 1])}</time>)
        %(<article class="holiday-card">#{tradition_date_link(date,label)}<small>#{%w[Svētdiena Pirmdiena Otrdiena Trešdiena Ceturtdiena Piektdiena Sestdiena][date.wday]}</small></article>)
      end.join
      %(<h3>Atsevišķi: Latvijas piemiņas diena</h3><div class="holiday-card-grid">#{local_years}</div><p>#{h(article['localDateNote'])}</p>)
    else
      ''
    end
    %(<section class="content-card"><h2>Datums kalendārā</h2><div class="holiday-card-grid">#{years}</div><p>#{h(article['dateNote'] || 'Šis ir tradīcijas vai atzīmēšanas datums. Likumā noteiktas brīvdienas ir norādītas atsevišķi.')}</p>#{local_markup}</section>)
  when 'latvian-spring'
    cards = [
      ['/svetki-un-tradicijas/meteni/', 'Meteņi: pavasara gaidīšanas tradīcijas'],
      ['/svetki-un-tradicijas/lieldienas/', 'Lieldienu datumi Latvijā'],
      ['/svetki-un-tradicijas/pavasara-ekvinokcija/', 'Astronomiskā pavasara ekvinokcija'],
      ['/gadalaiki/', 'Latvijas gadalaiku sākuma brīži']
    ].map { |url, title| %(<a class="link-card" href="#{url}"><strong>#{h(title)}</strong><span>Atvērt Latvijas kalendāra lapu</span></a>) }.join
    %(<section class="content-card"><h2>Pavasara notikumi Latvijā</h2><p>#{h(model['rule'])}</p><div class="link-grid">#{cards}</div><p>Gadskārtu paražas, kristīgo svētku datumi un astronomiskais ekvinokcijas brīdis pieder atšķirīgiem kalendāriem.</p></section>)
  when 'astronomical','gregorian-relative','easter-relative','confession-specific'
    rows=(2027..2030).flat_map { |year| cultural_calendar_dates(article,year) }.map do |event|
      date=Date.parse(event['date'])
      label=%(<time datetime="#{h(event['utc']||event['date'])}">#{date.year}. gada #{date.day}. #{h(MONTHS[date.month-1])}#{event['time'] ? " · #{h(event['time'])} · Latvijas laiks" : ''}</time>)
      %(<article class="holiday-card">#{tradition_date_link(date,label)}<strong>#{h(event['title'])}</strong>#{event['scope'] ? "<small>#{h(event['scope'])}</small>" : ''}</article>)
    end.join
    note=model['type']=='astronomical' ? 'Ekvinokcija ir precīzs astronomisks brīdis, nevis nemainīgs kalendāra datums.' : 'Datumi attiecas uz katrā ierakstā norādīto tradīciju vai konfesiju; tie nav automātiski vispārējas svētku brīvdienas.'
    %(<section class="content-card"><h2>Datumi 2027.–2030. gadā</h2><div class="holiday-card-grid">#{rows}</div><p>#{h(note)}</p></section>)
  else
    note = model['rule'] || model['easterRelativeConventionStatus'] || model['confessionScope'] || 'Datums ir atkarīgs no kalendāra noteikuma vai tradīcijas; vienu vispārēju Latvijas datumu neizdomājam.'
    %(<section class="content-card"><h2>Datuma noteikums un tā tvērums</h2><p>#{h(note)}</p><p>Pasākuma rīkotāja publicētais datums var atšķirties no tradīcijas kalendārā lietotā datuma.</p></section>)
  end
  notes = (article['factNotes'] || []).each_with_index.map { |note,index| "<li>#{tradition_text_markup(slug,note,"factNotes[#{index}]")}</li>" }.join
  extra = notes.empty? ? '' : %(<section class="content-card"><h2>Precizējumi</h2><ul>#{notes}</ul></section>)
  sources=%(<aside class="source-panel tradition-source-panel">#{tradition_sources_markup(slug)}<p>Pasākumu norises grafiks nav tas pats, kas pastāvīgais svētku vai tradīcijas datums.</p>#{a('/avoti-un-metodika/','Avoti un metodika →')}</aside>)
  intro + date_markup + extra + sources + tradition_related_markup(slug)
end

def astronomy_event_markup(slug)
  kind = { 'saules-aptumsums' => 'solar', 'meness-aptumsums' => 'lunar', 'perseidas' => 'perseids' }.fetch(slug)
  heading, description, source_ids = case kind
  when 'solar' then ['Saules aptumsumi', 'Aprēķinātie vietējie kontakti tiek rādīti tikai tad, ja Saules disks attiecīgajā pilsētā ir virs modelētā horizonta.', %w[nasa-solar usno-solar-local]]
  when 'lunar' then ['Mēness aptumsumi', 'Globāla aptumsuma fāze nav automātiski redzama Latvijā. Pilsētas skatā redzami tikai virs horizonta esošie intervāli.', %w[nasa-lunar usno-lunar-local]]
  else ['Perseīdu novērošanas naktis', 'Augusta vidus ir plānošanas periods, nevis precīzs ikgadējs maksimums vai garantēts meteoru skaits.', %w[nasa-perseids nasa-sky-2026-08]]
  end
  year_options = (2027..2030).map { |year| %(<option value="#{year}"#{year == [Date.today.year, 2027].max ? ' selected' : ''}>#{year}</option>) }.join
  city_options = CITIES.map { |city| %(<option value="#{h(city['id'])}"#{city['id'] == 'riga' ? ' selected' : ''}>#{h(city['name'])}</option>) }.join
  %(<section class="tool-panel extra-tool astronomy-event-tool" data-astronomy-tool="#{kind}" data-source="/assets/latvia-astronomy.json"><div class="astronomy-controls"><label>Pilsēta Latvijā<select data-astro-city>#{city_options}</select></label><label>Gads<select data-astro-year>#{year_options}</select></label><button type="button" data-astro-export>Lejupielādēt pilsētas notikumus (.ics)</button></div><p data-astro-status class="muted" role="status">Ielādē aprēķinātos datus…</p><div data-astro-results class="astronomy-event-list"></div><p class="print-hint">#{h(description)} Novērojamību var mainīt reljefs, ēkas, augstums, atmosfēra un mākoņi. Aprēķins izmanto pilsētas centra koordinātas, 0 m augstumu, standarta refrakciju un plakanu, neaizsegtu horizontu.</p></section>)+verified_sources_panel(source_ids,'Aprēķinu dzinējs un laika joslas modelis norādīts pie atvērtiem datiem; globāls kataloga tips nav pielīdzināts lokālai novērojamībai.')
end

def latvia_special_markup(path, metadata)
  slug = path.split('/').reject(&:empty?).last
  case slug
  when 'gada-diena'
    day_of_year_markup + verified_sources_panel(['leap-usno'])
  when 'garais-gads'
    leap_year_markup + verified_sources_panel(['leap-usno'])
  when 'pulkstena-pargriesana'
    clock_change_markup + verified_sources_panel(['dst-latvia'])
  when 'dienas-garums'
    '{% include sky-tool.html %}' + %(<section class="sun-city-options"><h2>Dienas garums un Saules laiki 82 Latvijas pilsētās</h2><p>Visas pilsētas ir Europe/Riga laika joslā. Koordinātas maina aprēķinātos Saules laikus, bet pilsētas izvēle nemaina pulksteņa joslu.</p><div class="link-grid">#{CITIES.map { |city| a('/saullekts-saulriets/' + city['id'] + '/', city['name'], 'link-card') }.join}</div></section>) + verified_sources_panel(['usno-services','usno-api'])
  when 'pensiju-izmaksas'
    %(<p class="lead">Latvijā nav vienas ikmēneša pensijas izmaksas dienas, ko varētu droši attiecināt uz visiem saņēmējiem. Pārbaudi savu VSAA lēmumu un izmanto privātu atgādinājumu.</p>#{payment_reminder_markup('pension')}#{verified_sources_panel(['vsaa-faq','vsaa-holidays-2025'],'Agrāks svētku izmaksas paziņojums ir tikai tā gada piemērs, nevis nākamā gada maksājumu kalendārs.')})
  when 'pabalstu-izmaksas'
    %(<p class="lead">Pabalstu veidiem un saņēmēju lēmumiem var būt atšķirīgs izmaksas ritms. Kalendārs nepiedēvē visiem pabalstiem vienu datumu.</p>#{payment_reminder_markup('benefit')}#{verified_sources_panel(['vsaa-faq','vsaa-parent-payments','vsaa-holidays-2025'],'Pirmā izmaksa var atšķirties no regulārās; dažus pabalstus izmaksā par iepriekšējo, citus par pašreizējo mēnesi.')})
  when 'skolas-kalendars'
    school_calendar_markup
  when 'valsts-parbaudes-darbi'
    exam_calendar_markup
  when 'studiju-kalendars'
    study_calendar_markup
  when 'darba-dienu-kalkulators'
    planning_panel('work', Date.today.year) + verified_sources_panel(['holiday-law','workdays-2026'])
  when 'nozimigas-dienas'
    observance_collection_markup
  when 'redakcijas-politika'
    %(<section class="editorial-policy-grid"><article class="content-card"><h2>Datums un avots ir sasaistīti</h2><p>Likuma noteiktu brīvdienu, piemiņas dienu, kultūras tradīciju, skolas termiņu un astronomisku notikumu statuss tiek glabāts atsevišķi. Avota neesamību neaizstājam ar minējumu.</p></article><article class="content-card"><h2>Nākotnes datumi</h2><p>Publicējam tikai attiecīgās iestādes izziņotus datumus vai skaidri marķētus aprēķinus pēc spēkā esoša noteikuma. Neizziņotu mācību gadu, VSAA maksājumu vai pasākumu datumus nepārceļam no iepriekšējā gada.</p></article><article class="content-card"><h2>Personīgs saturs</h2><p>Kalendāra un plānotāju ieraksti tiek apstrādāti pārlūkā. Fotoattēlu, autoru, licences un attēla lomu norādām pie attēla, ja izmantojam ārēju vizuālu materiālu.</p></article><article class="content-card"><h2>Automātiski sagatavots saturs</h2><p>Dienas horoskops tiek automātiski atlasīts un rediģēts no paša Kalendāra365 tematiskā satura krājuma; tas nav individuāls astrologu padoms vai zinātniska prognoze. Automātiskās datumu maiņas un avotu pārbaudes aprakstītas pie attiecīgās funkcijas.</p></article></section><p>Par kļūdu vai precizējumu raksti <a href="mailto:kalendars365@gmail.com">kalendars365@gmail.com</a> un pievieno attiecīgo adresi un pirmavota saiti.</p>)
  when 'saules-aptumsums', 'meness-aptumsums', 'perseidas'
    astronomy_event_markup(slug)
  else
    '<section class="content-card"><p>Šīs tēmas dati tiek pārbaudīti.</p></section>'
  end
end
