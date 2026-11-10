# frozen_string_literal: true
require 'fileutils'

ROOT = File.expand_path('..', __dir__)
PALETTES = {
  'calendar'=>['#a52b48','#661b34','#e7ae61','#fff8eb'], 'sun'=>['#e7a341','#a84934','#f8d68c','#fff6dd'],
  'moon'=>['#65779d','#313754','#e8dbc0','#fff9e9'], 'garden'=>['#548c61','#315744','#d98a54','#f8e7b8'],
  'zodiac'=>['#8a679e','#493f70','#e5b867','#fff5df'], 'school'=>['#527b94','#304b68','#b94a5b','#fffaf0'],
  'work'=>['#8b674f','#52413d','#d39858','#f9e8cf'], 'holiday'=>['#b5485b','#742a40','#e3ad59','#fff1df'],
  'memorial'=>['#8c6670','#514250','#d8b47b','#fff7e9'], 'culture'=>['#a13a40','#701f30','#e8d8bd','#fff8ec'],
  'astronomy'=>['#536f99','#2d3656','#e6bd7e','#fff7e4'], 'city'=>['#49847b','#31545e','#d89457','#fff4dc'],
  'names'=>['#768c58','#485e4b','#c77c62','#fff5e8'], 'print'=>['#657d91','#3e4e66','#c34c5a','#fff8ef'],
  'week'=>['#716b9c','#433d69','#daa85d','#fff7e6'], 'family'=>['#bb8069','#79515c','#7c9a84','#fff3e5'],
  'tools'=>['#537e85','#36535e','#dfa75b','#fff4df'], 'privacy'=>['#5e7589','#35495d','#d7ac70','#fff7e8'],
  'about'=>['#8a6f86','#54435f','#d7a864','#fff4e4']
}.freeze
ART_LABELS = {
  'calendar'=>'Kalendāra ilustrācija','sun'=>'Saules laiki','moon'=>'Mēness fāzes','garden'=>'Sējas un dārza kalendārs',
  'zodiac'=>'Zodiaka cikls','school'=>'Mācību gada kalendārs','work'=>'Darba dienu kalendārs','holiday'=>'Latvijas svētki',
  'memorial'=>'Atceres dienas','culture'=>'Latvijas kultūras gadskārtas','astronomy'=>'Astronomija Latvijā','city'=>'Latvijas pilsētas',
  'names'=>'Vārda dienu kalendārs','print'=>'Drukājams kalendārs','week'=>'Nedēļas plānotājs','family'=>'Ģimenes kalendārs',
  'tools'=>'Plānošanas rīki','privacy'=>'Privātuma aizsardzība','about'=>'Par Kalendārs365'
}.freeze

