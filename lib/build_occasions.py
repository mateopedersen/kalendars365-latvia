"""Source-checked Latvian occasion articles; generated dates use the shared dataset.
Editorial prose is deliberately separate from the statutory day-off classification.
No future municipal event programme, opening hours or ticket information is invented.
"""
import json
from pathlib import Path
from datetime import date
from html import escape

ROOT=Path(__file__).resolve().parents[1]
DATA=json.loads((ROOT/'assets/calendar-data.json').read_text())
LAW='https://likumi.lv/ta/id/72608-par-svetku-atceres-un-atzimejamam-dienam'
LABOR='https://likumi.lv/ta/id/26019-darba-likums'
USNO='https://aa.usno.navy.mil/data/api.html'
NASA='https://spaceplace.nasa.gov/seasons/en/'
FESTIVAL='https://likumi.lv/ta/id/367734-par-xxviii-visparejo-latviesu-dziesmu-un-xviiideju-svetku-norises-laiku'
KM='https://www.km.gov.lv/lv/jaunums/nakamie-visparejie-latviesu-dziesmu-un-deju-svetki-notiks-2028-gada-vasara'
LIAA='https://www.latvia.travel/en/culture-and-traditions-latvia'
FOOD='https://www.latvia.travel/en/flavours-latvia'
MAY4='https://saeima.lv/lv/aktualitates/neatkaribas-atjaunosanas-deklaracijai-35/'
LAC='https://www.president.lv/lv/jaunums/valsts-prezidenta-uzruna-militaraja-parade-par-godu-lacplesa-dienai'
BAR='https://barikades.lv/atskats-uz-barikazu-32-gadadienas-atceres-pasakumiem/'
DEPORT='https://okupacijasmuzejs.lv/storage/Padomju-deport%C4%81cijas---att%C4%81lin%C4%81ti_86dd0c5d-ef75-4b54-a197-f8c720b0b720.pdf'
LATGALE='https://www.saeima.lv/lv/aktualitates/saeimas-zinas/27019-saeima-par-atzimejamo-dienu-nosaka-latgales-kongresa-dienu'
EU='https://european-union.europa.eu/principles-countries-history/europe-day_en?prefLang=uk'
BALTIC='https://saeima.lv/lv/aktualitates/saeimas-zinas/33845-saeimas-priekssedetaja-pakroja-baltu-vienibas-diena-atgadina-par-baltu-tautu-speku'
LANG='https://valoda.lv/wp-content/uploads/2025/10/VVD_Saskaiti-valodu_LVA_2025.pdf'
TEACH='https://www.saeima.lv/lv/aktualitates/saeimas-zinas/33373-skolotaju-dienu-turpmak-atzimes-5-oktobri?phrase=k8.Saeima'
WOMEN='https://gendercoordinationandmainstreaming.unwomen.org/'
MONTHS='janvāris februāris marts aprīlis maijs jūnijs jūlijs augusts septembris oktobris novembris decembris'.split()
DAYS='pirmdiena otrdiena trešdiena ceturtdiena piektdiena sestdiena svētdiena'.split()

def cite(url,title): return f'<a href="{escape(url,quote=True)}" rel="noopener">{escape(title)}</a>'
def p(text):return '<p>'+text+'</p>'
def section(title,text):return '<h2>'+escape(title)+'</h2>'+p(text)
def label(value):
    d=date.fromisoformat(value)
    return f'{d.year}. gada {d.day}. {MONTHS[d.month-1]}'

ARTICLES=[]
def add(slug,title,description,terms,paras,sources=None,extra='',season=None):
    sources=list(dict.fromkeys([LAW]+(sources or [])))
    matches=[r for r in DATA['holidays'] if 2027<=int(r['date'][:4])<=2030 and any(t.casefold() in r['title'].casefold() for t in terms)]
    body=''.join(p(t) for t in paras)+extra
    if season:
        matches=[r for r in DATA['seasons'] if r['phenomenon']=='Solstice' and (season=='all' or ('Vasaras' if season=='summer' else 'Ziemas') in r['title'])]
        body+='<h2>Saulgriežu brīži 2027.–2030. gadā</h2><p>Laiks norādīts Latvijas laika joslā Europe/Riga, 24 stundu formātā.</p><div class="table-scroll"><table class="data-table"><thead><tr><th>Notikums</th><th>Datums</th><th>Laiks Latvijā</th></tr></thead><tbody>'
        for r in matches: body+=f'<tr><td>{escape(r["title"])}</td><td><time datetime="{r["date"]}">{label(r["date"])}</time></td><td>{r["time"]}</td></tr>'
    else:
        body+='<h2>Datumi 2027.–2030. gadā</h2><div class="table-scroll"><table class="data-table"><thead><tr><th>Datums</th><th>Nedēļas diena</th><th>Kalendāra ieraksts</th><th>Statuss</th></tr></thead><tbody>'
        for r in matches:
            status={'holiday':'Svētku diena','substitute':'Papildu brīvdiena','commemoration':'Atceres diena','observance':'Atzīmējama diena'}[r['type']]
            body+=f'<tr><td><time datetime="{r["date"]}">{label(r["date"])}</time></td><td>{DAYS[date.fromisoformat(r["date"]).weekday()]}</td><td>{escape(r["title"])}</td><td>{status}</td></tr>'
    body+='</tbody></table></div>'
    body+='<p class="fineprint">Avoti pārbaudīti 2026. gada 22. oktobrī. Nākotnes tiesību aktu grozījumi vai pasākumu norises izmaiņas var mainīt plānošanu.</p>'
    ARTICLES.append({'slug':slug,'title':title,'description':description,'bodyHtml':body,'verified':True,'sourceUrls':sources,'matchTerms':terms,'checked':'2026-10-22','reviewStatus':'primary_sources_checked','nativeEditorReviewed':False,'dates':matches})

