# One reviewed catalogue supplies the directory, shared tool search and artwork labels.
TOOLS_DIRECTORY = JSON.parse(File.read(File.join(__dir__,'../_data/tools-directory.json'))).freeze
TOOLS_DIRECTORY_GROUPS = {'calendar'=>'Kalendāri','personal'=>'Personīgie plāni','work'=>'Darbs un aprēķini','school'=>'Mācības','nature'=>'Saule, Mēness un daba'}.freeze

def tool_directory_catalog
 TOOLS_DIRECTORY
end

def tools_directory_art(item,klass='',lazy=true)
 %(<img class="#{klass}" src="/assets/tools-art/#{h(item.fetch('art'))}.svg?v={{ site.data.build.asset_version }}" width="320" height="280" alt="" decoding="async"#{lazy ? ' loading="lazy"' : ''}>)
end

def tools_directory_card(item)
 title=h(item.fetch('title'));url=h(item.fetch('url'));kind=item.fetch('kind');group=TOOLS_DIRECTORY_GROUPS.fetch(kind)
 %(<article class="directory-tool" data-directory-tool data-kind="#{kind}" data-tool-url="#{url}" data-tool-search="#{h([item['title'],item['description'],group,item['keywords']].compact.join(' '))}"><div class="directory-tool-top">#{tools_directory_art(item,'directory-tool-art')}<button class="directory-save" type="button" data-tool-save="#{url}" aria-label="Saglabāt: #{title}" aria-pressed="false" hidden><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5h10a1 1 0 0 1 1 1V21l-6-4-6 4V5.5a1 1 0 0 1 1-1Z"/></svg></button></div><div class="directory-tool-copy"><span class="directory-tool-group">#{h(group)}</span><h3><a href="#{url}">#{title}</a></h3><p>#{h(item.fetch('description'))}</p></div><a class="directory-tool-open" href="#{url}" aria-label="Atvērt rīku: #{title}">Atvērt rīku<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg></a></article>)
end

def tools_directory_markup
 options=TOOLS_DIRECTORY_GROUPS.map{|kind,title|%(<option value="#{kind}">#{h(title)}</option>)}.join
 %(<section id="category-workspace" class="tools-directory" data-tools-explorer aria-labelledby="directory-heading"><div class="directory-heading"><div><span class="eyebrow">RĪKI PĒC UZDEVUMA</span><h2 id="directory-heading">Atrodi vajadzīgo rīku</h2><p>Ieraksti nosaukumu vai izvēlies tēmu. Ar grāmatzīmi atzīmē rīkus, kurus vēlies ātri atrast arī nākamreiz.</p></div><span class="directory-account-note"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10V7a5 5 0 0 1 10 0v3M5 10h14v11H5zM12 14v3"/></svg>Bez reģistrācijas</span></div><form class="directory-filter" role="search" aria-label="Rīku meklēšana" hidden><label class="directory-query"><span>Meklēt rīku</span><span class="directory-input-wrap"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/></svg><input type="search" name="q" autocomplete="off" placeholder="Kalendārs, Mēness…"></span></label><label class="directory-kind"><span>Tēma</span><select name="kind"><option value="all">Visi rīki</option>#{options}</select></label><label class="directory-saved"><input type="checkbox" name="saved"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4h10v16l-5-3-5 3Z"/></svg><span>Saglabātie rīki</span></label></form><div class="directory-result-bar"><p role="status" aria-live="polite" aria-atomic="true" data-discovery-count>Pieejami #{TOOLS_DIRECTORY.length} rīki.</p><button type="button" class="directory-clear" data-directory-clear hidden>Notīrīt filtrus <span aria-hidden="true">×</span></button></div><div class="directory-tools-grid" data-tools-results>#{TOOLS_DIRECTORY.map{|item|tools_directory_card(item)}.join}</div><div class="directory-empty" data-directory-empty hidden><svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="21" cy="21" r="13"/><path d="m31 31 11 11M16 21h10"/></svg><h3 data-directory-empty-title>Neviens rīks neatbilst meklējumam.</h3><p data-directory-empty-copy>Pārbaudi nosaukumu, izmēģini īsāku vārdu vai noņem kādu filtru.</p><button type="button" data-directory-reset>Parādīt visus rīkus</button></div><p class="directory-storage-note" data-directory-storage hidden></p></section>)
end

def tools_directory_scene
 links=[['calendar','year','Kalendāri'],['personal','family','Personīgie plāni'],['work','calculator','Darbs un aprēķini'],['school','study','Mācības'],['nature','astronomy','Saule un daba']]
 %(<nav class="directory-hero-groups" aria-label="Rīku grupas">#{links.map{|kind,art,label|item=TOOLS_DIRECTORY.find{|row|row['art']==art};%(<a class="directory-hero-group directory-hero-group--#{kind}" href="?kind=#{kind}#category-workspace" data-directory-kind="#{kind}">#{tools_directory_art(item,'',false)}<span>#{h(label)}</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg></a>)}.join}</nav>)
end
