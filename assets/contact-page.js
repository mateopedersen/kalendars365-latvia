(() => {
  const topic = new URLSearchParams(location.search).get('tema');
  const topics = {
    saturs: 'Datums vai kalendāra saturs',
    riks: 'Rīka darbība vai tehniska kļūda',
    ideja: 'Ideja vai ierosinājums',
    pieklustamiba: 'Piekļūstamība',
    dati: 'Personas dati vai attēla licence',
    licence: 'Personas dati vai attēla licence',
    cits: 'Cits jautājums'
  };
  const frame = document.querySelector('.contact-form-frame iframe');
  if (!frame) return;
  if (Object.hasOwn(topics, topic)) {
    const url = new URL(frame.src);
    url.searchParams.set('entry.164533219', topics[topic]);
    frame.src = url.href;
    document.querySelectorAll('[data-contact-form-link]').forEach(link => {
      const direct = new URL(link.href);
      direct.searchParams.set('entry.164533219', topics[topic]);
      link.href = direct.href;
    });
  }
  function showFallback() {
    const notice = document.querySelector('.contact-form-notice');
    if (!notice) return;
    frame.hidden = true;
    notice.hidden = false;
  }
  document.addEventListener('securitypolicyviolation', event => {
    if (event.effectiveDirective !== 'frame-src') return;
    try {
      const host = new URL(event.blockedURI).hostname;
      if (['docs.google.com', 'accounts.google.com'].includes(host)) showFallback();
    } catch {}
  });
  frame.addEventListener('error', showFallback);
})();
