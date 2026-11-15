# frozen_string_literal: true
require 'json'
require 'date'
require_relative '../lib/calendar'

# The article and its FAQ share one date resolver. A cultural programme is never
# invented from a recurring observance, and a substitute day is labelled apart.
module OccasionGuide
  module_function
  DATA = JSON.parse(File.read(File.join(__dir__, '../_data/occasion-guides.json'))).fetch('topics').freeze
  MONTHS = Calendar365::MONTHS
  LOCATIVE = Calendar365::MONTHS_LOCATIVE
  WEEKDAYS = Calendar365::DAYS
  WEEKDAYS_LOCATIVE = %w[pirmdienā otrdienā trešdienā ceturtdienā piektdienā sestdienā svētdienā].freeze

  def slug(article); article['slug'] || article.fetch('url').split('/').last; end
  def title(article); DATA.dig(slug(article),'shortTitle') || article['title'] || article.fetch('h1'); end
  def copy(article); DATA.fetch(slug(article)); end
  def advent(year)
    last = Date.new(year, 12, 24)
    last -= last.wday
    (0..3).map { |i| last - 21 + 7*i }
  end

  def dates(article, year, seasons: [])
    if article.key?('dates')
      existing = article.fetch('dates').select { |row| Date.parse(row.fetch('date')).year == year }
      return existing unless existing.empty?
      rule = article.fetch('dateRule', {})
      case rule['kind']
      when 'fixed', 'fixed_dates', 'nth_weekday', 'western_easter_offset'
        # This also retains the statutory substitute-day rules for 2026.
        terms = article.fetch('matchTerms', []) + article.fetch('dates').map { |r| r['title'] }
        return Calendar365.holidays(year).select { |r| terms.include?(r[:title]) }.map { |r| r.transform_keys(&:to_s) }
      when 'astronomical'
        months = article.fetch('dates').map { |r| Date.parse(r['date']).month }.uniq
        return seasons.select { |r| r['date'].start_with?(year.to_s) && r['phenomenon']=='Solstice' && months.include?(Date.parse(r['date']).month) }
      else
        return [] # Only announced festival dates are valid.
      end
    end
    model = article.fetch('dateModel', {})
    make = ->(date, name, scope=nil) { {'date'=>date.iso8601, 'title'=>name, 'scope'=>scope}.compact }
    case model['type']
    when 'fixed'
      [make.call(Date.new(year,model.fetch('month'),model.fetch('day')),title(article),model['confessionScope'])]
    when 'gregorian-relative'
      advent(year).each_with_index.map { |date,i| make.call(date,"#{i+1}. adventes svētdiena",model['confessionScope']) }
    when 'easter-relative'
      [make.call(Calendar365.easter(year)+model.fetch('offsetDays'),title(article),model['confessionScope'])]
    when 'confession-specific'
      model.fetch('variants',[]).map do |variant|
        date = variant['month'] ? Date.new(year,variant['month'],variant['day']) : advent(year).first-7
        make.call(date,variant.fetch('name'),variant['scope'])
      end
    when 'astronomical'
      seasons.select { |r| r['date'].start_with?(year.to_s) && r['phenomenon']=='Equinox' && model.fetch('typicalMonths',[]).include?(Date.parse(r['date']).month) }
    else
      [] # Multiple traditions and seasonal collections have no single date.
    end
  end

  def sentence_date(row)
    date=Date.parse(row.fetch('date'))
    "#{date.day}. #{LOCATIVE[date.month-1]} (#{WEEKDAYS_LOCATIVE[date.cwday-1]})#{row['time'] ? ", plkst. #{row['time']} pēc Latvijas laika" : ''}"
  end

  def status(article)
    return 'Astronomisks brīdis' if article['type']=='astronomy' || article.dig('dateModel','type')=='astronomical'
    return 'Svētku diena' if article['dayOff']
    article['type']=='commemoration' ? 'Atceres diena' : 'Atzīmējama diena'
  end

  def status_answer(article)
    if article['dayOff']
      if slug(article)=='dziesmu-un-deju-svetki'
        'Svētku diena ir Vispārējo dziesmu un deju svētku noslēguma diena, nevis viss festivāla periods. Ja noslēgums ir sestdienā vai svētdienā, nākamā darbdiena ir brīvdiena.'
      elsif article.dig('dateRule','substituteRule')
        'Jā, tā ir Latvijas likumā noteikta svētku diena. Ja tā iekrīt sestdienā vai svētdienā, nākamā darbdiena ir brīvdiena. Maiņu darba grafiku pārbaudi pie darba devēja.'
      else
        'Jā, Latvijas likumā šis datums ir svētku diena. Taču par katru nedēļas nogalē iekritušu svētku datumu nav paredzēta automātiska brīva pirmdiena. Maiņu darba grafiku pārbaudi atsevišķi.'
      end
    else
      'Nē, šī kalendāra atzīme pati par sevi nav vispārēja Latvijas darba brīvdiena. Skolas, darba devēja vai pasākuma rīkotāja grafiks jāvērtē atsevišķi.'
    end
  end

  def pending(article)
    case article.dig('dateRule','kind') || article.dig('dateModel','type')
    when 'official_period'
      'Šim gadam Vispārējo svētku norise nav apstiprināta šīs lapas avotos. 2028. gada datumu uz citu gadu nepārnesam.'
    when 'multiple-traditions'
      'Nav viena kopīga datuma: tradīcijas un konkrēto pasākumu dienas atšķiras. Skati izvēlētā rīkotāja programmu.'
    when 'latvian-spring'
      'Nav vienas kopīgas dienas. Meteņi, Lieldienas un ekvinokcija jāskatās katrs savā kalendārā.'
    else
      'Apstiprināts šī gada norises datums nav pieejams. Iepriekšējā gada programmu nepārnesam automātiski.'
    end
  end

  def when_answer(article, year, seasons: [])
    rows=dates(article,year,seasons:seasons)
    return pending(article) if rows.empty?
    rows.map { |r| "#{sentence_date(r)}#{rows.size>1 ? ' '+r.fetch('title') : ''}" }.join('; ')+'.'
  end

  def calendar_url(row)
    date=Date.parse(row.fetch('date'))
    if (2027..2030).cover?(date.year)
      slugs=%w[janvaris februaris marts aprilis maijs junijs julijs augusts septembris oktobris novembris decembris]
      "/kalendars/#{date.year}/#{slugs[date.month-1]}/?date=#{date}&view=day#calendar-app"
    else
      "/?date=#{date}&view=day"
    end
  end
