# frozen_string_literal: true
require 'json'
require 'cgi'

module TrustPages
  DATA = JSON.parse(File.read(File.expand_path('../_data/trust-pages.json', __dir__))).freeze
  FAQ = JSON.parse(File.read(File.expand_path('../_data/site-faq.json', __dir__))).freeze
  STORAGE = JSON.parse(File.read(File.expand_path('../_data/privacy-storage.json', __dir__))).freeze
  PAGES = DATA.fetch('pages').freeze

  def trust_page?(url); PAGES.key?(url); end
  def trust_h(value); CGI.escapeHTML(value.to_s); end

  def trust_links(items, css='trust-links')
    items=Array(items).reject { |link| link.fetch('url').start_with?('/pilsetas-un-fotografijas/') }
    return '' if items.empty?
    %(<div class="#{css}">) + items.map do |link|
      external = link.fetch('url').start_with?('https://')
      attrs = external ? ' target="_blank" rel="noopener noreferrer"' : ''
      %(<a href="#{trust_h(link.fetch('url'))}"#{attrs}>#{trust_h(link.fetch('label'))}<span aria-hidden="true">#{external ? '↗' : '→'}</span></a>)
    end.join + '</div>'
  end

  def trust_navigation(url)
    %(<nav class="trust-directory" aria-label="Informācija par vietni">) + PAGES.map do |target, page|
      current = target==url ? ' aria-current="page"' : ''
      %(<a href="#{target}"#{current}><img src="/assets/trust/#{page.fetch('kind')}.svg" alt="" width="44" height="44" loading="lazy"><span>#{trust_h(page.fetch('label'))}</span><b aria-hidden="true">↗</b></a>)
    end.join + '</nav>'
  end

  def trust_table(columns, rows)
    '<div class="trust-table-scroll" role="region" aria-label="Informācijas tabula" tabindex="0"><table class="trust-table"><thead><tr>' +
      columns.map { |title| "<th scope=\"col\">#{trust_h(title)}</th>" }.join + '</tr></thead><tbody>' +
      rows.map { |row| '<tr>'+row.each_with_index.map { |cell, i| i.zero? ? "<th scope=\"row\">#{trust_h(cell)}</th>" : "<td>#{trust_h(cell)}</td>" }.join+'</tr>' }.join + '</tbody></table></div>'
  end

  def trust_storage_table
    rows=STORAGE.fetch('entries').map do |row|
      "<article class=\"trust-storage-row\"><div><h3>#{trust_h(row.fetch('title'))}</h3><span class=\"trust-chip\">#{trust_h(row.fetch('technology'))}</span></div><div><p>#{trust_h(row.fetch('purpose'))}</p><p class=\"trust-storage-duration\"><strong>Glabāšana:</strong> #{trust_h(row.fetch('duration'))}</p><details><summary>Tehniskie nosaukumi</summary><ul>#{row.fetch('keys').map{|key|"<li><code>#{trust_h(key)}</code></li>"}.join}</ul></details></div></article>"
    end.join
    '<div class="trust-storage-list">'+rows+'</div>'
  end

  def trust_actions(actions)
    labels={'consent'=>'Privātuma izvēles','backup'=>'Dublēt pamata kalendāru','settings'=>'Kalendāra iestatījumi'}
    '<div class="trust-actions">'+actions.map { |name| %(<button type="button" data-action="#{name}">#{trust_h(labels.fetch(name))}<span aria-hidden="true">↗</span></button>) }.join+'</div>'
  end

  def trust_faq_markup
    count=FAQ.fetch('groups').sum { |group| group.fetch('items').length }
    controls=%(<section class="trust-faq-search" aria-label="Meklēt jautājumu"><label for="trust-faq-query">Par ko vēlies uzzināt?</label><div><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg><input id="trust-faq-query" type="search" data-trust-query placeholder="Piemēram, drukāšana, dati vai pilsēta" autocomplete="off"><button type="button" data-trust-reset>Notīrīt</button></div><p role="status" aria-live="polite" data-trust-count>Jautājumi un atbildes: #{count}</p></section>)
    groups=FAQ.fetch('groups').map do |group|
      items=group.fetch('items').map do |item|
        %(<details class="trust-faq-item" data-trust-faq-item><summary>#{trust_h(item.fetch('question'))}<span aria-hidden="true">+</span></summary><div><p>#{trust_h(item.fetch('answer'))}</p>#{trust_links(item['links'])}</div></details>)
      end.join
      %(<section class="trust-section trust-faq-group" id="#{group.fetch('id')}" data-trust-faq-group><header><span class="trust-section-index" aria-hidden="true">#{format('%02d',FAQ.fetch('groups').index(group)+1)}</span><h2>#{trust_h(group.fetch('title'))}</h2></header>#{items}</section>)
    end.join
    empty=%(<section class="trust-empty" data-trust-empty hidden><h2>Šāds jautājums vēl nav atrasts.</h2><p>Pamēģini īsāku frāzi vai vienu tēmas vārdu. Ja atbildes nav, apraksti savu situāciju saziņas lapā.</p><a href="/kontakti/#zina">Uzdot savu jautājumu <span aria-hidden="true">→</span></a></section>)
    controls+groups+empty
  end

  def trust_section(section, i)
    body=Array(section['paragraphs']).map { |text| "<p>#{trust_h(text)}</p>" }.join
    body+='<ul class="trust-list">'+section['list'].map { |text| "<li>#{trust_h(text)}</li>" }.join+'</ul>' if section['list']
    body+='<ol class="trust-steps">'+section['steps'].map { |text| "<li>#{trust_h(text)}</li>" }.join+'</ol>' if section['steps']
    body+=trust_table(section['table'].fetch('columns'),section['table'].fetch('rows')) if section['table']
    body+=trust_storage_table if section['storageTable']
    body+=%(<a class="trust-email" href="mailto:kalendars365@gmail.com">kalendars365@gmail.com <span aria-hidden="true">↗</span></a>) if section['email']
    address=DATA['ownerAddress']
    body+="<p class=\"trust-owner-address\"><strong>Saziņas adrese:</strong> #{trust_h(address)}</p>" if address && %w[parzinis sazina atbildiba].include?(section['id'])
    body+=trust_actions(section['actions']) if section['actions']
    body+=trust_links(section['links'])
    %(<section class="trust-section" id="#{trust_h(section.fetch('id'))}" aria-labelledby="trust-#{trust_h(section.fetch('id'))}"><header><span class="trust-section-index" aria-hidden="true">#{format('%02d',i+1)}</span><h2 id="trust-#{trust_h(section.fetch('id'))}">#{trust_h(section.fetch('title'))}</h2></header>#{body}</section>)
  end

  def trust_sources(page)
    return '' if page.fetch('sources').empty?
    rows=page.fetch('sources').map do |id|
      source=DATA.fetch('sources').fetch(id)
      %(<li><a href="#{trust_h(source.fetch('url'))}" target="_blank" rel="noopener noreferrer">#{trust_h(source.fetch('title'))} <span aria-hidden="true">↗</span></a><span>#{trust_h(source.fetch('note'))}</span></li>)
    end.join
    %(<section class="trust-section trust-sources" id="avoti"><h2>Avoti un redakcijas datums</h2><p>Informācija pārskatīta #{trust_h(DATA.fetch('reviewedLabel').sub('novembris','novembrī'))}. Norādītas izmantotās pirmavotu publikācijas; tās neaizstāj konkrētās situācijas juridisku izvērtējumu.</p><ul>#{rows}</ul></section>)
  end

  def trust_page_markup(url)
    page=PAGES.fetch(url)
    return File.read(File.expand_path('../_includes/contact-page.html',__dir__)) if page.fetch('kind')=='contact'
    sections=page.fetch('kind')=='faq' ? FAQ.fetch('groups').map { |g| {'id'=>g.fetch('id'),'title'=>g.fetch('title')} } : page.fetch('sections')
    outline=sections.map { |section| %(<a href="##{section.fetch('id')}">#{trust_h(section.fetch('title'))}</a>) }.join
    outline+='<a href="#avoti">Avoti un redakcijas datums</a>' unless page.fetch('sources').empty?
    heading=if page.fetch('kind')=='about'
      File.read(File.expand_path('../_includes/owner-about.html',__dir__)).sub('</header>','</header>'+trust_navigation(url))
    else
      %(<nav class="breadcrumbs" aria-label="Atrašanās vieta">#{breadcrumb_markup(url,page.fetch('heading'))}</nav><header class="trust-hero"><div><span class="trust-eyebrow">#{trust_h(page.fetch('eyebrow'))}</span><h1>#{trust_h(page.fetch('heading'))}</h1><p>#{trust_h(page.fetch('intro'))}</p><div class="trust-facts">#{page.fetch('facts').map{|fact|"<span>#{trust_h(fact)}</span>"}.join}</div><p class="trust-reviewed"><span aria-hidden="true">✓</span> Pēdējā pārskatīšana: <time datetime="#{DATA.fetch('reviewedAt')}">#{trust_h(DATA.fetch('reviewedLabel'))}</time></p></div><figure aria-hidden="true"><img src="/assets/trust/#{page.fetch('kind')}.svg" alt="" width="320" height="260" fetchpriority="high"><figcaption>Kalendārs365 <span>Informācija, uz kuru paļauties.</span></figcaption></figure></header>)
    end
    body=page.fetch('kind')=='faq' ? trust_faq_markup : page.fetch('sections').each_with_index.map { |section,i| trust_section(section,i) }.join
    sidebar=%(<aside class="trust-sidebar"><div><p class="trust-eyebrow">ŠAJĀ LAPĀ</p><nav aria-label="Lapas sadaļas">#{outline}</nav><button type="button" data-trust-print>Drukāt šo lapu <span aria-hidden="true">↗</span></button></div><a class="trust-help-card" href="/kontakti/#zina"><strong>Neatradi atbildi?</strong><span>Apraksti savu jautājumu.</span><b aria-hidden="true">→</b></a></aside>)
    directory=page.fetch('kind')=='about' ? '' : trust_navigation(url)
    %(<div class="trust-page trust-page--#{page.fetch('kind')}" data-trust-page="#{page.fetch('kind')}">#{heading}#{directory}<div class="trust-layout">#{sidebar}<div class="trust-content">#{body}#{trust_sources(page)}<section class="trust-end-note"><h2>Skaidri jautājumi. Pārdomātas izvēles.</h2><p>Ja informācija nav saprotama vai pamani neprecizitāti, uzraksti vietnes uzturētājam. Norādi konkrēto lapu un vajadzīgo precizējumu.</p>#{trust_links([{'url'=>'/kontakti/','label'=>'Sazināties ar mums'},{'url'=>'/biezak-uzdotie-jautajumi/','label'=>'Jautājumi un atbildes'}].reject{|link|link['url']==url})}</section></div></div></div>)
  end
end
