// Read-only browser audit. Invoke through the supported browser tool, never as page code.
export function measureControlSpacing() {
  const root = document.querySelector('main') || document.body;
  const actionSelector = 'button,input:not([type="hidden"]),select,textarea,a.primary-button,a.primary,a.button,[role="button"],summary';
  const style = el => getComputedStyle(el);
  const box = el => el.getBoundingClientRect();
  const escape = value => value.replace(/(^-?\d)|[^a-zA-Z0-9_-]/g, chars => [...chars].map(c => '\\' + c.codePointAt(0).toString(16) + ' ').join(''));
  const visible = el => {
    if (el.closest('[hidden]')) return false;
    const closed = el.closest('details:not([open])');
    if (closed && !closed.querySelector('summary')?.contains(el)) return false;
    const b = box(el), s = style(el);
    return b.width > 1 && b.height > 1 && s.display !== 'none' && s.visibility !== 'hidden' && s.visibility !== 'collapse' && s.opacity !== '0';
  };
  const selector = el => {
    const parts = [];
    for (let e = el; e && e !== document.body && parts.length < 5; e = e.parentElement) {
      const id = e.getAttribute('id');
      if (id) { parts.unshift('#' + escape(id)); break; }
      const classes = [...e.classList].filter(c => !['active','selected','is-ready'].includes(c)).slice(0, 2);
      let part = e.tagName.toLowerCase() + classes.map(c => '.' + escape(c)).join('');
      const siblings = [...e.parentElement.children].filter(s => s.tagName === e.tagName);
      if (siblings.length > 1) part += ':nth-of-type(' + (siblings.indexOf(e) + 1) + ')';
      parts.unshift(part);
    }
    return parts.join(' > ');
  };
  const label = el => (el.getAttribute('aria-label') || el.textContent || el.getAttribute('name') || '').trim().replace(/\s+/g, ' ').slice(0, 140);
  const controls = el => [ ...(el.matches(actionSelector) ? [el] : []), ...el.querySelectorAll(actionSelector) ].filter(visible);
  const sibling = (el, direction) => {
    for (let e = el[direction]; e; e = e[direction]) if (visible(e)) return e;
    return null;
  };
  const intersect = (a, b) => Math.min(a.right,b.right) - Math.max(a.left,b.left) > 1 && Math.min(a.bottom,b.bottom) - Math.max(a.top,b.top) > 1;
  const crowded = [], overlaps = [], seen = [];
  let measured = 0;
  const record = (p, control, direction, gap, overlap = false) => {
    const key = selector(p) + '|' + selector(control) + '|' + direction;
    if (seen.includes(key)) return;
    seen.push(key);
    (overlap ? overlaps : crowded).push({ direction, gap: Math.round(gap * 10) / 10, note: selector(p), text: label(p), control: selector(control), action: label(control), parent: selector(p.parentElement) });
  };
  for (const p of root.querySelectorAll('p,.form-hint,.help-text,.field-hint')) {
    if (!visible(p) || !p.textContent.trim() || p.closest('button,a,[role="button"],label,svg,[hidden]') || p.querySelector(actionSelector)) continue;
    const pb = box(p);
    for (const [direction, key] of [['after','previousElementSibling'], ['before','nextElementSibling']]) {
      let scope = p, adjacent = sibling(scope, key);
      for (let depth = 0; !adjacent && scope.parentElement && scope.parentElement !== root && depth < 2; depth++) {
        scope = scope.parentElement;
        adjacent = sibling(scope, key);
      }
      if (!adjacent) continue;
      const actions = controls(adjacent);
      if (!actions.length) continue;
      const control = actions.reduce((a,b) => direction === 'after' ? (box(a).bottom > box(b).bottom ? a : b) : (box(a).top < box(b).top ? a : b));
      const cb = box(control), horizontal = Math.min(pb.right, cb.right) - Math.max(pb.left, cb.left);
      const inset = +(direction === 'after' ? style(p).paddingTop : style(p).paddingBottom).replace('px','') || 0;
      const gap = (direction === 'after' ? pb.top - cb.bottom : cb.top - pb.bottom) + inset;
      if (horizontal > 2 && gap >= -1) {
        measured++;
        const minimum = control.matches('button,a,[role="button"]') ? 12 : 8;
        if (gap < minimum) record(p, control, direction, gap);
      } else if (horizontal > 2 && gap < -1) {
        const range = document.createRange(); range.selectNodeContents(p);
        if ([...range.getClientRects()].some(rect => rect.width > 1 && rect.height > 1 && intersect(rect,cb))) record(p,control,direction,gap,true);
      }
    }
  }
  const allControls = [...root.querySelectorAll(actionSelector)].filter(visible);
  // A single-line field scrolls its value internally by design. Its content width
  // is not a layout failure; the page/control boxes are still checked separately.
  const singleLineField = el => el.tagName === 'INPUT' && ['text','search','url','tel','email','password','number','date','datetime-local','month','time','week'].includes(el.type);
  const controlMetrics = el => ({selector:selector(el),text:label(el),width:el.clientWidth,scrollWidth:el.scrollWidth,height:el.clientHeight,scrollHeight:el.scrollHeight});
  const nativeFieldScrolling = allControls.filter(el => singleLineField(el) && el.scrollWidth > el.clientWidth + 2).map(controlMetrics);
  const overflowingControls = allControls.filter(el => !el.closest('svg') && ((!singleLineField(el) && el.scrollWidth > el.clientWidth + 2) || el.scrollHeight > el.clientHeight + 2)).map(controlMetrics);
  return {
    path: location.pathname, width: innerWidth, documentWidth: document.documentElement.scrollWidth,
    assetVersion: document.querySelector('meta[name="asset-version"]')?.getAttribute('content') || '',
    family: document.body.dataset.family || '', fonts: document.fonts.status,
    widgets: [...root.querySelectorAll('[data-widget]')].map(el => ({type:el.dataset.widget,initialized:el.dataset.initialized || '',children:el.children.length})),
    controls: allControls.length, measured, crowded, overlaps, overflowingControls, nativeFieldScrolling
  };
}
