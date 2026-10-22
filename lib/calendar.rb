# frozen_string_literal: true
require 'date'
require 'json'

# Date-only values use Date, never the host timezone. Legal rules: law 72608,
# consolidated 18 March 2025, checked 22 October 2026. Future amendments and
# employer-specific moved working days must be supplied as explicit overrides.
module Calendar365
  MONTHS = %w[janvāris februāris marts aprīlis maijs jūnijs jūlijs augusts septembris oktobris novembris decembris].freeze
  MONTHS_GENITIVE = %w[janvāra februāra marta aprīļa maija jūnija jūlija augusta septembra oktobra novembra decembra].freeze
  MONTHS_LOCATIVE = %w[janvārī februārī martā aprīlī maijā jūnijā jūlijā augustā septembrī oktobrī novembrī decembrī].freeze
  DAYS = %w[pirmdiena otrdiena trešdiena ceturtdiena piektdiena sestdiena svētdiena].freeze
  SOURCE = 'https://likumi.lv/ta/id/72608-par-svetku-atceres-un-atzimejamam-dienam'
  FESTIVAL_SOURCE = 'https://likumi.lv/ta/id/367734-par-xxviii-visparejo-latviesu-dziesmu-un-xviiideju-svetku-norises-laiku'
  FIXED = [
    ['01-01','Jaungada diena','holiday'],
    ['01-20','1991. gada barikāžu aizstāvju atceres diena','commemoration'],
    ['01-26','Latvijas Republikas starptautiskās (de jure) atzīšanas diena','observance'],
    ['02-27','Starptautiskā nevalstisko organizāciju diena','observance'],
    ['03-02','Nacionālo partizānu bruņotās pretošanās atceres diena','commemoration'],
    ['03-08','Starptautiskā sieviešu diena','observance'],
    ['03-17','Nacionālās pretošanās kustības piemiņas diena','commemoration'],
    ['03-25','Komunistiskā genocīda upuru piemiņas diena','commemoration'],
    ['04-27','Latgales kongresa diena','observance'],
    ['05-01','Darba svētki; Latvijas Republikas Satversmes sapulces sasaukšanas diena','holiday'],
    ['05-04','Latvijas Republikas Neatkarības atjaunošanas diena','holiday'],
    ['05-08','Nacisma sagrāves diena un Otrā pasaules kara upuru piemiņas diena','commemoration'],
    ['05-09','Eiropas diena','observance'],
    ['05-15','Starptautiskā ģimenes diena','observance'],
    ['05-17','Ugunsdzēsēju un glābēju diena','observance'],
    ['06-01','Starptautiskā bērnu aizsardzības diena','observance'],
    ['06-14','Komunistiskā genocīda upuru piemiņas diena','commemoration'],
    ['06-17','Latvijas Republikas okupācijas diena','commemoration'],
    ['06-22','Varoņu piemiņas diena (Cēsu kaujas atceres diena)','commemoration'],
    ['06-23','Līgo diena','holiday'],['06-24','Jāņu diena','holiday'],
    ['07-04','Ebreju tautas genocīda upuru piemiņas diena','commemoration'],
    ['08-11','Latvijas brīvības cīnītāju piemiņas diena','commemoration'],
    ['08-21','Konstitucionālā likuma “Par Latvijas Republikas valstisko statusu” pieņemšanas diena','observance'],
    ['08-23','Staļinisma un nacisma upuru atceres diena','commemoration'],
    ['09-01','Zinību diena','observance'],['09-22','Baltu vienības diena','observance'],
    ['10-01','Starptautiskā senioru diena','observance'],['10-05','Skolotāju diena','observance'],
    ['10-15','Valsts valodas diena','observance'],['11-07','Robežsargu diena','observance'],
    ['11-11','Lāčplēša diena','commemoration'],
    ['11-18','Latvijas Republikas Proklamēšanas diena','holiday'],
    ['11-21','2013. gada 21. novembra traģēdijas atceres diena','commemoration'],
    ['12-05','Policijas darbinieku diena','observance'],
    ['12-24','Ziemassvētku vakars','holiday'],['12-25','Pirmie Ziemassvētki','holiday'],
    ['12-26','Otrie Ziemassvētki','holiday'],['12-31','Vecgada diena','holiday']
  ].freeze
  module_function
  def parse_iso(value)
    return value if value.is_a?(Date)
    raise ArgumentError, 'Datums jānorāda GGGG-MM-DD formātā.' unless value.is_a?(String) && value.match?(/\A\d{4}-\d{2}-\d{2}\z/)
    Date.iso8601(value)
  end
  def date_iso(value); parse_iso(value).iso8601; end
  def iso_week(value)
    d = parse_iso(value)
    {year: d.cwyear, week: d.cweek, weekday: d.cwday}
  end
  def easter(year)
    a=year%19; b=year/100; c=year%100; d=b/4; e=b%4; f=(b+8)/25
    g=(b-f+1)/3; h=(19*a+b-d-g+15)%30; i=c/4; k=c%4
    l=(32+2*e+2*i-h-k)%7; m=(a+11*h+22*l)/451
    Date.new(year,(h+l-7*m+114)/31,(h+l-7*m+114)%31+1)
  end
  def nth_weekday(year,month,weekday,n)
    first=Date.new(year,month,1)
    first + (weekday-first.cwday)%7 + (n-1)*7
  end
  def record(d,title,type)
    {date:d.iso8601,title:title,type:type,dayOff:%w[holiday substitute].include?(type),source:SOURCE}
  end
  def holidays(year)
    raise ArgumentError, 'Gads ārpus atbalstītā diapazona.' unless (1900..2100).cover?(year)
    @holiday_cache ||= {}
    return @holiday_cache[year].map(&:dup) if @holiday_cache.key?(year)
    rows=FIXED.map { |md,title,type| record(Date.iso8601("#{year}-#{md}"),title,type) }
    e=easter(year)
    [[-2,'Lielā Piektdiena'],[0,'Pirmās Lieldienas'],[1,'Otrās Lieldienas'],[49,'Vasarsvētki']].each { |offset,title| rows << record(e+offset,title,'holiday') }
    [[5,7,2,'Mātes diena','holiday'],[6,7,3,'Medicīnas darbinieku diena','observance'],[7,6,2,'Jūras svētku diena','observance'],[9,7,2,'Tēva diena','observance'],[12,7,1,'Pret latviešu tautu vērstā totalitārā komunistiskā režīma genocīda upuru piemiņas diena','commemoration']].each { |month,weekday,n,title,type| rows << record(nth_weekday(year,month,weekday,n),title,type) }
    if year==2028
      rows << record(Date.new(2028,7,9),'Vispārējo latviešu dziesmu un deju svētku noslēguma diena','holiday').merge(dateSource:FESTIVAL_SOURCE)
      rows << record(Date.new(2028,7,10),'Brīvdiena pēc Dziesmu un deju svētku noslēguma dienas','substitute').merge(dateSource:FESTIVAL_SOURCE)
    end
    %w[05-04 11-18].each do |md|
      d=Date.iso8601("#{year}-#{md}")
      if d.cwday >= 6
        d += 1
        d += 1 while d.cwday >= 6 || rows.any? { |r| r[:date]==d.iso8601 && r[:dayOff] }
        rows << record(d,"Brīvdiena pēc #{md=='05-04' ? '4. maija' : '18. novembra'}",'substitute')
      end
    end
    rows=rows.sort_by { |r| [r[:date],r[:type],r[:title]] }
    rows.each { |r| r.each_value(&:freeze); r.freeze }
    @holiday_cache[year]=rows.freeze
    rows.map(&:dup)
  end
  def is_workday(value, week_length:5, overrides:{})
    raise ArgumentError, 'Darba nedēļa: 5 vai 6 dienas.' unless [5,6].include?(week_length)
    d=parse_iso(value)
    return !!overrides[d.iso8601] if overrides.key?(d.iso8601)
    d.cwday <= week_length && !holidays(d.year).any? { |r| r[:date]==d.iso8601 && r[:dayOff] }
  end
  def diff_days(a,b); (parse_iso(b)-parse_iso(a)).to_i; end
  def workdays(a,b,week_length:5,include_end:true,overrides:{})
    a=parse_iso(a); b=parse_iso(b)
    return -workdays(b,a,week_length:week_length,include_end:include_end,overrides:overrides) if a>b
    b -= 1 unless include_end
    (a..b).count { |d| is_workday(d,week_length:week_length,overrides:overrides) }
  end
  def work_hours(value, week_length:5, hours:8, saturday_hours:5, overrides:{}, shorten:true)
    d=parse_iso(value)
    return 0 unless is_workday(d,week_length:week_length,overrides:overrides)
    base=week_length==6 ? (d.cwday==6 ? saturday_hours : [hours,7].min) : hours
    tomorrow=d+1
    holiday_eve=holidays(tomorrow.year).any? { |r| r[:date]==tomorrow.iso8601 && r[:type]=='holiday' }
    [0,base-((shorten && holiday_eve) ? 1 : 0)].max
  end
  def month_grid(year,month)
    first=Date.new(year,month,1); last=Date.new(year,month,-1)
    start=first-(first.cwday-1); finish=last+(7-last.cwday)
    holiday_rows=(start.year..finish.year).flat_map { |y| holidays(y) }
    (start..finish).each_slice(7).map do |days|
      {week:days[0].cweek,year:days[0].cwyear,days:days.map { |d| {date:d.iso8601,day:d.day,inMonth:d.month==month,weekday:d.cwday,holiday:holiday_rows.select { |r| r[:date]==d.iso8601 }} }}
    end
  end
end