add('jaungada-diena','Jaungada diena','1. janvāris Latvijā: svētku dienas statuss un nedēļas dienas 2027.–2030. gadā.',['Jaungada diena'],[
 'Jaungada diena Latvijā ir 1. janvāris. Tā ir valsts noteikta svētku diena, ar kuru sākas jaunais kalendāra gads. 31. decembris kalendārā ir atsevišķa svētku diena — Vecgada diena; abus datumus plānotājā ir vērts atzīmēt atsevišķi.',
 '2027. gadā 1. janvāris ir piektdienā, tādēļ cilvēkam ar ierasto piecu dienu darba nedēļu izveidojas trīs brīvas dienas pēc kārtas. 2028. gadā tas ir sestdienā, bet 2029. un 2030. gadā — attiecīgi pirmdienā un otrdienā. Likums neparedz automātisku papildu pirmdienas brīvdienu par katru nedēļas nogalē iekritušu Jaungada dienu.'
],extra=section('Gadu robeža un nedēļas numurs','Datums gada sākumā var piederēt iepriekšējā ISO nedēļu gada pēdējai nedēļai. Piemēram, 2027. gada 1. janvāris ir 2026. gada 53. ISO nedēļā. Tas nemaina svētku datumu vai kalendāra gadu.'))

add('liela-piektdiena','Lielā Piektdiena','Lielās Piektdienas datumi, saistība ar Lieldienām un brīvdienu plānošana.',['Lielā Piektdiena'],[
 'Lielā Piektdiena ir piektdiena divas dienas pirms Pirmajām Lieldienām. Latvijas svētku dienu likumā tā ir noteikta par svētku dienu. Datums ir mainīgs: to aprēķina attiecīgā gada Rietumu kristīgās tradīcijas Lieldienu ciklā.',
 'Lielā Piektdiena, sestdiena, Pirmās Lieldienas un Otrās Lieldienas veido četru dienu posmu. Cilvēkam, kurš strādā no pirmdienas līdz piektdienai, šajā posmā nav jāizmanto ikgadējais atvaļinājums, ja darba grafikā nav īpašu nosacījumu. Maiņu darba grafiku nosaka atsevišķi.'
],[USNO,LABOR],section('Pirms svētkiem','Ceturtdiena pirms Lielās Piektdienas šajā kalendārā ir pirmssvētku diena. Standarta darba laika aprēķinā tai piemēro Darba likuma 135. pantā paredzēto vienas stundas saīsinājumu. Dievkalpojuma vai vietējā pasākuma laiku pārbaudi pie tā rīkotāja.'))

add('lieldienas','Lieldienas','Pirmās un Otrās Lieldienas 2027.–2030. gadā: mainīgie datumi un brīvdienu posms.',['Pirmās Lieldienas','Otrās Lieldienas'],[
 'Latvijā par svētku dienām ir noteiktas Pirmās un Otrās Lieldienas. Pirmās Lieldienas ir svētdienā, Otrās — nākamajā pirmdienā. Tās katru gadu nav vienā un tajā pašā datumā: 2027. gadā svētdiena ir 28. martā, 2028. gadā — 16. aprīlī, 2029. gadā — 1. aprīlī, 2030. gadā — 21. aprīlī.',
 'Kalendārs izmanto Gregora kalendāra Lieldienu aprēķinu. Tas atbilst šeit izmantotajam Latvijas svētku dienu sarakstam; citu konfesiju svinību datumi var atšķirties. Astronomiskais pilnmēness kalendārā nav jāizmanto kā aizstājējs baznīcas Lieldienu datuma noteikšanai.'
],[USNO],section('Plānojot brīvdienas','Pieskaiti arī Lielo Piektdienu: piecu dienu darba nedēļā parasti izveidojas četras secīgas brīvdienas. Skolēnu pavasara brīvlaiks ir atsevišķs periods, ko nosaka konkrētā mācību gada noteikumi; tas ne vienmēr sakrīt ar Lieldienām.'))