end

def occasion_practical_markup(article)
  slug=OccasionGuide.slug(article);info=OccasionGuide.copy(article)
  <<~HTML
    <section class="occasion-practical" id="praktiska-informacija" data-occasion-practical>
      <header><span class="eyebrow">PIRMS IEPLĀNO</span><h2>Vieta, dalība un dienas statuss</h2></header>
      <div class="occasion-practical-grid">
        <section><span class="occasion-detail-number" aria-hidden="true">01</span><h3>Kur Latvijā to atzīmē?</h3><p>#{h(info.fetch('where'))}</p></section>
        <section><span class="occasion-detail-number" aria-hidden="true">02</span><h3>Kā sagatavoties?</h3><p>#{h(info.fetch('plan'))}</p></section>
        <section><span class="occasion-detail-number" aria-hidden="true">03</span><h3>Vai tā ir brīvdiena?</h3><p>#{h(OccasionGuide.status_answer(article))}</p></section>
      </div>
    </section>
  HTML
end

def occasion_dates_markup(article)
  title=OccasionGuide.title(article)
  cards=(2026..2030).map do |year|
    rows=OccasionGuide.dates(article,year,seasons:DATA.fetch('seasons',[]))
    entries=rows.map do |row|
      date=Date.parse(row['date']);time=row['time'] ? %(<span class="occasion-date-time">Plkst. #{h(row['time'])} · Latvijas laiks</span>) : ''
      label=%(<time datetime="#{h(row['utc']||row['date'])}">#{date.day}. #{h(MONTHS[date.month-1])}</time>)
      link=%(<a class="tradition-date-link" href="#{h(OccasionGuide.calendar_url(row))}" aria-label="Atvērt datumu kalendārā: #{date.year}. gada #{date.day}. #{h(MONTHS[date.month-1])}">#{label}</a>)
      %(<div class="occasion-date-entry" id="datums-#{date.iso8601}" tabindex="-1">#{link}<span>#{h(OccasionGuide::WEEKDAYS[date.cwday-1])}</span>#{time}<small>#{h(row['title'])}#{row['type']=='substitute' ? ' · Papildu brīvdiena' : ''}</small>#{row['scope'] ? '<small>'+h(row['scope'])+'</small>' : ''}</div>)
    end.join
    entries=%(<p class="occasion-pending">#{h(OccasionGuide.pending(article))}</p>) if rows.empty?
    %(<article><strong>#{year}</strong>#{entries}</article>)
  end.join
  <<~HTML
    <section class="occasion-dates occasion-dates--guide" id="datumi" data-occasion-dates>
      <div class="section-heading"><div><span class="eyebrow">GADU PA GADAM</span><h2>Kad ir #{h(title)}? Datumi 2026.–2030. gadā</h2></div><span>#{h(OccasionGuide.status(article))}</span></div>
      <div class="occasion-year-cards">#{cards}</div>
      <p class="occasion-dates-note">Kalendāra datums un pasākuma programma nav viens un tas pats. Atsevišķa koncerta, ceremonijas vai skolas pasākuma laiku nosaka tā rīkotājs.</p>
    </section>
  HTML
end

def occasion_faq_markup(article)
  title=OccasionGuide.title(article)
  rows=(2027..2030).map { |year| ["Kad ir #{title} #{year}. gadā?",OccasionGuide.when_answer(article,year,seasons:DATA.fetch('seasons',[]))] }
  %(<section class="occasion-faq" id="jautajumi" data-occasion-faq><header><span class="eyebrow">ĪSAS ATBILDES</span><h2>Jautājumi par šo dienu</h2></header>#{rows.map{|q,a|'<details><summary>'+h(q)+'</summary><p>'+h(a)+'</p></details>'}.join}</section>)
end
