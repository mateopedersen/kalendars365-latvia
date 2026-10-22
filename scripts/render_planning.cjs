// Dependency-free build adapter for the same markup used by the browser.
'use strict';
const planning = require('../assets/planning.js');
const markup = {};
for (const kind of ['work', 'leave']) {
  markup[kind] = {};
  for (let year = 2027; year <= 2030; year++) {
    markup[kind][year] = planning.initialMarkup(kind, year);
  }
}
process.stdout.write(JSON.stringify(markup));