add('darba-svetki','Darba svētki','1. maijs ir Darba svētki un Satversmes sapulces sasaukšanas diena.',['Darba svētki'],[
 '1. maijam Latvijas oficiālajā kalendārā ir divi nosaukumi: Darba svētki un Latvijas Republikas Satversmes sapulces sasaukšanas diena. Tas ir viens datums ar svētku dienas statusu. Darba dienu aprēķinā to atņem vienu reizi, pat ja kalendārā redzami abi nosaukumi.',
 '1. maijs un 4. maijs ir divas atsevišķas svētku dienas. Starp tām esošās darba dienas nekļūst brīvas automātiski. Ja darba devējs vai Ministru kabinets nosaka darba dienas pārcelšanu, tā jāņem vērā pēc konkrētā rīkojuma publicēšanas.'
],[LABOR],section('Ko rāda nedēļas nogale','2027. gadā 1. maijs iekrīt sestdienā. Atšķirībā no 4. maija šim datumam likumā nav paredzēta automātiska nākamās darbdienas atbrīvošana. Tāpēc 3. maijs pamataprēķinā paliek darba diena, līdz ir pārbaudīts piemērojams pārcelšanas lēmums.'))

add('neatkaribas-atjaunosanas-diena','Neatkarības atjaunošanas diena','4. maijs: neatkarības atjaunošanas atcere, brīvdienas un 2030. gada aizstājošais datums.',['Neatkarības atjaunošanas diena','Brīvdiena pēc 4. maija'],[
 '4. maijā Latvija atzīmē neatkarības atjaunošanu. 1990. gada 4. maijā pieņemtā deklarācija atjaunoja 1918. gada 18. novembrī dibinātās Latvijas Republikas neatkarību. Šo saikni starp valsts dibināšanu un atjaunošanu skaidro '+cite(MAY4,'Saeimas materiāls par deklarāciju')+'.',
 '4. maijs ir svētku diena ar īpašu brīvdienas noteikumu: ja tas ir sestdienā vai svētdienā, nākamā darbdiena ir brīvdiena. 2030. gadā 4. maijs būs sestdienā, tāpēc šajā datu kopā papildu brīvdiena ir pirmdiena, 6. maijs.'
],[MAY4],section('Divi atšķirīgi maija datumi','1. maijs ir Darba svētki un Satversmes sapulces sasaukšanas diena. 4. maijs ir neatkarības atjaunošanas diena. Abiem ir svētku statuss, taču automātiskās aizstājošās brīvdienas noteikums šeit attiecas tikai uz 4. maiju.'))

add('mates-diena','Mātes diena','Mātes diena Latvijā ir maija otrajā svētdienā. Datumi 2027.–2030. gadam.',['Mātes diena'],[
 'Mātes diena Latvijā ir maija otrā svētdiena. Likums nosaka nedēļas dienas principu, tāpēc datums mainās no gada uz gadu. 2027. gadā tā ir 9. maijā, 2028. gadā — 14. maijā, 2029. gadā — 13. maijā, 2030. gadā — 12. maijā.',
 'Mātes diena ir iekļauta Latvijas svētku dienu sarakstā. Tā vienmēr iekrīt svētdienā; šim datumam nav paredzēta automātiska papildu pirmdienas brīvdiena. Darba grafika aprēķinā dienas juridiskais statuss saglabājas arī tad, ja svētdiena jau ir ierastā nedēļas atpūtas diena.'
],extra=section('Ģimenes plānotājā','Atzīmē kopā būšanas laiku, apsveikumu vai zvanu sev piemērotā veidā. 2027. gadā Mātes diena sakrīt ar Eiropas dienu; abi ieraksti kalendārā ir saglabāti, un viens neaizstāj otru.'))

add('vasarsvetki','Vasarsvētki','Vasarsvētku svētdienas 2027.–2030. gadā un saistība ar Lieldienu datumu.',['Vasarsvētki'],[
 'Vasarsvētki šajā kalendārā ir septītā svētdiena pēc Pirmajām Lieldienām — 49 dienas pēc Lieldienu svētdienas. Skaitot Lieldienas kā pirmo dienu, tā ir piecdesmitā diena. Datums pārvietojas kopā ar Lieldienu ciklu.',
 'Latvijas svētku dienu likumā Vasarsvētki ir svētku diena. Svētdienas svētku statuss pats par sevi nenozīmē, ka nākamā pirmdiena būtu valsts noteikta brīvdiena. Šajā kalendārā Vasarsvētku pirmdiena netiek automātiski atzīmēta kā brīva.'
],[USNO],section('Praktiska atšķirība no Lieldienām','Otrās Lieldienas likumā ir nosauktas atsevišķi. Vasarsvētku pirmdienai šāda atsevišķa svētku ieraksta nav. Plānojot braucienu vai ģimenes tikšanos, pārbaudi savu darba grafiku un izvēlētās draudzes pasākumu programmu.'))

add('ligo-diena','Līgo diena','23. jūnija svētku statuss, Līgo vakara tradīcijas un atšķirība no astronomiskajiem saulgriežiem.',['Līgo diena'],[
 'Līgo diena Latvijas oficiālajā kalendārā ir 23. jūnijs. Tā ir svētku diena; nākamajā datumā, 24. jūnijā, ir Jāņu diena. Līgo vakars un nakts uz Jāņu dienu veido vienotu svinību laiku, bet kalendārā tie ir divi atsevišķi datumi.',
 'Vainagu pīšana, jāņuzāļu lasīšana, ugunskurs un ķimeņu siers ir tradīcijas, ko apraksta '+cite(LIAA,'LIAA tūrisma portāls')+'. Tās raksturo kultūras svinības; ģimenes un novadi var izvēlēties atšķirīgus svinēšanas paradumus.'
],[LIAA,USNO],section('Līgo un vasaras saulgrieži','Astronomiskie vasaras saulgrieži ir precīzs Saules gada cikla brīdis. Tie nav katru gadu 23. jūnijā. Piemēram, 2028. gadā tie Latvijā iestājas 20. jūnijā plkst. 23.02, savukārt Līgo diena joprojām ir 23. jūnijs.'))

