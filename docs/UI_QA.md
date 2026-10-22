# Frontend verification and handoff

## Implemented behavior

Latvian responsive dashboard with five calendar views; Riga-local today/time; holiday and historical name-day data; events with daily/weekly/monthly/yearly recurrence; tasks; per-day notes; local backup/restore; ICS import/export; consent controls; local search with Latvian diacritic normalization and one-edit typo matching. The print dialog supports 15 designs, 13 calendar types, PDF/WebP, photo position/zoom and low-resolution photo warnings. Route widgets read the page family and nearest print section context.

## Completed automated checks

`node test/frontend_test.cjs`: **48 passing checks** as of 2026-10-22. Covers ICS round-trip, UTF-8 line folding, Riga/UTC time conversion, invalid dates, strict recurrence limits, January 31 and leap-day COUNT, timed UTC UNTIL, exclusive DTEND, repeating multi-day duration, edit metadata preservation, diacritic/typo search, ISO-year boundaries, and two USNO solar-time spot checks.

Parent-run Lighthouse mobile v3: **performance 99, accessibility 100, best practices 100, SEO 100**, **CLS 0**, simulated **LCP 2.0 seconds**. Earlier v2 was 87/100/100/100 before the smaller mobile hero source. Earlier accessibility and layout failures were corrected: no aria-pressed on body, persistent search label, readable other-month/footer colors, space reserved before calendar rendering. A production compressed response should be measured separately; this is not a claim of field Core Web Vitals.

## Completed browser checks

An earlier local preview was exercised through the documented browser UI. Created, edited and deleted a recurring personal event containing `<svg onload=alert(1)>`; text remained literal. Notes and a task survived a reload. All five calendar views rendered the saved event. Test-only records were removed. A form input called `id` originally shadowed the form element ID and prevented save interception; it was renamed to `eventId`, and save/reload behavior was verified afterward.

Full Jekyll preview at port 8888 was checked at exact CSS widths **320, 375, 430, 768, 1024, 1448, 1920**: document width equaled scroll width at each size. Screenshots are in the delivery `outputs/screenshots/` directory. These screenshots precede the final uniform six-row grid, compact desktop sizing and performance fixes, so a final pass should refresh them. Width checks used CDP device metrics with deviceScaleFactor 1; native Retina screenshots were not reliable for exact sizing.

After the interrupted turn, this child agent's browser inventory became empty. The root agent still has a working browser and owns the remaining pass below. Root subsequently completed real PDF and WebP downloads in the browser: the PDF opened as one A4 page with correct Unicode; the WebP dimensions were 4961×7016. The later user instruction removed dark mode entirely; the final appearance pass should verify light mode with a previously saved dark preference.

## Reproducible browser flow (remaining visual checks noted above)

Use the compiled preview `http://127.0.0.1:8888/` after rebuilding latest assets, or the deployed URL after verifying its asset-version meta is current. UI tests create disposable local-only records.

1. **Home and accessibility**: read the latest page state; reject nonessential cookie choice if shown. `body` must not have `aria-pressed`. `.header-search` has accessible label `Meklēt datumu, vārdu vai rīku`. Use `button[data-view="month"]`, `week`, `day`, `list`, `year`; month has six rows and year has 12 mini-months. Calendar day buttons are `[data-date="YYYY-MM-DD"]`. `.add-event` opens the form.
2. **Save/reload**: `#event-form [name=title]`, `date`, `time`, `repeat`, `interval`, `until`, `description`; submit the form's primary button. Save must keep the page URL and show the event. Notes use `#notes`; task form `#task-form [name=task]`. Reload and inspect both. Edit via `[data-edit-event]`; delete via `[data-delete-event]`; task delete `[data-delete-task]`.
3. **Search**: `.header-search` opens modal; `#site-search-form [name=q]`; enter `janis`, then `kalendrs`. Results should be real internal links. Exact named pages also exist for available data.
4. **PDF download**: navigate `/pdf-kalendari/2029/februaris/`. Wait for 15 `.design-card` elements. Start `tab.playwright.waitForEvent('download', {timeoutMs:60000})`, click `[data-quick-print="pdf"][data-design-id="1"]`, await download and its `.path()`. The status should say the file is ready. Verify actual PDF magic/one page using local file tools.
5. **WebP download**: repeat with `[data-quick-print="webp"][data-design-id="1"]`, allowing up to 60 seconds. Verify downloaded dimensions with a local image library; expected A4 4961×7016 or 7016×4961.
6. **Photo customize**: click `[data-design="1"]` or a `data-action="customize"` button. Form is `#print-form`; `name=photo` accepts JPEG/PNG/WebP. Use documented filechooser API with a known task asset. `#photo-controls` becomes visible. Range controls are `photoX`, `photoY`, `photoZoom`; sliders should change image framing. Generate a PDF and inspect photo/low-resolution warning if applicable. Calendar type choices include `lunar-year` and `work-year`. Changing year/month must synchronize the date and preserve valid 29th/30th/31st days.
7. **Date tool**: `/datumu-kalkulators/`, `.date-calculator [name=from]`=`2029-02-01`, `[name=to]`=`2029-03-01`; plain day difference is 28. Workday mode explicitly includes both endpoints. Root's new planning.js widgets need their own final check.
8. **Name days**: `/varda-dienas/`; historical VVC 2018 notice remains visible. `Jānis` and `Janis` search should match the same name. Names are not claimed to be the fully reconciled 2026 edition.
9. **Sun**: `/saullekts-saulriets/riga/`; `#sun-form [name=date]`=`2027-06-21`, submit → 04:29 and 22:22 Riga (within rounding), then `2027-12-21` → 09:00 and 15:43.
10. **Light-only appearance**: no theme button, theme selector, dark CSS rules or system-dark listener remain. A previous saved `theme` preference is removed on first load without changing calendar data. Verify the page stays light on a system using dark appearance; inspect home and an inner content page at 375 and 1448 px.
11. **Screenshots**: refresh all seven requested widths, recording DOM `html.clientWidth` and `html.scrollWidth`. Save actual PNG via CDP `Page.captureScreenshot` after setting device metrics. Clear device metrics and reset browser viewport afterward. Check logs for new errors. Keep the working preview tab available only if useful to root.

