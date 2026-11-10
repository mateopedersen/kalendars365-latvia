# frozen_string_literal: true

def hub_date(value)
  date = Date.parse(value)
  "#{date.day}. #{GEN[date.month - 1]} #{date.year}."
end

def calendar_hub_markup
  years = (2027..2030).to_a
  cards = years.map do |year|
    days = Date.gregorian_leap?(year) ? 366 : 365
    %(<a class="hub-year-card" href="/kalendars/#{year}/"><span class="hub-kicker">GADA KALENDĀRS</span><strong>#{year}</strong><span>#{days} dienas · 12 mēneši</span><em>Atvērt gada pārskatu <span aria-hidden="true">↗</span></em></a>)
  end.join
  rows = (1..12).map do |month|
    cells = years.map do |year|
      start = Date.new(year, month, 1)
      weekend = (start..Date.new(year, month, -1)).count { |day| day.cwday > 5 }
      %(<td data-hub-year="#{year}"><a href="/kalendars/#{year}/#{SLUGS[month - 1]}/"><strong>#{MONTHS[month - 1].capitalize} #{year}</strong><span>#{Date.new(year, month, -1).day} dienas · #{weekend} nedēļas nogales dienas</span><span class="hub-cell-arrow" aria-hidden="true">↗</span></a></td>)
    end.join
    %(<tr data-hub-month="#{month}"><th scope="row"><span>#{format('%02d', month)}</span>#{MONTHS[month - 1].capitalize}</th>#{cells}</tr>)
  end.join
  %(<div class="hub-page hub-calendar"><section class="hub-intro"><div><span class="hub-kicker">LATVIJA · 2027–2030</span><h2>Izvēlies gadu. Atrodi mēnesi.</h2><p>48 mēnešu pārskati ar pirmdienu kā nedēļas sākumu, ISO nedēļu numuriem un Latvijas kalendāra datumiem.</p></div><div class="hub-intro-count"><strong>48</strong><span>mēnešu kalendāri</span></div></section><section class="hub-section" aria-labelledby="hub-years-title"><div class="hub-section-head"><div><span class="hub-kicker">GADA PĀRSKATS</span><h2 id="hub-years-title">Četri gadi vienuviet</h2></div><p>Atver gadu un pārej uz jebkuru mēnesi.</p></div><div class="hub-year-grid">#{cards}</div></section><section class="hub-section" data-calendar-hub aria-labelledby="hub-months-title"><div class="hub-section-head"><div><span class="hub-kicker">MĒNEŠU CEĻVEDIS</span><h2 id="hub-months-title">Gads un mēnesis</h2></div><p>Filtrē tabulu vai atver mēnesi tieši.</p></div><div class="hub-filters"><label>Gads<select data-hub-year-filter><option value="all">Visi gadi</option>#{years.map { |year| %(<option value="#{year}">#{year}</option>) }.join}</select></label><label>Mēnesis<select data-hub-month-filter><option value="all">Visi mēneši</option>#{MONTHS.each_with_index.map { |name, index| %(<option value="#{index + 1}">#{name.capitalize}</option>) }.join}</select></label><button type="button" data-hub-reset>Notīrīt filtrus</button><output data-hub-result aria-live="polite">48 mēneši</output></div><div class="hub-table-scroll"><table class="hub-month-table"><thead><tr><th scope="col">Mēnesis</th>#{years.map { |year| %(<th scope="col">#{year}</th>) }.join}</tr></thead><tbody>#{rows}</tbody></table></div></section><nav class="hub-related" aria-label="Citi kalendāra skati"><a href="/menesa-kalendars/2027/"><strong>Mēneša kalendārs</strong><span>Izvēlies mēnesi gada skatā ↗</span></a><a href="/nedelas-kalendars/2027/"><strong>Nedēļas kalendārs</strong><span>ISO nedēļas un datumi ↗</span></a><a href="/pdf-kalendari/2027/"><strong>Kalendāri drukai</strong><span>PDF un attēlu dizaini ↗</span></a></nav></div>)
end

def holiday_hub_markup
  years = (2027..2030).to_a
  cards = years.map do |year|
    off = HOLIDAYS.select { |item| item['date'].start_with?(year.to_s) && item['dayOff'] }.map { |item| item['date'] }.uniq
    weekday_off = off.count { |date| Date.parse(date).cwday < 6 }
    workdays = (Date.new(year, 1, 1)..Date.new(year, 12, 31)).count { |day| day.cwday < 6 && !off.include?(day.iso8601) }
    %(<a class="hub-holiday-year" href="/svetku-dienas/#{year}/"><span class="hub-kicker">#{year}. GADS</span><strong>#{year}</strong><div class="hub-holiday-metrics"><span><b>#{off.length}</b> brīvdienu datumi</span><span><b>#{weekday_off}</b> darbdienās</span><span><b>#{workdays}</b> pamatdarbdienas*</span></div><em>Skatīt gada datumus <span aria-hidden="true">↗</span></em></a>)
  end.join
  dates = HOLIDAYS.select { |item| item['date'].start_with?('2027') && item['dayOff'] }.sort_by { |item| item['date'] }.first(8)
  timeline = dates.map do |item|
    date = Date.parse(item['date'])
    %(<li><time datetime="#{item['date']}"><strong>#{date.day}</strong><span>#{GEN[date.month - 1]}</span></time><div><strong>#{h(item['title'])}</strong><span>#{item['type'] == 'substitute' ? 'Papildu brīvdiena' : 'Svētku brīvdiena'}</span></div><a href="/svetku-dienas/2027/#{SLUGS[date.month - 1]}/" aria-label="Atvērt #{MONTHS[date.month - 1]} svētku dienas">↗</a></li>)
  end.join
  %(<div class="hub-page hub-holidays"><section class="hub-intro"><div><span class="hub-kicker">LATVIJAS DATUMI</span><h2>Svētki, brīvdienas un atceres dienas</h2><p>Atšķir likumā noteiktu brīvdienu no atceres vai atzīmējamās dienas. Katram gadam un mēnesim ir savs pārskats.</p></div><div class="hub-intro-art" aria-hidden="true">#{ui_icon('gift')}</div></section><section class="hub-section" aria-labelledby="holiday-years-title"><div class="hub-section-head"><div><span class="hub-kicker">2027–2030</span><h2 id="holiday-years-title">Izvēlies gadu</h2></div><p>Gada rādītāji aprēķināti no publicētajiem datumiem.</p></div><div class="hub-holiday-grid">#{cards}</div><p class="hub-note">* Pamatdarbdienas: pirmdiena–piektdiena, atņemot datu kopā norādītās svētku brīvdienas. Darbdienu pārcelšana, maiņu grafiki un darba devēja noteikumi nav ieskaitīti.</p></section><section class="hub-section hub-holiday-split" aria-labelledby="holiday-upcoming-title"><div><span class="hub-kicker">2027. GADA PIEMĒRS</span><h2 id="holiday-upcoming-title">Tuvākie gada svētku datumi</h2><p>Atver attiecīgo mēnesi, lai redzētu visus tā datumus.</p><ol class="hub-holiday-timeline">#{timeline}</ol><a class="hub-main-link" href="/svetku-dienas/2027/">Visi 2027. gada svētki ↗</a></div><aside class="hub-status-guide"><span class="hub-kicker">KĀ LASĪT KALENDĀRU</span><h3>Vienam datumam var būt dažāds statuss</h3><div><b>Svētku brīvdiena</b><p>Likumā noteikta svētku diena, kurai ir brīvdienas statuss.</p></div><div><b>Atceres diena</b><p>Oficiāli atcerama diena pati par sevi nav papildu brīvdiena.</p></div><div><b>Atzīmējama diena</b><p>Kalendārā norādīts notikums, kas automātiski nemaina darba grafiku.</p></div><a href="/atceres-dienas/2027/">Atceres dienu pārskats ↗</a></aside></section><div class="hub-source-line">Datumu pamats: <a href="#{h(LATVIA_VERIFIED['sources'].find { |source| source['id'] == 'holiday-law' }['url'])}">Latvijas likums „Par svētku, atceres un atzīmējamām dienām” ↗</a> · <a href="/avoti-un-metodika/">Avoti un metodika</a></div></div>)
end

def school_hub_markup
  school = LATVIA_VERIFIED.fetch('education').fetch('school')
  city_photos = CITIES.to_h { |city| [city['id'], city['photo']] }
  occasions = JSON.parse(File.read('_data/occasions.json'))
  seasonal = {
    'Rudens brīvdienas' => ['Rudens', city_photos.fetch('preili')],
    'Ziemas brīvdienas' => ['Ziema', occasions.find { |item| item.dig('photo', 'id') == 'winter' }.fetch('photo')],
    'Pavasara brīvdienas' => ['Pavasaris', city_photos.fetch('iecava')],
    'Vasaras brīvdienas' => ['Vasara', occasions.find { |item| item.dig('photo', 'id') == 'summer' }.fetch('photo')]
  }
  cards = school.fetch('breaks').each_with_index.map do |item, index|
    season, photo = seasonal.fetch(item['label'])
    %(<article class="hub-school-break" data-start="#{item['start']}" data-end="#{item['end']}"><div class="hub-school-photo"><img src="#{h(photo['src'])}" srcset="#{h(photo['srcset'])}" sizes="(max-width:700px) 100vw, (max-width:1100px) 50vw, 25vw" alt="#{h(photo['alt'])}" width="960" height="720" loading="lazy" decoding="async"><span>#{format('%02d', index + 1)} · #{season}</span></div><div class="hub-school-break-copy"><h3>#{h(item['label'])}</h3><time datetime="#{item['start']}">#{hub_date(item['start'])} – #{hub_date(item['end'])}</time><small>#{h(item['scope'] || 'Pamatgrafiks Latvijas skolām')}</small><p>Ilustratīvs attēls · <a href="#{h(photo['sourceUrl'])}" target="_blank" rel="noopener">#{h(photo['author'])} · #{h(photo['license'])} ↗</a></p></div></article>)
  end.join
  future = [['2027-28', '2027./2028.'], ['2028-29', '2028./2029.'], ['2029-30', '2029./2030.'], ['2030-31', '2030./2031.']].map do |slug, label|
    %(<a href="/skolas-brivlaiki/#{slug}/"><strong>#{label}</strong><span>Oficiālie datumi vēl nav publicēti</span><span aria-hidden="true">↗</span></a>)
  end.join
  end_options = school.fetch('endByGrade').map do |grade, value|
    label = grade.include?(',') ? '1.–8. un 10.–11. klase' : "#{grade}. klase"
    %(<option value="#{h(value)}">#{h(label)}</option>)
  end.join
  source = LATVIA_VERIFIED['sources'].find { |item| item['id'] == school['sourceId'] }
  %(<div class="hub-page hub-school"><section class="hub-intro"><div><span class="hub-kicker">2026./2027. MĀCĪBU GADS</span><h2>Skolas laiks skaidrā pārskatā</h2><p>Oficiālie Latvijas brīvlaiki, semestri un klašu beigu datumi vienā vietā. Datumus nosaka Ministru kabineta noteikumi; savas skolas paziņojumus pārbaudi atsevišķi.</p></div><div class="hub-school-term"><span>Mācības sākās</span><strong>1. septembrī</strong><small>2026. gads</small></div></section><section class="hub-section" aria-labelledby="school-breaks-title"><div class="hub-section-head"><div><span class="hub-kicker">OFICIĀLIE PERIODI</span><h2 id="school-breaks-title">Četri mācību gada brīvlaiki</h2></div><p>Datumi ir iekļauti no pirmās līdz pēdējai norādītajai dienai.</p></div><div class="hub-school-grid">#{cards}</div></section><section class="hub-section hub-school-detail" aria-labelledby="school-grade-title"><div><span class="hub-kicker">KLASEI ATBILSTOŠS TERMIŅŠ</span><h2 id="school-grade-title">Kad beidzas mācību gads?</h2><label>Izvēlies klasi<select data-school-grade>#{end_options}</select></label><p class="hub-grade-result" data-school-end role="status">#{hub_date(school['endByGrade']['1–8, 10–11'])}</p><p>9. un 12. klasei mācību gads beidzas vēlāk nekā pamatgrafikā. Vasaras brīvlaika sākums 1. jūnijā oficiālajā pārskatā attiecas uz 1.–8. un 10.–11. klasi.</p></div><div class="hub-school-semesters"><div><span>1. semestris</span><strong>#{hub_date(school['firstSemester']['start'])}</strong><small>līdz #{hub_date(school['firstSemester']['end'])}</small></div><div><span>2. semestra sākums</span><strong>#{hub_date(school['secondSemesterStart'])}</strong></div><div><span>1. klases papildu nedēļa</span><p>Datumu otrajā semestrī nosaka konkrētā skola.</p></div></div></section><section class="hub-section" aria-labelledby="school-next-title"><div class="hub-section-head"><div><span class="hub-kicker">NĀKAMIE MĀCĪBU GADI</span><h2 id="school-next-title">Pārskati nākamajiem gadiem</h2></div><p>Datumi parādīsies pēc oficiālas publicēšanas.</p></div><div class="hub-school-future">#{future}</div></section><nav class="hub-related" aria-label="Saistītie mācību kalendāri"><a href="/skolas-kalendars/"><strong>Skolas kalendārs</strong><span>Mācību dienas un semestri ↗</span></a><a href="/studiju-kalendars/"><strong>Universitāšu kalendāri</strong><span>Atsevišķi augstskolu avoti ↗</span></a><a href="/valsts-parbaudes-darbi/"><strong>Pārbaudes darbi</strong><span>Oficiālais darbu grafiks ↗</span></a></nav><div class="hub-source-line">Oficiālais avots: <a href="#{h(source['url'])}">#{h(source['title'])} ↗</a> · <a href="/pilsetas-un-fotografijas/">Attēlu autori un licences</a></div></div>)
end
