require 'date'
module CalendarLatvianDates
  MONTHS = %w[janvāris februāris marts aprīlis maijs jūnijs jūlijs augusts septembris oktobris novembris decembris].freeze
  def latvian_date(value)
    raw=value.to_s
    raise ArgumentError, 'Expected an ISO date' unless raw.match?(/\A\d{4}-\d{2}-\d{2}\z/)
    date=Date.iso8601(raw)
    "#{date.year}. gada #{date.day}. #{MONTHS.fetch(date.month-1)}"
  end
end
Liquid::Template.register_filter(CalendarLatvianDates)