## Supported ICS scope

Import accepts date and timed events, standard daily/weekly/monthly/yearly interval/count/until recurrence, optional location/description/end time, and multi-day spans. Unsupported BYDAY/BYMONTH-style recurrence modifiers, exception dates and DURATION are explicitly rejected before merging any events; existing records remain unchanged. It is a focused personal calendar importer, not a full arbitrary RFC 5545 scheduling implementation. Single timed events from UTC or other zones are normalized to Riga. Cross-zone recurring events are explicitly rejected with guidance to export in Europe/Riga or as separate occurrences, avoiding silent daylight-saving drift.

## Data and output cautions

Name-day data is a verified 2018 VVC snapshot with a visible provenance notice. Later school holidays and dates awaiting primary confirmation remain labeled by the data/content layer. Solar times are approximate astronomical calculations, not weather. Local storage is device/browser-specific. The print engine and its generated artifacts have independent sibling-agent verification.

## Root final browser pass (2026-10-22)

Actual PDF and WebP controls on `/pdf-kalendari/2029/februaris/` downloaded real files. Inspection confirmed one-page A4 PDF with readable Latvian text and matching 4961×7016 WebP. This exposed Jekyll's reserved `page.name` fallback (`index.html`) in the filename; the page variable was renamed `calendar_name` and the full build/audit passed afterward.

The leave tool was exercised for year2028 with zero vacation days: correctly returned Easter April14–17, Christmas December23–26, and four three-day intervals including the verified festival compensation July8–10. Work-hour tool default2027 returned252days/2009hours/7shortened days. Final seven-width DOM checks again found no horizontal page overflow. Earlier appearance screenshots predate the Garet and light-only revision; refresh them for the final delivery.

Latest local mobile Lighthouse v3 after smaller hero: performance99/accessibility100/best-practices100/SEO100, LCP2.0s, CLS0. Live-domain measurement is separate and pending.

## Independent recurrence check

The data agent independently compared recurrence membership against Python dateutil.rrule across 355,752 cases (January 31/leap-day starts, four frequencies, intervals 1/2/3, COUNT 2/3/7, nine queried years), with zero mismatches. Quick-print context now derives ISO-week Monday from the page year/week; daily context uses the chosen print year and preserves valid 29th/30th/31st days.

## Final light-only revision

Per the later user instruction, all dark-mode styling and controls were removed. The compatibility migration deletes only the retired preference and is idempotent. Two tests verify saved calendar data is preserved and cleanup does not request repeated saves. Calendar day accessible names now include their visible holiday/event labels; a regression test covers timed event text and additional-event count. Font integration is owned by the root agent.

## Current test totals and typography review

Current frontend suite: 48 checks. Planning suite: 2,551 assertions, plus 11 route hydration/SSR integration checks reported by the print/planning agent. UI font declarations in style.css, pages.css and typography.css specify DM Sans or inherit; no alternate named UI font remains. DM Sans credits and the bundled OFL licence link are included in the sources-page generator. Decorative/system glyph fallback for symbols is separate from named body text fonts.

## CSP compatibility review

Current policy permits the actual implementation paths: same-origin script and font fetches; local photo data URLs and blob images; inline generated CSS; browser blob downloads. Print does not create workers, fetch data URLs, or embed an object/iframe. The bundled pdf-lib contains no dynamic-code constructor; fontkit has a Function.prototype.bind fallback that is unused where native bind exists. A separate Node VM check disabled both string and WebAssembly code generation, loaded the unchanged browser bundles, embedded the actual Garet Book font, and generated a 7,318-byte Unicode PDF successfully. This confirms the library path does not require unsafe-eval in supported modern runtimes; it complements, rather than replaces, the final browser check with deployed response headers. No security policy relaxation was made.

## Calendar initialization optimization

Date labels reuse ICU formatters and a bounded cache; Riga date/time formatters are reused. Month/week/year renders take one today snapshot, and per-year holiday lists are cached and invalidated when verified data arrives. Unchanged calendar/sidebar HTML is not replaced after the data fetch, preserving focus and avoiding a second full DOM layout. Current core holiday fallback and published data were compared for 2026–2031 and match on date/title/dayOff, so the initial visible calendar remains accurate. Routes without a live calendar or name/moon/work widget no longer fetch unused calendar JSON; print generation still fetches its own required data. Visible date/event sequences now begin day-button accessible names; print-design cards use their visible text as the accessible name. No initial content was deliberately delayed and reserved geometry remains unchanged.
