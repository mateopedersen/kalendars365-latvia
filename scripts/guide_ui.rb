# frozen_string_literal: true
require 'cgi'
require 'uri'

# One restrained control and reference style for the locally authored guides.
module GuideUI
  module_function
  def h(text); CGI.escapeHTML(text.to_s); end
  def icon(name='arrow')
    paths = {'external'=>'<path d="M14 4h6v6m0-6L10 14"/><path d="M10 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-5"/>','down'=>'<path d="M12 4v16m-6-6 6 6 6-6"/>','arrow'=>'<path d="M4 12h16m-6-6 6 6-6 6"/>','calendar'=>'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 11h18m-13 4h2m4 0h2m-8 3h2"/>','location'=>'<path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2.5"/>','download'=>'<path d="M12 3v12m-4-4 4 4 4-4M4 16v5h16v-5"/>','shield'=>'<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z"/><path d="m8 12 3 3 5-6"/>','bag'=>'<path d="M5 8h14l1 13H4L5 8Z"/><path d="M8 9V6a4 4 0 0 1 8 0v3"/>','photo'=>'<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8" cy="9" r="1.5"/><path d="m4 17 5-5 4 4 3-3 4 4"/>','check'=>'<path d="m5 12 4 4L19 6"/>','document'=>'<path d="M14 3H5v18h14V8l-5-5Zm0 0v5h5M8 12h8m-8 4h6"/>'}
    %(<svg class="guide-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">#{paths.fetch(name)}</svg>)
  end
  SOURCE_IDENTITIES = {
    'vsaa.gov.lv'=>['VSAA','Valsts sociālās apdrošināšanas aģentūra','Pensijas, pabalsti un individuālie pakalpojumi','shield'],
    'likumi.lv'=>['LIKUMI','Latvijas tiesību akti','Spēkā esošie noteikumi un likumu redakcijas','document'],
    'vid.gov.lv'=>['VID','Valsts ieņēmumu dienests','Nodokļi un neapliekamais minimums','document'],
    'bank.lv'=>['LB','Latvijas Banka','Pensiju fondi un finanšu pakalpojumu skaidrojumi','shield'],
    'lm.gov.lv'=>['LM','Labklājības ministrija','Sociālās drošības nosacījumi un skaidrojumi','document'],
    'ptac.gov.lv'=>['PTAC','Patērētāju tiesību aizsardzības centrs','Patērētāju tiesības un drošs pirkums','shield'],
    'cert.lv'=>['CERT.LV','Informācijas tehnoloģiju drošības incidentu novēršanas institūcija','Ieteikumi drošībai internetā','shield']
  }.freeze
  def sources(g, photo: false, photo_anchor: 'pasakumu-foto')
    checked=g.fetch('checkedAt','2026-11-15'); checked_label=checked.split('-').reverse.join('.')+'.'
    groups=g.fetch('sources').group_by { |s| URI(s.fetch('url')).host.sub(/^www\./,'') }
    panels=groups.map do |domain,items|
      known=g.fetch('sourceIdentities',{})[domain] || SOURCE_IDENTITIES[domain]
      short,title,description,symbol=known || [nil,domain,items.length>1 ? 'Saites uz norises informāciju un praktiskajiem nosacījumiem' : 'Informācija no norādītā pirmavota','external']
      rows=items.map do |s|
        kind=s['kind'] || (s.fetch('title').include?('2025') ? '2025. gada arhīvs' : 'Pirmavots')
        %(<li class="guide-source-entry"><a href="#{h(s.fetch('url'))}" rel="noopener"><span class="guide-source-entry-label"><small>#{h(kind)}</small><strong>#{h(s.fetch('title'))}</strong></span>#{icon('external')}</a><p>#{h(s.fetch('purpose',s.fetch('title')))}</p></li>)
      end.join
      %(<section class="guide-source-group#{items.length>3 ? ' guide-source-group--wide' : ''}"><header><span class="guide-source-identity">#{short ? h(short) : icon(symbol)}</span><div><h3>#{h(title)}</h3><p>#{h(description)}</p><span>#{h(domain)}</span></div></header><ul>#{rows}</ul></section>)
    end.join
    %(<section class="guide-reference-section" id="avoti"><header><div><span class="guide-overline">PĀRBAUDĀMI PIRMAVOTI</span><h2>Atrodi atbildi pareizajā avotā</h2><p>Izvēlies jautājumam atbilstošo saiti. Pilnos nosacījumus un jaunākās izmaiņas vienmēr pārbaudi avota vietnē.</p></div><div class="guide-source-reviewed">#{icon('check')}<span>Pēdējā pārbaude<time datetime="#{h(checked)}">#{h(checked_label)}</time></span></div></header><div class="guide-source-groups">#{panels}</div>#{photo ? %(<a class="guide-photo-credit" href="/pilsetas-un-fotografijas/##{h(photo_anchor)}">#{icon('photo')}<span>Fotogrāfijas izcelsme un licence</span>#{icon('arrow')}</a>) : ''}</section>)
  end
end
