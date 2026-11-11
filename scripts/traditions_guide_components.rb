# The directory is readable immediately; only its small filter model reaches JS.
def tradition_photo_catalog
  @tradition_photo_catalog ||= JSON.parse(File.read('_data/tradition-photos.json')).fetch('photos').to_h { |p| [p.fetch('slug'),p] }
end

def tradition_cover(photo)
  @tradition_covers ||= JSON.parse(File.read('_data/tradition-covers.json'))
  photo.merge(@tradition_covers.fetch(photo.fetch('id')))
end

def tradition_card_photo(photo)
  tradition_cover(photo).slice('id','src','srcset','width','height','alt','caption')
end

def tradition_photo_for(slug)
  TRADITION_LINKING.topic(slug).fetch('photo')
end

def category_tradition_articles
  articles=OCCASIONS.select{|item|item['verified']}.map do |item|
    item.slice('slug','title','description','intro','dates','type','dayOff','dateRule').merge(
      'photo'=>tradition_card_photo(tradition_photo_for(item.fetch('slug'))),
      'url'=>"/svetki-un-tradicijas/#{item['slug']}/",
      'sourceUrls'=>TRADITION_LINKING.sources(item['slug']).map{|s|s['url']})
  end
  articles+LATVIA_EXTRA.fetch('culturalPages').map do |item|
    slug=item.fetch('url').split('/').last
    {'title'=>item['h1'],'description'=>item['description'],'intro'=>item['intro'],
     'dateModel'=>item['dateModel'],'photo'=>tradition_card_photo(tradition_photo_catalog.fetch(slug)),
     'dates'=>(2027..2030).flat_map{|year|cultural_calendar_dates(item,year)},
     'type'=>'culture','dayOff'=>false,'url'=>item['url'],
     'sourceUrls'=>TRADITION_LINKING.sources(slug).map{|s|s['url']}}
  end
end

def traditions_guide_markup(body)
  articles=category_tradition_articles
  cards,error,status=Open3.capture3(ENV.fetch('NODE_BIN','node'),File.join(ROOT,'scripts/render_traditions_guide.mjs'),stdin_data:JSON.generate(articles))
  raise "Traditions directory render failed: #{error}" unless status.success?
  model=articles.map{|item|item.slice('url','title','description','type','dayOff','dates')}
  json=JSON.generate(model).gsub('<','\\u003c')
  body.sub('data-traditions-explorer','data-traditions-explorer data-traditions-guide')
      .sub('<p role="status" data-discovery-count></p>','<p role="status" data-discovery-count>Tēmu skaits: 73 · 2027. gads.</p>')
      .sub('<div class="tradition-story-grid" data-traditions-results></div>',
           %(<div class="tradition-story-grid" data-traditions-results>#{cards}</div><p class="traditions-empty" data-traditions-empty hidden>Neatradām nevienu tēmu. Izmēģini citu nosaukumu vai noņem kādu filtru.</p><script type="application/json" data-traditions-guide-data>#{json}</script>))
end

def tradition_topic_photo_markup(slug,hero=false)
  photo=tradition_cover(tradition_photo_for(slug))
  priority=hero ? 'loading="eager" fetchpriority="high"' : 'loading="lazy"'
  %(<figure class="tradition-topic-photo" data-tradition-photo="#{h(slug)}"><img src="#{h(photo.fetch('src'))}" srcset="#{h(photo.fetch('srcset'))}" sizes="(max-width: 900px) calc(100vw - 48px), 680px" width="#{photo.fetch('width')}" height="#{photo.fetch('height')}" alt="#{h(photo.fetch('alt'))}" #{priority} decoding="async"><figcaption>#{h(photo.fetch('caption'))}<span>#{h(photo.fetch('author'))} · #{a(photo.fetch('licenseUrl'),photo.fetch('license'))} · #{a('/pilsetas-un-fotografijas/#occasion-photo-'+photo.fetch('id'),'Foto avots un pielāgojumi')}</span></figcaption></figure>)
end

def tradition_photo_heading_markup(heading,description,slug)
  topic=TRADITION_LINKING.topic(slug)
  has_dates=topic.fetch('dates',[]).any? || (topic['dateModel'] && (2027..2030).any?{|year|cultural_calendar_dates(topic,year).any?})
  date_action=has_dates ? 'Skatīt datumus' : 'Datuma skaidrojums'
  status=if topic['dayOff'];'Svētku brīvdiena'
         elsif topic['type']=='commemoration';'Atceres diena'
         elsif topic['type']=='astronomy' || topic.dig('dateModel','type')=='astronomical';'Astronomisks notikums'
         elsif topic['type']=='culture';'Kultūra un tradīcijas'
         else 'Atzīmējamā diena';end
  %(<header class="page-heading tradition-photo-hero" data-tradition-hero="#{h(slug)}" data-long-title="#{heading.length>80}"><div class="tradition-hero-copy"><span class="eyebrow">LATVIJA · KALENDĀRS365</span><span class="tradition-hero-status">#{h(status)}</span><h1>#{h(heading)}</h1><p class="tradition-hero-description">#{h(description)}</p><div class="tradition-hero-actions">#{a('#datumi',date_action,'button primary')}#{a('/svetki-un-tradicijas/','Visi svētki un tradīcijas →')}</div></div>#{tradition_topic_photo_markup(slug,true)}</header>)
end
