def category_advanced_controls(slug,body)
 case slug
 when 'menesa-kalendars','nedelas-kalendars'
  body=body.sub('<div id="calendar-app"',%(<form class="v2-inline-tool" data-v2-calendar-jump><label>Atvērt datumu<input type="date" name="date" min="2027-01-01" max="2030-12-31" value="2027-01-#{slug=='nedelas-kalendars' ? '04' : '01'}" required></label><button type="submit">Atvērt savā plānā ↗</button><span role="status" data-v2-jump-status></span></form><div id="calendar-app"))
 when 'atvalinajuma-planotajs'
  body=body.sub('<section id="category-workspace" class="leave-experience">',%(<section id="category-workspace" class="leave-experience"><div class="v2-quick-budget"><span>Atvaļinājuma budžets</span>#{[3,5,10,20].map{|n|"<button type=\"button\" data-v2-budget=\"#{n}\">#{n} dienas</button>"}.join}<button type="button" data-v2-compose-leave>Salikt no ieteikumiem ↗</button><p role="status" data-v2-leave-status></p></div>))
 when 'mainu-grafiks'
  marker='<div class="category-data-actions">'
  form=%(<form class="v2-range-tool" data-v2-shift-range><div><span class="eyebrow">VAIRĀKAS DIENAS VIENĀ REIZĒ</span><h3>Atzīmē brīvdienu periodu</h3></div><label>No<input type="date" name="from" min="2027-01-01" max="2030-12-31" value="2027-01-01" required></label><label>Līdz<input type="date" name="to" min="2027-01-01" max="2030-12-31" value="2027-01-03" required></label><button type="submit">Atzīmēt brīvas dienas</button><p role="status" data-v2-shift-status></p></form>)
  body=body.sub(marker,form+marker)
 when 'varda-dienas'
  panel=%(<section class="v2-name-week"><div class="v2-block-heading"><div><span class="eyebrow">ATCERIES SAVĒJOS LAIKUS</span><h2>Vārda dienas tuvākajās septiņās dienās</h2></div><label>Sākuma datums<input type="date" data-v2-names-start value="#{Date.today.iso8601}" min="1901-01-01" max="2099-12-25"></label></div><div data-v2-names-week></div><button type="button" data-v2-names-week-ics>Saglabāt septiņas dienas (ICS) ↓</button></section>)
  body=body.sub('<div id="names-month"',panel+'<div id="names-month"')
 when 'svetki-un-tradicijas'
  panel='<div class="v2-inline-tool v2-tradition-modes" role="group" aria-label="Svētku skatījums"><button type="button" data-v2-tradition-mode="stories" aria-pressed="true">Stāsti ar attēliem</button><button type="button" data-v2-tradition-mode="dates" aria-pressed="false">Datumu saraksts</button><button type="button" data-category-print>Drukāt atlasi</button></div><div class="v2-dated-traditions" data-v2-traditions-dates hidden></div>'
  body=body.sub('<div class="category-result-bar">',panel+'<div class="category-result-bar">')
 when 'skolas-brivlaiki'
  body=body.sub('<div class="school-selection">','<div class="v2-school-actions"><button type="button" data-v2-school-csv>Atlasītie brīvlaiki (CSV) ↓</button><span role="status" data-v2-school-status></span></div><div class="school-selection">')
 when 'meness-kalendars'
  body=body.sub('<form data-lunar-jump>',%(<form class="v2-lunar-day-jump" data-v2-lunar-day><label>Konkrēta diena<input type="date" name="date" min="2027-01-01" max="2030-12-31" value="2027-01-01" required></label><button type="submit">Atvērt šo Mēness dienu ↗</button></form><form data-lunar-jump>))
 when 'meness-fazes'
  body=body.sub('<button type="button" data-phase-ics>','<button type="button" data-v2-phase-csv>Tabula (CSV) ↓</button><button type="button" data-phase-ics>')
 when 'gadalaiki'
  body=body.sub('<div class="category-segmented"', '<div class="v2-compare-toggle"><label><input type="checkbox" data-v2-season-compare> Salīdzināt 2027.–2030. gadu</label></div><div data-v2-season-comparison hidden></div><div class="category-segmented"')
 when 'astronomiskais-kalendars'
  body=body.sub('<div class="astronomy-feature"', '<div class="v2-astronomy-actions"><label><input type="checkbox" data-v2-local-eclipses> Aptumsumi — tikai izvēlētajā pilsētā redzamie</label><button type="button" data-v2-astronomy-link>Kopēt šīs atlases saiti ↗</button><span role="status" data-v2-astronomy-status></span></div><div class="astronomy-feature"')
 end
 body
end
