import fs from 'node:fs';
import {renderSeasonCards} from '../assets/season-cards.mjs';
const data = JSON.parse(fs.readFileSync(0, 'utf8'));
const keys = {3:'spring',6:'summer',9:'autumn',12:'winter'};
const rows = data.seasons.filter(row => keys[Number(row.date.slice(5,7))]).sort((a,b)=>a.utc.localeCompare(b.utc));
const selected = rows.filter(row => row.date.startsWith('2027-')).map(row => {
  const index = rows.indexOf(row), month=Number(row.date.slice(5,7));
  return {...row,month,title:data.scenes.find(scene=>scene.key===keys[month]).title,
    length:rows[index+1] ? Math.round((Date.parse(rows[index+1].utc)-Date.parse(row.utc))/864000)/100 : null};
});
if (selected.length!==4) throw new Error('Expected four verified initial seasons');
process.stdout.write(renderSeasonCards(selected,data.scenes,'astro',{
  dateLabel:date=>new Intl.DateTimeFormat('lv-LV',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(date+'T12:00:00Z')),
  utcTime:date=>new Intl.DateTimeFormat('lv-LV',{hour:'2-digit',minute:'2-digit',timeZone:'UTC'}).format(new Date(date))+' UTC',
  asset:src=>src+'?v={{ site.data.build.asset_version }}'
}));
