# Photograph provenance remains in the existing city source catalogue.
def city_photo_directory(kind='sun', title=nil, intro=nil)
  moon = kind == 'moon'
  prefix = moon ? '/meness-lekts-un-riets/' : '/saullekts-saulriets/'
  title ||= moon ? 'Mēness laiki Latvijas pilsētās' : 'Saules laiki Latvijas pilsētās'
  photos = JSON.parse(File.read('_data/city-thumbnails.json')).fetch('photos').to_h { |item| [item.fetch('id'), item] }
  cards = CITIES.map do |city|
    photo = photos.fetch(city.fetch('id'))
    image = photo.fetch('files').first
    srcset = photo.fetch('files').map { |file| "#{file.fetch('src')} #{file.fetch('width')}w" }.join(', ')
    %(<a class="city-photo-card" data-city-photo-card="#{h(city.fetch('id'))}" href="#{prefix}#{h(city.fetch('id'))}/"><span class="city-photo-frame"><img src="#{h(image.fetch('src'))}" srcset="#{h(srcset)}" sizes="72px" width="#{image.fetch('width')}" height="#{image.fetch('height')}" alt="#{h(photo.fetch('alt'))}" title="#{h(photo.fetch('author'))} · #{h(photo.fetch('license'))}" loading="lazy" decoding="async"><span class="city-photo-glint" aria-hidden="true"></span></span><span class="city-photo-copy"><strong translate="no" class="notranslate">#{h(city.fetch('name'))}</strong><span class="city-photo-prompt">#{moon ? 'Mēness lēkts un riets' : 'Saullēkts un saulriets'}</span><span class="city-photo-times" data-city-photo-times hidden><span data-city-photo-rise></span><span data-city-photo-set></span></span></span><svg class="city-photo-arrow" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="m7 5 5 5-5 5"/></svg></a>)
  end.join
  %(<section class="sun-city-options city-photo-directory"#{moon ? '' : ' id="sun-cities"'} data-city-photo-cards="#{h(kind)}"><div class="city-directory-heading"><div><span class="eyebrow">82 LATVIJAS PILSĒTAS</span><h2>#{h(title)}</h2><p data-city-photo-date>#{h(intro || 'Izvēlies pilsētu un apskati tās debess notikumu laikus.')}</p></div><a class="city-photo-credits" href="/pilsetas-un-fotografijas/#pilsetas-fotografijas">Foto avoti un licences <span aria-hidden="true">↗</span></a></div><div class="city-photo-grid">#{cards}</div><p class="city-photo-disclosure">Arhīva fotogrāfijas. Laiki aprēķināti pilsētu centriem un standarta horizontam.</p></section>)
end
