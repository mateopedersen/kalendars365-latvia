# frozen_string_literal: true
require 'cgi'
GARDEN_DATA = JSON.parse(File.read('_data/garden-crops.json'))
GARDEN_CROPS = GARDEN_DATA.fetch('crops').to_h { |crop| [crop.fetch('id'), crop] }
GARDEN_SOURCES = GARDEN_DATA.fetch('sources').to_h { |source| [source.fetch('id'), source] }
GARDEN_MONTHS = %w[Janvāris Februāris Marts Aprīlis Maijs Jūnijs Jūlijs Augusts Septembris Oktobris Novembris Decembris].freeze
GARDEN_MONTH_LOCATIVE = %w[janvārī februārī martā aprīlī maijā jūnijā jūlijā augustā septembrī oktobrī novembrī decembrī].freeze
GARDEN_MONTH_SLUGS = %w[janvaris februaris marts aprilis maijs junijs julijs augusts septembris oktobris novembris decembris].freeze

def garden_h(value)
  CGI.escapeHTML(value.to_s)
end

def garden_source_links(ids)
  links = Array(ids).map do |id|
    source = GARDEN_SOURCES[id]
    next unless source
    %(<a href="#{garden_h(source['url'])}" target="_blank" rel="noopener noreferrer">#{garden_h(source['title'])}</a>)
  end.compact
  return '' if links.empty?
  %(<span class="garden-source-links"><span>Avoti:</span> #{links.join(' · ')}</span>)
end

def garden_action_rows(crop)
  actions = Array(crop['calendarRefinements'])
  refined = !actions.empty?
  actions = Array(crop['preservedCalendarActions']) if actions.empty?
  actions.map do |action|
    label = action['label'] || action['kind'] || 'Dārza darbs'
    months = Array(action['months'])
    names = months.map { |month| GARDEN_MONTHS[month.to_i - 1] }.compact
    period = action['window'] || names.join(' · ')
    condition = action['condition'] || action['precision']
    notes = [condition, action['datePrecision'], action['precision']].compact.uniq
    source_ids = action['sourceIds'] || crop['sourceIds']
    %(<li class="garden-action" data-action-months="#{garden_h(months.join(','))}"><div><span class="garden-action-window">#{garden_h(period)}</span><strong>#{garden_h(label)}</strong><p>#{garden_h(notes.join(' '))}</p>#{garden_source_links(source_ids)}</div><span class="garden-window-mark" aria-hidden="true"><svg class="icon"><use href="#i-sprout"/></svg></span></li>)
  end.join
end

def garden_crop_card(crop, index)
  months = (Array(crop['preservedCalendarActions']).flat_map { |a| Array(a['months']) } + Array(crop['calendarRefinements']).flat_map { |a| Array(a['months']) } + Array(crop.dig('harvest', 'period')).flat_map { |p| Array(p['months']) }).uniq.sort
  actions = garden_action_rows(crop)
  harvest = Array(crop.dig('harvest', 'period')).map do |period|
    months = Array(period['months']).join(',')
    %(<p data-harvest-months="#{garden_h(months)}"><strong>#{garden_h(period['label'])}</strong> <span>#{garden_h(period['scope'])}</span> #{garden_h(period['precision'])} #{garden_source_links(period['sourceIds'])}</p>)
  end.join
  first = crop['intro'].fetch('text')
  reminder = %(<form class="garden-reminder-form" data-garden-reminder-form data-crop-id="#{garden_h(crop['id'])}"><label>Datums, ko pārbaudīt<input name="date" type="date" required value="#{Date.today.iso8601}"></label><label>Atgādinājums<input name="note" maxlength="120" value="Pārbaudīt augsni, laikapstākļus un salnu risku"></label><label>Mana piezīme par audzēšanu<select name="place"><option>Atklātā laukā</option><option>Neapkurinātā siltumnīcā</option><option>Apkurinātā siltumnīcā</option></select></label><label>Reģiona piezīme<select name="region"><option>Piekraste</option><option>Kurzemes iekšzeme</option><option>Zemgale</option><option>Vidzeme</option><option>Latgale</option><option>Cits mikroklimats</option></select></label><button class="primary" type="submit"><svg class="icon" aria-hidden="true"><use href="#i-plus"/></svg> Pievienot plānam</button></form>)
  %(<article class="garden-crop-card" data-garden-crop="#{garden_h(crop['id'])}" data-crop-months="#{garden_h(months.join(','))}" data-crop-search="#{garden_h([crop['name'], first, crop['title']].join(' ').downcase)}"><div class="garden-crop-top"><span class="garden-crop-illustration"><svg class="crop-icon" viewBox="0 0 128 128" aria-hidden="true"><use href="#i-crop-#{garden_h(crop['id'])}"/></svg></span><span class="garden-crop-number">#{format('%02d', index + 1)}</span></div><div class="garden-crop-copy"><h3>#{garden_h(crop['name'])}</h3><p class="garden-crop-intro">#{garden_h(first)}</p><button type="button" class="garden-save-crop" data-garden-save-crop="#{garden_h(crop['id'])}" aria-pressed="false"><svg class="icon" aria-hidden="true"><use href="#i-plus"/></svg>Pievienot manam dārza sarakstam</button><h4>Laika orientieri</h4><ul class="garden-action-list">#{actions}</ul>#{harvest.empty? ? '' : %(<div class="garden-harvest">#{harvest}</div>)}<p class="garden-season-note">#{garden_h(crop['publicConfidence'])}</p><a class="garden-profile-link" href="#{garden_h(crop['canonical'])}">Pilns audzēšanas apraksts <svg class="icon" aria-hidden="true"><use href="#i-arrow"/></svg></a><details class="garden-reminder-details"><summary>Personisks atgādinājums</summary>#{reminder}</details></div></article>)
end

def garden_month_filters(month = nil)
  options = %(<option value="0">Visi mēneši</option>) + GARDEN_MONTHS.each_with_index.map do |name, index|
    value = index + 1
    %(<option value="#{value}"#{month.to_i == value ? ' selected' : ''}>#{name}</option>)
  end.join
  %(<label>Mēnesis<select name="month" data-garden-month-filter>#{options}</select></label>)
end

def garden_hub_markup(month = nil)
  month_number = month.to_i
  locative = GARDEN_MONTH_LOCATIVE[month_number - 1] if month_number.positive? && month_number <= 12
  h1 = locative ? "Sējas un stādīšanas kalendārs #{locative}" : 'Sējas un stādīšanas kalendārs Latvijā'
  intro = locative ? "Pārskati, kurām Latvijā audzētajām kultūrām avotos norādīts darbs #{locative}. Mēneša atzīme ir orientieris; pirms sējas izvērtē augsni, šķirni un salnu risku." : GARDEN_DATA.dig('common', 'regionalGuidance', 'paragraphs', 0, 'text')
  pages = (1..12).map { |number| %(<a href="/sejas-kalendars/menesis/#{GARDEN_MONTH_SLUGS[number - 1]}/">#{GARDEN_MONTHS[number - 1]}</a>) }.join
  cards = GARDEN_DATA.fetch('crops').each_with_index.map { |crop, index| garden_crop_card(crop, index) }.join
  regional = GARDEN_DATA.dig('common', 'regionalGuidance')
  regional_html = regional.fetch('paragraphs').map { |p| %(<p>#{garden_h(p['text'])} #{garden_source_links(p['sourceIds'])}</p>) }.join
  frost = GARDEN_DATA.dig('common', 'yearlyFrostGuard')
  frost_html = frost.fetch('paragraphs').map { |p| %(<p>#{garden_h(p['text'])} #{garden_source_links(p['sourceIds'])}</p>) }.join
  %(<div class="garden-page" data-garden-app data-garden-initial-month="#{month_number}"><section class="garden-hero"><div class="garden-hero-copy"><span class="eyebrow">LATVIJAS DĀRZA SEZONA</span><h2>#{garden_h(h1)}</h2><p>#{garden_h(intro)}</p><p>16 dārzeņi. Sējas, dēstu un ražas orientieri ar avotiem un apstākļiem.</p><a class="button primary" href="#garden-planner">Atvērt sējas plānotāju <svg class="icon" aria-hidden="true"><use href="#i-arrow"/></svg></a></div><img class="garden-hero-art" src="/assets/garden/garden-hero.svg" width="640" height="430" alt="Izometriska dārza dobe ar dēstiem, burkānu sēklu paciņu un stādīšanas piederumiem" loading="eager"></section><section class="garden-principles"><article><svg class="icon"><use href="#i-sun"/></svg><h3>Apstākļi pirms datuma</h3><p>Augsnes mitrums un siltums, šķirne, vietējais mikroklimats un salnas ietekmē darbu sākumu.</p></article><article><svg class="icon"><use href="#i-clock"/></svg><h3>Orientieris, ne solījums</h3><p>Mēneša logs nav precīza diena un neaizstāj šī gada laikapstākļu prognozi.</p></article><article><svg class="icon"><use href="#i-check"/></svg><h3>Plāns paliek tavā ierīcē</h3><p>Atgādinājumus glabā pārlūka lokālajā krātuvē; tos var lejupielādēt kā ICS kalendāra failu.</p></article></section><section class="garden-filter-panel" id="garden-planner"><div class="garden-section-heading"><div><span class="eyebrow">IZVĒLIES SAVU SEZONU</span><h2>Dārza darbu pārskats</h2></div><p>Mēneša izvēle atlasa avotos minētos orientierus.</p></div><form class="garden-filters" data-garden-filters><div>#{garden_month_filters(month_number)}</div><label>Meklēt dārzeni<input type="search" name="query" data-garden-search placeholder="Piemēram, burkāni" autocomplete="off"></label><label>Mana audzēšanas vieta<select name="place" data-garden-place><option>Atklātā laukā</option><option>Neapkurinātā siltumnīcā</option><option>Apkurinātā siltumnīcā</option></select></label><label>Reģiona piezīme<select name="region" data-garden-region><option>Piekraste</option><option>Kurzemes iekšzeme</option><option>Zemgale</option><option>Vidzeme</option><option>Latgale</option><option>Cits mikroklimats</option></select></label><button type="reset" class="garden-reset"><svg class="icon"><use href="#i-refresh"/></svg> Notīrīt</button></form><p class="garden-filter-note" data-garden-region-note>Reģiona un siltumnīcas izvēle tiek saglabāta kā tava piezīme; tā nepārbīda avotu datumus ar nepārbaudītu dienu skaitu.</p><p class="garden-result-count" data-garden-count aria-live="polite">Parādīti visi 16 dārzeņi.</p><div class="garden-grid" data-garden-grid>#{cards}</div><p class="garden-empty" data-garden-empty hidden>Šim mēnesim norādītu sējas vai stādīšanas orientieru nav. Vari izvēlēties citu mēnesi vai apskatīt visus dārzeņus.</p></section><section class="garden-my-plan"><div class="garden-section-heading"><div><span class="eyebrow">TAVĀ PĀRLŪKĀ</span><h2>Mana dārza piezīmes</h2></div><button type="button" class="button" data-garden-export><svg class="icon"><use href="#i-file"/></svg> Lejupielādēt ICS</button></div><p>Pats izvēlies dienu, kad pārbaudīt augsni, salnu risku vai šķirnes gatavību. Šis atgādinājums nav publiska prognoze.</p><div class="garden-reminders" data-garden-reminders><p>Atgādinājumu vēl nav.</p></div><small>Informācija glabājas šajā ierīcē. ICS failu vari pievienot savam kalendāram.</small></section><section class="garden-regional"><div><span class="eyebrow">LATVIJAS APSTĀKĻI</span><h2>Piekrastes un iekšzemes dārzi</h2>#{regional_html}</div><aside><h3>#{garden_h(frost['heading'])}</h3>#{frost_html}</aside></section><nav class="garden-month-links" aria-label="Sējas kalendārs pa mēnešiem">#{pages}</nav></div>)
end

def garden_profile_markup(crop)
  actions = garden_action_rows(crop)
  sections = crop.fetch('sections').map do |section|
    paragraphs = section.fetch('paragraphs').map { |p| %(<p>#{garden_h(p['text'])} #{garden_source_links(p['sourceIds'])}</p>) }.join
    %(<section id="#{garden_h(section['id'])}"><h2>#{garden_h(section['heading'])}</h2>#{paragraphs}</section>)
  end.join
  source_ids = crop.fetch('sourceIds')
  sources = source_ids.map { |id| GARDEN_SOURCES[id] }.compact.uniq { |source| source['id'] }
  source_list = sources.map { |source| %(<li><a href="#{garden_h(source['url'])}" target="_blank" rel="noopener noreferrer">#{garden_h(source['title'])}</a><span>#{garden_h(source['publisherScope'])}#{source['publishedAt'] ? " · #{garden_h(source['publishedAt'])}" : ''}</span></li>) }.join
  refinement_note = Array(crop['calendarRefinements']).empty? ? '' : %(<p class="garden-refinement-note">Detalizētas vadlīnijas precizē īsāko agrāko orientieri; kalendārā prioritāte dota šeit norādītajiem nosacījumiem.</p>)
  maturity = crop.dig('harvest', 'daysFromSowing')
  maturity_html = if maturity
    %(<aside class="garden-maturity-source"><strong>Avotā pārbaudīts orientieris: #{garden_h(maturity['min'])}–#{garden_h(maturity['max'])} dienas</strong><p>#{garden_h(maturity['scope'])} Intervāls ir gatavības pārbaudes atgādinājums, nevis garantēts novākšanas datums.</p>#{garden_source_links([maturity['sourceId']])}</aside>)
  else
    '<aside class="garden-maturity-source"><strong>Vienots dienu skaits nav noteikts</strong><p>Šķirnes aprakstā norādīto ilgumu vari ievadīt zemāk. Tas kļūs par tavu personīgo pārbaudes atgādinājumu, nevis Latvijas kopējo prognozi.</p></aside>'
  end
  default_min = maturity ? maturity['min'] : ''
  default_max = maturity ? maturity['max'] : ''
  reminder = %(<form class="garden-reminder-form" data-garden-reminder-form data-crop-id="#{garden_h(crop['id'])}"><label>Datums, ko pārbaudīt<input name="date" type="date" required value="#{Date.today.iso8601}"></label><label>Atgādinājums<input name="note" maxlength="120" value="Pārbaudīt augsni, laikapstākļus un salnu risku"></label><label>Mana piezīme par audzēšanu<select name="place"><option>Atklātā laukā</option><option>Neapkurinātā siltumnīcā</option><option>Apkurinātā siltumnīcā</option></select></label><label>Reģiona piezīme<select name="region"><option>Piekraste</option><option>Kurzemes iekšzeme</option><option>Zemgale</option><option>Vidzeme</option><option>Latgale</option><option>Cits mikroklimats</option></select></label><button class="primary" type="submit"><svg class="icon"><use href="#i-plus"/></svg>Pievienot plānam</button></form>)
  %(<article class="garden-profile" data-garden-profile="#{garden_h(crop['id'])}"><section class="garden-profile-lead"><div><span class="eyebrow">DĀRZEŅU AUDZĒŠANA LATVIJĀ</span><h2>#{garden_h(crop['name'])}: sēja, kopšana un raža</h2><p>#{garden_h(crop.dig('intro', 'text'))}</p><p class="garden-profile-scope">#{garden_h(crop['scope'])}</p></div><svg class="crop-icon crop-icon--hero" viewBox="0 0 128 128" aria-hidden="true"><use href="#i-crop-#{garden_h(crop['id'])}"/></svg></section><section class="garden-action-panel"><div><span class="eyebrow">AVOTU ORIENTIERI</span><h2>Kad sēt vai stādīt</h2></div>#{refinement_note}<ul class="garden-action-list">#{actions}</ul></section><div class="garden-reading">#{sections}</div>#{maturity_html}<section class="garden-variety-tool"><h2>Aprēķini šķirnes pārbaudes intervālu</h2><p>Izmanto sēklu paciņas vai cita sava avota dienu skaitu. Norādi, no kura notikuma to skaitīt; rezultāts ir tikai tavs atgādinājums.</p><form data-variety-timing data-source-min="#{garden_h(default_min)}" data-source-max="#{garden_h(default_max)}"><label>Sākuma notikums<select name="basis"><option value="sowing">Sējas diena</option><option value="emergence">Sadīgšanas diena</option><option value="transplanting">Izstādīšanas diena</option></select></label><label>Sākuma datums<input name="date" type="date" required></label><div class="garden-duration-fields"><label>No dienas<input type="number" name="minDays" min="1" max="365" required value="#{garden_h(default_min)}"></label><label>Līdz dienai<input type="number" name="maxDays" min="1" max="365" required value="#{garden_h(default_max)}"></label></div><button class="primary" type="submit"><svg class="icon"><use href="#i-calculator"/></svg>Aprēķināt pārbaudes dienas</button><output aria-live="polite"></output></form><p class="garden-source-limit">#{maturity ? 'Dilles atklātā lauka zaļumiem norādītais avota intervāls attiecas tikai uz sēju un šo audzēšanas veidu.' : 'Lietotāja ievadīts dienu skaits netiek pasniegts kā pārbaudīts valsts kalendāra termiņš.'}</p></section><section class="garden-reminder-panel"><h2>Personisks atgādinājums</h2><p>Pats izvēlies datumu, kad pārbaudīt kultūraugu un konkrētā dārza apstākļus.</p>#{reminder}</section><section class="garden-sources"><h2>Izmantotie avoti</h2><ul>#{source_list}</ul></section><a class="button garden-back-link" href="/sejas-kalendars/">Atpakaļ uz sējas kalendāru <svg class="icon"><use href="#i-arrow"/></svg></a></article>)
end