add('janu-diena','Jāņu diena','24. jūnijs Latvijā: Jāņu dienas datums, svētku statuss un vasaras plānošana.',['Jāņu diena'],[
 'Jāņu diena Latvijā ir 24. jūnijā, nākamajā dienā pēc Līgo dienas. Abi datumi ir svētku dienas. Jāņu nosaukums sastopams arī sarunās par visu svinību posmu, taču darba kalendārā 23. un 24. jūnijs jāuzskaita atsevišķi.',
 'Jāņu svinību galdā tradicionāli vieta ir ķimeņu sieram. '+cite(FOOD,'LIAA aprakstā par Latvijas garšām')+' minēta arī siera siešanas tradīcija. Svinību paražas un ēdienu izvēle nav juridiski nosacījumi tam, lai datums būtu svētku diena.'
],[FOOD],section('Nedēļas nogale un brīvdienas','Ja 24. jūnijs iekrīt sestdienā vai svētdienā, likums šim datumam neparedz automātisku nākamās pirmdienas brīvdienu. Savukārt starp svētkiem un nedēļas nogali esošu darba dienu var pārcelt tikai pēc piemērojama lēmuma; kalendārs šādu pārcelšanu neizdomā.'))

add('dziesmu-un-deju-svetki','Dziesmu un deju svētki','Apstiprinātais 2028. gada svētku periods un brīvdiena pēc noslēguma dienas.',['dziesmu un deju svētku noslēguma diena','Dziesmu un deju svētku noslēguma dienas'],[
 'XXVIII Vispārējie latviešu dziesmu un XVIII Deju svētki Rīgā ir noteikti no 2028. gada 30. jūnija līdz 9. jūlijam. Norises laiku apstiprina '+cite(FESTIVAL,'Ministru kabineta rīkojums')+'; par valdības lēmumu 2026. gada 14. aprīlī ziņoja '+cite(KM,'Kultūras ministrija')+'.',
 'Svētku dienu likums nosaka Vispārējo latviešu dziesmu un deju svētku noslēguma dienu par svētku dienu. 2028. gada 9. jūlijs ir svētdiena, tāpēc nākamā darbdiena — pirmdiena, 10. jūlijs — šajā kalendārā ir papildu brīvdiena. Viss desmit dienu pasākumu periods nav desmit valsts noteiktas brīvdienas.'
],[FESTIVAL,KM],section('Programma tiek precizēta atsevišķi','Koncerta norises vietu, mēģinājumu laiku un biļešu pieejamību pārbaudi pie organizatora. Apstiprināts svētku periods vēl nav katra koncerta gala programma. Šis ieraksts attiecas uz Vispārējiem svētkiem, nevis automātiski uz visiem skolēnu vai reģionu dziesmu svētkiem.'))

add('latvijas-republikas-proklamesanas-diena','Latvijas Republikas Proklamēšanas diena','18. novembra svētku un aizstājošo brīvdienu datumi 2027.–2030. gadā.',['Latvijas Republikas Proklamēšanas diena','Brīvdiena pēc 18. novembra'],[
 '18. novembrī Latvija atzīmē 1918. gadā dibinātās Latvijas Republikas proklamēšanu. Tā ir valsts svētku diena. Valsts dibināšanas gadadienu no 4. maija neatkarības atjaunošanas dienas nošķir gan vēsturiskais notikums, gan datums.',
 'Ja 18. novembris iekrīt sestdienā vai svētdienā, nākamā darbdiena ir brīvdiena. 2028. gadā papildus brīva ir pirmdiena, 20. novembris, bet 2029. gadā — pirmdiena, 19. novembris. Svētku gadadienas datums paliek 18. novembris; pārvietojas papildu atpūtas diena.'
],[MAY4,LABOR],section('Pirms svētku dienas','17. novembrim, ja tā ir darba diena, standarta aprēķinā piemēro pirmssvētku darba laika saīsinājumu. Papildu brīvdiena pēc nedēļas nogalē iekrituša 18. novembra netiek uzskatīta par jaunu svētku gadadienu.'))

