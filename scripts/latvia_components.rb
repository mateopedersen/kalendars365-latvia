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
    date.month == month && date.year.between?(2026, 2030) && item['dayOff'] == false
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
  %(<section class="content-card"><p>Datumi uzskaitīti tikai pēc publicētajiem ierakstiem par 2026.–2030. gadu. Šajā lapā atceres un atzīmējamās dienas netiek pasniegtas kā brīvdienas.</p><div class="table-scroll"><table class="data-table"><thead><tr><th>Datums</th><th>Diena</th><th>Notikums</th><th>Kategorija</th></tr></thead><tbody>#{rows}</tbody></table></div></section>)
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
  data = JSON.parse(File.read('_data/university-calendars.json'))
  calendars = data.fetch('calendars').to_h { |calendar| [calendar.fetch('id'), calendar] }
  events_by_kind = { 'holiday' => 'Brīvlaiks / brīvdiena', 'study' => 'Studiju periods', 'exam' => 'Sesija / pārbaudījumi', 'registration' => 'Reģistrācija' }
  date_label = lambda do |event|
    first = Date.parse(event.fetch('start')).strftime('%d.%m.%Y.')
    last = event['end'] && Date.parse(event['end']).strftime('%d.%m.%Y.')
    last && last != first ? "#{first}–#{last}" : first
  end
  photo_markup = lambda do |photo|
    next '' unless photo
    license_link = %(<a href="#{h(photo.fetch('licenseUrl'))}" target="_blank" rel="noopener">#{h(photo.fetch('license'))}</a>)
    %(<figure class="study-campus-photo"><img src="#{h(photo.fetch('src'))}" alt="#{h(photo.fetch('alt'))}" loading="lazy" decoding="async" width="960" height="560"><figcaption>#{h(photo.fetch('caption'))} · <a href="#{h(photo.fetch('pageUrl'))}" target="_blank" rel="noopener">#{h(photo.fetch('author'))} · Wikimedia Commons</a> · #{license_link}</figcaption></figure>)
  end
  calendar_cards = data.fetch('calendars').map do |calendar|
    events = calendar.fetch('events').map do |event|
      scope = event['scope'] ? %(<small class="study-event-scope">#{h(event['scope'])}</small>) : ''
      kind = events_by_kind.fetch(event.fetch('kind'), 'Studiju kalendārs')
      %(<li class="study-event study-event--#{h(event.fetch('kind'))}"><span class="study-event-kind">#{h(kind)}</span><time datetime="#{h(event.fetch('start'))}">#{h(date_label.call(event))}</time><strong>#{h(event.fetch('label'))}</strong>#{scope}</li>)
    end.join
    source = %(<a href="#{h(calendar.fetch('source').fetch('url'))}" target="_blank" rel="noopener">#{h(calendar.fetch('source').fetch('title'))} ↗</a>)
    %(<article class="study-calendar-card" id="study-#{h(calendar.fetch('id'))}">#{photo_markup.call(calendar['photo'])}<div class="study-calendar-card-body"><div class="study-calendar-card-heading"><span class="study-calendar-type">2026./2027. · oficiālais kalendārs</span><h2>#{h(calendar.fetch('institution'))}</h2><p>#{h(calendar.fetch('scope'))}</p></div><ul class="study-event-list">#{events}</ul><p class="source-inline">Avots: #{source}</p></div></article>)
  end.join
  pending_cards = data.fetch('stateUniversities').select { |item| item['calendarStatus'] == 'not-found' }.map do |institution|
    photo = institution['photo'] ? photo_markup.call(institution['photo']) : %(<div class="study-pending-art" aria-hidden="true"><span>#{h(institution.fetch('city'))}</span><span>2026 — 27</span></div>)
    confirmed = institution.fetch('confirmedDates', []).map { |event| %(<li><time datetime="#{h(event.fetch('start'))}">#{Date.parse(event.fetch('start')).strftime('%d.%m.%Y.')}</time><span>#{h(event.fetch('label'))}</span></li>) }.join
    source = institution['dateSource']
    source_link = source ? %(<a href="#{h(source.fetch('url'))}" target="_blank" rel="noopener">#{h(source.fetch('title'))} ↗</a>) : ''
    %(<article class="study-calendar-card study-calendar-card--pending" id="study-#{h(institution.fetch('id'))}">#{photo}<div class="study-calendar-card-body"><span class="study-calendar-type">2026./2027. · pārbaudīti publiskie datumi</span><h2>#{h(institution.fetch('name'))}</h2><ul class="study-event-list">#{confirmed}</ul><p class="source-inline">Avots: #{source_link}</p><p>Šie ir studiju uzsākšanas un ievadpasākumu datumi. Atsevišķs publisks brīvlaiku grafiks nav atrasts; šie notikumi nav atzīmēti kā brīvdienas. Precīzu programmas grafiku pārbaudi studiju daļā.</p><p class="source-inline"><a href="#{h(institution.fetch('url'))}" target="_blank" rel="noopener">Augstskolas oficiālā lapa ↗</a></p></div></article>)
  end.join
  university_directory = data.fetch('stateUniversities').map do |institution|
    href = institution['calendarId'] ? "#study-#{institution.fetch('calendarId')}" : "#study-#{institution.fetch('id')}"
    status = institution['calendarStatus'] == 'not-found' ? 'Apstiprinātie datumi' : 'Atvērt grafiku'
    %(<a class="university-directory-link" href="#{h(href)}"><span>#{h(institution.fetch('name'))}<small>#{h(institution.fetch('city'))}</small></span><b>#{h(status)} →</b></a>)
  end.join
  directory = data.fetch('directorySource')
  %(<section class="university-calendar-intro"><div><span class="eyebrow">LATVIJAS AUGSTSKOLAS</span><h2>2026./2027. studiju gads</h2><p>Apkopoti augstskolu oficiālie semestru, sesiju un brīvlaiku periodi. Katras programmas grafiks var atšķirties, tāpēc svarīgo datumu pārbaudi arī savas augstskolas avotā.</p></div><div class="university-source-badge"><strong>#{data.fetch('calendars').length} publicēti grafiki</strong><span>9 no 11 iestādēm · LU doktorantūras grafiks uzrādīts atsevišķi</span></div></section><section class="university-directory" id="university-directory"><div class="university-directory-heading"><div><span class="eyebrow">IZVĒLIES IESTĀDI</span><h2>Latvijas valsts augstskolas</h2></div><a href="#{h(directory.fetch('registerUrl'))}" target="_blank" rel="noopener">Pilns AIKA reģistrs ↗</a></div><nav aria-label="Latvijas augstskolu kalendāri" class="university-directory-grid">#{university_directory}</nav><p class="university-directory-source">Saraksts: <a href="#{h(directory.fetch('url'))}" target="_blank" rel="noopener">#{h(directory.fetch('title'))} ↗</a>. Šis ir valsts augstskolu saraksts; pilnā AIKA reģistrā ir arī privātās augstskolas un koledžas.</p></section><section class="study-calendar-grid" aria-label="Augstskolu studiju kalendāri">#{calendar_cards}#{pending_cards}</section><aside class="university-calendar-notes"><h2>Kā lasīt datumus</h2><ul>#{data.fetch('notes').map { |note| "<li>#{h(note)}</li>" }.join}</ul></aside>)
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
  previous_link = previous_date.year >= 2026 ? a(previous_path, '← Iepriekšējais mēnesis', 'lunar-nav-button') : %(<span class="lunar-nav-button is-disabled" aria-disabled="true" title="Pieejamie Mēness kalendāri sākas 2026. gadā">← Iepriekšējais mēnesis</span>)
  next_link = next_date.year <= 2030 ? a(next_path, 'Nākamais mēnesis →', 'lunar-nav-button') : %(<span class="lunar-nav-button is-disabled" aria-disabled="true" title="Pieejamie Mēness kalendāri beidzas 2030. gadā">Nākamais mēnesis →</span>)
  year_path = "/meness-kalendars/#{year}/"
  city_options = CITIES.map { |city| %(<option value="#{h(city['id'])}"#{city['id'] == 'riga' ? ' selected' : ''}>#{h(city['name'])}</option>) }.join
  phases_json = JSON.generate(phases)
  %(<section class="lunar-page" data-lunar-calendar data-lunar-year="#{year}" data-lunar-month="#{month}" data-lunar-source="/assets/moon-lro-mosaic.jpg">
    <div class="lunar-action-banner"><span class="lunar-action-icon" aria-hidden="true">↓</span><div><strong>Mēness mēneša pārskatu vari izdrukāt vai saglabāt PDF formātā.</strong><p>Izvēlies dienu kalendārā, lai apskatītu tās aprēķināto fāzi un apgaismojumu.</p></div><button type="button" data-lunar-print>Drukāt mēnesi ↓</button></div>
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
    %(<a class="lunar-year-month" href="#{path}"><span class="lunar-month-index">#{format('%02d', month)}</span><strong>#{h(MONTHS[month - 1].capitalize)}</strong><span>#{Date.new(year, month, -1).day} dienas</span><small>#{new_moons} jaunmēness · #{full_moons} pilnmēness</small><b>Atvērt mēnesi <i aria-hidden="true">↗</i></b></a>)
  end.join
  days = Date.gregorian_leap?(year) ? 366 : 365
  cover = lunar_cover(year)
  %(<section class="lunar-year-page" data-lunar-year-overview><nav class="lunar-year-switch" aria-label="Gada izvēle">#{(2027..2030).map { |item| a("/meness-kalendars/#{item}/", item.to_s, item == year ? 'is-current' : '') }.join}</nav><header class="lunar-year-hero" data-cover="#{h(cover['id'])}"><img src="#{h(cover['src'])}" alt="#{h(cover['alt'])}" width="#{cover['width']}" height="#{cover['height']}"><div class="lunar-year-hero-copy"><span class="eyebrow">GADA MĒNESS PĀRSKATS · LATVIJA</span><h2>#{year}</h2><p>#{days} dienas · #{phases.length} precīzi galveno fāžu brīži</p><a href="#lunar-months-#{year}">Izvēlies mēnesi ↓</a></div><span class="lunar-year-source">#{h(cover['credit'])}</span></header><section class="lunar-year-months" id="lunar-months-#{year}"><div class="lunar-year-section-heading"><div><span class="eyebrow">Dienu pa dienai</span><h2>Izvēlies mēnesi</h2></div><p>Atver kalendāru, lai izvēlētos jebkuru dienu un apskatītu tās Mēness fāzi.</p></div><div class="lunar-year-grid">#{months}</div></section><p class="lunar-year-credit">Vākiem izmantotas īstas NASA Apollo un Artemis I misiju fotogrāfijas. Tās ir vēsturiskas vāka ilustrācijas, nevis attiecīgā nākotnes gada uzņēmumi. <a href="/pilsetas-un-fotografijas/#astronomijas-fotografijas">Katra attēla avots un izmantošanas noteikumi</a>. Fāžu aprēķinu brīžus publicē <a href="https://aa.usno.navy.mil/data/api" target="_blank" rel="noopener">ASV Jūras observatorija (USNO)</a>.</p></section>)
end

def lunar_year_index_markup
  data = JSON.parse(File.read('assets/calendar-data.json'))
  years = data.fetch('moon', []).map { |event| Date.parse(event['date']).year }.uniq.sort
  cards = years.map do |year|
    phases = data.fetch('moon', []).select { |event| event['date'].start_with?(year.to_s) }
    cover = lunar_cover(year)
    %(<article class="lunar-year-card"><a class="lunar-year-card-image" data-cover="#{h(cover['id'])}" href="/meness-kalendars/#{year}/" aria-label="Atvērt #{year}. gada Mēness pārskatu"><img src="#{h(cover['src'])}" alt="#{h(cover['alt'])}" loading="lazy" width="#{cover['width']}" height="#{cover['height']}"><span>#{h(cover['credit'])}</span><b>#{year}</b></a><div class="lunar-year-card-body"><p>#{Date.gregorian_leap?(year) ? 366 : 365} dienas <i></i> #{phases.length} precīzi fāžu brīži</p><a href="/meness-kalendars/#{year}/" class="lunar-year-open">Atvērt gada pārskatu <span aria-hidden="true">↗</span></a><h3>Izvēlies mēnesi</h3><nav aria-label="#{year}. gada mēneši" class="lunar-year-mini-months">#{(1..12).map { |month| a("/meness-kalendars/#{year}/#{SLUGS[month - 1]}/", format('%02d %s', month, MONTHS[month - 1].capitalize)) }.join}</nav></div></article>)
  end.join
  %(<section class="lunar-year-index"><p class="lead">Izvēlies gadu, tad mēnesi. Katrā kalendāra dienā redzams attiecīgā datuma aprēķinātais Mēness apgaismojums; pieskaries dienai, lai atvērtu plašāku skatu.</p><div class="lunar-year-index-grid">#{cards}</div><p class="lunar-year-credit">Vākiem izmantotas īstas NASA Apollo un Artemis I misiju fotogrāfijas. Tās ir vēsturiskas vāka ilustrācijas, nevis attiecīgā nākotnes gada uzņēmumi. <a href="/pilsetas-un-fotografijas/#astronomijas-fotografijas">Katra attēla avots un izmantošanas noteikumi</a>. Precīzie fāžu brīži: <a href="https://aa.usno.navy.mil/data/api" target="_blank" rel="noopener">USNO</a>.</p></section>)
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

def cultural_page_markup(article)
  model = article['dateModel'] || {}
  sources = article['sourceIds'] || []
  intro = %(<p class="lead">#{h(article['intro'])}</p>)
  date_markup = case model['type']
  when 'fixed'
    years = (2026..2030).map do |year|
      date = Date.new(year, model['month'], model['day'])
      %(<article class="holiday-card"><time datetime="#{date.iso8601}">#{date.day}. #{h(GARDEN_MONTH_LOCATIVE[date.month - 1])} #{year}. gadā</time><small>#{%w[Svētdiena Pirmdiena Otrdiena Trešdiena Ceturtdiena Piektdiena Sestdiena][date.wday]}</small></article>)
    end.join
    local_date = article['localDate']
    local_markup = if local_date
      local_years = (2026..2030).map do |year|
        date = Date.new(year, local_date['month'], local_date['day'])
        %(<article class="holiday-card"><time datetime="#{date.iso8601}">#{date.day}. #{h(GARDEN_MONTH_LOCATIVE[date.month - 1])} #{year}. gadā</time><small>#{%w[Svētdiena Pirmdiena Otrdiena Trešdiena Ceturtdiena Piektdiena Sestdiena][date.wday]}</small></article>)
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
  when 'astronomical'
    events = DATA.fetch('seasons', []).select { |event| event['title'].to_s.include?(article['h1'].to_s.split(':').first) }
    rows = events.map { |event| %(<article class="holiday-card"><time datetime="#{event['utc']}">#{h(event['date'])} · #{h(event['time'])} · Rīgas laiks</time><small>#{h(event['title'])}</small></article>) }.join
    %(<section class="content-card"><h2>Precīzie astronomiskie brīži</h2><div class="holiday-card-grid">#{rows}</div><p>Ekvinokcija ir astronomisks brīdis, nevis nemainīgs kalendāra datums.</p></section>)
  else
    note = model['rule'] || model['easterRelativeConventionStatus'] || model['confessionScope'] || 'Datums ir atkarīgs no kalendāra noteikuma vai tradīcijas; vienu vispārēju Latvijas datumu neizdomājam.'
    %(<section class="content-card"><h2>Datuma noteikums un tā tvērums</h2><p>#{h(note)}</p><p>Pasākuma rīkotāja publicētais datums var atšķirties no tradīcijas kalendārā lietotā datuma.</p></section>)
  end
  notes = (article['factNotes'] || []).map { |note| "<li>#{h(note)}</li>" }.join
  extra = notes.empty? ? '' : %(<section class="content-card"><h2>Precizējumi</h2><ul>#{notes}</ul></section>)
  local_links = Array(article['relatedPages']).map do |item|
    %(<a class="link-card" href="#{h(item['url'])}"><strong>#{h(item['title'])}</strong><span>Atvērt saistīto Latvijas kalendāra lapu</span></a>)
  end.join
  related = local_links.empty? ? '' : %(<section class="content-card"><h2>Saistītās Latvijas kalendāra tēmas</h2><div class="link-grid">#{local_links}</div></section>)
  intro + date_markup + extra + related + verified_sources_panel(sources, 'Pasākumu norises grafiks nav tas pats, kas pastāvīgais svētku vai tradīcijas datums.')
end

def astronomy_event_markup(slug)
  kind = { 'saules-aptumsums' => 'solar', 'meness-aptumsums' => 'lunar', 'perseidas' => 'perseids' }.fetch(slug)
  heading, description, source_ids = case kind
  when 'solar' then ['Saules aptumsumi', 'Aprēķinātie vietējie kontakti tiek rādīti tikai tad, ja Saules disks attiecīgajā pilsētā ir virs modelētā horizonta.', %w[nasa-solar usno-solar-local]]
  when 'lunar' then ['Mēness aptumsumi', 'Globāla aptumsuma fāze nav automātiski redzama Latvijā. Pilsētas skatā redzami tikai virs horizonta esošie intervāli.', %w[nasa-lunar usno-lunar-local]]
  else ['Perseīdu novērošanas naktis', 'Augusta vidus ir plānošanas periods, nevis precīzs ikgadējs maksimums vai garantēts meteoru skaits.', %w[nasa-perseids nasa-sky-2026-08]]
  end
  year_options = (2026..2030).map { |year| %(<option value="#{year}"#{year == Date.today.year ? ' selected' : ''}>#{year}</option>) }.join
  city_options = CITIES.map { |city| %(<option value="#{h(city['id'])}"#{city['id'] == 'riga' ? ' selected' : ''}>#{h(city['name'])}</option>) }.join
  %(<section class="tool-panel extra-tool astronomy-event-tool" data-astronomy-tool="#{kind}" data-source="/assets/latvia-astronomy.json"><div class="astronomy-controls"><label>Pilsēta Latvijā<select data-astro-city>#{city_options}</select></label><label>Gads<select data-astro-year>#{year_options}</select></label><button type="button" data-astro-export>Lejupielādēt pilsētas notikumus (.ics)</button></div><p data-astro-status class="muted" role="status">Ielādē aprēķinātos datus…</p><div data-astro-results class="astronomy-event-list"></div><p class="print-hint">#{h(description)} Novērojamību var mainīt reljefs, ēkas, augstums, atmosfēra un mākoņi. Aprēķins izmanto pilsētas centra koordinātas, 0 m augstumu, standarta refrakciju un plakanu, neaizsegtu horizontu.</p></section>)+verified_sources_panel(source_ids,'Aprēķinu dzinējs un time-zone modelis norādīts pie atvērtiem datiem; globāls kataloga tips nav pielīdzināts lokālai novērojamībai.')
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
    %(<section class="editorial-policy-grid"><article class="content-card"><h2>Datums un avots ir sasaistīti</h2><p>Likuma noteiktu brīvdienu, piemiņas dienu, kultūras tradīciju, skolas termiņu un astronomisku notikumu statuss tiek glabāts atsevišķi. Avota neesamību neaizstājam ar minējumu.</p></article><article class="content-card"><h2>Nākotnes datumi</h2><p>Publicējam tikai attiecīgās iestādes izziņotus datumus vai skaidri marķētus aprēķinus pēc spēkā esoša noteikuma. Neizziņotu mācību gadu, VSAA maksājumu vai pasākumu datumus nepārceļam no iepriekšējā gada.</p></article><article class="content-card"><h2>Personīgs saturs</h2><p>Kalendāra un planotāju ieraksti tiek apstrādāti pārlūkā. Fotoattēlu, autoru, licences un attēla lomu norādām pie attēla, ja izmantojam ārēju vizuālu materiālu.</p></article><article class="content-card"><h2>Automātiski sagatavots saturs</h2><p>Dienas horoskops tiek automātiski atlasīts un rediģēts no paša Kalendāra365 tematiskā satura krājuma; tas nav individuāls astrologu padoms vai zinātniska prognoze. Automātiskās datumu maiņas un avotu pārbaudes aprakstītas pie attiecīgās funkcijas.</p></article></section><p>Par kļūdu vai precizējumu raksti <a href="mailto:kalendars365@gmail.com">kalendars365@gmail.com</a> un pievieno attiecīgo adresi un pirmavota saiti.</p>)
  when 'saules-aptumsums', 'meness-aptumsums', 'perseidas'
    astronomy_event_markup(slug)
  else
    '<section class="content-card"><p>Šīs tēmas dati tiek pārbaudīti.</p></section>'
  end
end
