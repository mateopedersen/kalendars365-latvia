# frozen_string_literal: true
require 'json'
require 'cgi'
require_relative 'guide_inline_links'
require_relative 'guide_ui'

# Payment periods come from the cited service, never from a fabricated common payday.
module BenefitGuides
  DATA = JSON.parse(File.read(File.expand_path('../_data/benefit-guides.json', __dir__)))
  GUIDES = DATA.fetch('guides')
  module_function
  def h(value); CGI.escapeHTML(value.to_s); end
  def find(url); GUIDES.find { |g| g.fetch('url') == url }; end
  def card(g)
    %(<a class="benefit-card" href="#{g.fetch('url')}"><span class="benefit-card-top"><span class="benefit-icon" aria-hidden="true">#{symbol(g.fetch('slug'))}</span><small>#{h(g.fetch('rhythm'))}</small></span><h3>#{h(g.fetch('short'))}</h3><p>#{h(g.fetch('intro'))}</p><span class="benefit-card-link">Apmērs un pieteikšanās #{GuideUI.icon('arrow')}</span></a>)
  end
  def symbol(slug)
    paths = case slug
    when 'gimenes-valsts-pabalsts' then '<circle cx="9" cy="8" r="3"/><circle cx="21" cy="8" r="3"/><path d="M3 25v-4a6 6 0 0 1 12 0v4m0-4a6 6 0 0 1 12 0v4"/>'
    when 'berna-kopsanas-pabalsts' then '<path d="M4 14h22a11 11 0 0 1-22 0Zm11-11v11H4A11 11 0 0 1 15 3Z"/><circle cx="8" cy="28" r="2"/><circle cx="22" cy="28" r="2"/>'
    when 'berna-piedzimsanas-pabalsts' then '<path d="M4 13h22v5H4zm3 5v11h16V18M15 13v16"/><path d="M15 13C4 13 7 2 12 6l3 7Zm0 0c11 0 8-11 3-7l-3 7Z"/>'
    when 'vecaku-pabalsts' then '<rect x="4" y="6" width="22" height="23" rx="3"/><path d="M9 3v6m12-6v6M4 13h22m-15 7 3 3 6-6"/>'
    when 'bezdarbnieka-pabalsts' then '<rect x="3" y="10" width="24" height="18" rx="3"/><path d="M10 10V5h10v5M3 17h24m-14-2v5h4v-5"/>'
    when 'slimibas-pabalsts' then '<rect x="6" y="3" width="20" height="27" rx="3"/><path d="M12 10h8m-4-4v8m-5 7h10m-10 4h7"/>'
    when 'majokla-pabalsts' then '<path d="m2 15 13-11 13 11M6 12v16h18V12M12 28V18h6v10"/>'
    else '<path d="M4 7h22v20H4zM9 3v7m12-7v7M4 13h22m-16 6h3m4 0h3m-10 5h3m4 0h3"/>'
    end
    %(<svg viewBox="0 0 32 32" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">#{paths}</svg>)
  end
  def hero(title, intro, g=nil)
    symbol_html=g ? symbol(g.fetch('slug')) : GuideUI.icon('document')
    visual=%(<aside class="benefit-ledger" aria-label="Īss pārskats"><div class="benefit-visual-label"><span>ATBALSTA CEĻVEDIS</span><span>LATVIJA</span></div><div class="benefit-document"><div class="benefit-document-head"><span class="benefit-emblem">#{symbol_html}</span><span>#{g ? h(g.fetch('short')) : 'Sociālais atbalsts'}<small>Nosacījumi un pieteikšanās</small></span></div><div class="benefit-document-value"><strong>#{g ? h(g.fetch('metric')) : 'Tavs lēmums'}</strong><span>#{g ? h(g.fetch('metricLabel')) : 'Tavs datums. Skaidrs periods.'}</span></div><div class="benefit-document-rule"></div><div class="benefit-document-foot">#{GuideUI.icon('document')}<span>#{g ? h(g.fetch('rhythm')) : 'Sāc ar sava atbalsta veidu'}</span></div></div><div class="benefit-process"><span><b>01</b>Iesniegums</span><i></i><span><b>02</b>Lēmums</span><i></i><span><b>03</b>Izmaksa</span></div><p class="benefit-visual-note">Precīzo piešķīrumu un izmaksas dienu skati savā lēmumā.</p></aside>)
    %(<header class="benefit-hero"><div><span class="benefit-kicker"><span class="guide-category-symbol">#{GuideUI.icon('shield')}</span>LATVIJA · SOCIĀLAIS ATBALSTS</span><h1>#{h(title)}</h1><p>#{h(intro)}</p><nav class="benefit-actions" aria-label="Galvenās darbības"><a class="benefit-button" href="#{g ? '#ka-pieteikties' : '#atbalsta-veidi'}">#{g ? 'Kā pieteikties' : 'Atrast savu atbalsta veidu'} #{GuideUI.icon('arrow')}</a><a href="#{g ? '#iss-parskats' : '#mans-atgadinajums'}">#{g ? 'Summas un nosacījumi' : 'Izveidot atgādinājumu'} #{GuideUI.icon('down')}</a></nav></div>#{visual}</header>)
  end
  def hub
    groups=GUIDES.group_by { |g| g.fetch('group') }
    %(<div class="benefit-guide benefit-hub">#{hero('Pabalsti un sociālās izmaksas Latvijā','Atrodi, kur pieteikties, kā saprast piešķirto summu un par kuru mēnesi tiek veikta izmaksa. VSAA pabalsti un pašvaldības palīdzība vienā pārskatā.')}<section class="benefit-hub-intro" id="atbalsta-veidi"><span class="benefit-kicker">SĀC AR SAVU SITUĀCIJU</span><h2>Kurš atbalsts tevi interesē?</h2><p>Bērna piedzimšana, darba zaudējums vai apkures rēķins ved uz atšķirīgiem pakalpojumiem. Izvēlies savu tēmu, lai sagatavotu vajadzīgo pieteikumu.</p></section>#{groups.map { |name,rows| %(<section class="benefit-group"><h2>#{h(name)}</h2><div class="benefit-grid">#{rows.map { |g| card(g) }.join}</div></section>) }.join}<section class="benefit-period-note"><span class="benefit-kicker">DIVI DATUMI, KO NEJAUKT</span><h2>Izmaksas diena un apmaksātais periods</h2><div class="benefit-period-grid"><div><h3>Par kārtējo mēnesi</h3><p>Ģimenes valsts pabalsts attiecas uz to pašu mēnesi, kurā to maksā. Regulāro dienu skaties savā lēmumā.</p></div><div><h3>Par iepriekšējo mēnesi</h3><p>Bērna kopšanas, vecāku un bezdarbnieka pabalsta maksājumā var būt iepriekšējā mēneša periods. Pirmais maksājums var aptvert tikai daļu mēneša.</p></div><div><h3>Pēc piešķiršanas</h3><p>Dzimšanas vienreizējais pabalsts un slimības lapas apmaksa nav vienots ikmēneša kalendārs. Pārbaudi pieteikumu un saņemto lēmumu.</p></div></div><p><a href="https://www.vsaa.gov.lv/lv/media/7703/download?attachment=">VSAA skaidrojums par vecāku pabalstu izmaksām</a> · <a href="https://www.vsaa.gov.lv/lv/par-pabalstiem-un-atlidzibam">Jautājumi par pabalstiem</a></p></section><section class="benefit-pension-link"><div><span class="benefit-kicker">PENSIJAS</span><h2>Meklē pensijas izmaksas datumu?</h2><p>Pensiju lēmumi un indeksācija apskatīti atsevišķi. Pabalstu apmērus neizmanto pensijas aprēķinam.</p></div><a class="benefit-button" href="/pensiju-izmaksas/">Pensiju pārskats</a></section></div>)
  end
  def comparison(g)
    t=g.fetch('table');e=g.fetch('example')
    %(<section class="benefit-comparison" id="iss-parskats"><div class="benefit-section-heading"><span class="benefit-kicker">SVARĪGAIS VIENĀ VIETĀ</span><h2>#{h(t.fetch('title'))}</h2></div><div class="benefit-table-scroll" role="region" tabindex="0" aria-label="#{h(t.fetch('title'))}"><table><caption>#{h(t.fetch('caption'))}</caption><thead><tr>#{t.fetch('headers').map{|s|"<th scope=\"col\">#{h(s)}</th>"}.join}</tr></thead><tbody>#{t.fetch('rows').map{|row|'<tr>'+row.each_with_index.map{|s,i|i==0 ? "<th scope=\"row\">#{h(s)}</th>" : "<td>#{h(s)}</td>"}.join+'</tr>'}.join}</tbody></table></div></section><section class="benefit-example"><div><span class="benefit-kicker">#{h(e.fetch('label'))}</span><h2>#{h(e.fetch('title'))}</h2><p>#{h(e.fetch('text'))}</p></div><div class="benefit-example-values">#{e.fetch('values').map{|a,b|%(<div><strong>#{h(a)}</strong><span>#{h(b)}</span></div>)}.join}</div></section>)
  end
  def preparation(g)
    %(<section class="benefit-documents"><span class="benefit-kicker">PIE ROKAS PIRMS SAZIŅAS</span><h2>Ko sagatavot pārbaudei?</h2><ul>#{g.fetch('documents').map{|d|"<li>#{h(d)}</li>"}.join}</ul><p>Šis saraksts palīdz sakārtot informāciju. Iestāde var prasīt arī citus dokumentus atkarībā no tavas situācijas.</p></section>)
  end
  def page(g)
    chapters=g.fetch('sections').each_with_index.map { |s,i| %(<section class="benefit-chapter"><span class="benefit-number" aria-hidden="true">#{format('%02d',i+1)}</span><div><h2>#{h(s.fetch('title'))}</h2><p>#{GuideInlineLinks.render(s.fetch('text'),g.fetch('url'),i)}</p></div></section>) }.join
    %(<article class="benefit-guide" data-benefit-guide="#{g.fetch('slug')}">#{hero(g.fetch('title'),g.fetch('intro'),g)}<nav class="benefit-subnav" aria-label="Ceļveža sadaļas"><a href="#iss-parskats">Īss pārskats</a><a href="#skaidrojums">Skaidrojums</a><a href="#ka-pieteikties">Pieteikšanās</a></nav>#{comparison(g)}<div class="benefit-content" id="skaidrojums"><div>#{chapters}<section class="benefit-faq"><h2>Bieži jautājumi</h2>#{g.fetch('faq').map { |f| %(<details><summary>#{h(f.fetch('question'))}</summary><p>#{h(f.fetch('answer'))}</p></details>) }.join}</section></div><aside class="benefit-checklist" id="ka-pieteikties"><span class="benefit-kicker">NĀKAMAIS SOLIS</span><h2>Sagatavojies pieteikumam</h2><ol>#{g.fetch('steps').map { |step| "<li>#{h(step)}</li>" }.join}</ol><a class="benefit-button" href="#{h(g.fetch('sources').first.fetch('url'))}">Atvērt oficiālo pakalpojumu #{GuideUI.icon('external')}</a><p>Personas datus iesniedz iestādes oficiālajā pakalpojumā. Šī vietne neapstrādā pabalstu pieteikumus.</p><a href="/pabalstu-izmaksas/#mans-atgadinajums">Atgādinājums pēc sava lēmuma</a></aside></div>#{preparation(g)}</article>)
  end
  def pension_note
    %(<section class="benefit-period-note"><span class="benefit-kicker">2026. GADA 1. OKTOBRIS</span><h2>Pensiju indeksācija nav jauns izmaksas grafiks</h2><p>VSAA 2026. gada 1. oktobrī indeksēja līdz 30. septembrim piešķirtās vai pārrēķinātās pensijas un atlīdzības. Indeksācija notiek automātiski; tā pati par sevi nenosaka visiem saņēmējiem kopīgu mēneša izmaksas dienu.</p><p>Pārbaudi jaunās summas skaidrojumu un savu lēmumu. Papildu palīdzību mājokļa rēķiniem izvērtē pašvaldība, nevis pievieno pensijai automātiski.</p><div class="benefit-actions"><a href="https://www.vsaa.gov.lv/lv/jaunums/pensiju-un-atlidzibu-indeksacija-no-1-oktobra-1">VSAA 2026. gada indeksācijas paziņojums#{GuideUI.icon('external')}</a><a href="/pabalstu-izmaksas/majokla-pabalsts/">Mājokļa atbalsta ceļvedis</a></div></section>)
  end
  def notes(url)
    g=find(url)
    {'heading'=>'Pabalsta pieprasīšanas un izmaksas skaidrojums','paragraphs'=>[g.fetch('intro')+' '+g.fetch('sections').first.fetch('text'),g.fetch('sections').last.fetch('text')],'icon'=>g.fetch('icon'),'sources'=>g.fetch('sources'),'related'=>g.fetch('related').map { |slug| row=GUIDES.find { |x| x['slug']==slug }; {'url'=>row.fetch('url'),'title'=>row.fetch('short')} }}
  end
end
