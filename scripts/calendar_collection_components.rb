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

def collection_explorer(year, month, family)
 prefix=collection_prefix(family)
 years=(2027..2030).map{|candidate|%(<a href="#{collection_period_path(prefix,candidate,month)}"#{candidate==year ? ' aria-current="date"' : ''}>#{candidate}</a>)}.join
 template_id=prefix=='meness-kalendars' ? 'meness-drukai' : month ? 'menesa-a3-kalendari' : 'gada-a3-kalendari'
 summary=month ? "#{MONTHS[month-1].capitalize} #{year}" : "#{year}. gada kalendāri"
 annual=collection_period_path(prefix,year)
 %(<aside class="calendar-collection-sidebar" aria-label="Citi gadi un mēneši"><details class="collection-explorer" data-calendar-explorer><summary>#{ui_icon('calendar')}<span><small>GADI UN MĒNEŠI</small><strong>#{h(summary)}</strong></span><span aria-hidden="true">⌄</span></summary><div class="collection-explorer-panel"><header class="collection-explorer-header"><span class="eyebrow">IZVĒLIES GADU</span><nav class="collection-year-links" aria-label="Kalendāra gads">#{years}</nav><a class="collection-year-overview#{month ? '' : ' is-current'}" href="#{annual}"#{month ? '' : ' aria-current="page"'}>#{ui_icon('year')}<span>Viss #{year}. gads</span><span aria-hidden="true">↗</span></a></header><nav class="collection-month-list" aria-label="Visi #{year}. gada mēneši">#{(1..12).map{|number|%(<a class="collection-month-link#{number==month ? ' is-current' : ''}" data-month="#{number}" href="#{collection_period_path(prefix,year,number)}"#{number==month ? ' aria-current="page"' : ''}><span class="collection-month-art" aria-hidden="true">#{ui_icon("month-#{year}-#{number}")}</span><span>#{MONTHS[number-1].capitalize}</span></a>)}.join}</nav><a class="collection-gallery-jump" href="##{template_id}">#{ui_icon('print')}<span>Drukas veidnes</span><span aria-hidden="true">↓</span></a></div></details></aside>)
end

def calendar_collection(year, month, family, gallery, content)
 prefix=collection_prefix(family)
 previous_date=month ? Date.new(year,month,1)<<1 : Date.new(year-1,1,1)
 next_date=month ? Date.new(year,month,1)>>1 : Date.new(year+1,1,1)
 previous_label=month ? 'Iepriekšējais mēnesis' : 'Iepriekšējais gads'
 next_label=month ? 'Nākamais mēnesis' : 'Nākamais gads'
 previous=previous_date.year>=2027 ? a(collection_period_path(prefix,previous_date.year,month ? previous_date.month : nil),'← '+previous_label) : %(<span aria-disabled="true">← #{previous_label}</span>)
 following=next_date.year<=2030 ? a(collection_period_path(prefix,next_date.year,month ? next_date.month : nil),next_label+' →') : %(<span aria-disabled="true">#{next_label} →</span>)
 toolbar=%(<nav class="collection-period-nav" aria-label="Drukas kolekcijas perioda izvēle">#{previous}<a href="#calendar-period-content">#{ui_icon('calendar')}<span>Skatīt kalendāru</span><span aria-hidden="true">↓</span></a>#{following}</nav>)
 %(<div class="calendar-collection-layout" data-calendar-collection data-collection-year="#{year}" data-collection-month="#{month}" data-collection-prefix="#{prefix}">#{collection_explorer(year,month,family)}<div class="calendar-collection-main">#{gallery}#{toolbar}<section class="calendar-period-content" id="calendar-period-content" tabindex="-1">#{content}</section></div></div>)
end
