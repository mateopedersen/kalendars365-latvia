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
  if (!Object.hasOwn(topics, topic)) return;
  const frame = document.querySelector('.contact-form-frame iframe');
  if (!frame) return;
  const url = new URL(frame.src);
  url.searchParams.set('entry.164533219', topics[topic]);
  frame.src = url.href;
})();
