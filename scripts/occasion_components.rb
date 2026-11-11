# Original photo-led Latvian observance pages. Source metadata stays attached.
def occasion_page(article, _all=nil)
  slug=article.fetch('slug');type=article['type']
  status=article['dayOff'] ? 'Svētku brīvdiena' : type=='commemoration' ? 'Atceres diena' : type=='astronomy' ? 'Astronomisks notikums' : 'Atzīmējamā diena'
  dates=article.fetch('dates',[])
  cards=(2027..2030).map do |year|
    rows=dates.select{|row|row['date'].start_with?(year.to_s)}
    text=if rows.empty?
      '<p class="occasion-pending">Norises datums šajā gadā nav apstiprināts.</p>'
    else
      rows.map do |row|
        date=Date.parse(row['date'])
        %(<div>#{tradition_date_link(date)}<span>#{h(%w[pirmdiena otrdiena trešdiena ceturtdiena piektdiena sestdiena svētdiena][date.cwday-1])}</span><small>#{h(row['title'])}</small></div>)
      end.join
    end
    %(<article><strong>#{year}</strong>#{text}</article>)
  end.join
  notes=article.fetch('factNotes',[]).each_with_index.map{|note,index|%(<section><h2>#{h(note['section'])}</h2><p>#{tradition_text_markup(slug,note['text'],"factNotes[#{index}].text")}</p></section>)}.join
  notes=article['bodyHtml'] if notes.empty?
  tool=TRADITION_LINKING.tools(slug).first
  <<~HTML
    <article class="occasion-story">
      <section class="occasion-opening occasion-opening--text">
        <div class="occasion-opening-copy"><span class="occasion-status">#{ui_icon(type=='astronomy' ? 'sun':'gift')}#{h(status)}</span><h2>#{h(article.fetch('dateRule',{}).fetch('label',article['title']))}</h2><p>#{tradition_text_markup(slug,article['intro']||article['description'],'intro')}</p><div class="occasion-actions">#{a(tool.fetch('url'),tool.fetch('label'),'button')}</div></div>
      </section>
      #{tradition_context_markup(slug)}
      <section class="occasion-dates" id="datumi"><div class="section-heading"><div><span class="eyebrow">PLĀNO LAIKUS</span><h2>Datumi 2027.–2030. gadā</h2></div><span>#{h(status)}</span></div><div class="occasion-year-cards">#{cards}</div></section>
      <div class="occasion-reading"><div>#{notes}</div><aside><span class="eyebrow">DATUMS UN NOZĪME</span><h2>Kas jāņem vērā?</h2><p>#{article['dayOff'] ? 'Svētku dienas statuss ir noteikts Latvijas likumā. Darba dienu pārcelšana un aizstājoša brīvdiena jāvērtē pēc konkrētā noteikuma.' : 'Atzīmējama vai atceres diena pati par sevi nav vispārēja svētku brīvdiena.'}</p>#{tradition_sources_markup(slug)}#{a('/avoti-un-metodika/','Kā pārbaudām kalendāru →')}</aside></div>
      #{tradition_related_markup(slug)}
    </article>
  HTML
end
