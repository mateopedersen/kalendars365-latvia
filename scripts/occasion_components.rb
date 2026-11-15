# Original photo-led Latvian observance pages. Source metadata stays attached.
require_relative 'occasion_guide'

def occasion_page(article, _all=nil)
  return staro_riga_page(article) if article['slug']=='staro-riga'
  slug=article.fetch('slug');type=article['type']
  notes=article.fetch('factNotes',[]).each_with_index.filter_map do |note,index|
    # The opening already gives this paragraph. Keep the remaining topic facts.
    next if note['text']==article['intro']
    %(<section><h2>#{h(note['section'])}</h2><p>#{tradition_text_markup(slug,note['text'],"factNotes[#{index}].text")}</p></section>)
  end.join
  editorial = case slug
  when 'lieldienas'
    '<section class="occasion-editorial page-reading-copy"><h2>Ieplāno Lieldienu brīvdienas</h2><p>Ja svētkos paredzēts ceļojums vai ģimenes tikšanās, salīdzini Lielo piektdienu un Otrās Lieldienas ar savu darba grafiku. <a href="/blogs/lieldienas-2027-datumi-un-plani/">Lieldienu 2027. gada plānošanas ceļvedis</a> palīdz izvērtēt šo četru dienu posmu un sagatavot savu plānu.</p></section>'
  when 'ligo-diena'
    '<section class="occasion-editorial page-reading-copy"><h2>Laiks ceļam un svinībām</h2><p>Pirms Jāņu brauciena saskaņo brīvās dienas un atgriešanās laiku. <a href="/blogs/ligo-un-jani-planosana-latvija/">Līgo un Jāņu plānošanas ceļvedī</a> atradīsi praktiskus apsvērumus par darba grafiku, nakšņošanu un kopīgu svinēšanu.</p></section>'
  else ''
  end
  tools=TRADITION_LINKING.tools(slug).map{|tool|a(tool.fetch('url'),tool.fetch('label'),'button')}.join
  <<~HTML
    <article class="occasion-story occasion-guide" data-occasion-guide="#{h(slug)}">
      <section class="occasion-introduction"><span class="eyebrow">DATUMS UN NOZĪME</span><h2>#{h(article.fetch('dateRule',{}).fetch('label',article['title']))}</h2><p>#{tradition_text_markup(slug,article['intro']||article['description'],'intro')}</p><div class="occasion-actions">#{tools}</div></section>
      #{occasion_dates_markup(article)}
      #{occasion_practical_markup(article)}
      <div class="occasion-reading"><div>#{notes}</div><aside><span class="eyebrow">DATUMA PAMATS</span><h2>Ko svarīgi nejaukt?</h2><p>#{h(OccasionGuide.copy(article).fetch('distinction'))}</p>#{tradition_sources_markup(slug)}</aside></div>
      #{editorial}
      #{occasion_faq_markup(article)}
      #{tradition_context_markup(slug)}
      #{tradition_related_markup(slug)}
    </article>
  HTML
end
