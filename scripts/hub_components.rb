# frozen_string_literal: true

def hub_date(value)
  date = Date.parse(value)
  "#{date.year}. gada #{date.day}. #{MONTHS[date.month - 1]}"
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
  %(<div class="hub-page hub-calendar"><section class="hub-section" aria-labelledby="hub-years-title"><div class="hub-section-head"><div><span class="hub-kicker">GADA PĀRSKATS</span><h2 id="hub-years-title">Četri gadi vienuviet</h2></div><p>Atver gadu un pārej uz jebkuru mēnesi.</p></div><div class="hub-year-grid">#{cards}</div></section><section class="hub-section" data-calendar-hub aria-labelledby="hub-months-title"><div class="hub-section-head"><div><span class="hub-kicker">MĒNEŠU CEĻVEDIS</span><h2 id="hub-months-title">Gads un mēnesis</h2></div><p>Filtrē tabulu vai atver mēnesi tieši.</p></div><div class="hub-filters"><label>Gads<select data-hub-year-filter><option value="all">Visi gadi</option>#{years.map { |year| %(<option value="#{year}">#{year}</option>) }.join}</select></label><label>Mēnesis<select data-hub-month-filter><option value="all">Visi mēneši</option>#{MONTHS.each_with_index.map { |name, index| %(<option value="#{index + 1}">#{name.capitalize}</option>) }.join}</select></label><button type="button" data-hub-reset>Notīrīt filtrus</button><output data-hub-result aria-live="polite">48 mēneši</output></div><div class="hub-table-scroll"><table class="hub-month-table"><thead><tr><th scope="col">Mēnesis</th>#{years.map { |year| %(<th scope="col">#{year}</th>) }.join}</tr></thead><tbody>#{rows}</tbody></table></div></section><nav class="hub-related" aria-label="Citi kalendāra skati"><a href="/menesa-kalendars/2027/"><strong>Mēneša kalendārs</strong><span>Izvēlies mēnesi gada skatā ↗</span></a><a href="/nedelas-kalendars/2027/"><strong>Nedēļas kalendārs</strong><span>ISO nedēļas un datumi ↗</span></a><a href="/pdf-kalendari/2027/"><strong>Kalendāri drukai</strong><span>PDF un attēlu dizaini ↗</span></a></nav></div>)
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
    %(<li><time datetime="#{item['date']}"><strong>#{date.day}</strong><span>#{GEN[date.month - 1]}</span></time><div><strong>#{a(TRADITION_LINKING.holiday_url(item),item['title'],'holiday-story-link')}</strong><span>#{item['type'] == 'substitute' ? 'Papildu brīvdiena' : 'Svētku brīvdiena'}</span></div><a href="/svetku-dienas/2027/#{SLUGS[date.month - 1]}/" aria-label="Atvērt #{MONTHS[date.month - 1]} svētku dienas">↗</a></li>)
  end.join
  %(<div class="hub-page hub-holidays"><section class="hub-intro"><div><span class="hub-kicker">LATVIJAS DATUMI</span><h2>Svētki, brīvdienas un atceres dienas</h2><p>Atšķir likumā noteiktu brīvdienu no atceres vai atzīmējamās dienas. Katram gadam un mēnesim ir savs pārskats.</p></div><div class="hub-intro-art" aria-hidden="true">#{ui_icon('gift')}</div></section><section class="hub-section" aria-labelledby="holiday-years-title"><div class="hub-section-head"><div><span class="hub-kicker">2027–2030</span><h2 id="holiday-years-title">Izvēlies gadu</h2></div><p>Gada rādītāji aprēķināti no publicētajiem datumiem.</p></div><div class="hub-holiday-grid">#{cards}</div><p class="hub-note">* Pamatdarbdienas: pirmdiena–piektdiena, atņemot datu kopā norādītās svētku brīvdienas. Darbdienu pārcelšana, maiņu grafiki un darba devēja noteikumi nav ieskaitīti.</p></section><section class="hub-section hub-holiday-split" aria-labelledby="holiday-upcoming-title"><div><span class="hub-kicker">2027. GADA PIEMĒRS</span><h2 id="holiday-upcoming-title">Tuvākie gada svētku datumi</h2><p>Atver attiecīgo mēnesi, lai redzētu visus tā datumus.</p><ol class="hub-holiday-timeline">#{timeline}</ol><a class="hub-main-link" href="/svetku-dienas/2027/">Visi 2027. gada svētki ↗</a></div><aside class="hub-status-guide"><span class="hub-kicker">KĀ LASĪT KALENDĀRU</span><h3>Vienam datumam var būt dažāds statuss</h3><div><b>Svētku brīvdiena</b><p>Likumā noteikta svētku diena, kurai ir brīvdienas statuss.</p></div><div><b>Atceres diena</b><p>Oficiāli atcerama diena pati par sevi nav papildu brīvdiena.</p></div><div><b>Atzīmējama diena</b><p>Kalendārā norādīts notikums, kas automātiski nemaina darba grafiku.</p></div><a href="/atceres-dienas/2027/">Atceres dienu pārskats ↗</a></aside></section><div class="hub-source-line">Datumu pamats: <a href="#{h(LATVIA_VERIFIED['sources'].find { |source| source['id'] == 'holiday-law' }['url'])}">Latvijas likums „Par svētku, atceres un atzīmējamām dienām” ↗</a> · <a href="/avoti-un-metodika/">Avoti un metodika</a></div></div>)
end

def school_card_media
  @school_card_media ||= begin
    photos = JSON.parse(File.read('_data/school-break-images.json')).fetch('photos')
    photos.each do |photo|
      source = photo.fetch('source').sub(%r{^/}, '')
      raise "School photo source changed; rebuild school images: #{source}" unless Digest::SHA256.file(source).hexdigest == photo.fetch('sourceSha256')
    end
    photos
  end
end
