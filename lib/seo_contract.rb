# frozen_string_literal: true
require 'json'
require 'date'
require 'digest'
require 'uri'

module CalendarSeoContract
  ORIGIN = 'https://kalendars365.lv'
  COLLECTIONS = %w[year month_index week_index print_index print_month holiday_year holiday_month memorial_year lunar_year name_day_month blog_index].freeze
  INTENTS = {
    'year'=>'view-year', 'calendar_month'=>'view-month', 'month_index'=>'choose-month', 'print_index'=>'download-year', 'print_month'=>'download-month',
    'holiday_year'=>'find-holidays', 'holiday_month'=>'find-holidays', 'memorial_year'=>'find-commemorations', 'work_year'=>'calculate-workdays', 'work_month'=>'calculate-workdays',
    'name_calendar'=>'find-name-day', 'name_day_month'=>'find-name-day', 'lunar_month'=>'inspect-moon', 'lunar_year'=>'inspect-moon', 'sun_city'=>'calculate-sun-times', 'moon_city'=>'calculate-moon-times',
    'school_academic'=>'find-school-holidays', 'school_year_calendar'=>'find-school-holidays', 'iso_week'=>'plan-week', 'week_index'=>'choose-week', 'blog_article'=>'read-guide', 'blog_index'=>'choose-guide',
    'horoscope'=>'read-entertainment', 'garden'=>'plan-gardening', 'garden_month'=>'plan-gardening', 'occasion'=>'learn-tradition', 'latvia_cultural'=>'learn-tradition', 'long_weekends'=>'plan-leave'
  }.freeze
  ROUTE_INTENTS = {'/'=>'plan-day','/pdf-kalendari/'=>'download-calendar','/kalendars/'=>'choose-year','/varda-dienas/'=>'find-name-day','/skolas-brivlaiki/'=>'find-school-holidays','/studiju-kalendars/'=>'find-university-calendar','/datumu-kalkulators/'=>'calculate-date','/darba-dienu-kalendars/'=>'calculate-workdays','/izveidot-kalendaru/'=>'create-personal-calendar','/meklesana/'=>'search-site','/par-projektu/'=>'learn-project','/avoti-un-metodika/'=>'check-methodology','/kontakti/'=>'contact-project'}.freeze
  IMAGE_RIGHTS_PAGE = ORIGIN + '/pilsetas-un-fotografijas/#kopigosanas-vaki'
  # Reviewed identities from the source catalog and its original attribution
  # pages. A credit can contain an uploader, transfer history or an uncertain
  # photographer; do not turn arbitrary credit text into a Person.
  SOURCE_CREATORS = {
    'Diego Delso'=>['Person', 'Diego Delso'],
    'NASA · Apollo 17'=>['Organization', 'NASA'],
    'NASA/Apollo 17 crew; taken by either Harrison Schmitt or Ron Evans'=>['Organization', 'NASA'],
    'NASA/Bill Ingalls'=>['Person', 'Bill Ingalls'],
    'Saeima'=>['Organization', 'Saeima'],
    'Rīgas pašvaldības aģentūra “Rīgas investīciju un tūrisma aģentūra”'=>['Organization', 'Rīgas pašvaldības aģentūra “Rīgas investīciju un tūrisma aģentūra”']
  }.transform_values(&:freeze).freeze
  module_function
  def source_image_creator(source)
    identity=SOURCE_CREATORS[source.fetch('author')]
    {'@type'=>identity[0], 'name'=>identity[1]} if identity
  end
  def source_image_rights_notice(source)
    # Quote the documented credit and rights status, without adding a copyright
    # owner or a copyright symbol to public-domain, CC0 or NASA material.
    "Avota kredīts: #{source.fetch('author')}. Licences vai tiesību norāde: #{source.fetch('license')}."
  end
  def canonical_path(value)
    path=value.to_s
    raise "Invalid canonical path: #{path}" unless path.start_with?('/') && !path.start_with?('//') && !path.match?(/[?#\s\0]/) && !URI::DEFAULT_PARSER.unescape(path).split('/').include?('..')
    raise "Non-canonical index path: #{path}" if path.end_with?('/index.html')
    raise "Canonical needs a trailing slash: #{path}" unless path.end_with?('/') || path.end_with?('.html')
    path
  end
  def absolute(path)
    ORIGIN+canonical_path(path)
  end
  def full_title(value)
    text=value.to_s.strip.gsub(/\s+(?:-|—|–|·)\s+/,' | ')
    raise 'SEO title is empty' if text.empty?
    text.end_with?(' | Kalendārs365') ? text : text+' | Kalendārs365'
  end
  def date(value)
    raw=value.to_s
    raise "Invalid significant date: #{raw}" unless raw.match?(/\A\d{4}-\d{2}-\d{2}\z/)
    Date.iso8601(raw).iso8601
  end
  def revision_date(previous, source_hash, initial_date, observed_date)
    initial=date(initial_date);observed=date(observed_date)
    if previous['contentSha256']==source_hash
      date(previous.fetch('lastmod',initial))
    elsif previous['contentSha256'].nil?
      [previous['lastmod'],initial].compact.map { |value| date(value) }.max
    else
      observed
    end
  end
  def enrich(record)
    r=record.transform_keys(&:to_s)
    path=canonical_path(r.fetch('url'))
    family=r.fetch('family')
    r.merge('canonicalPath'=>path,'locale'=>'lv-LV','pageType'=>COLLECTIONS.include?(family) ? 'CollectionPage' : 'WebPage',
      'primaryIntent'=>ROUTE_INTENTS.fetch(path,INTENTS.fetch(family,'use-calendar-tool')),'significantModifiedAt'=>date(r.fetch('lastmod')))
  end
  def page_metadata(document, site, records)
    data=document.data; path=canonical_path(document.url)
    record=records[path]
    raise "Unregistered SEO page: #{path}" unless record || %w[/404.html /500.html].include?(path)
    record ||= {'family'=>data.fetch('family'),'pageType'=>'WebPage','primaryIntent'=>'recover-navigation','locale'=>'lv-LV','indexable'=>false}
    title=full_title(data.fetch('title'));description=data.fetch('description').to_s.strip
    raise "Missing description: #{path}" if description.empty?
    if record['title'] && record['title']!=data['title']
      raise "Route and page title disagree: #{path}"
    end
    cover=site.data.fetch('social-images').fetch('pages').fetch(path)
    image_path=cover.fetch('src'); image_file=File.join(site.source,image_path.delete_prefix('/'))
    raise "Missing social asset: #{path}" unless image_path.start_with?('/assets/') && File.file?(image_file)
    width=Integer(cover.fetch('width'));height=Integer(cover.fetch('height'));alt=cover.fetch('alt').to_s.strip
    raise "Invalid social image metadata: #{path}" unless width>0 && height>0 && !alt.empty?
    modified=record['significantModifiedAt'] || record['lastmod']
    modified=date(modified) if modified
    canonical=absolute(path);publisher=ORIGIN+'/#publisher';website=ORIGIN+'/#website';page_id=canonical+'#webpage';image_id=canonical+'#primaryimage'
    person={'@type'=>'Person','@id'=>publisher,'name'=>site.config.fetch('owner'),'url'=>ORIGIN+'/par-projektu/#silvis-balodis'}
    web={'@type'=>'WebSite','@id'=>website,'url'=>ORIGIN+'/','name'=>'Kalendārs365','alternateName'=>'Kalendars365','inLanguage'=>'lv-LV','publisher'=>{'@id'=>publisher}}
    image={'@type'=>'ImageObject','@id'=>image_id,'url'=>ORIGIN+image_path,'contentUrl'=>ORIGIN+image_path,'width'=>width,'height'=>height,'caption'=>alt,'inLanguage'=>'lv-LV',
      'creator'=>{'@type'=>'Organization','name'=>'Kalendārs365','url'=>ORIGIN+'/'},
      'creditText'=>'Kalendārs365 (kopīgošanas vāka makets)', 'copyrightNotice'=>'Kalendārs365 — kopīgošanas vāka makets.',
      'license'=>IMAGE_RIGHTS_PAGE, 'acquireLicensePage'=>IMAGE_RIGHTS_PAGE}
    page={'@type'=>record.fetch('pageType','WebPage'),'@id'=>page_id,'url'=>canonical,'name'=>data.fetch('title'),'description'=>description,'inLanguage'=>'lv-LV','isPartOf'=>{'@id'=>website},'primaryImageOfPage'=>{'@id'=>image_id},'publisher'=>{'@id'=>publisher}}
    page['dateModified']=modified if modified
    graph=[person,web,image,page]
    # The project creates the composition; the linked terms and separate source
    # objects retain the photographs' own authorship and individual rights.
    sources = cover.fetch('sources', [])
    unless sources.empty?
      image['creditText'] = 'Fotogrāfiju avoti: ' + sources.map { |source| source.fetch('author') }.uniq.join('; ')
      image['copyrightNotice'] += ' ' + sources.map { |source| source_image_rights_notice(source) }.uniq.join(' ')
      image['isBasedOn'] = sources.map do |source|
        src = source.fetch('src')
        raise "Invalid source image: #{src}" unless src.start_with?('/assets/') && !src.include?('..') && File.file?(File.join(site.source, src.delete_prefix('/')))
        original = source.fetch('sourceUrl')
        license = [source['licenseUrl'], source['rightsUrl']].find { |value| !value.to_s.strip.empty? }.to_s
        license = license.sub(%r{\Ahttp://creativecommons\.org/}, 'https://creativecommons.org/')
        # A source marked public domain keeps its documented rights statement;
        # do not silently assign CC0 or another license to that photograph.
        license = original if license.empty? && source['license'] == 'Public domain'
        raise "Missing photo attribution: #{src}" if source.fetch('author').to_s.strip.empty? || !license.to_s.start_with?('https://') || !original.start_with?('https://')
        id = ORIGIN + src + '#image'
        unless graph.any? { |node| node['@id'] == id }
          source_image={'@type'=>'ImageObject', '@id'=>id, 'url'=>ORIGIN+src, 'contentUrl'=>ORIGIN+src,
            'creditText'=>source.fetch('author'), 'license'=>license, 'isBasedOn'=>original,
            'acquireLicensePage'=>original, 'copyrightNotice'=>source_image_rights_notice(source)}
          creator=source_image_creator(source)
          source_image['creator']=creator if creator
          graph << source_image
        end
        {'@id'=>id}
      end.uniq
    end
    navigation=site.data.fetch('internal-navigation').fetch('pages').fetch(path)
    crumbs=navigation.fetch('breadcrumbs')
    if crumbs.length>1
      breadcrumb_id=canonical+'#breadcrumb'
      graph << {'@type'=>'BreadcrumbList','@id'=>breadcrumb_id,'itemListElement'=>crumbs.each_with_index.map{|c,i|
        target=canonical_path(c.fetch('url'))
        raise "Unknown breadcrumb target: #{target}" unless records.key?(target) || %w[/404.html /500.html].include?(target)
        {'@type'=>'ListItem','position'=>i+1,'name'=>c.fetch('title'),'item'=>absolute(target)}
      }}
      page['breadcrumb']={'@id'=>breadcrumb_id}
    end
    article=nil
    if data['family']=='blog_article'
      article=site.data.fetch('blog').fetch('posts').find{|post|post.fetch('slug')==data.fetch('blog_slug')}
      raise "Missing article source: #{path}" unless article
      article_id=canonical+'#article'; published=date(article.fetch('date'))
      raise "Article modified before publication: #{path}" if modified && modified<published
      graph << {'@type'=>'BlogPosting','@id'=>article_id,'url'=>canonical,'headline'=>data.fetch('title'),'description'=>description,'datePublished'=>published,'dateModified'=>modified || published,'inLanguage'=>'lv-LV','citation'=>article.fetch('sources').map { |source| source.fetch('url') },'wordCount'=>Integer(article.fetch('wordCount')),'mainEntityOfPage'=>{'@id'=>page_id},'image'=>{'@id'=>image_id},'author'=>{'@id'=>publisher},'publisher'=>{'@id'=>publisher}}
      page['mainEntity']={'@id'=>article_id}
    elsif data['family']=='blog_index'
      id=canonical+'#blog';graph << {'@type'=>'Blog','@id'=>id,'url'=>canonical,'name'=>'Kalendārs365 blogs','inLanguage'=>'lv-LV','author'=>{'@id'=>publisher},'publisher'=>{'@id'=>publisher}};page['mainEntity']={'@id'=>id}
    elsif path=='/par-projektu/'
      page['@type']='AboutPage';page['mainEntity']={'@id'=>publisher}
    elsif path=='/kontakti/'
      page['@type']='ContactPage'
    end
    revision=site.data.fetch('page-revisions',{}).fetch(path,{})
    source=revision['contentSha256'] || revision['sha256'] || Digest::SHA256.hexdigest(JSON.generate([data['title'],description,modified]))
    {'canonicalPath'=>path,'canonical'=>canonical,'locale'=>'lv-LV','pageType'=>page['@type'],'primaryIntent'=>record['primaryIntent'],'title'=>title,'description'=>description,'robots'=>data['noindex'] ? 'noindex,follow' : 'index,follow,max-image-preview:large','sourceVersion'=>source,'significantModifiedAt'=>modified,'assets'=>{'image'=>image_path,'width'=>width,'height'=>height,'alt'=>alt},'jsonld'=>JSON.generate({'@context'=>'https://schema.org','@graph'=>graph}).gsub('<','\\u003c'),'articlePublished'=>article && article['date']}
  end
end
