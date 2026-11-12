import C from '../assets/calendar-core.js';
import {createLongWeekendCore} from '../assets/long-weekends-core.mjs';
import {renderPage} from '../assets/long-weekends-markup.mjs';
const L=createLongWeekendCore(C),pages={root:renderPage({year:2027},L)};
for(const year of L.years)pages[year]=renderPage({year},L,{heading:year+'. gada garās brīvdienas',root:false});
process.stdout.write(JSON.stringify(pages));