add('ziemassvetki','Ziemassvētki','Ziemassvētku vakars un abas Ziemassvētku dienas Latvijas 2027.–2030. gada kalendārā.',['Ziemassvētku vakars','Pirmie Ziemassvētki','Otrie Ziemassvētki'],[
 'Latvijas svētku dienu sarakstā Ziemassvētku posmam ir trīs datumi: 24. decembris — Ziemassvētku vakars, 25. decembris — Pirmie Ziemassvētki un 26. decembris — Otrie Ziemassvētki. Visi trīs ir svētku dienas. Darba kalendārā tos vērtē atsevišķi pēc konkrētās nedēļas dienas.',
 'Latvijas svētku ēdienu tradīcijās minēti pelēkie zirņi ar speķi; tos Ziemassvētku kontekstā apraksta '+cite(FOOD,'LIAA Latvijas garšu ceļvedis')+'. Ģimeņu maltītes, dievkalpojumi un kopā būšanas paradumi var atšķirties, kamēr valsts noteiktie datumi paliek vienādi.'
],[FOOD,USNO],section('Ko nejaukt ar ziemas saulgriežiem','Astronomiskie ziemas saulgrieži ir atsevišķs notikums ar precīzu brīdi. Tie nav automātiski 24. decembrī. Arī par nedēļas nogalē iekritušiem Ziemassvētkiem likums neparedz vispārēju papildu pirmdienas brīvdienu.'))

add('vecgada-diena','Vecgada diena','31. decembris ir svētku diena. Gadu robežas darba laiks un nedēļu numerācija.',['Vecgada diena'],[
 'Vecgada diena ir 31. decembris — kalendāra gada pēdējā diena un Latvijā noteikta svētku diena. Tā pastāv atsevišķi no 1. janvāra Jaungada dienas. Ja plāno brīvdienu posmu pāri gadu robežai, apskati abu gadu datumus un darba grafiku.',
 '2027. gadā 31. decembris ir piektdienā, 2028. gadā — svētdienā, 2029. gadā — pirmdienā un 2030. gadā — otrdienā. Papildu brīvdiena par nedēļas nogalē iekritušu Vecgada dienu netiek pievienota automātiski.'
],[LABOR],section('Nedēļas un darba laika robežas','2029. gada 31. decembris pieder 2030. gada pirmajai ISO nedēļai, bet joprojām ir 2029. gada datums. 30. decembrī, ja tā ir darba diena, kalendāra standarta stundu aprēķinā piemēro pirmssvētku vienas stundas saīsinājumu.'))

add('lacplesa-diena','Lāčplēša diena','11. novembra nozīme un atceres dienas statuss Latvijas kalendārā.',['Lāčplēša diena'],[
 'Lāčplēša dienu Latvijā atzīmē 11. novembrī. Tā saistīta ar 1919. gada 11. novembra uzvaru, kad Latvijas armija atbrīvoja Rīgu no bermontiešiem. Šo vēsturisko notikumu skaidro '+cite(LAC,'Valsts prezidenta publicētā uzruna')+'.',
 '11. novembris ir atceres diena, un kalendārā to nošķir no valsts noteiktajām brīvdienām. Ja tas ir darba nedēļas dienā, datums pats par sevi neatceļ darbu. 18. novembris, ko atzīmē pēc nedēļas, ir cits notikums ar svētku dienas statusu.'
],[LAC],section('Piemiņas laika plānošana','Piemiņas brīža, lāpu gājiena vai vietējā pasākuma norisi pārbaudi pašvaldības vai organizatora programmā attiecīgajam gadam. Šajā lapā norādītais datums apliecina atceres dienu, nevis kāda konkrēta pasākuma sākuma laiku.'))

add('barikazu-aizstavju-atceres-diena','Barikāžu aizstāvju atceres diena','20. janvāris: 1991. gada barikāžu aizstāvju piemiņa un datumi četriem gadiem.',['barikāžu aizstāvju atceres diena'],[
 '20. janvārī Latvijā ir 1991. gada barikāžu aizstāvju atceres diena. Tā dod vietu atmiņām par cilvēkiem, kuri aizstāvēja Latvijas neatkarību, un janvāra notikumu upuru piemiņai. Oficiālajā nosaukumā ir saglabāts vēsturiskais 1991. gads.',
 'Piemiņas ugunskuri, ziedu nolikšana un dalībnieku atmiņu stāsti ir dokumentēti '+cite(BAR,'1991. gada barikāžu muzeja pasākumu atskatā')+'. Tie ir konkrētās atceres tradīcijas piemēri, nevis solījums par identisku nākotnes pasākumu programmu.'
],[BAR],section('Atceres diena darba kalendārā','20. janvāris nav vispārēja valsts noteikta brīvdiena. Piemiņas pasākumu var plānot līdzās darba vai mācību dienai. Ja vēlies apmeklēt muzeju, pārbaudi tā konkrētā datuma darba laiku un pasākuma pieteikšanās kārtību.'))

add('komunistiska-genocida-upuru-pieminas-diena','Komunistiskā genocīda upuru piemiņas diena','25. marta un 14. jūnija piemiņas dienas: divi datumi ar vienu oficiālo nosaukumu.',['Komunistiskā genocīda upuru piemiņas diena'],[
 'Latvijas kalendārā ar nosaukumu Komunistiskā genocīda upuru piemiņas diena ir atzīmēts gan 25. marts, gan 14. jūnijs. Tie ir divi atsevišķi piemiņas datumi. 25. marts saistīts ar 1949. gada deportācijām, 14. jūnijs — ar 1941. gada deportācijām.',
 'Latvijas Okupācijas muzeja '+cite(DEPORT,'izglītojošais materiāls par padomju deportācijām')+' aplūko abu masu izsūtīšanu norisi. Piemiņas dienas ļauj pievērsties konkrētu cilvēku un ģimeņu liecībām, vēstures dokumentiem un represiju sekām.'
],[DEPORT],section('Kā lasīt tabulu','Tabulā katram gadam ir divi ieraksti. Tie nav dublēti dati. Abi datumi ir piemiņas dienas, un tie paši par sevi nerada valsts noteiktu brīvdienu. Vietējo piemiņas sarīkojumu norisi pārbaudi atsevišķi.'))

