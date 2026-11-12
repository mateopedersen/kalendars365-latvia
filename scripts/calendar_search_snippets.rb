# frozen_string_literal: true

# Search summaries use the same dates and calculated examples as the visible
# calendars. A city example is always dated, even when the visitor opens today.
class CalendarSearchSnippets
  def initialize(data:, cities:, sky:, notes:)
    @data, @sky, @notes = data, sky, notes
    @cities = cities.to_h { |city| [city.fetch('id'), city] }
  end

  def description(family, year:, month:, slug:, fallback:)
    case family
    when 'year', 'calendar_month', 'iso_week', 'holiday_year', 'holiday_month', 'work_year', 'work_month', 'lunar_year', 'lunar_month'
      return week_summary(year, slug.to_i) if family == 'iso_week'
      first, last = @notes.period(year, month)
      period = month ? "#{year}. gada #{PageReadingNotes::LOC[month - 1]}" : "#{year}. gadā"
      calendar_summary(family, first, last, period)
    when 'sun_city', 'moon_city'
      city_summary(family, slug)
    when 'print_index'
      "Lejupielādē #{year}. gada kalendāru drukāšanai A3 formātā. Izvēlies kādu no 15 dizainiem, apskati priekšskatījumu un saglabā PDF dokumentu vai augstas izšķirtspējas attēlu."
    when 'print_month'
      "Lejupielādē #{year}. gada #{PageReadingNotes::GEN[month - 1]} kalendāru drukāšanai. Pieejami 15 dizaini A3 formātā ar PDF un 600 dpi attēlu katram dizainam."
    when 'name_day_month'
      names = @data.fetch('names').select { |r| r['month'] == month && r['day'] == 1 && r['kind'] == 'traditional' }.map { |r| r.fetch('name') }.uniq.first(3)
      "Atrodi vārda dienu #{PageReadingNotes::LOC[month - 1]} pēc vārda vai datuma. Mēneša pirmajā dienā tradicionālajā sarakstā: #{names.join(', ')}."
    when 'school_academic'
      start_year = Integer(slug.split('-').first)
      academic = "#{start_year}./#{start_year + 1}."
      status = @data.fetch('schoolYears').find { |s| s['academicYear'] == "#{start_year}-#{start_year + 1}" }
      if status&.fetch('status') == 'verified'
        "#{academic} mācību gada brīvlaiki Latvijā. Apskati semestru datumus, rudens, ziemas un pavasara brīvlaiku un mācību beigu datumu savai klasei."
      else
        "#{academic} mācību gada brīvlaiku datumi šajā kalendārā vēl nav apstiprināti. Skati, kur pārbaudīt termiņus pirms ģimenes atvaļinājuma plānošanas."
      end
    else
      fallback
    end
  end

  def week_summary(year, week)
    first = Date.commercial(year, week, 1)
    last = first + 6
    start_date = "#{first.day}. #{PageReadingNotes::LOC[first.month - 1]}"
    end_date = "#{last.day}. #{PageReadingNotes::LOC[last.month - 1]}"
    start_date = "#{first.year}. gada #{start_date}" if first.year != year
    end_date = "#{last.year}. gada #{end_date}" if last.year != year
    "#{year}. gada #{week}. ISO nedēļa sākas #{start_date} un beidzas #{end_date}. Atver dienu, pievieno savus notikumus vai izdrukā nedēļas plānu."
  end

  private

  def calendar_summary(family, first, last, period)
    if family.start_with?('lunar')
      phases = @data.fetch('moon').select { |e| e['date'].between?(first.iso8601, last.iso8601) && e['phaseKey'] == 'Full Moon' }
      if family == 'lunar_year'
        return "Uzzini, kad #{period} gaidāms pilnmēness un jaunmēness. Kalendārā ir #{phases.size} pilnmēneši. Katram mēnesim pieejami fāžu laiki un drukājams pārskats."
      end
      dates = phases.map { |e| "#{Date.iso8601(e.fetch('date')).day}. #{PageReadingNotes::LOC[first.month - 1]} plkst. #{e.fetch('time')}" }
      example = dates.empty? ? 'Šajā mēnesī pilnmēness nav.' : "Pilnmēness #{dates.join(' un ')} pēc Latvijas laika."
      return "Mēness fāzes #{period}. #{example} Apskati katras dienas apgaismojumu un lejupielādē mēneša kalendāru."
    end
    stats = @notes.stats(first, last)
    holidays = stats.fetch('offDates').map { |d| Date.iso8601(d) }.sort
    case family
    when 'calendar_month'
      "Kā izkārtotas nedēļas #{period}? Mēneša pirmā diena ir #{@notes.weekday(first)}, bet pēdējā ir #{@notes.weekday(last)}. Apskati svētku dienas un saglabā mēneša kalendāru."
    when 'year'
      "#{first.year}. gada kalendārā ir #{last.yday} dienas, un 1. janvāris ir #{@notes.weekday(first)}. Apskati Latvijas svētku dienas, ISO nedēļas un lejupielādē gada kalendāru."
    when 'holiday_year'
      "Kad #{period} Latvijā ir brīvdienas? Pārskati svētku datumus pa mēnešiem un atver katras dienas aprakstu. Atceres un atzīmējamās dienas norādītas atsevišķi."
    when 'holiday_month'
      dates = holidays.map { |d| "#{d.day}." }
      list = dates.length > 1 ? "#{dates[0...-1].join(', ')} un #{dates.last}" : dates.first
      summary = list ? "Svētku brīvdienu datumi: #{list} #{PageReadingNotes::LOC[first.month-1]}." : 'Šajā mēnesī Latvijas kalendārā nav svētku brīvdienu.'
      "Svētku kalendārs #{period}. #{summary} Apskati arī atceres un atzīmējamās dienas."
    when 'work_month', 'work_year'
      "Darba dienu skaits #{period} piecu dienu darba nedēļā: #{stats.fetch('workdays')}. Aprēķinā atskaitītas svētku brīvdienas. Pielāgo savu grafiku un nosaki darba stundu skaitu."
    end
  end

  def city_summary(family, slug)
    place = @cities.fetch(slug).fetch('locative')
    samples = @sky.fetch(slug)
    if family == 'sun_city'
      summer = samples.fetch('2027-06-21').fetch('daylightMinutes').divmod(60)
      winter = samples.fetch('2027-12-21').fetch('daylightMinutes').divmod(60)
      "Kad #{place} lec un riet Saule? Izvēlies datumu. Gaišais laiks 2027. gada 21. jūnijā ir #{summer[0]} h #{summer[1]} min, bet 21. decembrī #{winter[0]} h #{winter[1]} min."
    else
      sample = samples.fetch('2027-01-15')
      rise, set = sample.fetch('moonrise'), sample.fetch('moonset')
      times = if rise.one? && set.one?
        "2027. gada 15. janvārī Mēness riet plkst. #{set.first} un lec plkst. #{rise.first}."
      else
        "Apskati Mēness fāzi un apgaismojumu izvēlētajā datumā."
      end
      "Mēness lēkts un riets #{place} pēc Latvijas laika. #{times} Salīdzini citus datumus pilsētas kalendārā."
    end
  end
end
