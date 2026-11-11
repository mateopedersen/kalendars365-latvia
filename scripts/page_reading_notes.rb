# frozen_string_literal: true
require 'json'
require 'date'

# Two or three useful paragraphs per route. Repeated calendar families use their
# actual dates and source records; there is deliberately no generic fallback.
class PageReadingNotes
  MONTHS = %w[janvāris februāris marts aprīlis maijs jūnijs jūlijs augusts septembris oktobris novembris decembris].freeze
  GEN = %w[janvāra februāra marta aprīļa maija jūnija jūlija augusta septembra oktobra novembra decembra].freeze
  LOC = %w[janvārī februārī martā aprīlī maijā jūnijā jūlijā augustā septembrī oktobrī novembrī decembrī].freeze
  SLUGS = %w[janvaris februaris marts aprilis maijs junijs julijs augusts septembris oktobris novembris decembris].freeze
  DAYS = %w[pirmdiena otrdiena trešdiena ceturtdiena piektdiena sestdiena svētdiena].freeze
  LAW = 'https://likumi.lv/ta/id/72608-par-svetku-atceres-un-atzimejamam-dienam'

  def initialize(data:, cities:, sky:, cultural_dates:, garden_actions:)
    @data, @cities, @sky, @cultural_dates, @garden_actions = data, cities, sky, cultural_dates, garden_actions
    @authored = read('_data/reading-notes.json')
    @garden = read('_data/garden-crops.json')
    @garden_notes = read('_data/garden-reading-notes.json')
    @occasions = read('_data/occasions.json').to_h { |item| [item.fetch('slug'), item] }
    @extra = read('_data/latvia-extra-pages.json')
    @cultural = @extra.fetch('culturalPages').to_h { |item| [item.fetch('url'), item] }
    @verified = read('_data/latvia-verified-data.json')
    @sources = (@data.fetch('sources') + @verified.fetch('sources') + @garden.fetch('sources')).select { |s| s['url'] }.to_h { |s| [s.fetch('id'), s] }
    @profiles = read('_data/horoscope/profiles.json').fetch('profiles').to_h { |item| [item.fetch('slug'), item] }
    @year_art = read('downloads/gada-a3/manifest.json').fetch('items')
    @month_art = read('downloads/menesa-a3/manifest.json').fetch('items')
    @pages = {}
  end
  attr_reader :pages

  def read(path); JSON.parse(File.read(path)); end
  def date_label(value, form=:nominative)
    d = value.is_a?(Date) ? value : Date.parse(value)
    months = form==:locative ? LOC : form==:genitive ? GEN : MONTHS
    "#{d.year}. gada #{d.day}. #{months[d.month - 1]}"
  end
  def weekday(value); DAYS[(value.is_a?(Date) ? value : Date.parse(value)).cwday - 1]; end
  def link(url, title); {'url'=>url, 'title'=>title}; end
  def source(ids)
    Array(ids).map { |id| @sources[id] }.compact.uniq { |s| s['url'] }.map { |s| link(s['url'], s['title'] || s['id']) }
  end
  def rows(first, last)
    @data.fetch('holidays').select { |row| row.fetch('date') >= first.iso8601 && row.fetch('date') <= last.iso8601 }
  end
  def stats(first, last)
    list = rows(first,last)
    off = list.select { |r| r['dayOff'] }.map { |r| r['date'] }.uniq
    days = (first..last).to_a
    {'days'=>days.length,'weekends'=>days.count { |d| d.cwday >= 6 },'workdays'=>days.count { |d| d.cwday < 6 && !off.include?(d.iso8601) },'offDates'=>off,'rows'=>list}
  end
  def period(year, month)
    month ? [Date.new(year,month,1),Date.new(year,month,-1)] : [Date.new(year,1,1),Date.new(year,12,31)]
  end
  def period_name(year, month); month ? "#{year}. gada #{MONTHS[month-1]}" : "#{year}. gads"; end
  def holiday_summary(first,last)
    list=rows(first,last).select { |r| r['dayOff'] }.uniq { |r| r['date'] }
    return "Izvēlētais datumu diapazons: #{date_label(first)}–#{date_label(last)}. Tā ietvaros izmantotajā datu kopā nav svētku brīvdienas. Tas nenozīmē, ka šajā periodā nebūtu vārda dienu, atceres datumu vai tavu personīgo notikumu." if list.empty?
    text=list.first(3).map { |r| "#{r['title']} (#{date_label(r['date'])}; #{weekday(r['date'])})" }.join('; ')
    "Perioda svētku brīvdienu piemēri: #{text}. #{list.length>3 ? 'Pilno sarakstu un aizstājošās brīvdienas pārbaudi datumu pārskatā.' : 'Šie ieraksti ir nodalīti no atceres un citām atzīmējamām dienām.'}"
  end
  def calendar_note(year,month,family)
    first,last=period(year,month);s=stats(first,last);name=period_name(year,month)
    if month
      weeks=(first..last).map { |d| "#{d.cwyear}/#{format('%02d',d.cweek)}" }.uniq
      anatomy="#{name.capitalize}: kalendāra dienu skaits ir #{s['days']}. Pirmā diena ir #{weekday(first)}, pēdējā — #{weekday(last)}; mēnesis skar #{weeks.length} ISO nedēļas (#{weeks.first}–#{weeks.last}). Pilnās nedēļu rindās redzami arī blakus mēnešu datumi, tāpēc gaišāka rūtiņa nav pazudusi šā mēneša diena."
      tail="#{year}. gada #{LOC[month-1]} sestdienu un svētdienu skaits ir #{s['weekends']}, bet pirmdienu–piektdienu pamatdarbadienu skaits pēc svētku brīvdienu atņemšanas ir #{s['workdays']}. Šis skaitlis neiekļauj darba devēja maiņu grafiku un atsevišķi apstiprinātu darba dienu pārcelšanu. #{Date.new(year,month,-1).day==29 && month==2 ? '2028. gada 29. februāris ir derīgs datums; pārnesot notikumu uz citu gadu, to pārbaudi atsevišķi.' : 'Nospied datumu, lai pievienotu personīgu notikumu, vai izvēlies attiecīgā mēneša drukas veidni.'}"
    else
      anatomy="#{year}. gada 1. janvāris ir #{weekday(first)}, bet 31. decembris — #{weekday(last)}. Gads ietver #{s['days']} dienas; februārī ir #{Date.new(year,2,-1).day} dienas. Gada sākuma datums pieder ISO #{first.cwyear}. gada #{first.cweek}. nedēļai, savukārt pēdējais datums ISO #{last.cwyear}. gada #{last.cweek}. nedēļai. Kalendāra gads un ISO nedēļu gads pie robežas var atšķirties."
      months=(1..12).map { |m| a,b=period(year,m);[m,stats(a,b)['workdays']] }
      fewest=months.min_by { |m,n| n };most=months.max_by { |m,n| n }
      tail="Piecu dienu pamatnedēļā #{year}. gada darbadienu skaits pēc svētku brīvdienu atņemšanas ir #{s['workdays']}. Mēnešu salīdzinājumā #{MONTHS[fewest[0]-1]} dod #{fewest[1]}, bet #{MONTHS[most[0]-1]} — #{most[1]} šādas dienas. Vienādu rezultātu gadījumā šeit minēts pirmais mēnesis gada secībā. Individuālu slodzi un pārceltās darba dienas pārbaudi atsevišķi."
    end
    {'heading'=>month ? "#{year}. gada #{GEN[month-1]} kalendāra skaidrojums" : "#{year}. gada izkārtojums un plānošana",'paragraphs'=>[anatomy,holiday_summary(first,last),tail],'icon'=>month ? "month-#{year}-#{month}" : 'calendar','sources'=>source(['holidays']),'related'=>[link("/darba-dienu-kalendars/#{year}/",'Darba dienu pārskats'),link('/atvalinajuma-planotajs/','Atvaļinājuma plānotājs')],'basis'=>{'first'=>first.iso8601,'last'=>last.iso8601,'workdays'=>s['workdays'],'days'=>s['days'],'family'=>family}}
  end
  def print_note(year,month)
    first,last=period(year,month);s=stats(first,last)
    art=(month ? @month_art : @year_art).select { |r| r['year']==year && (!month || r['month']==month) }
    labels=art.first(3).map { |r| "«#{r['title']}»" }.join(', ')
    dims=art.map { |r| "#{r['width']} × #{r['height']}" }.uniq.join(' vai ')
    title=month ? "#{year}. gada #{GEN[month-1]} izdrukas izvēle" : "#{year}. gada izdrukas izvēle"
    first_p="#{month ? "#{year}. gada #{GEN[month-1]} kolekcijā" : "#{year}. gada kolekcijā"} ir #{art.length} A3 dizaini, tostarp #{labels}. Tie attēlo #{month ? "tikai izvēlēto mēnesi (dienu skaits: #{s['days']})" : "visus 12 mēnešus un #{s['days']} gada dienas"}. Viena dizaina PDF un Attēls pogas ved uz viena perioda failiem, taču priekšskatījums ir samazināts un nav paredzēts augstas kvalitātes drukai."
    second="#{month ? "#{year}. gada #{GEN[month-1]}" : "#{year}. gada visu mēnešu"} kolekcijas attēlu pilnie izmēri ir #{dims} pikseļi pie 600 dpi. Vertikālu dizainu drukā portreta, horizontālu ainavas orientācijā. Daļā veidņu svētki nav īpaši atzīmēti; tas ir noformējuma variants, nevis cits datumu izkārtojums. Pirms drukāšanas pārbaudi pie kartītes norādīto formātu un svētku atzīmju izvēli."
    third="Šīs izdrukas pirmā datuma (#{date_label(first)}) nedēļas diena ir #{weekday(first)}, pēdējā (#{date_label(last)}) — #{weekday(last)}. #{holiday_summary(first,last)} Atver PDF vai pilno attēlu, lai pārbaudītu saturu pirms papīra tērēšanas."
    {'heading'=>title,'paragraphs'=>[first_p,second,third],'icon'=>'print','sources'=>source(['holidays']),'related'=>[link(month ? "/kalendars/#{year}/#{SLUGS[month-1]}/" : "/kalendars/#{year}/",'Interaktīvais kalendārs'),link('/izveidot-kalendaru/','Personīgs kalendārs')],'basis'=>{'designs'=>art.length,'year'=>year,'month'=>month}}
  end
  def week_note(year,week)
    first=Date.commercial(year,week,1);last=first+6;s=stats(first,last)
    cross=first.month==last.month ? "Visas septiņas dienas atrodas #{LOC[first.month-1]}." : "Nedēļa šķērso mēneša robežu: #{date_label(first)}–#{date_label(last)}. Viena mēneša pārskats bez blakus datumiem to neaptver pilnībā."
    ps=["ISO #{year}. gada #{week}. nedēļa sākas pirmdien, #{date_label(first,:locative)}, un beidzas svētdien, #{date_label(last,:locative)}. #{cross} Notikuma nosaukumā izmantots nedēļas numurs neaizstāj datumu, ja plānu sūti cilvēkam, kurš lieto citu nedēļu numerācijas kārtību.","Šajā nedēļā pirmdienas–piektdienas modelī pēc svētku brīvdienu atņemšanas ir #{s['workdays']} pamatdarbadienas. #{holiday_summary(first,last)} Ja strādā maiņās, šīs nedēļas faktisko slodzi salīdzini ar savu grafiku, nevis pārņem pamata skaitli kā personisku normu."]
    if last.year>2030
      ps[1]="Šī robežnedēļa ir atvērta, jo tā sākas 2030. gada decembrī un turpinās 2031. gada janvārī. Visa 2031. gada svētku un darba dienu kopa šeit nav publicēta, tāpēc pilnu nedēļas darba dienu normu neuzrādām kā pārbaudītu rezultātu. 2030. gada 31. decembra ierakstu salīdzini ar gada svētku pārskatu, bet turpmākajām dienām pārbaudi attiecīgā gada oficiālos avotus."
      s['workdays']=nil
    end
    target=first.year.between?(2027,2030) ? "/kalendars/#{first.year}/#{SLUGS[first.month-1]}/" : '/kalendars/'
    {'heading'=>"#{week}. nedēļas datumi un praktiskais pārskats",'paragraphs'=>ps,'icon'=>'week','sources'=>source(['holidays']),'related'=>[link(target,'Mēneša pārskats'),link('/mainu-grafiks/','Mans maiņu cikls')],'basis'=>{'first'=>first.iso8601,'last'=>last.iso8601,'isoYear'=>year,'week'=>week,'workdays'=>s['workdays']}}
  end
  def lunar_note(year,month)
    first,last=period(year,month)
    phases=@data.fetch('moon').select { |r| r['date']>=first.iso8601 && r['date']<=last.iso8601 }
    full=phases.select { |r| r['phaseKey']=='Full Moon' }
    new_moon=phases.select { |r| r['phaseKey']=='New Moon' }
    scope=month ? "#{year}. gada #{LOC[month-1]}" : "#{year}. gadā"
    phase_text=phases.first(month ? 5 : 2).map { |r| "#{r['phase']} — #{date_label(r['date'],:locative)} plkst. #{r['time']}" }.join('; ')
    p1="USNO datu kopā #{scope} galveno Mēness fāžu brīžu skaits ir #{phases.length}; pilnmēness ierakstu skaits #{full.length}, jaunmēness ierakstu skaits #{new_moon.length}. #{month ? 'Šā mēneša notikumi' : 'Gada pirmie notikumi'}: #{phase_text}. Norādīts Latvijas vietējais laiks, nevis UTC."
    p2=if month
      "Mēness attēlu skaits #{year}. gada #{GEN[month-1]} kalendārā ir #{last.day}. Katrs raksturo attiecīgās dienas plkst. 12.00 pēc Latvijas laika, tāpēc diska apgaismojums nav obligāti maksimāls tieši pilnmēness datuma attēlā. Nospied dienu, lai nolasītu tās apgaismojumu un vietējos lēkta un rieta aprēķinus; pilsētas maiņa nemaina pašu globālo galvenās fāzes brīdi."
    else
      "#{year}. gada pārskats aptver #{(last-first).to_i+1} dienas. Fāžu cikls nav vienāda garuma ar kalendāra mēnesi, tāpēc galveno brīžu skaits mēnešos nav vienmēr četri. Atver atsevišķo mēnesi, lai fāzes salīdzinātu ar ikdienas attēliem, nevis pieņemtu, ka viena gada shēma atkārtojas nākamajā gadā."
    end
    p3="#{month ? "#{year}. gada #{GEN[month-1]} periodam" : "#{year}. gadam"} pieejami četri atšķirīgi drukas izkārtojumi. PDF saglabā lapas noformējumu, bet Attēls ir pilnas izšķirtspējas attēla fails. Šie materiāli palīdz salīdzināt fāzes; mākoņi, vietējā apbūve un konkrētās nakts redzamība tajos nav attēlota kā novērojums vai prognoze."
    {'heading'=>"#{year}#{month ? '. gada '+GEN[month-1] : '. gada'} Mēness cikla skaidrojums",'paragraphs'=>[p1,p2,p3],'icon'=>'moon','sources'=>[link("https://aa.usno.navy.mil/api/moon/phases/year?year=#{year}",'USNO galveno Mēness fāžu dati')],'related'=>[link('/meness-lekts-un-riets/','Mēness laiki manā pilsētā'),link('/meness-fazes/','Fāžu brīžu pārskats')],'basis'=>{'phaseCount'=>phases.length,'fullMoonCount'=>full.length,'newMoonCount'=>new_moon.length,'year'=>year,'month'=>month}}
  end
  def city_note(city,family)
    lat=format('%.4f',city.fetch('lat')).tr('.',',');lon=format('%.4f',city.fetch('lon')).tr('.',',');samples=@sky.fetch(city.fetch('id'))
    if family=='sun_city'
      summer=samples.fetch('2027-06-21');winter=samples.fetch('2027-12-21')
      ps=["#{city['name']}: Saules laiku atskaites punkts ir pilsētas centra koordinātas #{lat}° ziemeļu platuma un #{lon}° austrumu garuma. Rezultāti parādīti Europe/Riga joslā. Šis punkts ļauj atkārtot aprēķinu; konkrētas ēkas, meža malas vai paugura aizsegums aprēķinātajā standarta horizontā nav iekļauts.","Dienas garuma salīdzinājuma piemērs šai vietai: 2027. gada 21. jūnijā aprēķinātais saullēkts ir #{summer['sunrise']}, saulriets #{summer['sunset']} un dienas garums #{duration(summer['daylightMinutes'])}; 21. decembrī attiecīgi #{winter['sunrise']}, #{winter['sunset']} un #{duration(winter['daylightMinutes'])}. Pulksteņa laiki un ilgums noapaļoti atsevišķi, tāpēc to starpībā iespējama vienas minūtes atšķirība. Tie ir datēti modeļa piemēri, nevis pašreizējā laika ziņa; savu dienu izvēlies rīkā."]
      related=[link("/meness-lekts-un-riets/#{city['id']}/",'Mēness laiki tajā pašā pilsētā'),link('/dienas-garums/','Dienas garuma salīdzinājums')]
    else
      sample=samples.fetch('2027-01-15');rise=sample['moonrise'].empty? ? 'šajā vietējā diennaktī lēkta nav' : 'lēkts '+sample['moonrise'].join(' un ');set=sample['moonset'].empty? ? 'šajā vietējā diennaktī rieta nav' : 'riets '+sample['moonset'].join(' un ')
      ps=["#{city['name']}: vietējo Mēness notikumu modelis izmanto koordinātas #{lat}° ziemeļu platuma un #{lon}° austrumu garuma, bet pulksteņa laikus parāda Europe/Riga joslā. Lēkts un riets ir horizonta notikumi, tāpēc cita novērotāja vieta var dot citus laikus pat tajā pašā Latvijas datumā. Diska fāze pati par sevi nepasaka, vai Mēness ir virs horizonta.","Konkrēts pārbaudes piemērs pilsētai #{city['name']}: 2027. gada 15. janvārī #{rise}; #{set}. Plkst. 12.00 modelī apgaismoti aptuveni #{sample['illumination'].to_s.tr('.',',')} % diska. Piemērs ir fiksēts šim datumam, nevis apgalvojums par šodienas debesīm. Rīkā salīdzini arī iepriekšējo un nākamo dienu, ja kāds horizonta notikums izvēlētajā diennaktī nav redzams."]
      related=[link("/saullekts-saulriets/#{city['id']}/",'Saules laiki tajā pašā pilsētā'),link('/meness-kalendars/','Mēness kalendārs pa gadiem')]
    end
    {'heading'=>"#{city['name']}: vieta, datums un aprēķina nozīme",'paragraphs'=>ps,'icon'=>family=='sun_city' ? 'sunrise' : 'moon','sources'=>[link(city.fetch('coordinateSource'),'Pilsētas koordinātu avots'),link('https://aa.usno.navy.mil/data/RS_OneDay','Astronomiskā horizonta laiku skaidrojums')],'related'=>related,'basis'=>{'cityId'=>city['id'],'lat'=>city['lat'],'lon'=>city['lon'],'model'=>'same sky-core as interactive city tool','exampleDates'=>family=='sun_city' ? ['2027-06-21','2027-12-21'] : ['2027-01-15']}}
  end
  def duration(minutes); "#{minutes/60} h #{minutes%60} min"; end

  def names_note(name,month)
    records=@data.fetch('names').select { |r| name ? r['name']==name : r['month'].to_i==month }
    traditional=records.select { |r| r['kind']=='traditional' }
    extra=records.reject { |r| r['kind']=='traditional' }
    if name
      entries=records.map { |r| "#{r['day']}. #{MONTHS[r['month'].to_i-1]} (#{r['kind']=='traditional' ? 'tradicionālais saraksts' : 'paplašinātais saraksts'})" }.uniq
      ps=["Vārdam «#{name}» izmantotajā VVC datu kopā norādīts: #{entries.join('; ')}. Saraksta veidu saglabā kopā ar datumu, jo tradicionālais un paplašinātais kalendārs nav viens ierakstu kopums. Šeit izmantota avotā norādītā vārda rakstība; līdzīgi skanošs vārds ar citu rakstību var būt atsevišķs meklēšanas rezultāts.","Veidojot kalendāru vārdam «#{name}», pārbaudi izvēlēto gadu un to, kuru no norādītajiem datumiem vēlies atzīmēt. Virsraksts ar saņēmēja vārdu ir personīgs noformējums, nevis jauns oficiāls vārda dienas ieraksts. Dzimšanas dienu vai jubileju pievieno atsevišķi un pirms izdrukas salīdzini, vai nosaukums un atzīme joprojām ir skaidri salasāmi."]
      heading="«#{name}»: datuma izvēle personīgam kalendāram"
    else
      examples=traditional.first(4).map { |r| "#{r['name']} — #{r['day']}. #{MONTHS[month-1]}" }.join('; ')
      ps=["#{MONTHS[month-1].capitalize} vārda dienu datu kopā tradicionālā saraksta ierakstu skaits ir #{traditional.length}, bet paplašinātā saraksta papildu ierakstu skaits ir #{extra.length}. Skaitļi attiecas uz ierakstiem, nevis Latvijas iedzīvotāju skaitu. Izvēlētais mēnesis ierobežo meklējumu līdz #{LOC[month-1]} norādītajām dienām, bet neapvieno abu sarakstu statusus.","Tradicionālā saraksta piemēri šajā mēnesī: #{examples}. Apsveikumu plānam vispirms izvēlies konkrēto vārdu un datumu, pēc tam pievieno personīgu atgādinājumu. #{month==2 ? 'Februāra ierakstiem atšķir arī 29. februāra datumu: tas ir derīgs tikai garajā gadā, tostarp 2028. gadā.' : 'Vārda dienas atzīme nepadara šo datumu par vispārēju darba brīvdienu un nav saistīta ar cilvēka dzimšanas datumu.'}"]
      heading="#{MONTHS[month-1].capitalize}: kā lasīt vārdu sarakstu"
    end
    {'heading'=>heading,'paragraphs'=>ps,'icon'=>'names','sources'=>source(['names-traditional','names-extended']),'related'=>[link('/varda-dienas/','Meklēt vārdu'),link('/kalendars-ar-vardu/','Veidot kalendāru ar vārdu')],'basis'=>{'name'=>name,'month'=>month,'traditionalRecords'=>traditional.length,'extendedRecords'=>extra.length}}
  end

  def work_note(year,month)
    first,last=period(year,month);s=stats(first,last);name=period_name(year,month)
    off=s['offDates'].map { |d| Date.parse(d) };weekdays=off.select { |d| d.cwday<6 };weekends=off.select { |d| d.cwday>=6 }
    affected=weekdays.first(3).map { |d| "#{date_label(d)} (#{weekday(d)})" }.join('; ')
    impact="#{name.capitalize}: svētku brīvdienu datumi darba nedēļas pamatā #{weekdays.length}, sestdienās vai svētdienās #{weekends.length}. #{affected.empty? ? 'Šajā periodā nav svētku datuma, kas no pirmdienas–piektdienas bāzes atņemtu papildu dienu.' : 'Darba dienu skaitu ietekmē, piemēram, '+affected+'.'} Vienu un to pašu datumu no bāzes neatņem atkārtoti, ja tajā ir vairāki atzīmējamo dienu ieraksti."
    ps=["#{name.capitalize}: kalendāra dienas #{s['days']}, sestdienas un svētdienas #{s['weekends']}, pamatdarbadienas pēc svētku brīvdienu atņemšanas #{s['workdays']}. Šī ir pirmdienas–piektdienas bāze, nevis individuāls maiņu grafiks. Darba stundas nolasi kopā ar rīkā izvēlēto dienas ilgumu un saīsinājumu iestatījumiem.",impact,"#{month ? "#{year}. gada #{GEN[month-1]}" : "#{year}. gada"} darba plāna salīdzinājumam saglabā to pašu darba nedēļas modeli abos rezultātos. Pārcelta darba diena, pirmssvētku saīsinājums un personīga prombūtne maina atšķirīgas aprēķina daļas. Pirms rezultāta lietošanas darba uzskaitē pārbaudi, kuras no tām ir ieslēgtas, un salīdzini periodu ar apstiprināto darba grafiku."]
    {'heading'=>"#{name.capitalize}: ko nozīmē darba dienu rezultāts",'paragraphs'=>ps,'icon'=>'work','sources'=>source(['holidays','labor']),'related'=>[link('/darba-laika-kalendars/','Stundu aprēķina rīks'),link('/mainu-grafiks/','Maiņu grafiks')],'basis'=>{'year'=>year,'month'=>month,'workdays'=>s['workdays'],'first'=>first.iso8601,'last'=>last.iso8601}}
  end

  def holiday_note(year,month,memorial=false)
    first,last=period(year,month);s=stats(first,last);name=period_name(year,month)
    relevant=s['rows'].select { |r| memorial ? !r['dayOff'] : r['dayOff'] }.uniq { |r| [r['date'],r['title']] }
    examples=relevant.first(4).map { |r| "#{r['title']} (#{date_label(r['date'])}, #{weekday(r['date'])})" }.join('; ')
    ps=["#{name.capitalize} izvēlētās #{memorial ? 'atceres un atzīmējamo dienu' : 'svētku brīvdienu'} kategorijas ierakstu skaits ir #{relevant.length}. #{examples.empty? ? 'Šīs kategorijas ierakstu neesamība nenozīmē, ka mēnesī nav citu nozīmīgu dienu vai personisku notikumu.' : 'Datumu piemēri: '+examples+'.'} Pilnā pārskatā salīdzini arī datuma veidu, ne tikai tā nosaukumu.","#{memorial ? "#{year}. gada atceres ieraksti" : "#{year}. gada svētku datumi"} izmantojami dažādiem plāniem: pasākumam vajadzīga rīkotāja programma, bet atvaļinājuma plānam vajadzīga darba režīma un brīvdienas statusa pārbaude. #{month ? "#{MONTHS[month-1].capitalize} šajā gadā sākas ar datumu #{first.strftime('%d.%m.%Y.')} (#{weekday(first)}) un beidzas ar #{last.strftime('%d.%m.%Y.')} (#{weekday(last)})." : "Gada kopējā pirmdienas–piektdienas pamatā pēc svētku brīvdienu atņemšanas ir #{s['workdays']} darbadienas."} Atceres dienu automātiski neuzskata par brīvu darba dienu."]
    {'heading'=>"#{name.capitalize}: datuma veids un lietojums",'paragraphs'=>ps,'icon'=>memorial ? 'memorial' : 'holiday','sources'=>source(['holidays']),'related'=>[link('/svetki-un-tradicijas/','Svētku un piemiņas apraksti'),link("/darba-dienu-kalendars/#{year}/",'Darba dienu pārskats')],'basis'=>{'year'=>year,'month'=>month,'recordCount'=>relevant.length}}
  end

  def authored_sources(url)
    extra=(@extra.fetch('directTargets')+[@extra.fetch('educationPage')]+@extra.fetch('culturalPages')).find { |row| row['url']==url }
    return source(extra['sourceIds']) if extra && Array(extra['sourceIds']).any?
    return source(['names-traditional','names-extended']) if url.include?('varda') || url.include?('vardu')
    return source(['holidays','labor']) if url.match?(/darba|atvalinajuma|brivdienas/)
    return source(['school']) if url.match?(/skolas|parbaudes/)
    return source(['holidays']) if url.match?(/svetk|atceres|nozimigas/)
    return [link('https://aa.usno.navy.mil/data/index','USNO astronomisko datu skaidrojumi')] if url.match?(/meness|pilnmeness|jaunmeness|saullekts|gadalaiki|astronom/)
    []
  end

  def for_route(route)
    url=route.fetch('URL path');family=route.fetch('Page family');slug=url.split('/').last;year=route['Year'].to_i;month=SLUGS.index(slug);month+=1 if month
    note=if @authored.key?(url)
      @authored.fetch(url).merge('icon'=>icon(url,family),'sources'=>authored_sources(url),'related'=>authored_related(url))
    elsif %w[year calendar_month].include?(family)
      calendar_note(year,month,family)
    elsif family=='month_index'
      month_index_note(year)
    elsif %w[print_index print_month].include?(family)
      print_note(year,month)
    elsif family=='iso_week'
      week_note(year,slug.to_i)
    elsif family=='week_index'
      count=Date.new(year,12,28).cweek
      {'heading'=>"#{year}. gada nedēļu robežas",'paragraphs'=>["ISO #{year}. nedēļu gadā ir #{count} nedēļas. Pirmā sākas #{date_label(Date.commercial(year,1,1),:locative)}, pēdējā beidzas #{date_label(Date.commercial(year,count,7),:locative)}. Šis diapazons var sākties vai beigties ārpus kalendāra gada; tieši tāpēc tabulā dots gan numurs, gan pirmdienas un svētdienas datums.","Izvēloties #{year}. gada nedēļu, atver pilnu septiņu dienu pārskatu un salīdzini to ar mēneša kalendāru. Piemēram, #{year}. gada 1. janvāris pieder ISO #{Date.new(year,1,1).cwyear}. gada #{Date.new(year,1,1).cweek}. nedēļai. Šo piederību saglabā arī kopīgotā darba vai mācību plānā, lai numuru nevarētu sajaukt ar citas nedēļu kārtības pierakstu."],'icon'=>'week','related'=>[link('/nedelu-numuri/','ISO nedēļu skaidrojums'),link("/kalendars/#{year}/",'Gada kalendārs')],'sources'=>[],'basis'=>{'year'=>year,'weekCount'=>count}}
    elsif %w[lunar_year lunar_month].include?(family)
      lunar_note(year,month)
    elsif %w[sun_city moon_city].include?(family)
      city_note(@cities.find { |c| c['id']==slug } || raise("Unknown city #{url}"),family)
    elsif %w[name_calendar name_day_month].include?(family)
      names_note(family=='name_calendar' ? route.fetch('Latvian title/topic') : nil,month)
    elsif %w[work_year work_month].include?(family)
      work_note(year,month)
    elsif %w[holiday_year holiday_month memorial_year].include?(family)
      holiday_note(year,month,family=='memorial_year')
    elsif family=='long_weekends'
      long_weekends_note(year)
    elsif %w[school_academic school_year_calendar].include?(family)
      school_note(year,slug,family)
    elsif family=='occasion'
      occasion_note(@occasions.fetch(slug))
    elsif family=='latvia_cultural'
      cultural_note(@cultural.fetch(url))
    elsif family=='garden'
      crop=@garden.fetch('crops').find { |c| c['id']==slug } || raise("Unknown crop #{url}")
      @garden_notes.fetch(slug).merge('icon'=>'garden','related'=>[link('/sejas-kalendars/','Sējas kalendārs'),link('/sejas-kalendars/menesis/maijs/','Maija dārza darbu pārskats')],'sources'=>source(crop['sourceIds']))
    elsif family=='garden_month'
      garden_month_note(month)
    elsif family=='horoscope'
      horoscope_note(@profiles.fetch(slug))
    elsif family=='latvia_special' && url.start_with?('/atceres-dienas/')
      note=holiday_note(2027,month,true)
      note['heading']="#{MONTHS[month-1].capitalize}: piemiņas un atzīmējamo datumu salīdzinājums"
      note['paragraphs'][0]="2027. gads kā datumu lasīšanas piemērs: "+note['paragraphs'][0]
      note
    else
      raise "Reading notes missing for #{url} (#{family})"
    end
    raise "Wrong paragraph count #{url}" unless note.fetch('paragraphs').length.between?(2,3)
    raise "Empty reading note #{url}" if note.fetch('paragraphs').any? { |text| text.strip.empty? }
    @pages[url]=note
  end

  def icon(url,family)
    return 'print' if url.include?('pdf')
    return 'planner' if url.match?(/izveidot|planotajs|tukss/)
    return 'names' if url.match?(/varda|vardu/)
    return 'astronomy' if url.match?(/aptums|astronom|perseidas/)
    return 'moon' if url.match?(/meness|pilnmeness|jaunmeness/)
    return 'sunrise' if url.match?(/saullekts|dienas-garums/)
    return 'seasons' if url.include?('gadalaiki')
    return 'school' if url.match?(/skolas|studiju|parbaudes|stundu/)
    return 'garden' if family=='garden'
    return 'family' if url.match?(/gimenes|dzimsanas/)
    return 'work' if url.match?(/darba|mainu|izmaksas/)
    return 'holiday' if url.match?(/svetk|atceres|nozimigas|brivdienas/)
    return 'zodiac' if url.match?(/horoskop|zodiak/)
    return 'privacy' if url.match?(/privatum|sikdatnu|noteikumi/)
    return 'about' if url.match?(/projek|avoti|kontakti|laboj|pieklust|redakc|fotograf/)
    'calendar'
  end
  def authored_related(url)
    if url.match?(/meness|pilnmeness|jaunmeness|saullekts|astronom|gadalaiki|perseidas|aptums|dienas-garums/)
      [link('/meness-kalendars/','Mēness kalendārs'),link('/saullekts-saulriets/','Saules laiki pilsētās')].reject { |x| x['url']==url }
    elsif url.match?(/privatum|sikdatnu|noteikumi|projek|avoti|kontakti|laboj|pieklust|redakc|fotograf/)
      [link('/avoti-un-metodika/','Avoti un metodika'),link('/kontakti/','Sazinies ar mums')].reject { |x| x['url']==url }
    elsif url.match?(/skolas|studiju|parbaudes|stundu/)
      [link('/skolas-brivlaiki/','Skolas brīvlaiki'),link('/studiju-kalendars/','Studiju kalendāri')].reject { |x| x['url']==url }
    else
      [link('/kalendars/','Gada kalendāri'),link('/visi-riki/','Visi plānošanas rīki')].reject { |x| x['url']==url }
    end
  end

  def long_weekends_note(year)
    first,last=period(year,nil);s=stats(first,last)
    off=s['offDates'].map { |d| Date.parse(d) }.select { |d| d.cwday<6 }
    edges=off.select { |d| [1,5].include?(d.cwday) }
    examples=edges.first(3).map { |d| "#{date_label(d)} (#{weekday(d)})" }.join('; ')
    {'heading'=>"#{year}. gada atpūtas posmu salīdzinājums",'paragraphs'=>["#{year}. gada datu kopā ir #{off.length} svētku brīvdienu datumi, kas iekrīt pirmdienā–piektdienā. No tiem #{edges.length} ir pirmdienā vai piektdienā#{examples.empty? ? '.' : ': '+examples+'.'} Ierastā piecu dienu nedēļā šie datumi var savienoties ar nedēļas nogali; kopīgus posmus lasi kā vienu atpūtas periodu, nevis saskaiti atkārtoti.","#{year}. gada pirmā diena ir #{weekday(first)}, bet pēdējā #{weekday(last)}. Gadu mijas atpūtas posms var turpināties ārpus šī gada pārskata, tāpēc pārbaudi abus perioda galus. Plānotājā norādītais atvaļinājuma darba dienu skaits ir atkarīgs no tava nedēļas modeļa; atsevišķi apstiprināta darba dienas pārcelšana vai maiņu cikls var mainīt rezultātu."],'icon'=>'vacation','sources'=>source(['holidays','labor']),'related'=>[link('/atvalinajuma-planotajs/','Salīdzināt atvaļinājumu'),link("/svetku-dienas/#{year}/",'Gada svētku dienas')],'basis'=>{'year'=>year,'weekdayOffDates'=>off.map(&:iso8601),'mondayFridayOffDates'=>edges.map(&:iso8601)}}
  end
  def month_index_note(year)
    year_first,year_last=period(year,nil)
    month_starts=(1..12).select { |m| Date.new(year,m,1).cwday>=6 }.map { |m| MONTHS[m-1] }
    ps=["#{year}. gada mēnešu izvēlnē ir 12 atsevišķi periodi ar katram atbilstošu datumu izkārtojumu. Mēnesis ar vienu nosaukumu dažādos gados nav savstarpēji aizvietojams: šajā gadā februārī ir #{Date.new(year,2,-1).day} dienas, bet kopējais gada dienu skaits ir #{(year_last-year_first).to_i+1}. Izvēloties mēnesi šeit, vari turpināt ar tā paša gada interaktīvo skatu un drukas veidnēm.","#{year}. gadā mēneši, kuru pirmā diena ir sestdiena vai svētdiena: #{month_starts.join(', ')}. To sākuma kalendāra rindās ir vairāk iepriekšējā mēneša datumu, tāpēc šīs rūtiņas noder pilnas nedēļas salīdzinājumam. Ja plāns šķērso mēneša robežu, pārbaudi arī nākamā mēneša sākumu un precīzo datumu, ne tikai redzamo rindas vietu."]
    {'heading'=>"#{year}. gada 12 mēneši: izvēle un robežas",'paragraphs'=>ps,'icon'=>'calendar','related'=>[link("/kalendars/#{year}/",'Gada pārskats'),link("/pdf-kalendari/#{year}/",'Gada drukas veidnes')],'sources'=>[],'basis'=>{'year'=>year,'februaryDays'=>Date.new(year,2,-1).day,'weekendMonthStarts'=>month_starts}}
  end
  def school_note(year,slug,family)
    label=family=='school_academic' ? slug.split('-').first+'./'+(slug.split('-').first.to_i+1).to_s+'. mācību gads' : year.to_s+'. kalendāra gads'
    {'heading'=>"#{label}: ko vēl pārbaudīt",'paragraphs'=>["Šīs lapas tvērums ir #{label.downcase}. Apstiprināts pilns brīvlaiku grafiks šeit vēl nav publicēts, tāpēc tukšu sarakstu neaizstājam ar iepriekšējā gada datumiem. Gadu pāra pieraksts attiecas uz vienu mācību gadu, bet viena kalendāra gada pārskats var aptvert divu mācību gadu daļas.","Plānam, kura tvērums ir #{label.downcase}, pārbaudi konkrētās klases un skolas paziņojumu. Eksāmeni, konsultācijas un citi pienākumi var attiekties uz datumiem ārpus ierastā stundu saraksta. Pārej uz publicēto skolas brīvlaiku pārskatu vai attiecīgās iestādes avotu; universitātes semestra pārtraukumu no šīs skolas lapas secināt nevar."],'icon'=>'school','sources'=>[link('https://www.izm.gov.lv/lv','Izglītības un zinātnes ministrija')],'related'=>[link('/skolas-brivlaiki/','Publicētie skolu termiņi'),link('/valsts-parbaudes-darbi/','Valsts pārbaudes darbu pārskats')],'basis'=>{'status'=>'not-published','label'=>label}}
  end
  def occasion_note(article)
    dates=article.fetch('dates').select { |r| Date.parse(r['date']).year.between?(2027,2030) }.sort_by { |r| r['date'] }
    first=dates.first;last=dates.last
    examples=[first,last].compact.uniq { |r| r['date'] }.map { |r| "#{date_label(r['date'])} — #{weekday(r['date'])}" }.join('; ')
    status=article['dayOff'] ? 'Svētku brīvdienas statusu pārbaudi attiecīgā datuma ierakstā un tiesību aktā.' : 'Šī tēma pati par sevi nenozīmē vispārēju Latvijas darba brīvdienu.'
    reminder=first ? "Personiska plāna piemērs tēmai «#{article['title']}»: atskaites datums ir #{date_label(first['date'])}, bet vienas nedēļas sagatavošanās atgādinājums — #{date_label(Date.parse(first['date'])-7)}. Tas nav rīkotāja izziņots pasākuma grafiks." : 'Pasākuma sagatavošanās atgādinājumu piesaisti pārbaudītam rīkotāja datumam.'
    {'heading'=>article['title']+': kalendāra ieraksts savā plānā','paragraphs'=>["«#{article['title']}» pārskatā atrodamas šādas datumu robežas: #{examples}. Viena temata nedēļas diena gadu gaitā var mainīties, tāpēc ierakstu nesaglabā kā nemainīgu nedēļas dienu. #{status}",reminder+' Dalībai pievieno norises vietu, sākuma laiku un programmas saiti atsevišķi no kalendārā norādītā nosaukuma.'],'icon'=>article['type']=='commemoration' ? 'memorial' : 'culture','sources'=>[],'related'=>TRADITION_LINKING.tools(article['slug']).map { |tool| link(tool['url'],tool['label']) },'basis'=>{'slug'=>article['slug'],'dates'=>dates.map { |r| r['date'] }}}
  end
  def cultural_note(article)
    dates=(2027..2030).flat_map { |y| @cultural_dates.call(article,y) }.sort_by { |row| row['date'] }
    model=article.fetch('dateModel');first=dates.first;last=dates.last
    examples=[first,last].compact.uniq { |r| r['date'] }.map { |r| "#{date_label(r['date'])} (#{weekday(r['date'])}#{model['type']=='fixed' ? '' : '; '+[r['title'],r['scope']].compact.join(', ')})" }.join('; ')
    p1=if dates.empty?
      "«#{article['title']}» nav attēlots kā viens visiem Latvijas notikumiem obligāts datums. #{model['rule'] || model['eventDate'] || 'Dažādas tradīcijas un konkrētu pasākumu rīkotāji var lietot atšķirīgu laika izvēli.'} Pirms saglabā personīgu plānu, izvēlies, uz kuru tradīciju vai konkrēto pasākumu tas attiecas."
    else
      "Tēmas «#{article['title']}» aprēķināto vai fiksēto datumu piemēri 2027.–2030. gada tvērumā: #{examples}. Tie ir kalendāra atskaites datumi, nevis automātiski apstiprināta pasākumu programma. #{article['isStatutoryWorkFreeHoliday'] ? 'Darba brīvdienas statusam nolasāms arī konkrētais tiesiskais pamats.' : 'No šī temata nosaukuma nevar secināt vispārēju darba brīvdienu Latvijā.'}"
    end
    fact=article.fetch('factNotes').first
    p2="Plānojot «#{article['title']}», ievēro šo atšķirību: #{fact} Kalendāra piezīmē atsevišķi pieraksti izvēlēto norisi un tās avotu, lai gadskārtējais nosaukums netiktu sajaukts ar vienas vietas vai konfesijas programmu. Salīdzini arī šajā lapā norādītās saistītās tēmas un pirmavotus."
    slug=article.fetch('url').split('/').last
    {'heading'=>'Datuma pamats un personīgā plāna izvēle','paragraphs'=>[p1,p2],'icon'=>'culture','sources'=>[],'related'=>TRADITION_LINKING.tools(slug).map { |tool| link(tool['url'],tool['label']) },'basis'=>{'dateModel'=>model['type'],'dates'=>dates.map { |r| r['date'] }}}
  end
  def garden_month_note(month)
    active=@garden.fetch('crops').select { |c| @garden_actions.call(c).any? { |a| %w[sow plant].include?(a['task']) && Array(a['months']).include?(month) } }
    harvest=@garden.fetch('crops').select { |c| @garden_actions.call(c).any? { |a| a['task']=='harvest' && Array(a['months']).include?(month) } }
    active_names=active.first(6).map { |c| c['name'] }.join(', ')
    harvest_names=harvest.first(5).map { |c| c['name'] }.join(', ')
    a=active.empty? ? "#{LOC[month-1].capitalize} šajā datu kopā nav kultūraugu sējas vai stādīšanas pamatloga. Tas nav apgalvojums, ka dārzā nav nekā darāma: šķirņu izvēli, pierakstus un audzēšanas vietas sagatavošanu vari plānot atsevišķi." : "#{LOC[month-1].capitalize} kultūraugu skaits ar sējas vai stādīšanas orientieri ir #{active.length}; piemēri — #{active_names}. Šie logi nav viens kopīgs izstādīšanas datums: pie katra auga jālasa audzēšanas vieta, šķirne un augsnes vai salnu nosacījumi."
    b=harvest.empty? ? "#{MONTHS[month-1].capitalize} pārskatā nav atsevišķi norādītu ražas periodu. Šī atzīme attiecas tikai uz šeit iekļautajiem kultūraugiem un avotu orientieriem; tā neapraksta katru Latvijas saimniecību, siltumnīcu vai glabāto ražu." : "#{MONTHS[month-1].capitalize}: kultūraugu skaits ar ražas orientieri ir #{harvest.length}; piemēri — #{harvest_names}. Gatavību pārbaudi pēc augam un šķirnei atbilstošām pazīmēm, nevis novāc visu tikai mēneša maiņas dēļ."
    b+=' Personīgajā pierakstā saglabā novērojumu un faktiskā darba dienu; nākamajā sezonā tas būs precīzāks tava dārza salīdzinājums par vispārīgu mēneša nosaukumu.'
    protected_examples=harvest.flat_map { |c| @garden_actions.call(c).select { |r| r['task']=='harvest' && Array(r['months']).include?(month) && r['places']==['greenhouse'] }.map { |r| "#{c['name']}: #{r['window']}. #{r['condition']}" } }.first(2)
    b+=' Segtās platības piemērs: '+protected_examples.join(' ') unless protected_examples.empty?
    source_ids=(active+harvest).uniq { |c| c['id'] }.flat_map { |c| @garden_actions.call(c).select { |r| Array(r['months']).include?(month) }.flat_map { |r| Array(r['sourceIds']) } }.uniq
    source_ids=['garden-di-guide','garden-di-april'] if source_ids.empty?
    {'heading'=>"#{MONTHS[month-1].capitalize}: kā pārvērst orientieri dārza darbā",'paragraphs'=>[a,b],'icon'=>"month-#{month}",'sources'=>source(source_ids),'related'=>[link('/sejas-kalendars/','Visi kultūraugi un to apraksti'),link('/saullekts-saulriets/','Saules laiki dārza darbu plānam')],'basis'=>{'month'=>month,'sowingCropIds'=>active.map { |c| c['id'] },'harvestCropIds'=>harvest.map { |c| c['id'] }}}
  end
  def horoscope_note(profile)
    prompts={'auns'=>'Kuru pirmo soli vari pabeigt, pirms uzņemies nākamo?','versis'=>'Kas šodien jānostiprina, lai ieradums būtu vienkāršāk uzturams?','dvini'=>'Kuru jautājumu vajadzētu precizēt pirms tālākas sarunas?','vezis'=>'Kādu mazu, konkrētu rūpi vari parādīt sev vai tuvam cilvēkam?','lauva'=>'Kuram darbam tu vēlies piešķirt personīgu un pamanāmu kvalitāti?','jaunava'=>'Kura viena detaļa patiešām palīdzēs uzdevumu pabeigt?','svari'=>'Kuras izvēles priekšrocības un trūkumi tev jānosauc skaidri?','skorpions'=>'Kuru pieņēmumu vari pārbaudīt, pirms uz to paļaujies?','strelnieks'=>'Kā plašu ieceri pārvērst vienā šodien izmēģināmā darbībā?','mezazis'=>'Kurš mazais posms palīdzēs turpināt ilgāku plānu?','udensvirs'=>'Kuru jaunu pieeju vari izmēģināt nelielā un pārskatāmā apjomā?','zivis'=>'Kā domu vai izjūtu izteikt vienā saprotamā iecerē?'}
    name=profile.fetch('name');prompt=prompts.fetch(profile.fetch('slug'))
    {'heading'=>"#{name}: no simboliskas tēmas līdz savai iecerei",'paragraphs'=>["«#{name}» apraksts pieder populārās Rietumu astroloģijas simbolikai; zīmei šajā tradīcijā norādīts elements «#{profile.dig('element','label')}». Tas nav mērījums par konkrētu cilvēku. Lasījumu vari pārvērst savā pārdomu jautājumā: #{prompt} Atbildē izmanto savu situāciju, nevis pieņem tekstu par nenovēršamu nākotnes notikumu.","Saglabājot piezīmi pie #{profile['genitive']} lasījuma, ieraksti vienu darbību un datumu, kad vēlies to pārskatīt. Dienas tēma un pastāvīgais zīmes apraksts ir atšķirīgs saturs; vispirms nolasi rādīto izdevuma datumu. Šī pašrefleksijas izvēle neaizstāj veselības, finanšu vai juridisku jautājumu profesionālu izvērtējumu."],'icon'=>'zodiac','sources'=>[],'related'=>[link('/zodiaka-zimes/','Zīmju simbolu pārskats'),link('/dienas-planotajs/','Mana dienas iecere')],'basis'=>{'sign'=>profile['slug'],'contentType'=>'symbolic_entertainment'}}
  end
end
