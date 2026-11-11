// One accessible date card per season, using the existing verified season rows.
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const keys={3:'spring',6:'summer',9:'autumn',12:'winter'};
export function renderSeasonCards(rows,scenes,mode,format){
 if(!['astro','calendar'].includes(mode))throw new RangeError('Unknown season mode');
 return rows.map(row=>{
  const key=keys[row.month],scene=scenes.find(s=>s.key===key);
  if(!scene)throw new RangeError('Missing seasonal illustration');
  const index=['spring','summer','autumn','winter'].indexOf(key)+1;
  const end=mode==='calendar'?format.dateLabel(format.dateISO(format.addDays(row.nextDate,-1))):null;
  const duration=row.length?'Līdz nākamajam gadalaikam: '+row.length.toLocaleString('lv-LV')+' dienas.':'Precīzais nākamā gada beigu brīdis šajā datu kopā nav ietverts.';
  return `<article class="season-card season-card--${key}" id="season-${key}" aria-labelledby="season-title-${key}">
   <div class="season-card-art"><img src="${escape(format.asset(scene.src))}" width="600" height="500" loading="lazy" decoding="async" alt="${escape(scene.alt)}"><span class="season-card-badge">${escape(scene.tagline)}</span></div>
   <div class="season-card-body"><div class="season-card-heading"><h3 id="season-title-${key}">${escape(row.title)}</h3><span class="season-card-number" aria-hidden="true">${String(index).padStart(2,'0')}</span></div>
   <p class="season-label">${mode==='astro'?'Astronomiskais sākums':'Kalendārais sākums'}</p>
   <time class="season-start" datetime="${escape(row.utc||row.date)}"><span>${escape(format.dateLabel(row.date))}</span>${mode==='astro'?`<strong>${escape(row.time)}<small>Latvijas laiks</small></strong>`:''}</time>
   ${end?`<p class="season-end">Beigas: ${escape(end)}</p>`:''}
   <details class="season-card-details"><summary>${mode==='astro'?'UTC un gadalaika ilgums':'Par šo periodu'}</summary>${mode==='astro'?`<p>${escape(format.utcTime(row.utc))}</p><p>${escape(duration)}</p>`:'<p>Trīs kalendārie mēneši.'+(key==='winter'?' Ziemas periods turpinās nākamajā gadā.':'')+'</p>'}</details></div></article>`;
 }).join('');
}
