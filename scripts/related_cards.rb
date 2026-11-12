# frozen_string_literal: true
require 'json'
require 'digest'

# A single target catalogue supplies all recommendation cards. Titles and dates
# come from registered routes; artwork stays bound to accepted page-cover bytes.
class CalendarRelatedCards
  MONTHS = %w[Janvāris Februāris Marts Aprīlis Maijs Jūnijs Jūlijs Augusts Septembris Oktobris Novembris Decembris].freeze
  GEN = %w[janvāra februāra marta aprīļa maija jūnija jūlija augusta septembra oktobra novembra decembra].freeze
  SLUGS = %w[janvaris februaris marts aprilis maijs junijs julijs augusts septembris oktobris novembris decembris].freeze
  INFORMATION = %w[/par-projektu/ /avoti-un-metodika/ /pilsetas-un-fotografijas/ /privatuma-politika/ /sikdatnu-politika/ /pieklustamiba/ /kontakti/ /biezak-uzdotie-jautajumi/ /lietošanas-noteikumi/ /redakcijas-politika/ /labojumi/].freeze
  TYPE = {
    'calendar'=>['Kalendārs','Atvērt kalendāru'], 'print'=>['Drukai','Izvēlēties veidni'],
    'work'=>['Darba laiks','Skatīt darba dienas'], 'dates'=>['Svarīgi datumi','Apskatīt datumus'],
    'sky'=>['Saule un Mēness','Apskatīt pārskatu'], 'city'=>['Vietējie laiki','Apskatīt laikus'],
    'garden'=>['Dārzam','Plānot dārza darbus'], 'zodiac'=>['Zodiaks','Iepazīt zodiaku'],
    'school'=>['Mācībām','Skatīt mācību plānu'], 'guide'=>['Praktisks ceļvedis','Lasīt rakstu'],
    'information'=>['Par vietni','Lasīt vairāk'], 'tool'=>['Ikdienas rīks','Atvērt rīku']
  }.freeze
  def initialize(records:, plans:)
    @records, @plans = records, plans
    @covers = JSON.parse(File.read('_data/social-images.json')).fetch('pages')
    @previews = JSON.parse(File.read('_data/related-previews.json')).fetch('pages')
    @cities = JSON.parse(File.read('_data/cities.json')).fetch('cities').to_h { |city| [city.fetch('id'),city] }
    @blogs = JSON.parse(File.read('_data/blog.json')).fetch('posts').to_h { |post| [post.fetch('url'),post] }
  end
  def type(row)
    url,f=row.values_at('url','family')
    return 'information' if INFORMATION.include?(url)
    return 'guide' if f.start_with?('blog_')
    return 'city' if %w[sun_city moon_city sky_hub].include?(f)
    return 'print' if f.start_with?('print_') || url=='/pdf-kalendari/'
    return 'calendar' if %w[year calendar_month month_index week_index iso_week name_calendar].include?(f) || %w[/kalendars/ /menesa-kalendars/ /nedelas-kalendars/ /tukss-kalendars/ /kalendars-ar-vardu/].include?(url)
    return 'work' if f.start_with?('work_') || url.start_with?('/darba-')
    return 'dates' if %w[holiday_year holiday_month memorial_year occasion latvia_cultural name_day_month long_weekends].include?(f) || %w[/svetku-dienas/ /atceres-dienas/ /varda-dienas/ /garas-brivdienas/].include?(url)
    return 'garden' if f.start_with?('garden')
    return 'zodiac' if f=='horoscope' || url.match?(/horoskop|zodiak/)
    return 'school' if f.start_with?('school_') || %w[/skolas-brivlaiki/ /studiju-kalendars/ /stundu-saraksts/].include?(url)
    return 'sky' if f.start_with?('lunar_') || url.match?(/meness|saullekts|saulriets|astronom|gadalaiki|pilnmeness|jaunmeness/)
    'tool'
  end
  def period(row)
    parts=row.fetch('url').split('/')
    [parts.find { |part| part.match?(/\A20\d{2}\z/) }&.to_i, SLUGS.index(parts.last)]
  end
  def scope(row)
    year,month=period(row)
    return "#{year} · #{row['url'].split('/').last.to_i}. nedēļa" if row['family']=='iso_week'
    return [year,month && MONTHS[month]].compact.join(' · ') if year || month
    city=@cities[row['url'].split('/').last]
    return city.fetch('name') if %w[sun_city moon_city].include?(row['family']) && city
    return @blogs[row['url']].fetch('category') if @blogs[row['url']]
    nil
  end
  def description(row)
    year,month=period(row)
    label=year && "#{year}. gada#{month ? ' '+GEN[month] : ''}"
    case row['family']
    when 'calendar_month' then "#{label.capitalize} datumi, nedēļas un vieta taviem notikumiem."
    when 'year' then "Visi #{year}. gada mēneši, svētki un ISO nedēļu numuri vienā pārskatā."
    when 'print_month','print_index' then "Izvēlies #{label} kalendāru drukāšanai PDF vai attēla formātā."
    when 'work_month','work_year' then "#{label.capitalize} darba dienu un brīvdienu pārskats ar aprēķina pieņēmumiem."
    when 'holiday_month','holiday_year' then "Apskati #{label} svētku datumus un ieplāno brīvo laiku."
    when 'memorial_year' then "#{year}. gada atceres un atzīmējamās dienas, nošķirtas no svētku brīvdienām."
    when 'lunar_month' then "Mēness apgaismojums katrai dienai un četras #{label} drukas veidnes."
    when 'lunar_year' then "#{year}. gada Mēness pārskats, precīzie fāžu brīži un mēnešu izvēle."
    when 'sun_city','moon_city'
      city=@cities.fetch(row['url'].split('/').last)
      row['family']=='sun_city' ? "Saullēkts, saulriets un dienas garums #{city.fetch('locative')} pēc izvēlētā datuma." : "Mēness lēkts, riets un redzamības laiki #{city.fetch('locative')}."
    else row.fetch('description', row.fetch('title'))
    end
  end
  def image(url)
    cover=@covers.fetch(url);preview=@previews.fetch(url)
    raise "Stale related preview #{url}" unless preview.fetch('source')==cover.fetch('src') && preview.fetch('sourceSha256')==cover.fetch('sha256')
    files=preview.fetch('files')
    files.each { |row| raise "Missing related preview #{row['src']}" unless File.file?(row.fetch('src').delete_prefix('/')) }
    files.first.slice('src','width','height').merge('srcset'=>files.map { |row| "#{row.fetch('src')} #{row.fetch('width')}w" }.join(', '))
  end
  def write
    cards=@records.to_h do |url,row|
      kind=type(row);kicker,cta=TYPE.fetch(kind)
      cta='Izvēlēties rīku' if url=='/visi-riki/'
      cta='Lasīt rakstus' if row['family']=='blog_index'
      [url,{'title'=>row.fetch('title'),'description'=>description(row),'type'=>kind,'kicker'=>kicker,
            'cta'=>cta,'scope'=>scope(row),'minutes'=>@blogs.dig(url,'readingMinutes'),'image'=>image(url)}]
    end
    @plans.each do |url,plan|
      plan['context']=scope(@records.fetch(url))
      shown=plan.fetch('related')+plan.fetch('reading')
      raise "Repeated related destination #{url}" unless shown.map { |link| link.fetch('url') }.uniq.length==shown.length
      shown.each { |link| raise "Missing recommendation metadata #{url}: #{link['url']}" unless cards.key?(link.fetch('url')) }
    end
    File.write('_data/related-cards.json',JSON.pretty_generate({'version'=>1,'pages'=>cards})+"\n")
  end
end
