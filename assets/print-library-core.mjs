export const printMonthSlugs = ['janvaris','februaris','marts','aprilis','maijs','junijs','julijs','augusts','septembris','oktobris','novembris','decembris'];
export const printMonthGenitives = ['janvāra','februāra','marta','aprīļa','maija','jūnija','jūlija','augusta','septembra','oktobra','novembra','decembra'];
export const defaultPrintFilters = Object.freeze({year:2027,period:'year',month:1,orientation:'all',holidays:'all',query:''});
const choice = (value,allowed,fallback) => allowed.includes(value) ? value : fallback;
export function normalizePrintFilters(input = {}) {
  return {year:choice(Number(input.year),[2027,2028,2029,2030],2027),period:choice(input.period,['year','month'],'year'),
    month:choice(Number(input.month),Array.from({length:12},(_,index)=>index+1),1),
    orientation:choice(input.orientation,['all','portrait','landscape'],'all'),holidays:choice(input.holidays,['all','yes','no'],'all'),
    query:String(input.query||'').trim().slice(0,80)};
}
export const normalizePrintSearch = value => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('lv-LV').replace(/\s+/g,' ').trim();
export function filterPrintLibrary(items,input) {
  const filters=normalizePrintFilters(input), terms=normalizePrintSearch(filters.query).split(' ').filter(Boolean);
  return items.filter(item => item.year===filters.year && item.period===filters.period &&
    (filters.period==='year'||item.month===filters.month) &&
    (filters.orientation==='all'||item.orientation===filters.orientation) &&
    (filters.holidays==='all'||item.holidays===(filters.holidays==='yes')) &&
    terms.every(term=>normalizePrintSearch(item.title).includes(term)));
}
export function printPeriodLink(input) {
  const state=normalizePrintFilters(input);
  return `/pdf-kalendari/${state.year}/${state.period==='month'?printMonthSlugs[state.month-1]+'/':''}`;
}
export function printPeriodLabel(input) {
  const state=normalizePrintFilters(input);
  return state.period==='year' ? `${state.year}. gada kalendāri` : `${state.year}. gada ${printMonthGenitives[state.month-1]} kalendāri`;
}
export function printDesignCount(count) { return `${count} ${count%10===1&&count%100!==11?'dizains':'dizaini'}`; }
