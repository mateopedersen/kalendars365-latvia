# frozen_string_literal: true
require 'json'
require 'date'
require 'set'
require_relative 'editorial_links'

# One editorial graph feeds HTML breadcrumbs, schema, contextual routes and
# related reading. It changes discovery, never route identities or calendar data.
class InternalNavigation
  SLUGS = %w[janvaris februaris marts aprilis maijs junijs julijs augusts septembris oktobris novembris decembris].freeze
  MONTHS = %w[Janvāris Februāris Marts Aprīlis Maijs Jūnijs Jūlijs Augusts Septembris Oktobris Novembris Decembris].freeze
  PERIODS = %w[year calendar_month month_index print_index print_month work_year work_month holiday_year holiday_month memorial_year long_weekends lunar_year lunar_month week_index iso_week].freeze
  ROOTS = %w[/kalendars/ /svetku-dienas/ /skolas-brivlaiki/ /varda-dienas/ /saullekts-saulriets/ /meness-kalendars/ /astronomiskais-kalendars/ /sejas-kalendars/ /horoskops/ /visi-riki/ /blogs/ /par-projektu/].freeze
  attr_reader :pages, :records

  def initialize(records:, notes:, blogs:, crops:, garden_actions:)
    @rules = JSON.parse(File.read('_data/link-architecture.json'))
    @records = records.to_h { |row| [row.fetch(:url), row.transform_keys(&:to_s)] }
    @notes, @blogs, @crops, @garden_actions = notes, blogs, crops, garden_actions
    @pages = {}
    validate_rules!
    @records.each_value { |row| @pages[row['url']] = build(row) }
    enrich_notes!
    validate!
  end

  def validate_rules!
    root_urls = @records.keys.select { |url| url != '/' && url.count('/') == 2 }
    missing = root_urls - @rules.fetch('parents').keys
    raise "Unassigned navigation roots: #{missing.join(', ')}" unless missing.empty?
    @rules.fetch('parents').each do |url, parent|
      raise "Unknown parent relationship: #{url} -> #{parent}" unless @records[url] && @records[parent]
    end
    @rules.fetch('related').each do |url, targets|
      raise "Unknown related source #{url}" unless @records[url]
      raise "Duplicate or self-related targets #{url}" unless targets.uniq == targets && !targets.include?(url)
      targets.each { |target| raise "Unknown related destination #{url} -> #{target}" unless @records[target] }
    end
    slugs = @blogs.map { |blog| blog.fetch('slug') }.sort
    raise 'Editorial blog relations must cover all articles' unless @rules.fetch('blog_related').keys.sort == slugs
    @rules.fetch('blog_related').each do |slug, targets|
      raise "Invalid blog relations for #{slug}" unless targets.uniq == targets && !targets.include?(slug) && (targets-slugs).empty?
    end
  end

  def indexable?(url); @records[url] && @records[url]['indexable']; end
  def clean_title(value); value.to_s.gsub(/\s+[—–-]\s+/, ': ').strip; end
  def label(url); @rules.fetch('labels')[url] || clean_title(@records.fetch(url).fetch('title')); end
  def parent(url)
    return nil if url == '/'
    explicit = @rules.fetch('parents')[url]
    return explicit if explicit
    @records.keys.select { |candidate| candidate != url && url.start_with?(candidate) }.max_by(&:length) || '/'
  end
  def ancestors(url)
    result, seen, current = [], Set.new, url
    while current
      raise "Breadcrumb cycle at #{current}" if seen.include?(current)
      seen.add(current); result.unshift(current); current = parent(current)
    end
    result
  end
  def links(urls, source, kind='related')
    urls.compact.uniq.reject { |url| url == source || !indexable?(url) }.map do |url|
      {'url'=>url, 'title'=>label(url), 'kind'=>kind}
    end
  end

  def period(row)
    parts = row['url'].split('/')
    [parts.find { |part| part.match?(/\A20\d{2}\z/) }.to_i, SLUGS.index(parts.last)&.+(1)]
  end
  def period_links(row)
    year, month = period(row)
    slug = month && SLUGS[month-1]
    calendar = "/kalendars/#{year}/#{slug}/".gsub('//','/')
    work = "/darba-dienu-kalendars/#{year}/#{slug}/".gsub('//','/')
    holidays = "/svetku-dienas/#{year}/#{slug}/".gsub('//','/')
    moon = "/meness-kalendars/#{year}/#{slug}/".gsub('//','/')
    print = "/pdf-kalendari/#{year}/#{slug}/".gsub('//','/')
    case row['family']
    when 'calendar_month' then [print, holidays, work, moon]
    when 'year' then [print, holidays, work, moon, "/nedelas-kalendars/#{year}/"]
    when 'month_index' then [calendar, print, "/nedelas-kalendars/#{year}/", work]
    when 'print_month','print_index' then [calendar, holidays, '/izveidot-kalendaru/', '/tukss-kalendars/']
    when 'lunar_month','lunar_year' then [calendar, '/meness-fazes/', '/meness-lekts-un-riets/', holidays]
    when 'work_month','work_year' then [calendar, holidays, '/darba-laika-kalendars/', '/atvalinajuma-planotajs/']
    when 'holiday_month','holiday_year' then [calendar, work, '/svetki-un-tradicijas/', "/atceres-dienas/#{year}/"]
    when 'memorial_year' then [holidays, calendar, '/nozimigas-dienas/', '/svetki-un-tradicijas/']
    when 'long_weekends' then ['/atvalinajuma-planotajs/', holidays, work, calendar]
    when 'week_index' then [calendar, "/menesa-kalendars/#{year}/", '/nedelu-numuri/', work]
    when 'iso_week'
      week = row['url'].split('/').last.to_i
      first = Date.commercial(year,week,1)
      months = (first..first+6).map { |day| "/kalendars/#{day.year}/#{SLUGS[day.month-1]}/" }.uniq
      months + ['/nedelu-numuri/', '/nedelas-kalendars/', '/gimenes-kalendars/']
    else []
    end
  end

  def related_urls(row)
    url, family = row.values_at('url','family')
    return @rules.fetch('related').fetch(url) if @rules.fetch('related').key?(url)
    return period_links(row) if PERIODS.include?(family)
    slug = url.split('/').last
    case family
    when 'latvia_special'
      raise "Unassigned special topic #{url}" unless url.start_with?('/atceres-dienas/') && SLUGS.include?(slug)
      (2027..2030).map { |year| "/kalendars/#{year}/#{slug}/" } + ['/atceres-dienas/', '/svetku-dienas/']
    when 'sun_city'
      ["/meness-lekts-un-riets/#{slug}/", '/dienas-garums/', '/saullekts-saulriets/', '/gadalaiki/']
    when 'moon_city'
      ["/saullekts-saulriets/#{slug}/", '/meness-kalendars/', '/meness-fazes/', '/meness-lekts-un-riets/']
    when 'horoscope'
      ['/horoskopa-zimes-kalkulators/', '/zodiaka-zimes/', '/horoskops/']
    when 'name_calendar'
      ['/varda-dienas/', '/izveidot-kalendaru/', '/dzimsanas-dienu-kalendars/', '/kalendars-ar-vardu/']
    when 'name_day_month'
      (2027..2030).map { |year| "/kalendars/#{year}/#{slug}/" } + ['/kalendars-ar-vardu/', '/varda-dienas/']
    when 'garden_month'
      month = SLUGS.index(slug)+1
      active = @crops.select { |crop| @garden_actions.call(crop).any? { |a| Array(a['months']).include?(month) && a['task'] != 'harvest' } }
      active.first(3).map { |crop| "/sejas-kalendars/#{crop['id']}/" } + ['/sejas-kalendars/', '/gadalaiki/', '/saullekts-saulriets/']
    when 'garden'
      crop = @crops.find { |c| c['id'] == slug }
      raise "Unassigned crop #{slug}" unless crop
      months = @garden_actions.call(crop).reject { |a| a['task']=='harvest' }.flat_map { |a| Array(a['months']) }.uniq.sort
      months.first(3).map { |month| "/sejas-kalendars/menesis/#{SLUGS[month-1]}/" } + ['/sejas-kalendars/', '/saullekts-saulriets/']
    when 'occasion','latvia_cultural'
      entry = JSON.parse(File.read('_data/tradition-links.json')).fetch('topics').fetch(slug)
      entry.fetch('tools').map { |tool| tool.fetch('url') } + ['/svetki-un-tradicijas/', '/svetku-dienas/']
    when 'school_academic','school_year_calendar'
      ['/skolas-brivlaiki/', '/skolas-kalendars/', '/stundu-saraksts/', '/gimenes-kalendars/']
    when 'blog_article'
      @blogs.find { |b| b['url'] == url }.fetch('related')
    when 'not_found','temporary_error'
      ['/kalendars/', '/svetku-dienas/', '/visi-riki/']
    else raise "Missing contextual navigation: #{url} (#{family})"
    end
  end

  def pagination(row)
    family, url = row.values_at('family','url')
    candidates = @records.values.select { |r| r['family'] == family && r['indexable'] }
    ordered = case family
    when 'calendar_month','print_month','lunar_month','work_month','holiday_month'
      candidates.sort_by { |r| period(r) }
    when 'year','month_index','print_index','lunar_year','work_year','holiday_year','memorial_year','week_index','long_weekends'
      candidates.sort_by { |r| period(r).first }
    when 'iso_week'
      candidates.sort_by { |r| [period(r).first,r['url'].split('/').last.to_i] }
    when 'name_day_month','garden_month'
      candidates.sort_by { |r| SLUGS.index(r['url'].split('/').last) }
    when 'latvia_special'
      url.start_with?('/atceres-dienas/') ? candidates.select { |r| r['url'].start_with?('/atceres-dienas/') }.sort_by { |r| SLUGS.index(r['url'].split('/').last) } : []
    else []
    end
    index = ordered.index { |r| r['url'] == url }
    return [] unless index
    result = []
    result << links([ordered[index-1]['url']],url,'previous').first if index > 0
    result << links([ordered[index+1]['url']],url,'next').first if index+1 < ordered.length
    result.compact
  end

  def reading_for(url)
    @blogs.select { |blog| blog.fetch('related').include?(url) }.first(2).map { |b| {'url'=>b['url'],'title'=>b['title'],'kind'=>'guide'} }
  end
  def heading(row)
    f = row['family']
    return 'Šī perioda kalendāri un plāni' if PERIODS.include?(f)
    return 'Vietējie Saules un Mēness laiki' if %w[sun_city moon_city].include?(f)
    return 'Turpini dārza plānu' if f.start_with?('garden') || row['url']=='/sejas-kalendars/'
    return 'Zodiaka zīmes un to aprēķini' if f=='horoscope' || row['url'].match?(/horoskop|zodiak/)
    return 'Rakstā minētie rīki' if f=='blog_article'
    return 'Datumi un saistītie plāni' if %w[occasion latvia_cultural].include?(f)
    'Saistītie kalendāri un skaidrojumi'
  end
  def discover(row)
    url = row['url']
    if url == '/varda-dienas/'
      return {'title'=>'Vārda dienas pa mēnešiem','links'=>SLUGS.each_with_index.map { |slug,index| {'url'=>"/varda-dienas/#{slug}/",'title'=>MONTHS[index],'kind'=>'month'} }}
    end
    group = @rules.fetch('discover')[url]
    return nil unless group
    {'title'=>group['title'],'links'=>links(group['urls'],url,'topic')}
  end
  def build(row)
    url = row['url']
    breadcrumbs = ancestors(url).map { |part| {'url'=>part,'title'=>label(part)} }
    {'parent'=>parent(url), 'breadcrumbs'=>breadcrumbs, 'heading'=>heading(row),
     'related'=>links(related_urls(row),url).first(6), 'pagination'=>pagination(row),
     'reading'=>reading_for(url), 'discover'=>discover(row),
     'blogRelated'=>row['family']=='blog_article' ? @rules['blog_related'].fetch(url.split('/').last) : [],
     'show'=>!%w[not_found temporary_error].include?(row['family'])}
  end

  def enrich_notes!
    EditorialLinks.new(records:@records,crops:@crops).enrich!(@notes)
  end
  def validate!
    @pages.each do |source, page|
      raise "Missing breadcrumb identity #{source}" unless page['breadcrumbs'].last['url']==source
      all = page['related']+page['pagination']+page['reading']+Array(page.dig('discover','links'))
      raise "No useful links for #{source}" if @records[source]['indexable'] && source!='/' && all.empty?
      all.each do |link|
        raise "Invalid content link #{source} -> #{link['url']}" unless indexable?(link['url']) && link['url']!=source && !link['title'].strip.empty?
      end
    end
  end
  def write
    File.write('_data/internal-navigation.json',JSON.pretty_generate({'version'=>1,'pages'=>@pages})+"\n")
    File.write('docs/INTERNAL_LINK_PLAN.json',JSON.pretty_generate({'rootHierarchy'=>@rules['parents'],'pages'=>@pages.transform_values { |v| v.reject { |k,_| k=='show' } }})+"\n")
  end
end