add('latgales-kongresa-diena','Latgales kongresa diena','27. aprīļa vēsturiskais pamats un atzīmējamās dienas statuss.',['Latgales kongresa diena'],[
 'Latgales kongresa diena ir 27. aprīlī. Saeima šo datumu iekļāva atzīmējamo dienu sarakstā, godinot 1917. gada Latgales latviešu kongresu un tā lēmumus. '+cite(LATGALE,'Saeimas skaidrojumā')+' uzsvērta kongresa nozīme ceļā uz Latvijas valsts veidošanos.',
 'Diena pievērš uzmanību Latgales vēsturei, reģiona identitātei un līdzdalībai kopējā Latvijas vēsturē. Tā ir atzīmējama diena, nevis vispārēja brīvdiena. Darba dienu skaitā 27. aprīli saglabā, ja tas iekrīt darba nedēļā un nav cita piemērojama izņēmuma.'
],[LATGALE],section('Vietējās programmas','Muzeji, bibliotēkas un kultūras iestādes var rīkot atsevišķas izstādes vai sarunas. Kalendāra datums nenozīmē, ka katrs pasākums notiek tieši 27. aprīlī; pārbaudi konkrētā rīkotāja paziņojumu.'))

add('eiropas-diena','Eiropas diena','9. maijs, Šūmana deklarācija un Eiropas dienas vieta Latvijas kalendārā.',['Eiropas diena'],[
 'Eiropas dienu atzīmē 9. maijā. Tā saistīta ar 1950. gada 9. maija Šūmana deklarāciju un Eiropas sadarbības attīstību. '+cite(EU,'Eiropas Savienības skaidrojums')+' šo datumu saista ar miera, integrācijas un sadarbības ieceri.',
 'Latvijas likumā Eiropas diena ir atzīmējama diena. Tā pati par sevi nav valsts noteikta brīvdiena. Ja 9. maijs vienā gadā sakrīt ar citu svētku datumu, abi notikumi tiek rādīti atsevišķi.'
],[EU],section('2027. gada sakritība','2027. gada 9. maijā vienlaikus ir Eiropas diena un Mātes diena, jo maija otrā svētdiena tajā gadā ir 9. maijs. Mātes dienai likumā ir svētku dienas statuss, savukārt Eiropas diena ir atzīmējama diena.'))

add('bernu-aizsardzibas-diena','Bērnu aizsardzības diena','1. jūnijs Latvijas kalendārā un atšķirība no skolēnu vasaras brīvlaika.',['Starptautiskā bērnu aizsardzības diena'],[
 'Starptautiskā bērnu aizsardzības diena Latvijas atzīmējamo dienu sarakstā ir 1. jūnijā. Kalendārā tā ir atsevišķa tēma līdzās skolas gada beigu un vasaras plānošanai. Atzīmējamās dienas statuss nepadara šo datumu par vispārēju brīvdienu.',
 '1. jūniju nevajadzētu automātiski uztvert kā brīvlaika sākumu ikvienam skolēnam. Mācību gada beigas atšķiras pa klašu grupām, īpaši eksāmenu klasēs. Precīzos datumus nosaka konkrētā mācību gada Ministru kabineta noteikumi.'
],[next(s['url'] for s in DATA['sources'] if s['id']=='school')],section('Pārbaudīts piemērs','2026./2027. mācību gadā vasaras brīvdienas no 1. jūnija līdz 31. augustam noteiktas 1.–8. un 10.–11. klasei. 9. un 12. klases mācību gada beigu datumi ir citi. Nākamo gadu datumus šeit neaizstājam ar iepriekšējā gada prognozi.'))

add('zinibu-diena','Zinību diena','1. septembra atzīmējamā diena un konkrētā mācību gada sākuma pārbaude.',['Zinību diena'],[
 'Zinību diena Latvijas kalendārā ir 1. septembrī. Tā ir atzīmējama diena, kuru plānotājā var izmantot kā atgādinājumu par skolas gaitām un jaunā mācību gada sagatavošanu. Šis ieraksts pats par sevi nav valsts noteikta brīvdiena vecākiem.',
 'Oficiālā Zinību diena un skolas organizētais svinīgais pasākums ir divas saistītas, bet atsevišķi pārbaudāmas lietas. Konkrētās skolas ierašanās laiku, klases tikšanos un pirmās mācību dienas norisi nosaka tās paziņojumi.'
],extra=section('Plānotājā ierakstāmais','Pieraksti bērna klasi, pasākuma laiku, ceļu uz skolu un vajadzīgās lietas. Ja 1. septembris iekrīt nedēļas nogalē, nepārvieto mācību gada sākumu pēc minējuma: vispirms pārbaudi attiecīgā gada noteikumus un skolas ziņu.'))

