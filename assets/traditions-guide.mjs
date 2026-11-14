// No catalog fetch: the readable HTML and its small date/filter model arrive together.
const root = document.querySelector('[data-traditions-guide]');
if (root) {
  const C = window.CalendarCore, K = window.CategoryCore;
  const E = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const articles = JSON.parse(root.querySelector('[data-traditions-guide-data]').textContent);
  const form = root.querySelector('form'), stories = root.querySelector('[data-traditions-results]');
  const dates = root.querySelector('[data-v2-traditions-dates]');
  const count = root.querySelector('[data-discovery-count]'), empty = root.querySelector('[data-traditions-empty]');
  const cards = new Map([...stories.querySelectorAll('[data-tradition-url]')].map(el => [el.dataset.traditionUrl, el]));
  let mode = 'stories', list = [], year = 2027;
  const params = new URLSearchParams(location.search);
  for (const name of ['year','month','kind','q']) {
    const input = form.elements[name], value = params.get(name);
    if (value !== null && (name === 'q' || [...input.options].some(o => o.value === value))) input.value = value;
  }
  const dateLabel = row => row.dates.length
    ? row.dates.map(d => `<time datetime="${E(d.date)}">${E(C.dateLabel(d.date))}</time>`).join(' · ')
    : 'Datums un tradīcijas — tēmas aprakstā';
  function renderDates() {
    const groups = new Map();
    for (const article of list) for (const d of article.dates) {
      if (!groups.has(d.date)) groups.set(d.date, []);
      groups.get(d.date).push({title:d.title || article.title, url:article.url, dayOff:article.dayOff});
    }
    dates.innerHTML = [...groups].sort(([a],[b]) => a.localeCompare(b)).map(([date,items]) =>
      `<article><time datetime="${date}">${E(C.dateLabel(date))}</time><ul>${items.map(i => `<li><a href="${E(i.url)}">${E(i.title)}</a><small>${i.dayOff ? 'Svētku brīvdiena' : 'Nav vispārēja svētku brīvdiena'}</small></li>`).join('')}</ul></article>`
    ).join('') || '<p>Atlasē nav viennozīmīgi noteiktu datumu. Skati tēmu aprakstus stāstu skatā.</p>';
  }
  function render() {
    const values = Object.fromEntries(new FormData(form)); year = Number(values.year);
    list = K.traditions(articles, {year, month:values.month, kind:values.kind, query:values.q});
    const selected = new Map(list.map(a => [a.url, a]));
    for (const [url, card] of cards) {
      const article = selected.get(url); card.hidden = !article;
      if (article) card.querySelector('.tradition-card-dates').innerHTML = dateLabel(article);
    }
    count.textContent = `Tēmu skaits: ${list.length} · ${year}. gads.`;
    stories.hidden = mode === 'dates'; dates.hidden = mode !== 'dates';
    empty.hidden = mode !== 'stories' || list.length > 0;
    root.querySelector('[data-traditions-ics]').disabled = !list.some(a => a.dates.length);
    if (mode === 'dates') renderDates();
  }
  form.addEventListener('submit', e => e.preventDefault());
  form.addEventListener('input', render); form.addEventListener('change', render);
  root.querySelectorAll('[data-v2-tradition-mode]').forEach(button => button.addEventListener('click', () => {
    mode = button.dataset.v2TraditionMode;
    root.querySelectorAll('[data-v2-tradition-mode]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
    render();
  }));
  root.querySelector('[data-traditions-ics]').addEventListener('click', () => {
    const events = list.flatMap(a => a.dates.map(d => ({
      id:a.url.replace(/\W/g,'')+'-'+d.date, date:d.date, title:d.title || a.title,
      description:a.url+' · '+(d.scope ? d.scope+' · ' : '')+(a.dayOff ? 'Svētku brīvdiena' : 'Nav vispārēja svētku brīvdiena')
    })));
    globalThis.Calendar365Downloads.save(K.ics(events,'Latvijas svētki un tradīcijas'),`latvijas-tradicijas-${year}.ics`,'text/calendar;charset=utf-8');
  });
  const cleanup = () => {document.body.classList.remove('traditions-printing'); document.getElementById('traditions-print-sheet')?.remove();};
  window.addEventListener('beforeprint', () => {
    cleanup(); const sheet = document.createElement('section'); sheet.id = 'traditions-print-sheet';
    const rows = mode === 'dates' ? [...list].sort((a,b) => (a.dates[0]?.date || '').localeCompare(b.dates[0]?.date || '')) : list;
    sheet.innerHTML = `<header>Kalendārs365™ · kalendars365.lv</header><h1>Svētki un tradīcijas · ${year}</h1><p>${E(count.textContent)}</p>` + rows.map(a =>
      `<article><h2>${E(a.title)}</h2><p>${dateLabel(a)}</p><p>${E(a.description)}</p><small>kalendars365.lv${E(a.url)}</small></article>`).join('');
    document.body.append(sheet); document.body.classList.add('traditions-printing');
  });
  window.addEventListener('afterprint', cleanup);
  root.querySelectorAll('[data-category-print]').forEach(b => b.addEventListener('click', () => window.print()));
  render();
}
