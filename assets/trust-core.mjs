export function normalizeSearch(value){return String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('lv').replace(/\s+/g,' ').trim();}
export function matchesQuestion(text,query){const words=normalizeSearch(query).split(' ').filter(Boolean),value=normalizeSearch(text);return words.every(word=>value.includes(word));}