add('tevu-diena','Tēva diena','Tēva diena Latvijā: septembra otrā svētdiena un datumi 2027.–2030. gadā.',['Tēva diena'],[
 'Tēva dienu Latvijā atzīmē septembra otrajā svētdienā. Tāpēc Latvijai paredzētā kalendārā nevajag pārņemt citu valstu Tēva dienas datumu, kas var būt citā mēnesī. Šeit datums vienmēr aprēķināts no Latvijas likumā noteiktā principa.',
 '2027. gadā Tēva diena ir 12. septembrī, 2028. gadā — 10. septembrī, 2029. gadā — 9. septembrī, 2030. gadā — 8. septembrī. Tā ir atzīmējama diena. Papildu pirmdienas brīvdiena šim datumam nav paredzēta.'
],extra=section('Personīgs atgādinājums','Ģimenes kalendārā vari atzīmēt tikšanos, apsveikumu vai kopīgi ieplānotu nodarbi. Šāds personīgs notikums papildina oficiālo datumu, bet nemaina tā juridisko statusu un netiek uzskatīts par publiska pasākuma programmu.'))

add('baltu-vienibas-diena','Baltu vienības diena','22. septembris: Saules kaujas piemiņa un Latvijas un Lietuvas saikne.',['Baltu vienības diena'],[
 'Baltu vienības diena ir 22. septembrī. Tā saistīta ar 1236. gada Saules kaujas piemiņu un Latvijas un Lietuvas tuvību. '+cite(BALTIC,'Saeimas skaidrojumā')+' diena aprakstīta kā baltu tautu kopības un sadarbības apliecinājums.',
 'Latvijas kalendārā tā ir atzīmējama diena. Tas nav automātisks atbrīvojums no darba vai mācībām. Datums ir nemainīgs, bet svinīga pasākuma norise konkrētajā pilsētā var būt ieplānota citā, tuvā datumā.'
],[BALTIC],section('Datums un pasākums','Nošķir 22. septembra kalendāra ierakstu no koncerta, izstādes vai kopīga sarīkojuma programmas. Ceļojuma vai dalības plānam vajadzīga organizatora aktuālā informācija par vietu un laiku.'))

add('valsts-valodas-diena','Valsts valodas diena','15. oktobris: latviešu valoda, konstitucionālais pamats un atzīmējamās dienas statuss.',['Valsts valodas diena'],[
 'Valsts valodas diena Latvijā ir 15. oktobrī. Datums saistīts ar 1998. gada 15. oktobrī pieņemtajiem Satversmes grozījumiem, kuros nostiprināts latviešu valodas kā valsts valodas regulējums. Šo pamatu izskaidro '+cite(LANG,'Latviešu valodas aģentūras materiāls')+'.',
 'Šī ir atzīmējama diena. Tā sniedz iemeslu pievērsties valodai ikdienas lietojumā — lasīšanā, sarunās un precīzā rakstībā. Kalendārā arī mēnešu un nedēļas dienu nosaukumi ir rakstīti latviski ar diakritiskajām zīmēm.'
],[LANG],section('Valoda arī datumos','Atsevišķā datuma uzrakstā lietojam, piemēram, “2027. gada 15. oktobris”. Teikumā par notikuma laiku forma mainās: “2027. gada 15. oktobrī”. Šī atšķirība palīdz veidot dabiskāk lasāmus atgādinājumus un drukājamos kalendārus.'))

add('skolotaju-diena','Skolotāju diena','Latvijā Skolotāju diena ir 5. oktobrī. Pašreizējais datums un agrākā principa atšķirība.',['Skolotāju diena'],[
 'Skolotāju diena Latvijā ir 5. oktobrī. Pašreizējā likuma redakcijā tas ir fiksēts datums, tāpēc 2027.–2030. gada kalendārā to neaprēķina kā oktobra pirmo svētdienu. Vecākos kalendāros šis iepriekšējais princips vēl var būt sastopams.',
 cite(TEACH,'Saeimas 2024. gada komisijas skaidrojums')+' apraksta ierosinājumu salāgot Latvijas datumu ar Starptautisko skolotāju dienu. Kalendāra datuma noteikšanai izmantojam spēkā esošo svētku un atzīmējamo dienu likumu, nevis tikai toreizējo ierosinājumu.'
],[TEACH],section('Skolas pasākums var būt citā laikā','Skolotāju dienai ir atzīmējamās dienas statuss. Skolas var vienoties par apsveikumu vai sarīkojumu sev piemērotā laikā, bet tas nemaina oficiālo 5. oktobra datumu. Darba dienu skaits tāpēc netiek automātiski samazināts.'))

