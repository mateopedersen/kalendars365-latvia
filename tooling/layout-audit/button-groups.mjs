// Read-only UI measurements for sibling action controls. Run through cua_repl.
export function measureButtonGroups() {
  const boxes = [], styles = [];
  const box = el => {
    let entry = boxes.find(item => item.el === el);
    if (!entry) { entry = {el, value:el.getBoundingClientRect()}; boxes.push(entry); }
    return entry.value;
  };
  const style = el => {
    let entry = styles.find(item => item.el === el);
    if (!entry) { entry = {el, value:getComputedStyle(el)}; styles.push(entry); }
    return entry.value;
  };
  const number = value => +value.replace('px', '') || 0;
  const visible = el => {
    if (el.closest('[hidden]')) return false;
    for (let p = el.parentElement; p; p = p.parentElement) {
      if (p.tagName === 'DETAILS' && !p.open && !p.querySelector('summary')?.contains(el)) return false;
    }
    const b = box(el), s = style(el);
    return b.width > 1 && b.height > 1 && s.display !== 'none' && s.visibility === 'visible' && s.opacity !== '0';
  };
  const escape = value => value.replace(/(^-?\d)|[^a-zA-Z0-9_-]/g, chars => [...chars].map(c => '\\' + c.codePointAt(0).toString(16) + ' ').join(''));
  const selector = el => {
    const parts = [];
    for (let p = el; p && p !== document.body && parts.length < 5; p = p.parentElement) {
      const id = p.getAttribute('id');
      if (id) { parts.unshift('#' + escape(id)); break; }
      const classes = [...p.classList].filter(c => !['active','selected','is-ready'].includes(c)).slice(0, 2);
      let part = p.tagName.toLowerCase() + classes.map(c => '.' + escape(c)).join('');
      const siblings = [...p.parentElement.children].filter(s => s.tagName === p.tagName);
      if (siblings.length > 1) part += ':nth-of-type(' + (siblings.indexOf(p) + 1) + ')';
      parts.unshift(part);
    }
    return parts.join(' > ');
  };
  const label = el => (el.getAttribute('aria-label') || el.textContent || el.getAttribute('title') || '').trim().replace(/\s+/g, ' ').slice(0, 100);
  const boxed = el => {
    const s = style(el);
    return el.matches('button,[role="button"],input[type="button"],input[type="submit"],input[type="reset"],label.organizer-file-button,label.category-file-button,label.g-import-button') || number(s.borderTopWidth) > 0 && number(s.borderInlineStartWidth) > 0;
  };
  const action = el => el.matches('button,a,[role="button"],input[type="button"],input[type="submit"],input[type="reset"],label.organizer-file-button,label.category-file-button,label.g-import-button');
  const parents = [];
  for (const el of document.querySelectorAll('main button,main a,main [role="button"],main label.organizer-file-button,main label.category-file-button,main label.g-import-button,.site-header button,.site-header a,.consent-banner button')) {
    if (!parents.includes(el.parentElement)) parents.push(el.parentElement);
  }
  const groups = [], problems = [];
  for (const parent of parents) {
    if (parent.closest('svg')) continue;
    // Floating share buttons overlay previews rather than forming an action row.
    // A navigation caption is a text link, not one of the year buttons.
    const elements = [...parent.children].filter(el => action(el) && visible(el) && !el.matches('.nav-years-label') && !['absolute','fixed'].includes(style(el).position));
    if (elements.length < 2 || !elements.some(boxed)) continue;
    const items = elements.map(el => {
      const b = box(el), s = style(el), text = label(el);
      let paintedText = el.textContent || '';
      for (const hidden of el.querySelectorAll('svg,.sr-only,[hidden]')) paintedText = paintedText.replace(hidden.textContent || '', '');
      const rowSpan = Math.max(...[s.gridRowStart,s.gridRowEnd].map(value => +(value.match(/span\s+(\d+)/)?.[1] || 1)));
      return { selector: selector(el), text, boxed: boxed(el), x:b.x, y:b.y, right:b.right, bottom:b.bottom, width:b.width, height:b.height,
        font:number(s.fontSize), lineHeight:number(s.lineHeight), weight:s.fontWeight,
        rowSpan,
        paddingBlock:number(s.paddingTop) + number(s.paddingBottom),
        paddingInline:number(s.paddingLeft) + number(s.paddingRight),
        textControl:/[\p{L}\p{N}]{2}/u.test(paintedText),
        overflow:el.scrollWidth > el.clientWidth + 2 || el.scrollHeight > el.clientHeight + 2 };
    });
    const rows = [];
    for (const item of items) {
      // A featured card spanning two grid rows is not a taller sibling button.
      let row = rows.find(r => r.rowSpan === item.rowSpan && Math.min(r.bottom,item.bottom) - Math.max(r.y,item.y) > Math.min(r.height,item.height) / 2);
      if (!row) { row = {y:item.y,bottom:item.bottom,height:item.height,rowSpan:item.rowSpan,items:[]}; rows.push(row); }
      row.items.push(item);
    }
    const group = {selector:selector(parent),classes:parent.className,items,rows:rows.length};
    groups.push(group);
    const add = (type, members) => problems.push({type,group:group.selector,classes:group.classes,items:members.map(item=>({...item}))});
    const calendar = parent.matches('.school-month-grid,.work-calendar-grid,.lunar-day-grid,.mini-grid,.calendar-table,[role="grid"]');
    // Links on the tilted month/week paper illustrations follow their perspective.
    const illustrative = !!parent.closest('.v2-hero-scene') && parent.matches('.v2-week-preview,.v2-mini-calendar');
    for (const row of rows) {
      const members = row.items;
      if (members.length < 2) continue;
      if (!illustrative && Math.max(...members.map(x=>x.height)) - Math.min(...members.map(x=>x.height)) > 1) add('height',members);
      else if (!illustrative && Math.max(...members.map(x=>x.y)) - Math.min(...members.map(x=>x.y)) > 1) add('alignment',members);
      const text = members.filter(x=>x.textControl);
      if (text.length > 1 && Math.max(...text.map(x=>x.font)) - Math.min(...text.map(x=>x.font)) > .5) add('font',text);
      if (!calendar && text.length > 1 && text.some(x=>x.weight!==text[0].weight)) add('weight',text);
    }
    if (parent.matches('.school-opening-actions,.a3-design-actions,.moon-print-downloads,.print-library-downloads,.category-export-buttons,.g-plan-actions')) {
      if (Math.max(...items.map(x=>x.width)) - Math.min(...items.map(x=>x.width)) > 1) add('width',items);
      if (Math.max(...items.map(x=>x.height)) - Math.min(...items.map(x=>x.height)) > 1) add('wrapped-height',items);
    }
    const overflowing = items.filter(x=>x.overflow);
    if (overflowing.length) add('overflow',overflowing);
  }
  return {path:location.pathname,width:innerWidth,documentWidth:document.documentElement.scrollWidth,
    assetVersion:document.querySelector('meta[name="asset-version"]')?.getAttribute('content') || '',fonts:document.fonts.status,
    groupCount:groups.length,controlCount:groups.reduce((n,g)=>n+g.items.length,0),groups,problems};
}
