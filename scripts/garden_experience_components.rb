# frozen_string_literal: true

def garden_photo_data
  @garden_photo_data ||= JSON.parse(File.read('_data/garden-photos.json')).fetch('photos').to_h { |photo| [photo.fetch('cropId'),photo] }
end

def garden_photo_img(id, large=false, eager=false)
  photo=garden_photo_data.fetch(id)
  %(<img class="g-plant-img" src="#{garden_h(large ? photo['large'] : photo['src'])}"#{large ? " srcset=\"#{garden_h(photo['srcset'])}\" sizes=\"(max-width: 650px) 80vw, 370px\"" : ''} alt="#{garden_h(photo['alt'])}" width="#{large ? 960 : 320}" height="#{large ? 720 : 240}" loading="#{eager ? 'eager' : 'lazy'}" decoding="async">)
end

def garden_calendar_actions(crop)
  GARDEN_CALENDAR_DATA.fetch('crops').find { |item| item['id']==crop['id'] }.fetch('actions')
end

def garden_heading_markup(heading,description,slug)
  crop=GARDEN_CROPS[slug]
  artwork=if crop
    %(<figure class="g-hero-photo">#{garden_photo_img(crop['id'],true,true)}</figure>)
  else
    %(<div class="g-hero-mosaic">#{%w[tomati burkani salati kiploki].map { |id| %(<div>#{garden_photo_img(id,false,true)}</div>) }.join}</div>)
  end
  %(<header class="g-hero"><div><span class="g-kicker">LATVIJAS DĀRZS · NO SĒKLAS LĪDZ RAŽAI</span><h1>#{garden_h(heading)}</h1><p>#{garden_h(description)}</p><div class="g-hero-actions"><a class="g-primary" href="#{crop ? '#sejas-orientieri' : '#garden-planner'}">#{crop ? 'Skatīt sezonas darbus' : 'Atvērt sezonas pārskatu'} <span aria-hidden="true">↓</span></a><a href="#{crop ? '/sejas-kalendars/#garden-my-plan' : '#garden-my-plan'}">Mans dārza plāns <span aria-hidden="true">↗</span></a></div></div>#{artwork}</header>)
end

def garden_season_actions_markup(crop)
  crop.fetch('actions').map do |action|
    %(<li class="g-action g-action--#{action['task']}" data-g-action-months="#{action['months'].join(',')}" data-g-action-task="#{action['task']}" data-g-action-places="#{action['places'].join(',')}"><div><span>#{garden_h(action['window'])}</span><strong>#{garden_h(action['label'])}</strong><p>#{garden_h(action['condition'])}</p>#{garden_source_links(action['sourceIds'])}</div></li>)
  end.join
end

def garden_hub_markup(month=nil)
  selected=month.to_i
  crops=GARDEN_CALENDAR_DATA.fetch('crops')
  rows=crops.map do |crop|
    visible=selected.zero? || crop['actions'].any? { |action| action['months'].include?(selected) }
    cells=(1..12).map do |n|
      tokens=crop['actions'].select { |action| action['months'].include?(n) }.group_by { |action| action['task'] }.map do |task,actions|
        text={'sow'=>'S','plant'=>'D','harvest'=>'R'}.fetch(task)
        %(<span class="g-stage g-stage--#{task}" data-g-stage-task="#{task}" data-g-stage-places="#{actions.flat_map { |a| a['places'] }.uniq.join(',')}" title="#{garden_h(actions.map { |a| "#{a['label']}: #{a['window']}" }.join(' · '))}"><span aria-hidden="true">#{text}</span><span class="sr-only">#{garden_h({'sow'=>'Sēja','plant'=>'Dēstu izstādīšana vai stādīšana','harvest'=>'Ražas novākšana'}[task])}</span></span>)
      end.join
      %(<td data-g-cell-month="#{n}"#{selected==n ? ' class="is-current-month"' : ''}>#{tokens}</td>)
    end.join
    %(<tr data-g-season-row="#{crop['id']}"#{visible ? '' : ' hidden'}><th scope="row"><button type="button" data-g-expand="#{crop['id']}" aria-label="Atvērt: #{garden_h(crop['name'])}" aria-expanded="false" aria-controls="g-details-#{crop['id']}">#{garden_photo_img(crop['id'])}<span>#{garden_h(crop['name'])}</span><b aria-hidden="true">+</b></button></th>#{cells}<td><button class="g-add-plant" type="button" data-g-plan-crop="#{crop['id']}" aria-label="Pievienot plānam: #{garden_h(crop['name'])}">+</button></td></tr><tr class="g-detail-row" id="g-details-#{crop['id']}" data-g-detail="#{crop['id']}" hidden><td colspan="14"><div class="g-detail-layout"><figure>#{garden_photo_img(crop['id'],true)}</figure><div><h3>#{garden_h(crop['name'])}</h3><p>#{garden_h(crop['intro'])}</p><ul class="g-detail-actions">#{garden_season_actions_markup(crop)}</ul><p class="g-readiness"><strong>Gatavības pazīmes:</strong> #{garden_h(crop['readiness'])}</p><a class="g-profile-link" href="#{garden_h(crop['canonical'])}">Pilns audzēšanas apraksts ↗</a><button class="g-save" type="button" data-garden-save-crop="#{crop['id']}" aria-pressed="false">Saglabāt kultūru manā sarakstā</button></div></div></td></tr>)
  end.join
  payload=JSON.generate(GARDEN_CALENDAR_DATA).gsub('<','\\u003c')
  months=(1..12).map { |n| %(<a href="/sejas-kalendars/menesis/#{GARDEN_MONTH_SLUGS[n-1]}/"#{n==selected ? ' aria-current="page"' : ''}>#{GARDEN_MONTHS[n-1]}</a>) }.join
  regional=GARDEN_DATA.dig('common','regionalGuidance','paragraphs').map { |p| %(<p>#{garden_h(p['text'])} #{garden_source_links(p['sourceIds'])}</p>) }.join
  sources=GARDEN_CALENDAR_DATA.fetch('sources').map { |source| %(<li><a href="#{garden_h(source['url'])}" target="_blank" rel="noopener">#{garden_h(source['title'])} ↗</a></li>) }.join
  <<~HTML
  <div class="g-experience" data-garden-app data-garden-initial-month="#{selected}">
    <div class="g-intro-stats"><div><strong>16</strong><span>Latvijā audzētas dārzeņu kultūras</span></div><div><strong>12</strong><span>mēnešu sezonas pārskats</span></div><div><strong>Tavs dārzs</strong><span>personiski datumi, ICS un dublējums</span></div></div>
    <nav class="g-jump" aria-label="Sējas kalendāra sadaļas"><a href="#garden-planner">01 · Sezonas pārskats</a><a href="#garden-my-plan">02 · Mans plāns</a><a href="#garden-conditions">03 · Latvijas apstākļi</a><a href="#garden-sources">04 · Avoti</a></nav>
    <section class="g-overview" id="garden-planner" aria-labelledby="g-overview-title"><div class="g-section-head"><div><span class="g-kicker">SEZONA VIENĀ SKATĀ</span><h2 id="g-overview-title">Ko šomēnes darīt dārzā?</h2><p>Sēja, stādīšana un raža ir atsevišķi darbi. Atver kultūru, lai izlasītu apstākļus un avotus.</p></div><button type="button" data-garden-print="overview">Drukāt pārskatu ↓</button></div>
    <form class="g-filters" data-garden-filters><label>Meklēt kultūru<input type="search" data-garden-search name="query" placeholder="Burkāni, tomāti, ķiploki…"></label>#{garden_month_filters(selected)}<label>Darbs<select data-garden-task><option value="all">Visi darbi</option><option value="sow">Sēja</option><option value="plant">Stādīšana un dēsti</option><option value="harvest">Ražas novākšana</option></select></label><label>Audzēšanas veids<select data-garden-cultivation><option value="all">Visi veidi</option><option value="field">Atklātā laukā</option><option value="seedlings">Dēstu audzēšana</option><option value="greenhouse">Siltumnīcā</option></select></label><button type="reset">Notīrīt</button></form>
    <div class="g-climate-line"><label>Mans reģions<select data-garden-region><option>Piekraste</option><option>Kurzemes iekšzeme</option><option>Zemgale</option><option>Vidzeme</option><option>Latgale</option><option>Cits mikroklimats</option></select></label><p data-garden-region-note>Reģions palīdz saglabāt tava dārza piezīmes. Mēnešu logus nemainām ar vienādu dienu nobīdi.</p></div><div class="g-legend"><span><b class="g-stage g-stage--sow">S</b> Sēja</span><span><b class="g-stage g-stage--plant">D</b> Stādīšana / dēsti</span><span><b class="g-stage g-stage--harvest">R</b> Ražas novākšana</span><button type="button" data-garden-this-month>Šis mēnesis</button></div>
    <p class="g-season-note" data-garden-season-note>Laika logi ir orientieri. Pārbaudi šķirni, augsnes siltumu un vietējo salnu risku.</p><p class="g-count" data-garden-count role="status">16 kultūras pārskatā.</p><div class="g-table-scroll" role="region" aria-label="Sējas, stādīšanas un ražas kalendārs pa mēnešiem" tabindex="0"><table class="g-season-table"><caption class="sr-only">Latvijas dārzeņu sezonas orientieri. S: sēja; D: stādīšana; R: ražas novākšana.</caption><thead><tr><th scope="col">Kultūra</th>#{%w[Jan Feb Mar Apr Mai Jūn Jūl Aug Sep Okt Nov Dec].each_with_index.map { |name,i| %(<th scope="col" data-g-month-header="#{i+1}"><abbr title="#{GARDEN_MONTHS[i]}">#{name}</abbr></th>) }.join}<th scope="col">Plāns</th></tr></thead><tbody>#{rows}</tbody></table></div><p class="g-empty" data-garden-empty hidden>Izvēlētajam mēnesim, darbam un audzēšanas veidam šajā pārskatā nav avotos norādītu periodu. Maini filtrus; trūkstošs datums nenozīmē ražas garantiju citā mēnesī.</p></section>
    <section class="g-plan" id="garden-my-plan" aria-labelledby="g-plan-title"><div class="g-section-head"><div><span class="g-kicker">TAVI DATUMI · TAVĀ IERĪCĒ</span><h2 id="g-plan-title">Mans dārzs. Mans sezonas plāns.</h2><p>Pats izvēlies konkrēto dienu un šķirni. Piezīmes paliek šajā pārlūkā.</p></div><strong data-garden-plan-count>0 darbi</strong></div><div class="g-plan-layout"><form class="g-plan-form" data-garden-reminder-form><input type="hidden" name="editId"><label>Kultūra<select name="cropId" required><option value="">Izvēlies kultūru</option>#{crops.map { |crop| %(<option value="#{crop['id']}">#{garden_h(crop['name'])}</option>) }.join}</select></label><label>Plāna darbs<select name="task"><option value="sow">Sēja</option><option value="plant">Stādīšana / dēsti</option><option value="harvest">Ražas novākšana</option><option value="other">Cits dārza darbs</option></select></label><label>Mans datums<input type="date" name="date" required></label><label>Piezīme par šķirni vai dobi<input name="note" maxlength="160" placeholder="Piemēram, šķirne un dobes numurs"></label><label>Audzēšanas vieta<select name="place"><option>Atklātā laukā</option><option>Neapkurinātā siltumnīcā</option><option>Apkurinātā siltumnīcā</option></select></label><label>Reģiona piezīme<select name="region"><option>Piekraste</option><option>Kurzemes iekšzeme</option><option>Zemgale</option><option>Vidzeme</option><option>Latgale</option><option>Cits mikroklimats</option></select></label><button class="g-primary" type="submit" data-garden-save-plan>Pievienot manam plānam +</button><button type="reset" class="g-cancel-edit" data-garden-cancel-edit hidden>Atcelt labošanu</button></form><div class="g-plan-content"><div class="g-plan-actions"><button type="button" data-garden-export disabled>ICS kalendārs ↓</button><button type="button" data-garden-backup>JSON dublējums ↓</button><label class="g-import-button">Atvērt JSON<input type="file" data-garden-import accept="application/json,.json"></label><button type="button" data-garden-print="plan" disabled>Drukāt plānu ↓</button></div><div class="g-reminders" data-garden-reminders><p class="g-plan-empty">Tavas nākamās sezonas plāns sāksies ar pirmo kultūru un datumu.</p></div></div></div><p class="g-feedback" data-garden-feedback role="status"></p></section>
    <section class="g-conditions" id="garden-conditions"><div><span class="g-kicker">LATVIJAS SEZONA</span><h2>Datums ir orientieris. Apstākļi izšķir.</h2>#{regional}<p>Rudenī stādītos ziemas ķiplokus vērtē nākamās vasaras ražai. Siltumnīcas un lauka aprites nesapludinām vienā grafikā.</p></div><aside><h3>Pirms sējas pārbaudi</h3><label><input type="checkbox" data-garden-check="variety"> Šķirnes norādes un ražas mērķi</label><label><input type="checkbox" data-garden-check="soil"> Augsnes mitrumu un temperatūru</label><label><input type="checkbox" data-garden-check="frost"> Vietējo laikapstākļu un salnu prognozi</label><p>Ja avots nenosaka precīzu novākšanas mēnesi, tabulā ražas mēnesi neizdomājam. Gatavības pazīmes ir kultūras aprakstā.</p></aside></section>
    <nav class="g-month-links" aria-label="Sējas kalendārs pa mēnešiem">#{months}</nav><section class="g-source-section" id="garden-sources"><span class="g-kicker">AVOTI UN SKAIDROJUMI</span><h2>Latvijas audzēšanas avoti</h2><p>Sezonas pārskats balstīts Dārzkopības institūta un Zemkopības ministrijas / VAAD vadlīnijās. Agronomisko avotu izdošanas gads nav šī gada laikapstākļu prognoze. Mēness fāzēm nepiedēvējam garantētu ietekmi uz ražu.</p><ul>#{sources}</ul></section><script type="application/json" data-garden-data>#{payload}</script>
  </div>
  HTML
end