add('starptautiska-sieviesu-diena','Starptautiskā sieviešu diena','8. marts Latvijas kalendārā: atzīmējama diena un sieviešu sasniegumu novērtējums.',['Starptautiskā sieviešu diena'],[
 'Starptautiskā sieviešu diena ir 8. martā. '+cite(WOMEN,'UN Women sistēmas koordinācijas materiāls')+' šo dienu saista ar sieviešu un meiteņu sasniegumu atzīšanu. Latvijas likumā tā ir iekļauta atzīmējamo dienu sarakstā.',
 '8. marts pats par sevi nav Latvijas valsts noteikta brīvdiena. Ja tas iekrīt parastā darba nedēļas dienā, darba kalendārs to saglabā kā darba dienu. Individuāli apsveikumi, darba vietas pasākums vai sabiedriska diskusija nav papildu brīvdienas juridisks pamats.'
],[WOMEN],section('Konteksts plānotājā','Pieraksti konkrētu sarunu, tikšanos vai pasākumu, kurā vēlies piedalīties. Par publiskas norises vietu un sākuma laiku pārliecinies pie rīkotāja: kalendāra atzīme apliecina datumu, nevis pasākuma programmu.'))

add('saulgriezi','Saulgrieži','Vasaras un ziemas saulgriežu precīzie brīži Latvijā 2027.–2030. gadā.',['saulgrieži'],[
 'Saulgrieži ir divi astronomiski brīži gadā: jūnija saulgrieži un decembra saulgrieži. Latvijā, kas atrodas ziemeļu puslodē, tie iezīmē astronomiskās vasaras un ziemas sākumu. Gadalaiku maiņu nosaka Zemes ass slīpums; šo pamatprincipu skaidro '+cite(NASA,'NASA')+'.',
 'Tabulas brīži iegūti no '+cite(USNO,'ASV Jūras observatorijas (USNO) datiem')+' un pārrēķināti no UTC uz Europe/Riga laiku. Viens un tas pats astronomiskais notikums dažādās laika joslās var būt redzams ar citu pulksteņa laiku vai pat citu datumu.'
],[USNO,NASA],section('Astronomija un svētki','Vasaras saulgriežu datums nav automātiski Līgo diena, un ziemas saulgrieži nav Ziemassvētku vakars. Līgo ir 23. jūnijā, Jāņu diena — 24. jūnijā, bet Ziemassvētku svētku dienas — 24.–26. decembrī. Saulgriežu brīdis pats par sevi nerada papildu valsts brīvdienu.'),season='all')

add('vasaras-saulgriezi','Vasaras saulgrieži','Astronomiskās vasaras sākums un Europe/Riga laiks 2027.–2030. gadā.',['Vasaras saulgrieži'],[
 'Vasaras saulgrieži ir jūnija astronomiskais pagrieziena punkts. Ziemeļu puslodē tas saistīts ar vasaras sākumu un gada garāko dienu laiku. Saullēkta un saulrieta pulksteņa laiks ir atkarīgs arī no novērošanas vietas; saulgriežu brīdis visai Zemei ir viens.',
 '2028. gadā vasaras saulgrieži Latvijā iestājas jau 20. jūnijā plkst. 23.02. Pārējos šeit aplūkotajos gados tabulā redzams 21. jūnijs. Šī atšķirība ir iemesls izmantot konkrētā gada efemerīdu, nevis vienu nemainīgu datumu visiem gadiem.'
],[USNO,NASA],section('Līgo paliek 23. jūnijā','Līgo un Jāņu dienas ir fiksēti Latvijas svētku datumi. Kultūras pasākumi ap saulgriežiem var notikt dažādās dienās. Precīzs astronomiskais brīdis neapliecina ne pasākuma sākumu, ne laikapstākļu prognozi.'),season='summer')

add('ziemas-saulgriezi','Ziemas saulgrieži','Astronomiskās ziemas sākuma brīži Latvijas laikā un atšķirība no Ziemassvētkiem.',['Ziemas saulgrieži'],[
 'Ziemas saulgrieži ir decembra astronomiskais pagrieziena punkts. Latvijā tas iezīmē astronomiskās ziemas sākumu un īsāko dienu laiku. Dienas gaismas ilgums ir atkarīgs no atrašanās vietas; tabulā ir notikuma brīdis, nevis katras pilsētas saullēkta vai saulrieta laiks.',
 '2027. gadā Latvijas laikā ziemas saulgrieži ir 22. decembrī plkst. 04.42. 2028., 2029. un 2030. gadā tie ir 21. decembrī. Laiks pārrēķināts uz Europe/Riga joslu; nākotnē pieņemti laika joslas noteikumu grozījumi var prasīt šo pulksteņa laiku atjaunošanu.'
],[USNO,NASA],section('Atsevišķi no svētku brīvdienām','Ziemassvētku vakars Latvijā ir 24. decembrī, un tam seko abas Ziemassvētku dienas. Saulgriežu datums šos likumā noteiktos datumus nepārvieto. Ziemas saulgriežiem pašiem nav atsevišķas vispārējas brīvdienas statusa.'),season='winter')

assert len(ARTICLES)==28
assert len({a['slug'] for a in ARTICLES})==28
assert all(a['dates'] and len(a['bodyHtml'])>1500 for a in ARTICLES)
(ROOT/'_data/occasions.json').write_text(json.dumps(ARTICLES,ensure_ascii=False,indent=2))
print(json.dumps({'occasions':len(ARTICLES),'sourceChecked':sum(a['verified'] for a in ARTICLES),'nativeEditorReviewed':0,'minBodyChars':min(len(a['bodyHtml']) for a in ARTICLES)},ensure_ascii=False))
