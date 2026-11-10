(()=>{'use strict';
  const calendar=document.querySelector('[data-calendar-hub]');
  if(calendar){
    const year=calendar.querySelector('[data-hub-year-filter]');
    const month=calendar.querySelector('[data-hub-month-filter]');
    const result=calendar.querySelector('[data-hub-result]');
    const rows=[...calendar.querySelectorAll('[data-hub-month]')];
    const update=()=>{
      let count=0;
      rows.forEach(row=>{
        const visible=month.value==='all'||row.dataset.hubMonth===month.value;
        row.hidden=!visible;
        row.querySelectorAll('[data-hub-year]').forEach(cell=>{
          cell.hidden=!visible||(year.value!=='all'&&cell.dataset.hubYear!==year.value);
          if(!cell.hidden)count++;
        });
      });
      calendar.querySelectorAll('thead th').forEach((heading,index)=>{if(index>0)heading.hidden=year.value!=='all'&&heading.textContent.trim()!==year.value});
      result.textContent=`${count} ${count===1?'mēnesis':'mēneši'}`;
    };
    year.addEventListener('change',update);month.addEventListener('change',update);
    calendar.querySelector('[data-hub-reset]').addEventListener('click',()=>{year.value='all';month.value='all';update();year.focus()});
  }
  const grade=document.querySelector('[data-school-grade]');
  const end=document.querySelector('[data-school-end]');
  if(grade&&end){
    const formatter=new Intl.DateTimeFormat('lv-LV',{day:'numeric',month:'long',year:'numeric',timeZone:'Europe/Riga'});
    const update=()=>{const [y,m,d]=grade.value.split('-').map(Number);end.textContent=formatter.format(new Date(Date.UTC(y,m-1,d,12)))};
    grade.addEventListener('change',update);
  }
})();
