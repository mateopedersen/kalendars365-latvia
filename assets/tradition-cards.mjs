const labels = {
  holiday: 'Svētku brīvdiena',
  commemoration: 'Atceres diena',
  observance: 'Atzīmējama diena',
  culture: 'Kultūras tradīcija',
  astronomy: 'Astronomisks notikums'
};
const escape = value => String(value ?? '').replace(/[&<>"']/g, character => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[character]));

// Photos and illustrations share a bounded media element, separate from the copy.
export function traditionCard(article, formatDate, version = '') {
  const image = article.photo || article.illustration;
  if (!image?.src) throw new Error('Missing tradition card visual: ' + article.url);
  const src = image.src + (version ? '?v=' + encodeURIComponent(version) : '');
  const kind = article.photo ? 'photo' : 'illustration';
  const dates = article.dates.length
    ? article.dates.map(date => `<time datetime="${escape(date.date)}">${escape(formatDate(date.date))}</time>`).join(' · ')
    : 'Datums un tradīcijas — tēmas aprakstā';
  const responsive = image.srcset ? ` srcset="${escape(image.srcset)}" sizes="(max-width: 620px) calc(100vw - 48px), (max-width: 1180px) 44vw, 30vw"` : '';
  return `<article class="tradition-story" data-tradition-url="${escape(article.url)}"><a class="tradition-story-media tradition-story-media--${kind}" href="${escape(article.url)}" aria-label="Lasīt: ${escape(article.title)}"><img src="${escape(src)}"${responsive} loading="lazy" decoding="async" width="${image.width || 640}" height="${image.height || 360}" alt="${escape(image.alt)}"></a><div class="tradition-story-copy"><span class="tradition-tag">${escape(labels[article.type] || 'Kalendāra notikums')}</span><h3><a href="${escape(article.url)}">${escape(article.title)}</a></h3><div class="tradition-card-dates">${dates}</div><p>${escape(article.description)}</p><a class="tradition-more" href="${escape(article.url)}">Lasīt stāstu un avotus ↗</a></div></article>`;
}
