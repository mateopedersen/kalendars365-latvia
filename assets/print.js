/* Kalendārs365 printing. One millimetre-based scene feeds both vector PDF and 600 ppi WebP. */
(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.K365Print = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  'use strict';
  const names = ['Karmīna klasika','Rīgas panorāma','Melnbalts arhīvs','Latvju rakstu josla','Mājīgs ģimenes plāns','Minimāls melnbalts','Dabas gadalaiki','Stingrais birojs','Mēness grafika','Ģeometriskais bordo','Skolas nedēļa','Smalkas līnijas','Maiņu maiņstrāva','Redaktora izkārtojums','Svētku ornaments'];
  const designs = names.map((name,i)=>({id:i+1,name,mode:[3,6,8,12,14].includes(i+1)?'melnbalts':'krāsains',orientation:[2,5,7,8,11,13,15].includes(i+1)?'landscape':'portrait'}));
  const months = ['Janvāris','Februāris','Marts','Aprīlis','Maijs','Jūnijs','Jūlijs','Augusts','Septembris','Oktobris','Novembris','Decembris'];
  const genitive = ['janvāra','februāra','marta','aprīļa','maija','jūnija','jūlija','augusta','septembra','oktobra','novembra','decembra'];
  const days = ['P.','O.','T.','C.','Pk.','S.','Sv.'];
  const weekdays = ['Pirmdiena','Otrdiena','Trešdiena','Ceturtdiena','Piektdiena','Sestdiena','Svētdiena'];
  const types = ['yearly','monthly','weekly','daily','lunar','blank','work','family','shift','school','named','lunar-year','work-year'];
  const annualTypes=['yearly','named','lunar-year','work-year'];
  const labels = {yearly:'Gada kalendārs',monthly:'Mēneša kalendārs',weekly:'Nedēļas plānotājs',daily:'Dienas plānotājs',lunar:'Mēness kalendārs',blank:'Tukšs kalendārs',work:'Darba dienu kalendārs',family:'Ģimenes plānotājs',shift:'Maiņu plānotājs',school:'Stundu saraksts',named:'Kalendārs ar vārdu','lunar-year':'Mēness gada kalendārs','work-year':'Darba dienu gada kalendārs'};
  const iso = d=>d.toISOString().slice(0,10);
  const dt = (y,m,d)=>new Date(Date.UTC(y,m-1,d));
  const dim = (y,m)=>dt(y,m+1,0).getUTCDate();
  const add = (d,n)=>new Date(d.getTime()+n*86400000);
  function week(d) {let x=new Date(d);x.setUTCHours(0,0,0,0);x.setUTCDate(x.getUTCDate()+4-(x.getUTCDay()||7));return {year:x.getUTCFullYear(),week:Math.ceil((((x-dt(x.getUTCFullYear(),1,1))/86400000)+1)/7)};}
  const slug = x=>String(x).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  function options(input={}) {
    const o={type:'yearly',year:2027,month:1,week:1,design:1,name:'',format:'pdf',domain:'kalendars365.lv',photoX:.5,photoY:.5,photoZoom:1,...input};
    o.design=Number(o.design); o.year=Number(o.year); o.month=Number(o.month); o.week=Number(o.week);
    if(!types.includes(o.type)||!Number.isInteger(o.year)||o.year<2027||o.year>2030||!Number.isInteger(o.month)||o.month<1||o.month>12||!Number.isInteger(o.design)||o.design<1||o.design>15) throw Error('Izvēlieties derīgu gadu, mēnesi un dizainu.');
    if(!['pdf','webp'].includes(o.format)) throw Error('Atbalstītie formāti: PDF un WebP.');
    if(!Number.isInteger(o.week)||o.week<1||o.week>53) throw Error('Nederīgs ISO nedēļas numurs.');
    if(o.name.length>80) throw Error('Vārds ir pārāk garš (ne vairāk kā 80 rakstzīmes).');
    o.name=o.name.replace(/[\x00-\x1f]/g,'').trim();
    if(o.name&&!/^[\p{Script=Latin}\p{M}\d .,'’()&-]+$/u.test(o.name))throw Error('Vārdā izmantojiet latīņu alfabēta burtus un parastas pieturzīmes.');
    o.orientation=o.orientation||designs[o.design-1].orientation;
    if(!['portrait','landscape'].includes(o.orientation)) throw Error('Izvēlieties lapas orientāciju.');
    for(const key of ['photoX','photoY','photoZoom'])o[key]=Number(o[key]);
    if(!Number.isFinite(o.photoX)||!Number.isFinite(o.photoY)||!Number.isFinite(o.photoZoom)||o.photoX<0||o.photoX>1||o.photoY<0||o.photoY>1||o.photoZoom<1||o.photoZoom>3)throw Error('Nederīgs fotoattēla izgriezums.');
    if(o.date && (!/^\d{4}-\d{2}-\d{2}$/.test(o.date)||!Number.isFinite(Date.parse(o.date))||iso(new Date(o.date))!==o.date)) throw Error('Nederīgs datums.');
    if(['weekly','family','shift','school'].includes(o.type)){
      if(o.date){const iw=week(new Date(o.date));o.week=iw.week;o.weekYear=iw.year;}
      else if(o.week>week(dt(o.year,12,28)).week)throw Error('Šajā ISO gadā nav 53. nedēļas.');
    }
    return o;
  }
  function buildScene(input={},data={}) {
    const o=options(input), landscape=o.orientation==='landscape', W=landscape?297:210,H=landscape?210:297;
    const d=o.design,mono=designs[d-1].mode==='melnbalts',accent=mono?'#202020':d===7?'#375b46':d===9?'#283852':'#8b1d34';
    const ink='#22252b', muted='#64666c', pale=mono?'#f1f1f1':d===7?'#edf3ed':'#f8eff1',line='#d4d5d7';
    const commands=[],S={width:W,height:H,commands,options:o,design:designs[d-1]};
    const text=(s,x,y,size=3,color=ink,bold=false,align='left')=>commands.push({op:'text',text:String(s),x,y,size:size>=7?Math.min(size,(W-32)/(Math.max(String(s).length,1)*.62)):size,color,bold,align});
    const rect=(x,y,w,h,fill,stroke=null,lw=.2)=>commands.push({op:'rect',x,y,w,h,fill,stroke,lw});
    const ln=(x1,y1,x2,y2,color=line,lw=.2)=>commands.push({op:'line',x1,y1,x2,y2,color,lw});
    const circle=(x,y,r,fill,stroke=null,lw=.2)=>commands.push({op:'circle',x,y,r,fill,stroke,lw});
    const poly=(pts,fill,stroke=null,lw=.2)=>commands.push({op:'poly',pts,fill,stroke,lw});
    const wrap=(s,x,y,maxWidth,size=2.6,color=muted,maxLines=3)=>{let lines=[],part='';for(const word of String(s).split(/\s+/)){if((part+' '+word).length*size*.53>maxWidth&&part){lines.push(part);part=word;}else part+=(part?' ':'')+word;}lines.push(part);lines.slice(0,maxLines).forEach((t,i)=>text(t,x,y+i*size*1.5,size,color));return Math.min(lines.length,maxLines)*size*1.5;};
    const holidays=(data.holidays||[]).filter(x=>x.date?.startsWith(String(o.year))&&x.dayOff!==false&&['public','public_holiday','holiday','substitute','compensatory','rest_day'].includes(x.type));
    const isHoliday=val=>holidays.some(x=>x.date===val);
    const moons=data.moon||[];
    const selectedDay=o.date?new Date(o.date):dt(o.year,o.month,1);
    const title=o.type==='named'&&o.name?o.name:o.type==='daily'?`${selectedDay.getUTCFullYear()}. gada ${selectedDay.getUTCDate()}. ${months[selectedDay.getUTCMonth()].toLocaleLowerCase('lv')}`:annualTypes.includes(o.type)?String(o.year):['weekly','family','shift','school'].includes(o.type)?`${o.weekYear||o.year} · ${o.week}. nedēļa`:`${months[o.month-1]} ${o.year}`;
    rect(0,0,W,H,'#ffffff');
    let left=14,right=14,top=55,bottom=H-23;
    function ornament(x,y,w,h){for(let a=x;a<x+w-3;a+=7){poly([[a+3,y],[a+6,y+3],[a+3,y+6],[a,y+3]],null,accent,.45);ln(a,y+h-3,a+6,y+h-3,accent,.3);}}
    function skyline(x,y,w,h){rect(x,y,w,h,pale);const hs=[.22,.29,.4,.25,.57,.36,.48,.3,.67,.33,.4,.84,.31,.26,.43,.27,.35];hs.forEach((z,i)=>{const bx=x+w*i/hs.length,bw=w/hs.length*.84,by=y+h*(1-z);rect(bx,by,bw,h*z,accent);if([4,8,11].includes(i)){poly([[bx+bw*.18,by],[bx+bw*.5,by-h*.20],[bx+bw*.82,by]],accent);ln(bx+bw/2,by-h*.2,bx+bw/2,by-h*.3,accent,.4);}});ln(x,y+h+1,x+w,y+h+1,accent,.45);}
    if(d===1){text('KALENDĀRS365 · LATVIJA',left,18,2.8,accent,true);text(title,left,34,10,accent,true);ln(left,44,W-right,44,accent,.65);}
    if(d===2){skyline(0,0,W,31);text(title,left,44,8,accent,true);text('RĪGA · LAIKS TAVIEM PLĀNIEM',W-right,43,2.6,accent,false,'right');top=54;}
    if(d===3){rect(left,12,W-left-right,27,null,ink,.8);text(title,W/2,24,8,ink,true,'center');text('KALENDĀRS / LATVIJA',W/2,33,2.4,ink,false,'center');top=49;}
    if(d===4){rect(0,0,9,H,pale);for(let y=10;y<H-10;y+=9)ornament(1,y,8,7);left=20;text(title,left,29,10,accent,true);text('LATVJU RAKSTU JOSLA',left,39,2.5,accent);top=52;}
    if(d===5){text('ĢIMENES LAIKS',left,18,3,accent,true);text(title,left,31,8,accent,true);['Kopā','Mājās','Ārpus mājas','Svarīgi'].forEach((s,i)=>{rect(left+i*(W-left-right)/4,40,(W-left-right)/4-2,9,i%2?pale:'#f1f3ed');text(s,left+3+i*(W-left-right)/4,46,2.8,accent);});top=57;}
    if(d===6){text(title,left,32,9,ink);text(labels[o.type].toUpperCase(),left,42,2.4,muted);top=66;bottom=H-35;}
    if(d===7){rect(W*.62,0,W*.38,47,pale);for(let i=0;i<9;i++){const x=W*.66+i*9;poly([[x,44],[x+5,17+(i%3)*5],[x+10,44]],accent);}text(title,left,27,8,accent,true);text('DABAS RITMĀ',left,38,2.8,accent);top=58;}
    if(d===8){rect(left,13,W-left-right,15,ink);text(title,left+4,23,7,'#ffffff',true);text('DARBS · PRIORITĀTES · REZULTĀTI',left,37,2.6,ink,true);top=46;}
    if(d===9){rect(0,0,W,44,accent);circle(W-33,22,13,'#ffffff');circle(W-27,18,12,accent);text(title,left,23,8,'#ffffff',true);text('VĒRO. IEPLĀNO. PIERAKSTI.',left,35,2.6,'#ffffff');top=57;}
    if(d===10){poly([[W-65,0],[W,0],[W,59]],accent);poly([[W-84,0],[W-67,0],[W,67],[W,82]],pale);text(title,left,29,10,accent,true);ln(left,39,left+45,39,accent,1.4);top=55;}
    if(d===11){text('MANA NEDĒĻA',left,17,3,accent,true);text(title,left,31,8,accent,true);for(let i=0;i<5;i++)rect(left+i*(W-left-right)/5,41,(W-left-right)/5-2,3,i%2?accent:pale);top=53;}
    if(d===12){text(title,left,28,8,ink);ln(left,37,W-right,37,ink,.25);text('PLĀNIEM UN PIERAKSTIEM',left,44,2.2,muted);top=59;bottom=H-45;}
    if(d===13){rect(0,0,12,H,accent);left=21;text(title,left,27,9,accent,true);['Rīts','Diena','Vakars','Nakts'].forEach((s,i)=>{rect(left+i*35,38,32,8,i%2?pale:'#f0f2f4');text(s,left+3+i*35,43.5,2.5,ink);});top=56;}
    if(d===14){text('KALENDĀRS365',left,17,3,ink,true);text(title,left,33,9,ink,true);ln(left,42,W-right,42,ink,.8);top=53;right=55;}
    if(d===15){ornament(left,9,W-left-right,9);text(title,W/2,34,9,accent,true,'center');text('LAIKS SVĒTKIEM. VIETA IKDIENAI.',W/2,43,2.5,accent,false,'center');top=55;ornament(left,H-17,W-left-right,8);bottom=H-28;}
    if(o.photo){commands.push({op:'image',src:o.photo,x:left,y:top,w:W-left-right,h:landscape?32:42});top+=landscape?38:48;}
    if(o.type==='named'&&o.name){const found=(data.names||[]).filter(n=>n.name?.toLocaleLowerCase('lv')===o.name.toLocaleLowerCase('lv')&&n.kind==='traditional');const nameday=found.length?` · Vārda diena: ${found.map(n=>`${n.day}.${String(n.month).padStart(2,'0')}.`).join(', ')}${found[0].edition?` (VVC ${found[0].edition})`:''}`:'';text(`${o.year}. gada kalendārs${nameday}`,left,top-3,3,muted);top+=3;}
    if(o.type==='lunar-year')text('Mēness fāzes · USNO · Europe/Riga',left,top-5,2.4,muted);
    if(o.type==='work-year')text('Darba dienas · 5 dienu nedēļa · bez darba dienu pārcelšanas',left,top-5,2.3,muted);
    const cw=W-left-right;
    function phaseSymbol(x,y,r,key){circle(x,y,r,key==='New Moon'?accent:'#ffffff',accent,.13);if(key==='First Quarter'||key==='Last Quarter'){const start=key==='First Quarter'?Math.PI/2:-Math.PI/2;const pts=[];for(let i=0;i<=12;i++){const a=start+i*Math.PI/12;pts.push([x+r*Math.cos(a),y+r*Math.sin(a)]);}poly(pts,accent);}}
    function miniMonth(y,m,x,y0,w,h,large=false){
      const n=dim(y,m),offset=(dt(y,m,1).getUTCDay()+6)%7,rows=Math.ceil((n+offset)/7),weekCol=w*.08,cell=(w-weekCol)/7,head=large?12:8,rowH=(h-head-5)/(large?rows:6),base=large?3.5:2.2;
      const workCount=Array.from({length:n},(_,i)=>dt(y,m,i+1)).filter(v=>v.getUTCDay()!==0&&v.getUTCDay()!==6&&!isHoliday(iso(v))).length;
      text(large?labels[o.type]:months[m-1]+(o.type==='work-year'?` · ${workCount} d.d.`:''),x,y0,large?3.1:3.2,accent,true);
      if(o.type==='work'&&large)text('Pirmdiena-piektdiena; svētku dienas atzīmētas',x,y0+5,2.3,muted);
      days.forEach((s,i)=>text(s,x+weekCol+cell*(i+.5),y0+head-3,large?2.8:2.1,i>4?accent:muted,true,'center'));
      if(d!==6)ln(x,y0+head,W===0?x:x+w,y0+head,line,.25);
      for(let r=0;r<rows;r++){
        const monday=dt(y,m,1-offset+r*7);text(String(week(monday).week),x+weekCol*.35,y0+head+r*rowH+Math.min(rowH*.32,5),1.9,muted,false,'center');
        if([8,13].includes(d)&&r%2===0)rect(x+weekCol,y0+head+r*rowH,w-weekCol,rowH,pale);
        for(let i=0;i<7;i++){
          const num=r*7+i-offset+1,bx=x+weekCol+i*cell,by=y0+head+r*rowH;
          if(d===3||d===8||(large&&![6,12].includes(d)))rect(bx,by,cell,rowH,null,line,d===3?.3:.15);
          if(num>0&&num<=n){const val=iso(dt(y,m,num)),holiday=isHoliday(val),weekend=i>4;
            if((large||o.type==='work-year')&&(weekend||holiday)&&d!==6)rect(bx,by,cell,rowH,pale);
            const phase=o.type==='lunar-year'?moons.find(v=>v.date?.slice(0,10)===val):null;
            if(o.type!=='blank')text(String(num),large?bx+2:bx+cell*(phase ? .31 : .5),by+Math.min(rowH*.34,6),base,holiday||weekend?accent:ink,holiday,large?'left':'center');
            if(phase)phaseSymbol(bx+cell*.81,by+Math.min(rowH*.34,6)-.7,.55,phase.phaseKey);
            if(large&&holiday&&o.type!=='blank'&&rowH>17){let hs=holidays.filter(v=>v.date===val).map(v=>v.title).join(', ');wrap(hs,bx+2,by+11,cell-4,1.9,accent,Math.floor((rowH-12)/3));}
            if(large&&o.type==='lunar'){const found=moons.find(v=>v.date?.slice(0,10)===val);if(found){circle(bx+cell-4,by+5,1.3,accent);if(rowH>=18)wrap(found.phase,bx+2,by+11,cell-4,1.8,muted,2);else text({'New Moon':'JM','First Quarter':'1C','Full Moon':'PM','Last Quarter':'3C'}[found.phaseKey]||'',bx+2,by+rowH-2,1.8,muted);}}
          }
          if(d===6&&large)ln(bx+2,by+rowH-2,bx+cell-2,by+rowH-2,line,.15);
        }
      }
    }
    if(annualTypes.includes(o.type)){
      let cols=landscape?4:3,rows=12/cols;if(d===5){cols=landscape?4:2;rows=12/cols;}if(d===14){cols=landscape?4:2;rows=12/cols;}
      const gapX=7,gapY=d===6?9:6,mw=(cw-gapX*(cols-1))/cols,mh=(bottom-top-gapY*(rows-1))/rows;
      for(let m=1;m<=12;m++)miniMonth(o.year,m,left+((m-1)%cols)*(mw+gapX),top+Math.floor((m-1)/cols)*(mh+gapY),mw,mh);
      if(o.type==='lunar-year'){if(moons.length){[['New Moon','Jauns Mēness'],['First Quarter','Pirmais ceturksnis'],['Full Moon','Pilnmēness'],['Last Quarter','Pēdējais ceturksnis']].forEach(([key,label],i)=>{const x=left+i*(W-left-14)/4;phaseSymbol(x+1,H-20,1,key);text(label,x+4,H-19.2,1.8,muted);});}else text('Fāžu dati vēl nav pārbaudīti; simboli nav attēloti.',left,H-20,2.2,muted);}
      if(o.type==='work-year')text('d.d. = darba dienas; valsts svētku dienas izslēgtas. Individuālais grafiks var atšķirties.',left,H-20,2,muted);
    } else if(['monthly','lunar','work','blank'].includes(o.type)) {
      let gridBottom=bottom;
      if(d===5||d===11||d===12)gridBottom-=28;
      miniMonth(o.year,o.month,left,top,cw,gridBottom-top,true);
      if(o.type==='lunar')text(moons.length?'USNO · JM: jauns Mēness · 1C: pirmais ceturksnis · PM: pilnmēness · 3C: pēdējais ceturksnis':'Mēness fāžu dati vēl nav pārbaudīti; fāzes nav attēlotas.',left,bottom+5,1.9,muted);
      if(gridBottom<bottom){text(d===11?'Mācību mērķi':d===5?'Ģimenes plāni':'Piezīmes',left,gridBottom+7,2.8,accent,true);for(let y=gridBottom+13;y<bottom;y+=6)ln(left,y,W-right,y,line,.2);}
    } else if(o.type==='daily') {
      const split=left+cw*.64,bodyH=bottom-top;
      text('LAIKS / PLĀNS',left,top,2.5,accent,true);text('PRIORITĀTES',split+5,top,2.5,accent,true);
      for(let i=0;i<16;i++){const y=top+8+i*(bodyH-10)/16;text(`${String(i+6).padStart(2,'0')}:00`,left,y+2,2.5,muted);ln(left+14,y+4,split-5,y+4,line,.2);}
      for(let i=0;i<3;i++){rect(split+5,top+9+i*12,3,3,null,line,.25);ln(split+11,top+12+i*12,W-right,top+12+i*12,line,.2);}text('PIEZĪMES',split+5,top+54,2.5,accent,true);for(let y=top+65;y<bottom;y+=8)ln(split+5,y,W-right,y,line,.2);
    } else {
      const jan4=dt(o.weekYear||o.year,1,4),monday=add(jan4,-((jan4.getUTCDay()+6)%7)+(o.week-1)*7),rowH=(bottom-top-12)/8;
      const cols=o.type==='school'?5:7,cell=cw/cols;
      for(let i=0;i<cols;i++){const x=left+i*cell,date=add(monday,i);rect(x,top,cell,12,i%2?pale:'#f7f7f7');text(weekdays[i],x+2,top+4.5,2.3,accent,true);text(`${date.getUTCDate()}.${String(date.getUTCMonth()+1).padStart(2,'0')}.`,x+2,top+9,2.3,muted);for(let r=0;r<8;r++){const y=top+12+r*rowH;rect(x,y,cell,rowH,null,line,.2);text(o.type==='school'?`${r+1}.`:(o.type==='family'?'':o.type==='shift'?'Maiņa:':`${String(r*2+7).padStart(2,'0')}:00`),x+2,y+4,2.2,muted);}}
      if(o.type==='school')text('Stundu saraksts personīgai plānošanai; skolēnu brīvlaiki nav prognozēti.',left,bottom+5,2.2,muted);
      if(o.type==='shift')text('Maiņu laiku aizpilda lietotājs; darba grafiks nav automātiski piešķirts.',left,bottom+5,2.2,muted);
    }
    if(d===14){const x=W-47;text('ŠĪ PERIODA',x,top,2.2,ink,true);text('PIEZĪMES',x,top+5,2.2,ink,true);for(let i=0;i<Math.floor((bottom-top-18)/10);i++){text(String(i+1).padStart(2,'0'),x,top+17+i*10,1.9,muted);ln(x+6,top+18+i*10,W-14,top+18+i*10,line,.2);}}
    if(d===12){text('01   Svarīgākais',left,H-33,2.3,muted);ln(left+32,H-32,W-right,H-32,line,.2);}
    if(d!==15)ln(left,H-16,W-14,H-16,line,.2);
    const domain=o.domain&&/^[a-z0-9][a-z0-9.-]+\.[a-z]{2,}$/i.test(o.domain)?` · ${o.domain}`:'';
    text(`Kalendārs365${domain}`,left,H-9,2.4,accent,true);text(`${designs[d-1].name} · A4 · ${o.orientation==='landscape'?'horizontāli':'vertikāli'}`,W-14,H-9,2.1,muted,false,'right');
    const period=['weekly','family','school','shift'].includes(o.type)?`${o.weekYear||o.year}-gada-${o.week}-nedela`:o.type==='daily'?(o.date||iso(dt(o.year,o.month,1))):`${o.year}-${annualTypes.includes(o.type)?'gada':'gada-'+genitive[o.month-1]}`;
    S.filename=slug(`${period}-${o.type==='yearly'?'kalendars':o.type==='lunar-year'?'meness-kalendars':o.type==='work-year'?'darba-dienu-kalendars':labels[o.type]}${o.name?'-'+o.name:''}-${String(d).padStart(2,'0')}`);
    return S;
  }
  function canvasPaint(scene,canvas,images={}) {
    const width=Math.round(scene.width/25.4*600),height=Math.round(scene.height/25.4*600);canvas.width=width;canvas.height=height;
    const ctx=canvas.getContext('2d');if(!ctx)throw Error('Šajā ierīcē attēlu nevar izveidot. Izvēlieties PDF.');ctx.setTransform(width/scene.width,0,0,height/scene.height,0,0);
    for(const c of scene.commands){ctx.fillStyle=c.fill||c.color||'#000000';ctx.strokeStyle=c.stroke||c.color||'#000000';ctx.lineWidth=c.lw||.2;
      if(c.op==='rect'){if(c.fill)ctx.fillRect(c.x,c.y,c.w,c.h);if(c.stroke)ctx.strokeRect(c.x,c.y,c.w,c.h);}
      if(c.op==='line'){ctx.beginPath();ctx.moveTo(c.x1,c.y1);ctx.lineTo(c.x2,c.y2);ctx.stroke();}
      if(c.op==='circle'){ctx.beginPath();ctx.arc(c.x,c.y,c.r,0,Math.PI*2);if(c.fill)ctx.fill();if(c.stroke)ctx.stroke();}
      if(c.op==='poly'){ctx.beginPath();c.pts.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath();if(c.fill)ctx.fill();if(c.stroke)ctx.stroke();}
      if(c.op==='text'){ctx.fillStyle=c.color;ctx.font=`${c.bold?'bold ':''}${c.size}px "K365 DM Sans"`;ctx.textAlign=c.align;ctx.fillText(c.text,c.x,c.y);}
      if(c.op==='image'&&images[c.src]){const im=images[c.src],ratio=Math.max(c.w/im.width,c.h/im.height),iw=im.width*ratio,ih=im.height*ratio;ctx.save();ctx.beginPath();ctx.rect(c.x,c.y,c.w,c.h);ctx.clip();ctx.drawImage(im,c.x+(c.w-iw)/2,c.y+(c.h-ih)/2,iw,ih);ctx.restore();}
    }return {width,height};
  }
  async function pdfBytes(scene,PDFLib,fontkit,regular,bold,images={}) {
    const doc=await PDFLib.PDFDocument.create();doc.registerFontkit(fontkit);const fonts=[await doc.embedFont(regular,{subset:true}),await doc.embedFont(bold,{subset:true})];
    doc.setTitle(`${labels[scene.options.type]} ${scene.options.year} · Kalendārs365`);doc.setAuthor('Kalendārs365');doc.setSubject(scene.design.name);doc.setCreator('Kalendārs365 vector print engine');doc.setLanguage('lv-LV');
    const k=72/25.4,page=doc.addPage([scene.width*k,scene.height*k]);const rgb=x=>{const h=x.replace('#','');return PDFLib.rgb(parseInt(h.slice(0,2),16)/255,parseInt(h.slice(2,4),16)/255,parseInt(h.slice(4,6),16)/255);};
    for(const c of scene.commands){const st={color:c.fill?rgb(c.fill):undefined,borderColor:c.stroke?rgb(c.stroke):undefined,borderWidth:c.stroke?(c.lw||.2)*k:0};
      if(c.op==='rect')page.drawRectangle({x:c.x*k,y:(scene.height-c.y-c.h)*k,width:c.w*k,height:c.h*k,...st});
      if(c.op==='line')page.drawLine({start:{x:c.x1*k,y:(scene.height-c.y1)*k},end:{x:c.x2*k,y:(scene.height-c.y2)*k},color:rgb(c.color),thickness:c.lw*k});
      if(c.op==='circle')page.drawCircle({x:c.x*k,y:(scene.height-c.y)*k,size:c.r*k,...st});
      if(c.op==='poly'){const p=c.pts.map((v,i)=>`${i?'L':'M'} ${v[0]*k} ${v[1]*k}`).join(' ')+' Z';page.drawSvgPath(p,{x:0,y:scene.height*k,...st});}
      if(c.op==='text'){const f=fonts[c.bold?1:0],size=c.size*k,w=f.widthOfTextAtSize(c.text,size),x=c.x*k-(c.align==='right'?w:c.align==='center'?w/2:0);page.drawText(c.text,{x,y:(scene.height-c.y)*k,size,font:f,color:rgb(c.color)});}
      if(c.op==='image'&&images[c.src]){let im=images[c.src];if(im.bytes){const embedded=im.mime==='image/jpeg'?await doc.embedJpg(im.bytes):await doc.embedPng(im.bytes);page.drawImage(embedded,{x:c.x*k,y:(scene.height-c.y-c.h)*k,width:c.w*k,height:c.h*k});}}
    }
    return doc.save();
  }
  let loadPromise;
  async function loadBrowser(){
    if(loadPromise)return loadPromise;
    loadPromise=(async()=>{const version=document.querySelector('meta[name=asset-version]')?.content;const assetURL=src=>version?src+'?v='+encodeURIComponent(version):src;const load=src=>new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=assetURL(src);s.onload=resolve;s.onerror=()=>reject(Error('Neizdevās ielādēt drukas moduli.'));document.head.appendChild(s);});
      if(!globalThis.PDFLib)await load('/assets/vendor/pdf-lib.min.js');if(!globalThis.fontkit)await load('/assets/vendor/fontkit.umd.min.js');
      const [regular,bold]=await Promise.all(['Regular','Bold'].map(async style=>{const r=await fetch(assetURL(`/assets/fonts/DM-Sans-${style}.ttf`));if(!r.ok)throw Error('Neizdevās ielādēt drukas fontu.');return new Uint8Array(await r.arrayBuffer());}));
      await Promise.all([[regular,'normal'],[bold,'bold']].map(async([bytes,weight])=>{const f=new FontFace('K365 DM Sans',bytes,{weight});await f.load();document.fonts.add(f);}));
      const r=await fetch(assetURL('/assets/calendar-data.json'));let data=r.ok?await r.json():{};return {regular,bold,data};
    })().catch(e=>{loadPromise=null;throw e;});return loadPromise;
  }
  async function generate(input={}){
    const o=options(input),{regular,bold,data}=await loadBrowser(),scene=buildScene(o,data),images={};let photoPpi=null;
    if(o.photo){if(typeof o.photo!=='string'||!/^data:image\/(png|jpeg|webp);base64,/.test(o.photo)||o.photo.length>14*1024*1024)throw Error('Fotoattēlam jābūt PNG, JPEG vai WebP failam līdz 10 MB.');const img=new Image();img.src=o.photo;await img.decode();if(img.width*img.height>40000000)throw Error('Fotoattēls ir pārāk liels. Samaziniet to līdz 40 megapikseļiem.');const cmd=scene.commands.find(c=>c.op==='image');const c=document.createElement('canvas');c.width=Math.round(cmd.w/25.4*600);c.height=Math.round(cmd.h/25.4*600);const cx=c.getContext('2d'),r=Math.max(c.width/img.width,c.height/img.height)*o.photoZoom;photoPpi=Math.floor(600/r);if(designs[o.design-1].mode==='melnbalts')cx.filter='grayscale(1)';cx.drawImage(img,(c.width-img.width*r)*o.photoX,(c.height-img.height*r)*o.photoY,img.width*r,img.height*r);const url=c.toDataURL('image/png');const cropped=new Image();cropped.src=url;await cropped.decode();cropped.bytes=Uint8Array.from(atob(url.split(',')[1]),ch=>ch.charCodeAt(0));cropped.mime='image/png';images[o.photo]=cropped;}
    let blob,width=Math.round(scene.width/25.4*600),height=Math.round(scene.height/25.4*600);
    if(o.format==='pdf'){const bytes=await pdfBytes(scene,globalThis.PDFLib,globalThis.fontkit,regular,bold,images);blob=new Blob([bytes],{type:'application/pdf'});}
    else {const canvas=document.createElement('canvas');canvasPaint(scene,canvas,images);blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',.96));canvas.width=1;canvas.height=1;if(!blob||blob.type!=='image/webp')throw Error('Šī pārlūkprogramma nevar izveidot 600 ppi WebP. Izvēlieties PDF.');}
    const filename=scene.filename+'.'+o.format;
    if(o.download!==false){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);}
    return {filename,blob,width,height,scene,photoPpi,warning:photoPpi!==null&&photoPpi<600?`Fotoattēla faktiskā izšķirtspēja pēc izgriešanas: ${photoPpi} ppi (zem 600 ppi).`:null};
  }
  return {designs,types,labels,options,buildScene,canvasPaint,pdfBytes,generate};
});