ART = {
  'calendar'=>%(<g transform="rotate(-7 160 130)" filter="url(#shadow)"><path d="m78 75 133-14 15 136-143 17Z" fill="url(#side)"/><path d="m69 66 133-14 15 136-143 17Z" fill="url(#paper)" stroke="#fff" stroke-width="4"/><path d="m72 80 137-15 4 27L76 107Z" fill="url(#primary)"/><path d="M102 63V43m92-9 3 22" stroke="#fff4df" stroke-width="10" stroke-linecap="round"/><g fill="#a99a8c"><circle cx="100" cy="127" r="6"/><circle cx="134" cy="123" r="6"/><circle cx="168" cy="119" r="6"/><circle cx="104" cy="161" r="6"/><circle cx="138" cy="157" r="6"/><circle cx="172" cy="153" r="6"/></g><circle cx="207" cy="179" r="12" fill="url(#accent)" stroke="#fff" stroke-width="3"/></g>),
  'sun'=>%(<g stroke="url(#accent)" stroke-width="9" stroke-linecap="round"><path d="M160 31v24m0 122v24M57 116h25m156 0h25M87 43l17 19m112 108 17 19m-1-146-18 19m-95 100-18 19"/></g><circle cx="160" cy="116" r="68" fill="url(#primary)" filter="url(#shadow)"/><path d="M122 94c15-25 41-34 68-28" stroke="#fff7dc" stroke-width="9" stroke-linecap="round" opacity=".72"/><circle cx="136" cy="105" r="6" fill="#fff7dc"/>),
  'moon'=>%(<g filter="url(#shadow)"><circle cx="151" cy="126" r="79" fill="url(#side)"/><path d="M177 48c-40 13-64 49-58 87 7 39 40 67 80 66-19 13-42 18-65 13-47-10-77-56-67-103 10-48 56-77 104-67 2 1 4 2 6 4Z" fill="url(#accent)"/><path d="M105 83c17-21 39-28 63-25" stroke="#fff8e8" stroke-width="7" stroke-linecap="round" opacity=".55"/><g fill="#8b806f" opacity=".55"><circle cx="117" cy="121" r="7"/><circle cx="144" cy="152" r="9"/><circle cx="110" cy="166" r="4"/></g></g><path d="m229 58 6 15 15 6-15 6-6 15-6-15-15-6 15-6z" fill="url(#accent)"/>),
  'garden'=>%(<g filter="url(#shadow)"><path d="m95 141 130 3-18 64q-3 9-13 9h-68q-11 0-13-9Z" fill="url(#primary)"/><ellipse cx="160" cy="143" rx="65" ry="15" fill="#72523b"/><path d="M157 141c-8-41-38-58-63-51 2 25 22 48 59 56m9-6c5-44 35-67 61-58-4 27-25 51-58 65" fill="url(#accent)" stroke="#3d6a4b" stroke-width="4"/><path d="M157 141c-5-24-20-40-40-45m51 43c8-24 23-39 42-45" stroke="#f7e8b7" stroke-width="3"/><path d="m106 148 12 52m94-52-12 52" stroke="#ffd5b1" stroke-width="4" opacity=".6"/></g>),
  'zodiac'=>%(<circle cx="160" cy="127" r="76" fill="none" stroke="url(#side)" stroke-width="17"/><circle cx="160" cy="127" r="76" fill="none" stroke="url(#accent)" stroke-width="3" stroke-dasharray="2 13"/><ellipse cx="160" cy="127" rx="108" ry="39" transform="rotate(-24 160 127)" stroke="#fff3d8" stroke-width="3"/><path d="m160 72 18 31 36 6-26 24 7 35-35-17-33 17 6-35-26-24 36-6z" fill="url(#accent)" stroke="#fff5df" stroke-width="3" filter="url(#shadow)"/><circle cx="83" cy="80" r="5" fill="#fff"/>),
  'school'=>%(<g filter="url(#shadow)"><path d="m68 81 81 13 11 120-84-20Z" fill="url(#side)"/><path d="m160 94 81-14v102l-81 31Z" fill="url(#primary)"/><path d="m77 70 78 13 5 117-72-16Z" fill="url(#paper)" stroke="#fff" stroke-width="3"/><path d="m160 83 73-13v102l-73 28Z" fill="#fff7e8" stroke="#fff" stroke-width="3"/><path d="M159 85v115" stroke="url(#accent)" stroke-width="7"/><path d="m91 103 53 9m-51 16 53 9m-50 16 52 9m32-45 43-8m-42 24 42-8m-40 24 40-8" stroke="#ad9e8e" stroke-width="3" stroke-linecap="round"/></g>),
  'work'=>%(<g filter="url(#shadow)"><path d="M101 88V73q0-14 14-14h91q14 0 14 14v15" fill="none" stroke="url(#side)" stroke-width="14"/><path d="M83 99q0-12 12-12h130q12 0 12 12v93q0 12-12 12H95q-12 0-12-12Z" fill="url(#primary)"/><path d="M83 108h154v28H83Z" fill="url(#side)"/><rect x="146" y="108" width="29" height="31" rx="5" fill="url(#accent)"/><path d="M105 164h110" stroke="#fff4dc" stroke-width="5" stroke-linecap="round" opacity=".35"/></g>),
  'holiday'=>%(<g filter="url(#shadow)"><path d="m82 116 77 25v78l-77-29Z" fill="url(#side)"/><path d="m159 141 79-29v78l-79 29Z" fill="url(#primary)"/><path d="m82 116 77-31 79 27-79 29Z" fill="url(#accent)"/><path d="m146 138 27-10v84l-27 10Z" fill="#fff2dc"/><path d="M159 84c-26-29-53-13-43 8 5 12 24 16 43 16-6-23 0-43 18-44 22-1 18 26-18 44" fill="none" stroke="#fff6de" stroke-width="10" stroke-linecap="round"/></g>),
  'memorial'=>%(<g filter="url(#shadow)"><path d="M128 101h64v88q0 14-14 14h-36q-14 0-14-14Z" fill="url(#paper)"/><path d="M124 128h72v12h-72Z" fill="url(#primary)"/><path d="M141 92q19-20 38 0v37h-38Z" fill="url(#accent)"/><path d="M151 78q9-14 18 0v13h-18Z" fill="#fff9df"/><path d="M160 39c-17 20-19 30-9 38 7 5 14 0 16-7 2 8 11 12 17 5 8-9 1-22-24-36Z" fill="#f2c678"/><path d="M91 154c15-24 28-24 38-21-4 17-15 27-38 21Zm101-5c16-17 31-17 39-9-8 16-20 22-39 9Z" fill="#78947b"/></g>),
  'culture'=>%(<g transform="rotate(-8 160 130)" filter="url(#shadow)"><rect x="70" y="80" width="182" height="98" rx="15" fill="#f5e7d1"/><path d="M75 91h172v19H75zm0 56h172v19H75z" fill="url(#primary)"/><path d="M75 119h172v19H75z" fill="#fff8ec"/><path d="m96 129 12-12 12 12-12 12zm42 0 12-12 12 12-12 12zm42 0 12-12 12 12-12 12z" fill="url(#accent)"/><path d="M81 88h159" stroke="#fff" stroke-width="4" opacity=".7"/></g>),
  'astronomy'=>%(<g transform="rotate(-22 160 128)" filter="url(#shadow)"><path d="M83 94h132l19 28-19 28H83q-10 0-10-10v-36q0-10 10-10Z" fill="url(#primary)"/><path d="M215 94h26l17 28-17 28h-26l19-28Z" fill="url(#accent)"/><path d="M145 149v31m36-33 21 35m-56-2h53" stroke="url(#side)" stroke-width="10" stroke-linecap="round"/></g><path d="m215 51 5 14 14 5-14 5-5 14-5-14-14-5 14-5z" fill="url(#accent)"/>),
  'city'=>%(<path d="M43 190q30-26 60-6 21-48 53-10 29-49 62-7 26-28 58-1v48H43Z" fill="#54836e"/><path d="M49 189h42v-53h31v53h15v-74h37v74h18v-45h29v45h49v27H49Z" fill="url(#primary)" filter="url(#shadow)"/><path d="m133 115 19-17 20 17zm44 0 15-17 18 17z" fill="url(#accent)"/><path d="M155 115V84h11v31m-8-31h5l-3-17Z" fill="url(#accent)"/><g fill="#f3d29a"><path d="M59 153h8v12h-8zm19 0h8v12h-8zm40-4h7v11h-7zm28-27h8v13h-8zm24 0h8v13h-8zm37 36h8v11h-8zm19 0h8v11h-8z"/></g><path d="M34 211q65-20 130 0t130 0" stroke="#a9d0c4" stroke-width="8" stroke-linecap="round"/>),
  'names'=>%(<g transform="rotate(-5 160 130)" filter="url(#shadow)"><rect x="73" y="67" width="174" height="136" rx="14" fill="url(#paper)"/><path d="M84 67h18v136H84q-11 0-11-11V78q0-11 11-11Z" fill="url(#side)"/><path d="M119 97h101m-101 19h77" stroke="#b5a293" stroke-width="4" stroke-linecap="round"/><path d="M121 158c19-20 42-20 60 0-18 22-41 22-60 0Z" fill="url(#accent)"/><path d="M151 160v32m0-15-17-15m17 15 17-17" stroke="#507c59" stroke-width="4" stroke-linecap="round"/><circle cx="206" cy="163" r="17" fill="url(#primary)"/></g>),
  'print'=>%(<g filter="url(#shadow)"><rect x="102" y="50" width="116" height="70" rx="4" fill="url(#paper)"/><path d="M94 103h132q15 0 15 15v55q0 15-15 15h-19v-37H113v37H94q-15 0-15-15v-55q0-15 15-15Z" fill="url(#side)"/><path d="M111 143h98v72h-98Z" fill="url(#paper)"/><path d="M124 159h69m-69 15h69m-69 15h45" stroke="#b3a79b" stroke-width="4" stroke-linecap="round"/><path d="M121 61h78" stroke="url(#primary)" stroke-width="7" stroke-linecap="round"/><circle cx="212" cy="122" r="5" fill="url(#accent)"/></g>),
  'week'=>%(<g transform="rotate(-7 160 130)" filter="url(#shadow)"><path d="m75 76 139-17 15 127-139 18Z" fill="url(#side)"/><path d="m66 66 139-17 15 127-139 18Z" fill="url(#paper)"/><path d="m68 81 141-18 4 25L72 107Z" fill="url(#primary)"/><path d="m82 130 124-15m-120 41 126-16m-122 41 126-16m-98-46 7 57m35-62 7 57m35-62 7 57" stroke="#b9ada1" stroke-width="2"/><g fill="url(#accent)"><rect x="112" y="135" width="15" height="12" rx="3"/><rect x="149" y="130" width="15" height="12" rx="3"/><rect x="185" y="125" width="15" height="12" rx="3"/></g></g>),
  'family'=>%(<g filter="url(#shadow)"><path d="M54 207q3-52 53-58 48 7 51 58Z" fill="url(#primary)"/><circle cx="107" cy="111" r="31" fill="url(#accent)"/><path d="M144 209q4-69 52-75 51 6 56 75Z" fill="url(#side)"/><circle cx="196" cy="118" r="34" fill="#e6b27c"/><path d="M132 205q1-44 28-53 27 9 30 53Z" fill="url(#accent)"/><circle cx="160" cy="132" r="23" fill="#f1c18b"/><path d="M95 83q12-21 30-11 12 7 15 22-23-10-45 1m83-11q15-19 34-8 13 8 16 25-24-13-49 0" fill="#51434b"/></g>),
  'tools'=>%(<g transform="rotate(-12 160 130)" filter="url(#shadow)"><circle cx="157" cy="126" r="72" fill="url(#side)"/><circle cx="157" cy="126" r="59" fill="url(#paper)" stroke="#fff" stroke-width="4"/><circle cx="157" cy="126" r="45" fill="none" stroke="#b8ab9c" stroke-width="2"/><path d="M157 80v12m0 68v12m-45-46h12m67 0h12m-78-32 9 9m48 48 9 9m0-66-9 9m-48 48-9 9" stroke="#716d71" stroke-width="4" stroke-linecap="round"/><path d="m157 91 14 42-14-8-16 12Z" fill="url(#accent)"/><circle cx="157" cy="126" r="7" fill="#fff2d5" stroke="#695c57" stroke-width="3"/></g>),
  'privacy'=>%(<g filter="url(#shadow)"><path d="m160 48 76 29v55q-2 66-76 98-74-32-76-98V77Z" fill="url(#side)"/><path d="m160 59 64 25v47q-2 55-64 84-62-29-64-84V84Z" fill="url(#primary)"/><path d="M130 124v-15q0-30 30-30t30 30v15" fill="none" stroke="url(#accent)" stroke-width="12" stroke-linecap="round"/><rect x="117" y="120" width="86" height="58" rx="14" fill="url(#paper)"/><circle cx="160" cy="144" r="8" fill="url(#side)"/><path d="M160 151v11" stroke="url(#side)" stroke-width="6" stroke-linecap="round"/></g>),
  'about'=>%(<g filter="url(#shadow)"><path d="M66 78q45-22 94 1v124q-49-22-94-1Z" fill="url(#side)"/><path d="M160 79q48-23 95-1v124q-47-21-95 1Z" fill="url(#paper)"/><path d="M160 81v122" stroke="url(#accent)" stroke-width="8"/><path d="M80 102q33-12 65 0m-65 19q33-12 65 0m-65 19q33-12 65 0m34-38q32-12 63 0m-63 19q32-12 63 0" stroke="#b2a090" stroke-width="3" stroke-linecap="round"/><circle cx="207" cy="167" r="26" fill="url(#accent)"/><circle cx="207" cy="159" r="9" fill="#fff2dd"/><path d="M191 184q2-17 16-17t16 17" fill="#fff2dd"/></g>)
}.freeze

