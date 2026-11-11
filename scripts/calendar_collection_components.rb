# frozen_string_literal: true
# One period explorer and template-first shell for the complete 2027–2030 catalog.
CALENDAR_COLLECTION_FAMILIES = %w[year calendar_month print_index print_month lunar_year lunar_month].freeze

def collection_prefix(family)
 return 'meness-kalendars' if family.start_with?('lunar')
 family.start_with?('print') ? 'pdf-kalendari' : 'kalendars'
end

def collection_period_path(prefix, year, month=nil)
 "/#{prefix}/#{year}/#{month ? SLUGS[month-1]+'/' : ''}"
end

def collection_mini_calendar(year, month, selected, prefix)
 first=Date.new(year,month,1);last=Date.new(year,month,-1)
 from=first-(first.cwday-1);until_date=last+(7-last.cwday)
 rows=(from..until_date).each_slice(7).map do |week|
  week_link=week[3].cwyear.between?(2027,2031) ? format('/nedelas-kalendars/%d/%02d/',week[3].cwyear,week[3].cweek) : "/?date=#{week.first.iso8601}&amp;view=week#calendar-app"
  cells=week.map do |day|
   holiday=HOLIDAYS.any?{|item|item['date']==day.iso8601&&item['dayOff']}
   target=if day.year.between?(2027,2030)
    root=prefix=='meness-kalendars' ? prefix : 'kalendars'
    collection_period_path(root,day.year,day.month)+"?date=#{day.iso8601}#{root=='kalendars' ? '&view=month#calendar-app' : '#calendar-period-content'}"
   else
    "/?date=#{day.iso8601}&view=day#calendar-app"
   end
   classes=[day.month!=month ? 'is-outside' : '',day.cwday>5 ? 'is-weekend' : '',holiday ? 'is-holiday' : ''].reject(&:empty?).join(' ')
   label="#{day.day}. #{MONTHS[day.month-1]} #{day.year}"
   %(<td class="#{classes}"><a href="#{h(target)}" aria-label="#{h(label)}"><time datetime="#{day.iso8601}">#{day.day}</time></a></td>)
  end.join
  %(<tr><th scope="row"><a href="#{h(CGI.unescapeHTML(week_link))}" aria-label="#{week[3].cwyear}. gada #{week[3].cweek}. nedēļa">#{week[3].cweek}</a></th>#{cells}</tr>)
 end.join
 title_path=collection_period_path(prefix,year,month)
 %(<section class="collection-mini-month#{selected==month ? ' is-current' : ''}" data-month="#{month}"><h3><a href="#{h(title_path)}"#{selected==month ? ' aria-current="page"' : ''}>#{ui_icon("month-#{month}")}<span>#{MONTHS[month-1].capitalize}</span><span class="collection-mini-arrow" aria-hidden="true">↗</span></a></h3><table aria-label="#{MONTHS[month-1].capitalize} #{year}"><thead><tr><th scope="col"><abbr title="ISO nedēļa">N.</abbr></th>#{DAYS.map{|day|"<th scope=\"col\">#{day}</th>"}.join}</tr></thead><tbody>#{rows}</tbody></table></section>)
end

def collection_explorer(year, month, family)
 prefix=collection_prefix(family)
 years=(2027..2030).map{|candidate|%(<a href="#{collection_period_path(prefix,candidate,month)}"#{candidate==year ? ' aria-current="date"' : ''}>#{candidate}</a>)}.join
 template_id=prefix=='meness-kalendars' ? 'meness-drukai' : month ? 'menesa-a3-kalendari' : 'gada-a3-kalendari'
 summary=month ? "#{MONTHS[month-1].capitalize} #{year}" : "#{year}. gada kalendāri"
 annual=collection_period_path(prefix,year)
 %(<aside class="calendar-collection-sidebar" aria-label="Citi gadi un mēneši"><details class="collection-explorer" data-calendar-explorer open><summary>#{ui_icon('calendar')}<span><small>GADI UN MĒNEŠI</small><strong>#{h(summary)}</strong></span><span aria-hidden="true">⌄</span></summary><div class="collection-explorer-panel"><header class="collection-explorer-header"><span class="eyebrow">IZVĒLIES GADU</span><nav class="collection-year-links" aria-label="Kalendāra gads">#{years}</nav><a class="collection-year-overview#{month ? '' : ' is-current'}" href="#{annual}"#{month ? '' : ' aria-current="page"'}>#{ui_icon('year')}<span>Viss #{year}. gads</span><span aria-hidden="true">↗</span></a><a class="collection-gallery-jump" href="##{template_id}">Drukas veidnes <span aria-hidden="true">→</span></a></header><nav class="collection-month-list" aria-label="Visi #{year}. gada mēneši">#{(1..12).map{|number|collection_mini_calendar(year,number,month,prefix)}.join}</nav></div></details></aside>)
end

def calendar_collection(year, month, family, gallery, content)
 prefix=collection_prefix(family)
 previous_date=month ? Date.new(year,month,1)<<1 : Date.new(year-1,1,1)
 next_date=month ? Date.new(year,month,1)>>1 : Date.new(year+1,1,1)
 previous_label=month ? 'Iepriekšējais mēnesis' : 'Iepriekšējais gads'
 next_label=month ? 'Nākamais mēnesis' : 'Nākamais gads'
 previous=previous_date.year>=2027 ? a(collection_period_path(prefix,previous_date.year,month ? previous_date.month : nil),'← '+previous_label) : %(<span aria-disabled="true">← #{previous_label}</span>)
 following=next_date.year<=2030 ? a(collection_period_path(prefix,next_date.year,month ? next_date.month : nil),next_label+' →') : %(<span aria-disabled="true">#{next_label} →</span>)
 toolbar=%(<nav class="collection-period-nav" aria-label="Iepriekšējais un nākamais periods">#{previous}<a href="#calendar-period-content">#{ui_icon('calendar')}<span>Skatīt kalendāru</span><span aria-hidden="true">↓</span></a>#{following}</nav>)
 %(<div class="calendar-collection-layout" data-calendar-collection data-collection-year="#{year}" data-collection-month="#{month}" data-collection-prefix="#{prefix}">#{collection_explorer(year,month,family)}<div class="calendar-collection-main">#{gallery}#{toolbar}<section class="calendar-period-content" id="calendar-period-content" tabindex="-1">#{content}</section></div></div>)
end
