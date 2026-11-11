# frozen_string_literal: true

def work_calculator_art
  %(<svg viewBox="0 0 80 92" fill="none" aria-hidden="true"><defs><linearGradient id="wc-case" x1="11" y1="12" x2="69" y2="88" gradientUnits="userSpaceOnUse"><stop stop-color="#fff9ec"/><stop offset="1" stop-color="#c8ada0"/></linearGradient><linearGradient id="wc-key" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#a35268"/><stop offset="1" stop-color="#62233d"/></linearGradient></defs><ellipse cx="43" cy="86" rx="29" ry="4" fill="#77404c" opacity=".12"/><g transform="rotate(-7 40 45)"><rect x="13" y="9" width="57" height="76" rx="10" fill="#67404b"/><rect x="9" y="5" width="57" height="76" rx="10" fill="url(#wc-case)" stroke="#fffaf1" stroke-width="1.5"/><rect x="16" y="13" width="43" height="18" rx="4" fill="#4d5960"/><path d="M22 21h6m7 0h6m8-3v7m-3-4h6" stroke="#e7e8d2" stroke-width="1.5" stroke-linecap="round"/><g fill="#fdf4e8" stroke="#cbb3a6" stroke-width=".8"><rect x="17" y="39" width="10" height="9" rx="2"/><rect x="32" y="39" width="10" height="9" rx="2"/><rect x="17" y="53" width="10" height="9" rx="2"/><rect x="32" y="53" width="10" height="9" rx="2"/><rect x="17" y="67" width="25" height="7" rx="2"/></g><rect x="47" y="39" width="11" height="9" rx="2" fill="url(#wc-key)"/><rect x="47" y="53" width="11" height="21" rx="2" fill="url(#wc-key)"/><path d="M50 61h5m-5 4h5" stroke="#f6dfd8" stroke-width="1.3" stroke-linecap="round"/></g></svg>)
end

def work_date_tool_markup(year, month, annual, selected)
  initial=month ? selected : annual
  modes=[['workdays','days','Darba dienas','Dienas un darba stundas'],['difference','difference','Datumu starpība','Dienas, nedēļas un mēneši'],['add','add','Pieskaitīt vai atņemt','Atrodi nākamo datumu']]
  tabs=modes.map do |id,icon,title,subtitle|
    %(<button type="button" role="tab" id="work-tool-tab-#{id}" data-work-tool-tab="#{id}" aria-controls="work-tool-pane" aria-selected="#{id=='workdays'}" tabindex="#{id=='workdays' ? '0' : '-1'}">#{work_symbol(icon)}<span><strong>#{title}</strong><small>#{subtitle}</small></span></button>)
  end.join
  %(<section class="work-calculator" id="darba-periods" aria-labelledby="work-tool-title">
    <div class="work-calc-heading"><div><span class="work-kicker">VIETA TAVIEM APRĒĶINIEM</span><h2 id="work-tool-title">Tavi datumi. Skaidrs rezultāts.</h2><p>Izvēlies aprēķinu, pielāgo datumus un saņem atbildi tepat.</p></div><span class="work-calc-emblem" aria-hidden="true">#{work_calculator_art}</span></div>
    <div class="work-calc-tabs" role="tablist" aria-label="Datumu aprēķina veids">#{tabs}</div>
    <div class="work-calc-layout">
      <div class="work-calc-inputs" role="tabpanel" id="work-tool-pane" aria-labelledby="work-tool-tab-workdays" tabindex="0">
        <form class="work-date-form" id="work-date-form" data-work-range-form>
          <div class="work-date-pair" data-work-date-pair>
            <label>Sākuma datums<input type="date" name="from" value="#{initial['from']}" min="2027-01-01" max="2030-12-31" required></label>
            <button class="work-date-swap" type="button" data-work-swap aria-label="Samainīt sākuma un beigu datumu">#{work_symbol('swap')}</button>
            <label>Beigu datums<input type="date" name="to" value="#{initial['to']}" min="2027-01-01" max="2030-12-31" required></label>
          </div>
          <div class="work-boundary-options" data-work-mode-part="workdays"><label><input type="checkbox" name="includeStart" checked>Ieskaitīt sākuma dienu</label><label><input type="checkbox" name="includeEnd" checked>Ieskaitīt beigu dienu</label></div>
          <div class="work-boundary-options" data-work-mode-part="difference" hidden><label><input type="checkbox" name="includeBoth">Ieskaitīt abus izvēlētos datumus</label><p>Bez šīs izvēles vienāds datums ir 0 dienu; ar to — 1 diena.</p></div>
          <div class="work-date-shift" data-work-mode-part="add" hidden><label>Sākuma datums<input type="date" name="base" value="#{initial['from']}" min="1900-01-01" max="2100-12-31" required disabled></label><div><label>Skaits<input type="number" name="amount" value="30" min="-100000" max="100000" step="1" required disabled></label><label>Laika vienība<select name="unit" disabled><option value="days">Dienas</option><option value="weeks">Nedēļas</option><option value="months">Mēneši</option></select></label></div><p>Negatīvs skaitlis atņem laiku. Ja mēnesī nav izvēlētās dienas, izmantojam tā pēdējo dienu.</p></div>
          <div class="work-quick-ranges" data-work-range-presets><span>Ātrā izvēle</span><button type="button" data-work-range="month">Mēnesis</button><button type="button" data-work-range="year">Gads</button><button type="button" data-work-quick-days="30">30 dienas</button><button type="button" data-work-quick-days="90">90 dienas</button></div>
        </form>
        <div class="work-tool-schedule" data-work-schedule>#{work_schedule_markup}</div>
        <div class="work-calc-submit"><button type="submit" form="work-date-form" class="work-primary">#{work_symbol('calculate')} Aprēķināt</button><span>Rezultāts mainās uzreiz.</span></div>
        <p class="work-calc-scope" data-work-tool-scope>Latvijas svētki: 2027–2030. Nedēļas grafiks attiecas arī uz gada un mēneša pārskatu zemāk.</p>
      </div>
      <aside class="work-calc-result" aria-labelledby="work-result-title">
        <div class="work-result-top"><span>TAVS REZULTĀTS</span><span class="work-result-badge" data-work-result-badge>LATVIJA</span></div>
        <div data-work-range-result aria-live="polite" aria-atomic="true"><h3 id="work-result-title">Darba dienas izvēlētajā periodā</h3><p class="work-result-dates">#{hub_date(initial['from'])} → #{hub_date(initial['to'])}</p><div class="work-result-value"><strong>#{initial['work']}</strong><span>darba dienas</span></div><div class="work-result-grid"><div><span>Plānotās stundas</span><strong>#{initial['hours']} h</strong></div><div><span>Kalendārās dienas</span><strong>#{initial['days']}</strong></div><div><span>Brīvdienas</span><strong>#{initial['rest']}</strong></div><div><span>Saīsinātas dienas</span><strong>#{initial['shortened']}</strong></div></div></div>
        <div class="work-result-actions"><button type="button" data-work-copy="result">#{work_symbol('copy')} Kopēt rezultātu</button><button type="button" data-work-copy="link">#{work_symbol('link')} Kopēt saiti</button><button type="button" data-work-csv="range">#{work_symbol('download')} Lejupielādēt CSV</button></div>
        <p class="work-copy-feedback" data-work-copy-feedback role="status"></p><label class="work-copy-manual" data-work-copy-manual hidden><span data-work-copy-label>Kopē šo tekstu</span><textarea readonly rows="3"></textarea></label>
      </aside>
    </div>
    <div class="work-calc-steps"><span><b>01</b> Izvēlies aprēķinu</span><span><b>02</b> Norādi datumus</span><span><b>03</b> Kopē vai saglabā</span></div>
  </section>)
end