FileUtils.mkdir_p(File.join(ROOT, 'assets', 'category-art'))
ART.each do |name, motif|
  primary, side, accent, paper = PALETTES.fetch(name)
  svg = <<~SVG
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 260" role="img" aria-labelledby="title desc">
      <title id="title">#{ART_LABELS.fetch(name)}</title>
      <desc id="desc">Oriģināla telpiska ilustrācija tēmai “#{ART_LABELS.fetch(name)}”.</desc>
      <defs>
        <linearGradient id="primary" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#{primary}"/><stop offset=".55" stop-color="#{primary}"/><stop offset="1" stop-color="#{side}"/></linearGradient>
        <linearGradient id="side" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#{side}"/><stop offset="1" stop-color="#242430"/></linearGradient>
        <linearGradient id="accent" x1=".1" y1="0" x2=".9" y2="1"><stop stop-color="#fff9e8"/><stop offset=".48" stop-color="#{accent}"/><stop offset="1" stop-color="#{side}"/></linearGradient>
        <linearGradient id="paper" x1="0" y1="0" x2=".9" y2="1"><stop stop-color="#fffefb"/><stop offset=".72" stop-color="#{paper}"/><stop offset="1" stop-color="#dfd1c2"/></linearGradient>
        <radialGradient id="glow"><stop stop-color="#{accent}" stop-opacity=".34"/><stop offset="1" stop-color="#{accent}" stop-opacity="0"/></radialGradient>
        <filter id="shadow" x="-25%" y="-25%" width="150%" height="170%"><feDropShadow dx="0" dy="11" stdDeviation="8" flood-color="#29212e" flood-opacity=".26"/></filter>
      </defs>
      <circle cx="160" cy="127" r="116" fill="url(#glow)"/>
      <ellipse cx="160" cy="132" rx="112" ry="63" transform="rotate(-16 160 132)" fill="none" stroke="#{primary}" stroke-opacity=".17" stroke-width="2"/>
      <circle cx="249" cy="78" r="5" fill="#{accent}"/><circle cx="76" cy="171" r="3" fill="#{primary}" opacity=".7"/>
      #{motif}
    </svg>
  SVG
  File.write(File.join(ROOT, 'assets', 'category-art', "#{name}.svg"), svg)
end
