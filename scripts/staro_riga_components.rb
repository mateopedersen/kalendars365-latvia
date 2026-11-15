# Confirmed festival evenings stay separate from recurring public holidays.
def staro_riga_data
  @staro_riga_data ||= JSON.parse(File.read('_data/staro-riga.json'))
end

def staro_riga_calendar
  data=staro_riga_data
  escape=->(text){text.gsub('\\','\\\\').gsub("\n",'\\n').gsub(';','\\;').gsub(',','\\,')}
  lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Kalendars365.lv//Staro Riga//LV','CALSCALE:GREGORIAN','METHOD:PUBLISH','X-WR-CALNAME:Staro Rīga 2026','X-WR-TIMEZONE:Europe/Riga']
  (Date.iso8601(data.fetch('startDate'))..Date.iso8601(data.fetch('endDate'))).each do |date|
    lines += ['BEGIN:VEVENT',"UID:staro-riga-#{date.iso8601}@kalendars365.lv",'DTSTAMP:20261115T081315Z',"DTSTART:#{date.strftime('%Y%m%d')}T150000Z","DTEND:#{date.strftime('%Y%m%d')}T210000Z",'SUMMARY:Staro Rīga 2026','LOCATION:Rīga',"DESCRIPTION:#{escape.call("Gaismas festivāls Rīgā. Plkst. 17.00–23.00 pēc Latvijas laika. Bezmaksas ieeja. Pirms došanās pārbaudi oficiālo programmu: #{data.fetch('programmeUrl')}")}",'URL:https://kalendars365.lv/svetki-un-tradicijas/staro-riga/','TRANSP:TRANSPARENT','END:VEVENT']
  end
  lines << 'END:VCALENDAR'
  # RFC 5545: fold at 75 UTF-8 octets without splitting a character.
  folded=lines.flat_map do |line|
    chunks=[];chunk=''
    line.each_char do |character|
      if chunk.bytesize+character.bytesize>75
        chunks << chunk;chunk=' '
      end
      chunk+=character
    end
    chunks << chunk
  end
  FileUtils.mkdir_p('kalendari')
  File.binwrite('kalendari/staro-riga-2026.ics',folded.join("\r\n")+"\r\n")
end

def staro_riga_page(article)
  data=staro_riga_data;slug=article.fetch('slug');photo=data.fetch('galleryPhoto')
  evenings=article.fetch('dates').map do |row|
    date=Date.iso8601(row.fetch('date'))
    weekday=%w[Pirmdiena Otrdiena Trešdiena Ceturtdiena Piektdiena Sestdiena Svētdiena][date.cwday-1]
    %(<article id="datums-#{date.iso8601}" tabindex="-1"><span>#{weekday}</span><h3><time datetime="#{date.iso8601}">#{date.day}. novembris</time></h3><p>17.00–23.00</p>#{a("/?date=#{date.iso8601}&view=day",'Skatīt dienu kalendārā')}</article>)
  end.join
  <<~HTML
    <article class="staro-riga occasion-story">
      <section class="staro-riga-overview" aria-labelledby="staro-ievads">
        <span class="eyebrow">ČETRI VAKARI PILSĒTĀ</span><h2 id="staro-ievads">Kas ir Staro Rīga?</h2>
        <p>#{tradition_text_markup(slug,article.fetch('intro'),'intro')}</p>
        <div class="staro-facts"><div><span>Norises laiks</span><strong>15.–18. novembris</strong><small>2026. gads</small></div><div><span>Katru vakaru</span><strong>17.00–23.00</strong><small>Pēc Latvijas laika</small></div><div><span>Ieeja</span><strong>Bez maksas</strong><small>Brīvdabas festivāls</small></div><div><span>Programma</span><strong>52 gaismas objekti</strong><small>Abos Daugavas krastos</small></div></div>
        <div class="staro-actions">#{a(data.fetch('mapUrl'),'Atvērt oficiālo objektu karti','button primary')}#{a(data.fetch('programmeUrl'),'Lasīt festivāla programmu','button')}</div>
        <p class="staro-note">Datumi un laiks pārbaudīti 15.11.2026. Oficiālajā kartē pārbaudi konkrēto objektu atrašanās vietas un jaunākos paziņojumus; šī lapa nav festivāla rīkotāja vietne.</p>
      </section>
      #{tradition_context_markup(slug)}
      <section id="datumi" aria-labelledby="staro-datumi"><span class="eyebrow">IZVĒLIES SAVU VAKARU</span><h2 id="staro-datumi">Kad notiek Staro Rīga 2026?</h2><p>Visos četros vakaros norādīts vienāds apmeklējuma laiks. Izvēlies dienu, kas der tavam maršrutam un ceļam mājup.</p><div class="staro-evenings">#{evenings}</div>
        <div class="staro-actions"><a class="button" href="/kalendari/staro-riga-2026.ics" download="staro-riga-2026.ics">Saglabāt četrus vakarus kalendārā</a></div><p class="staro-note">ICS fails paredzēts Apple Calendar, Google Kalendāram un Outlook. Atver vai importē to savā kalendāra lietotnē. Tas pievieno četrus sešu stundu notikumus Latvijas laikā; šī ir vienreizēja kopija, kas pati neatjaunojas. Atgādinājuma laiku izvēlies lietotnē.</p>
      </section>
      <div class="staro-route-grid"><section><span class="eyebrow">2026. GADA PROGRAMMA</span><h2>Viens mirklis, vairāki gaismas loki</h2><p>Šī gada tēma ir «unum momentum – tas viens mirklis». Rīkotāji aicina meklēt gaismas mākslu pilsētvidē, nevis tikai vienā skatuvē. Programmā ir 52 objekti: instalācijas, projekcijas un citi darbi, kurus apskata vakara pastaigā.</p><p>Objekti izvietoti abos Daugavas krastos no Gaismas pils un Mūkusalas promenādes līdz Spīķeriem, Vecrīgai, centra parkiem un Viesturdārzam. Precīzo pieturu secību izvēlies oficiālajā kartē, nevis pēc iepriekšējo gadu fotogrāfijām.</p></section><section class="staro-tips"><h2>Kā ieplānot pastaigu?</h2><ol><li><strong>Izvēlies nelielu maršrutu.</strong><p>Atzīmē dažus tuvumā esošus objektus un ērtu sākumpunktu. Visa festivāla apskate vienā vakarā nav obligāta.</p></li><li><strong>Atstāj laiku starp pieturām.</strong><p>Pie populāriem objektiem var būt vairāk cilvēku. Ja dodies ar bērniem, ieplāno iespēju sasildīties un saīsināt pastaigu.</p></li><li><strong>Pārbaudi ceļu mājup.</strong><p>Pirms došanās apskati laikapstākļus un sava transporta pēdējo reisu. Uzlādē telefonu, lai karte būtu pieejama arī pastaigas beigās.</p></li></ol></section></div>
      <div class="staro-reading"><section><h2>Vai festivāla dienas ir brīvdienas?</h2><p>Staro Rīga ir kultūras notikums. Festivāla norise pati par sevi nepadara visas četras dienas par valsts svētku brīvdienām. 18. novembris ir Latvijas Republikas proklamēšanas diena tā ir likumā noteikta svētku diena. Pārējos vakarus plāno atbilstoši savai darba vai mācību nedēļai.</p><h2>Īstas fotogrāfijas no festivāla arhīva</h2><p>Lapas ievadā redzams Saeimas nams, bet šeit Rātslaukums. Abi attēli uzņemti 2011. gadā. Tie parāda festivāla noskaņu, taču neapliecina, ka šie gaismas darbi ir 2026. gada programmā. Šī gada objektus meklē rīkotāju kartē.</p><p class="staro-note"><a href="/pilsetas-un-fotografijas/#occasion-photo-occasion-staro-riga">Ievada foto autors, avots un licence</a>.</p></section><figure class="staro-archive-photo"><img src="#{h(photo.fetch('src'))}" srcset="#{h(photo.fetch('srcset'))}" sizes="(max-width: 800px) calc(100vw - 48px), 560px" width="#{photo.fetch('width')}" height="#{photo.fetch('height')}" alt="#{h(photo.fetch('alt'))}" loading="lazy" decoding="async"><figcaption>#{h(photo.fetch('caption'))}<br>#{a('/pilsetas-un-fotografijas/#staro-riga-foto','Foto autors, avots un licence')}.</figcaption></figure></div>
      <section class="staro-faq" aria-labelledby="staro-jautajumi"><h2 id="staro-jautajumi">Biežākie jautājumi par Staro Rīga</h2><details><summary>Vai vajadzīga biļete?</summary><p>LiveRiga norāda, ka gaismas festivāla apmeklējums ir bez maksas. Pirms izvēlētās pieturas apskati objekta aprakstu oficiālajā programmā.</p></details><details><summary>Kur atrast Staro Rīga karti un programmu?</summary><p>Izmanto šīs lapas saiti uz rīkotāju interaktīvo objektu karti. Tajā vari izvēlēties tuvākos objektus un saplānot savu pastaigu. Programmas saite ved uz festivāla oficiālo vietni.</p></details><details><summary>Vai Staro Rīga notiks arī 2027. gadā?</summary><p>Pārbaudītajos oficiālajos avotos 2027. gada pilnā programma un norises datumi vēl nav izziņoti. Arī 2028.–2030. gada datumus šeit neparedzam pēc iepriekšējā gada. Kad rīkotāji publicēs apstiprinātu informāciju, to varēs salīdzināt ar šo ceļvedi.</p></details></section>
      <section aria-labelledby="staro-riki"><h2 id="staro-riki">Noderīgi pastaigas plānošanai</h2><ul>#{TRADITION_LINKING.tools(slug).map{|tool|%(<li>#{a(tool.fetch('url'),tool.fetch('label'))} #{h(tool.fetch('reason'))}</li>)}.join}</ul></section>
      #{tradition_sources_markup(slug)}
      #{tradition_related_markup(slug)}
    </article>
  HTML
end
