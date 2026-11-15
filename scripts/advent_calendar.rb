# frozen_string_literal: true
require 'json'
require 'cgi'
require 'date'
module AdventCalendar
  DATA = JSON.parse(File.read(File.expand_path('../_data/advent-calendar.json', __dir__)))
  module_function
  def h(text); CGI.escapeHTML(text.to_s); end
  # Original artwork. All pigments are carmine, ivory or neutral graphite.
  def art(kind, id)
    shapes = case kind
    when 'paperstar'
      '<path d="m100 22 20 46 49 5-37 34 11 49-43-25-43 25 11-49-37-34 49-5Z" fill="#fffaf0" stroke="#9a354b" stroke-width="2"/><path d="M100 22v109L57 156l43-56-69-27 69 27 69-27-69 27 43 56-43-25" fill="none" stroke="#cfaaad" stroke-width="2"/><path d="M100 22V5" stroke="#9a354b" stroke-width="2"/>'
    when 'puzuris'
      '<g fill="none" stroke="#982b40" stroke-width="2.5"><path d="M100 17v20m0 0 53 46-53 56-53-56 53-46v102M47 83h106M100 37 73 83l27 56 27-56Z"/><path d="m100 139-25 28m25-28 25 28m-50 0v12m50-12v12"/></g><circle cx="100" cy="83" r="5" fill="#7b162d"/>'
    when 'cookie'
      '<path d="m100 32 18 39 44 5-32 30 9 44-39-22-39 22 9-44-32-30 44-5Z" fill="#8b3d39" stroke="#521c2b" stroke-width="5"/><path d="m100 47 14 33 33 3-25 23 7 32-29-16-29 16 7-32-25-23 33-3Z" fill="none" stroke="#fff8e8" stroke-width="3" stroke-linejoin="round"/><circle cx="100" cy="98" r="8" fill="#fff8e8"/>'
    when 'market'
      '<path d="M39 94h122v65H39Z" fill="#fff9ed" stroke="#8d2940" stroke-width="3"/><path d="m28 89 72-55 72 55Z" fill="#802038"/><path d="m44 78 56-42 56 42" fill="none" stroke="#fff7e8" stroke-width="5"/><path d="M50 102h100v35H50Z" fill="#9b2944"/><path d="M48 142h104v10H48Z" fill="#e8d8c7"/><path d="M69 102v35m32-35v35m31-35v35" stroke="#fff6e6" stroke-width="2"/><path d="M52 89h96" stroke="#fff7e8" stroke-width="3" stroke-dasharray="2 10"/>'
    when 'card'
      '<g transform="rotate(-8 100 100)"><rect x="40" y="40" width="117" height="110" rx="4" fill="#fffdf4" stroke="#ac5968" stroke-width="2"/><rect x="124" y="48" width="23" height="28" fill="#8a2038"/><path d="M54 59h48m-48 12h35m-40 22h47" stroke="#c8b5aa" stroke-width="3"/><path d="m28 94 72 32 73-32v68H28Z" fill="#e6d2c4" stroke="#925064" stroke-width="2"/><path d="m28 162 53-44m92 44-52-44" stroke="#b99191" stroke-width="2"/><path d="M91 137c-16-16-28 5 9 20 38-16 26-37 9-20-5 4-13 4-18 0" fill="#8e213c"/></g>'
    when 'candle'
      '<ellipse cx="100" cy="160" rx="49" ry="12" fill="#d5c6b6"/><rect x="76" y="68" width="48" height="90" rx="5" fill="#f9ead5" stroke="#bc8b83" stroke-width="2"/><ellipse cx="100" cy="68" rx="24" ry="7" fill="#fffaf0"/><path d="M100 69V51" stroke="#452e2e" stroke-width="3"/><path d="M100 22c-27 31-10 40 0 36 17-6 14-21 0-36" fill="#a02a3f"/><path d="M100 37c-11 16-6 19 0 16 6-3 4-10 0-16" fill="#fff7df"/><path d="m83 84 34 30m-34-14 34 30m-34-15 34 30" stroke="#d9c1aa" stroke-width="1.5"/>'
    when 'book'
      '<g transform="rotate(-9 100 100)"><path d="M43 36h111v129H43c-13-2-15-15-3-20h115" fill="#82243c" stroke="#4d1d2d" stroke-width="3"/><path d="M45 145h111v15H44c-8-4-8-11 1-15" fill="#fff7e6"/><path d="M49 37v108" stroke="#bf7883" stroke-width="3"/><path d="m96 59 8 18 20 2-15 14 4 19-17-10-17 10 4-19-15-14 20-2Z" fill="none" stroke="#fff3df" stroke-width="2"/><path d="M68 124h59" stroke="#fff3df" stroke-width="2"/></g>'
    when 'gloves'
      '<g transform="rotate(-12 100 100)" fill="#8c223c" stroke="#582137" stroke-width="2"><path d="M38 142V81c0-40 52-42 52-4v25c22-26 37-2 14 19l-14 14v18H38Z"/><path d="M106 154V83c0-39 52-37 52 0v29c20-26 33-2 13 15l-13 15v22h-52Z"/></g><g fill="none" stroke="#fff5e6" stroke-width="3"><path d="m42 112 14-13 15 13 15-13m28 13 14-13 15 13 15-13M41 128h44m29 0h45"/><path d="m57 82 8-9 9 9-9 9Zm72-6 8-9 9 9-9 9Z"/></g>'
    when 'tea','bowl'
      '<ellipse cx="99" cy="156" rx="61" ry="10" fill="#d8c9bb"/><path d="M137 89c54-15 50 56 1 39" fill="none" stroke="#a45b64" stroke-width="9"/><path d="M49 77h91l-7 55c-6 34-73 34-79 0Z" fill="#faf0df" stroke="#995063" stroke-width="2"/><ellipse cx="94" cy="78" rx="44" ry="10" fill="#713e40"/><path d="M62 105h67m-63 13h59" stroke="#922943" stroke-width="5"/><path d="M80 63c-16-19 20-25 4-46m28 46c-15-18 18-22 6-40" fill="none" stroke="#c3a8a4" stroke-width="3" stroke-linecap="round"/>'
    when 'bread'
      '<path d="M34 120c-5-77 125-99 134-16l-3 34c-41 17-92 21-132 4Z" fill="#693c39" stroke="#432a2e" stroke-width="3"/><path d="M40 111c13-52 101-61 120-12" fill="none" stroke="#b97e69" stroke-width="9"/><path d="m64 80 6 13m23-26 4 16m24-17 2 15m22-9-1 14" stroke="#f3d6b8" stroke-width="3" stroke-linecap="round"/><path d="m44 131 20-3m16-2 20-3m15-2 20-3" stroke="#986659" stroke-width="2"/>'
    when 'tree'
      '<path d="M95 135h13v33H95Z" fill="#753448"/><path d="m100 25 34 48h-15l29 39h-22l36 38H38l36-38H52l29-39H66Z" fill="#84243b" stroke="#5d2431" stroke-width="2"/><path d="m79 66 37 20m-48 17 62 22m-37 13 33 8" fill="none" stroke="#fff2db" stroke-width="2"/><g fill="#fff5e5"><circle cx="93" cy="75" r="4"/><circle cx="105" cy="107" r="4"/><circle cx="75" cy="131" r="4"/><circle cx="132" cy="143" r="4"/></g><path d="m100 12 4 9 10 1-7 7 2 10-9-5-9 5 2-10-7-7 10-1Z" fill="#ead5b9"/>'
    when 'star','sun'
      '<g fill="none" stroke="#8e263f" stroke-width="2"><circle cx="100" cy="99" r="35"/><circle cx="100" cy="99" r="27"/><path d="M100 18v35m0 92v35M19 99h35m92 0h35M43 42l25 25m65 65 25 25M43 156l25-25m65-65 25-25M69 24l13 31m36 88 13 31M25 69l31 13m88 36 31 13M25 130l31-13m88-36 31-13M69 174l13-31m36-88 13-31"/></g><path d="m100 64 9 25 26 10-26 9-9 26-9-26-26-9 26-10Z" fill="#9c2a44"/>'
    else
      '<path d="M48 79h109v83H48Z" fill="#eee0cc" stroke="#864356" stroke-width="2"/><path d="M43 67h120v25H43Z" fill="#fcf7ea" stroke="#864356" stroke-width="2"/><path d="M91 67h22v95H91Z" fill="#8c223c"/><path d="M103 66c-76 0-55-67-14-16l14 16c58-55 85-11 0 0Z" fill="none" stroke="#8c223c" stroke-width="10"/><path d="M49 106h41m24 0h41" stroke="#b99998" stroke-width="2"/>'
    end
    %(<svg viewBox="0 0 200 190" class="advent-art" aria-hidden="true" focusable="false"><defs><filter id="#{id}"><feDropShadow dx="0" dy="5" stdDeviation="2.5" flood-color="#3d1124" flood-opacity=".17"/></filter></defs><g filter="url(##{id})">#{shapes}</g></svg>)
  end
  def page(year=nil)
    year=nil unless (2026..2030).include?(year)
    label=year ? "Adventes kalendārs #{year}" : 'Adventes kalendārs'
    yearnav=(2026..2030).map{|y| %(<a href="/adventes-kalendars/#{y}/#adventes-lodzini"#{year==y ? ' aria-current="page"' : ''}>#{y}</a>)}.join
    overview=''
    if year
      christmas=Date.new(year,12,25);last_sunday=christmas-1;last_sunday-=1 until last_sunday.sunday?;sundays=(0..3).map{|i|last_sunday-21+i*7}
      weekday=%w[svētdiena pirmdiena otrdiena trešdiena ceturtdiena piektdiena sestdiena]
      overview=%(<section class="advent-year-overview"><div><p class="advent-kicker">#{year}. GADA DATUMI</p><h2>Kā decembris iekrīt #{year}. gadā?</h2><p>Pirmais lodziņš atveras 1. decembrī tā ir #{weekday[Date.new(year,12,1).wday]}. Pēdējais pārsteigums gaida 24. decembrī, Ziemassvētku vakarā. Kalendāra lodziņi un četras Adventes svētdienas seko atšķirīgam ritmam.</p></div><dl>#{sundays.each_with_index.map{|d,i| %(<div><dt>#{i+1}. Advente</dt><dd>#{d.day}. #{d.month==11 ? 'novembris' : 'decembris'} #{year}</dd></div>)}.join}</dl></section>)
    end
    doors=DATA['days'].map do |d|
      day=d['day'];tone=day%5==0 || day==24 ? 'ivory' : 'wine'
      %(<button type="button" class="advent-door advent-door--#{tone} advent-door--v#{day%6}" data-advent-day="#{day}" aria-label="#{day}. decembris" aria-disabled="true" aria-haspopup="dialog"><span class="advent-recess" aria-hidden="true">#{art(d['art'],"advent-mini-#{day}")}<span class="advent-open-mark">Atvērts</span></span><span class="advent-lid" aria-hidden="true"><span class="advent-lid-back"></span><span class="advent-lid-front"><span class="advent-door-frame"></span><span class="advent-ornament">#{art(d['art'],"advent-ornament-#{day}")}</span><span class="advent-number">#{day.to_s.rjust(2,'0')}</span><span class="advent-door-month">DECEMBRIS</span><span class="advent-door-seal">✧</span></span></span><span class="advent-door-state" aria-hidden="true">Vēl jāgaida</span></button>)
    end.join
    templates=DATA['days'].map do |d|
      %(<template id="advent-content-#{d['day']}"><div class="advent-reveal-art">#{art(d['art'],"advent-reveal-#{d['day']}")}<span>#{h(d['time'])}</span></div><div class="advent-reveal-copy"><p class="advent-kicker" data-reveal-date></p><h2 id="advent-dialog-title">#{h(d['title'])}</h2><p>#{h(d['text'])}</p><a class="advent-action" href="#{h(d['href'])}"#{d['href'].start_with?('https:') ? ' rel="noopener"' : ''}>#{h(d['link'])}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-5-5 5 5-5 5"/></svg></a></div></template>)
    end.join
    %(<article class="advent-page" data-advent-calendar data-advent-year-default="#{year}" >
    <header class="advent-intro"><div><p class="advent-kicker">LATVIJAS ZIEMAS MAZIE PRIEKI</p><h1>Adventes<br><em>kalendārs#{year ? " #{year}" : ""}.</em></h1><p class="advent-lead">Tavs Adventes kalendārs ar 24 atveramiem lodziņiem. Aiz katrām durtiņām maza, latviska ideja: piparkūku smarža, rakstaini cimdi, gaismu pastaiga vai brīdis kopā.</p><div class="advent-intro-actions"><a class="advent-action" href="#adventes-lodzini">Pie kalendāra<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v16m-6-6 6 6 6-6"/></svg></a><span>1.–24. decembris #{year} · Pēc Latvijas laika</span></div></div><figure class="advent-hero-photo"><img src="/assets/occasions/christmas-960.webp" width="960" height="640" alt="Izgaismotās tirdziņa mājiņas un Ziemassvētku egle Rīgas Doma laukumā" fetchpriority="high"><figcaption>Rīgas Doma laukums · 2024. gada foto<br>AleWi · <a href="/pilsetas-un-fotografijas/#occasion-photo-christmas">CC BY-SA 4.0</a></figcaption><span class="advent-photo-label">Mūsu svētku sajūta</span></figure></header>
    <nav class="advent-years-nav" aria-label="Adventes kalendāri pa gadiem"><span>Izvēlies savu decembri</span>#{yearnav}</nav>#{overview}
    <section class="advent-calendar-section" id="adventes-lodzini" aria-labelledby="advent-board-heading"><div class="advent-toolbar"><div><p class="advent-kicker">DIVDESMIT ČETRI MAZI ATKLĀJUMI</p><h2 id="advent-board-heading">Atver savu decembri</h2></div><label class="advent-year">Kalendāra gads<select data-advent-year>#{(2026..2030).map{|y|"<option#{year==y ? ' selected' : ''}>#{y}</option>"}.join}</select></label></div>
    <div class="advent-status-line"><p data-advent-status role="status" aria-live="polite">Lodziņi atveras no 1. decembra, katru dienu pa vienam.</p><span data-advent-progress>Atvērti 0 no 24</span></div>
    <div class="advent-cabinet"><div class="advent-cabinet-heading"><span>ADVENTES KALENDĀRS</span><span data-advent-board-year>#{year || 2026}</span></div><div class="advent-doors">#{doors}</div><div class="advent-cabinet-foot"><span>RĪGA · LATVIJA</span><span>24 dienas. Laiks sev un savējiem.</span><span aria-hidden="true">✧</span></div></div>
    <div class="advent-board-bottom"><p>Iepriekšējos lodziņus vari atvērt atkārtoti. Tavs progress paliek šajā pārlūkā.</p><button type="button" data-advent-preview class="advent-preview">Izmēģināt atvēršanu<span>Paraugs pirms decembra</span></button></div><noscript><p>Lodziņu atvēršanai nepieciešams JavaScript. Svētku datumus un idejas atradīsi <a href="/svetki-un-tradicijas/advente/">Adventes ceļvedī</a>.</p></noscript>
    </section>
    <section class="advent-how" aria-labelledby="advent-how-title"><div><p class="advent-kicker">KĀ TAS DARBOJAS</p><h2 id="advent-how-title">Mazi pārsteigumi.<br>Bez steigas.</h2><p>Šis ir digitāls Adventes kalendārs. Lodziņos ir idejas un mazi uzdevumi; fiziskas preces netiek sūtītas. Izvēlies sev piemēroto un atgriezies, kad vēlies.</p></div><ol><li><span>01</span><div><h3>Sagaidi savu dienu</h3><p>Katrs lodziņš pieejams no attiecīgā decembra datuma plkst. 00.00 pēc Rīgas laika. Dienu nosaka tavas ierīces pulkstenis, pārrēķināts Latvijas laika joslā.</p></div></li><li><span>02</span><div><h3>Atver un atklāj</h3><p>Durtiņas atveras telpiski, un parādās dienas kartīte. Ieteikumiem nav jāseko pēc kārtas. Arī viena kopīga saruna ir labs rezultāts.</p></div></li><li><span>03</span><div><h3>Saglabā decembra sajūtu</h3><p>Atvērtos lodziņus atceras šis pārlūks. Citā ierīcē atzīmes nesinhronizējas. Vari pārslēgt gadu no 2026. līdz 2030.; katram gadam ir atsevišķs progress.</p></div></li></ol></section>
    <section class="advent-links" aria-label="Turpināt svētku plānošanu"><a href="/svetki-un-tradicijas/advente/"><span>ČETRAS SVĒTDIENAS</span><h3>Kad sākas Advente?</h3><p>Adventes svētdienas ir mainīgos datumos. 24 lodziņu kalendārs vienmēr sākas 1. decembrī.</p></a><a href="/pasakumi/ziemassvetku-tirdzins-riga/"><span>RĪGAS DOMA LAUKUMS</span><h3>Vakars tirdziņā</h3><p>Atrašanās vieta, apmeklējuma plānošana un izziņotie sezonas datumi.</p></a><a href="/svetki-un-tradicijas/ziemassvetki/"><span>24.–26. DECEMBRIS</span><h3>Ziemassvētki Latvijā</h3><p>Svētku dienas un datumi, lai ieplānotu laiku savējiem.</p></a></section>
    <dialog class="advent-dialog" data-advent-dialog aria-labelledby="advent-dialog-title"><button type="button" class="advent-dialog-close" data-advent-close aria-label="Aizvērt dienas kartīti">×</button><div data-advent-reveal></div><p class="advent-dialog-note" data-advent-dialog-note></p><button type="button" class="advent-dialog-done" data-advent-close>Atgriezties pie kalendāra</button></dialog>#{templates}
    </article>)
  end
  def notes(year=nil)
    {'heading'=>'24 mazi decembra atklājumi','paragraphs'=>["#{year ? year.to_s+'. gada kalendārā' : 'Šajā interaktīvajā kalendārā'} decembrī vari atvērt 24 lodziņus ar latviskām idejām."+' Digitālais Adventes kalendārs aicina decembrī atrast laiku maziem svētku darbiem. No 1. līdz 24. decembrim vari atvērt dienas ideju, bet agrāk atvērtie lodziņi paliek pieejami. Atzīmes glabājas tikai tavā pārlūkā. Kalendāra idejas saistītas ar dzīvi Latvijā, rokdarbiem, lasīšanu, maltītēm un kopā būšanu.',"#{year ? 'Izvēlēts '+year.to_s+'. gads.' : 'Gadu vari mainīt ar saitēm virs kalendāra.'}"+' Četru Adventes svētdienu datumi katru gadu mainās, savukārt šis kalendārs sākas 1. decembrī. Izvēlies sev piemērotas nodarbes un plāno tās mierīgā ritmā. Katrā lodziņā ir sava ideja un saite, kur turpināt svētku plānošanu.'],'sources'=>[],'related'=>[],'icon'=>'calendar'}
  end
end
