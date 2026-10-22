# Acceptance audit: original 58 criteria

Checked on 2026-10-22 against the packet's `05_TEKNIK_VE_TESTLER/kabul_kriterleri_58.csv`. This report describes the actual implementation and available evidence. The specification is a requirement, not proof of completion.

**Verified** means the cited local evidence establishes the stated technical scope. **Partial** identifies implemented work with a remaining element or required evidence. **Pending** means the external result or validation has not been established here. These labels are not a percentage-complete score. Deployment and final UI QA can add evidence after this snapshot.

## Material release limits

- Current VVC data is incomplete: the official traditional 2018 snapshot has 1,013 names; neither current CSV is fully reconciled. Keep the 20 name pages and 12 name-month pages noindex and retain edition labels. PMLP 2025 popularity ranking remains independently unconfirmed.
- Today's 12 dated horoscope entries pass freshness validation. A validator alone does not publish tomorrow's content. Root created the authorized daily editorial automation for 03:10 Europe/Istanbul. It requires the computer and app to be running; stale entries remain hidden instead of being relabeled if a run is missed.
- Native Latvian proofreading, exact reference-image sign-off, live mailbox delivery, field Core Web Vitals and independent full WCAG certification are not established.
- Production HTTPS, actual HTTP 404, final remote CI and final browser interaction/network checks require deployment evidence. A Git remote or workflow file is not proof of a successful run.
- ICS boundary defects found during this audit were repaired. The supported recurrence subset remains explicit; full RFC 5545 support is not claimed.

## Criteria and evidence

| ID | Requirement | Status | Actual evidence and remaining condition |
|---|---|---|---|
| 01 | Consent, accept/reject/manage, persistence | Partial | Footer and app implement necessary-only, accept and manage with local persistence. No analytics/advertising tags are configured. Final storage/network screenshots remain required. |
| 02 | Responsive image SEO | Partial | Local panorama has 640/1600 Web P renditions; previews/OG have dimensions. Final cold-load image and LCP audit is separate. |
| 03 | Latvian contextual and decorative alt text | Partial | Panorama, print previews and uploaded-photo preview have Latvian alternatives; OG alt is contextual. Full decorative-image/manual accessibility review is not established. |
| 04 | Custom Latvian 404 and real HTTP 404 | Partial | `404.html` has custom Latvian copy and calendar/tool links. Real HTTP status must be tested on Cloudflare. |
| 05 | Actual contact and working mailto/form | Partial | User-supplied Mateo Pedersen and `kalendars365@gmail.com` appear in config and contact/trust pages. Mailto is implemented; no server form requiring anti-spam exists. Delivery is not independently tested. |
| 06 | Canonical indexable sitemap and lastmod | Partial | Generator filters indexable routes; `_data/page-revisions.json` stores content hash/lastmod. Six isolated revision checks passed. Local sitemap membership passes; live 200 status remains a deployment check. |
| 07 | Hub/year/month/week internal navigation | Partial | Generator links period hubs and 208 ISO weeks, plus two boundary support routes. Local target-file audit passes. Full live click-trail evidence is still needed. |
| 08 | Useful official external citations | Partial | Source panels, 28 occasion articles, `SOURCES.md` and `DATA_AUDIT.md` cite laws, VVC and USNO. Some official downloads remain unavailable; not every external link has a successful live response. |
| 09 | Asset versioning and safe cache refresh | Partial | `_data/build.json` hashes assets and print manifest; layout/dynamic loads use matching version metadata. Six revision checks passed. Two-deploy stale-cache behavior still needs verification. User data is separate from asset revisions. |
| 10 | Calendar dates, navigation and event creation | Partial | App implements day/week/month/year/list, navigation, events and local records. Static annual/monthly cells now link to the daily view with full Latvian ARIA dates; 1,743 annual links including 2026/2031 boundary dates passed checks. Final browser E2E evidence remains required. |
| 11 | Premium consistent reference-based design | Partial | Shared burgundy identity, planner/card layout and print gallery exist. Visual fidelity requires final reference comparison; code is not visual proof. |
| 12 | Functional controls and loading/error/focus states | Partial | Calendar, dialogs, tasks, search, import/export and print controls have handlers and result states. Complete button inventory and browser error-state evidence remain. |
| 13 | Mobile/cold-cache performance and CWV | Partial | Latest local mobile Lighthouse v3: performance 99, accessibility/best practices/SEO 100, LCP 2.0 s, CLS 0, TBT 20 ms. Live-site verification and production field CWV remain separate. |
| 14 | Latvian search, synonyms and keyboard | Partial | Diacritic-insensitive normalization, one-typo matching and keyboard search exist; utilities are tested. Final synonym/query/browser examples are separate. |
| 15 | All twelve 2029 months and leap boundaries | Partial | Date suites cover all 1,461 days/48 months,2028 Feb 29 and nonleap 2029/2030. Print includes 2029/2030 February. Unit tests do not establish screenshots of all 12 months. |
| 16 | No nested-card/grid overflow | Pending | CSS is responsive; final overflow scans and required viewport screenshots must be attached. Latest local CLS is 0; this metric alone does not establish every required viewport. |
| 17 | Contextual 1200×630 OG images | Partial | Generator assigns contextual hashed OG Web Ps; layout declares size/alt; social-image script creates them. Final built/live image audit remains. |
| 18 | Distinct meaningful Latvian titles/descriptions | Partial | Titles vary by family/period; local duplicate/missing audit passes. Shared description boilerplate remains; editorial intent quality is not established by uniqueness alone. |
| 19 | Responsive 320/375/768/1024/1448+ | Pending | Responsive styles exist. Required screenshots, touch targets and actual overflow results belong in final UI QA. |
| 20 | Robots/canonical/language/speed/accessibility | Partial | Latvian-only lang, real canonical, robots and noindex controls exist; no invented hreflang. Local technical crawl passes its scope. Other runtime checks remain. |
| 21 | Dark palette and unaffected printing | Partial | Persisted themes and independent print palettes exist. Dark screenshots and cross-theme print verification remain browser QA. |
| 22 | USNO moon data and Riga conversion | Verified |198 primary phases:49/50/49/50 across 2027–2030, raw official JSON, UTC/local conversion checks and provenance in `DATA_AUDIT.md`. |
| 23 | Western sign calculator and boundaries | Partial |12 conventional date ranges and exact-time/year boundary caveat are visible. This is not an ephemeris birth chart; independent sign-boundary tests are not in the utility suite. |
| 24 | Dated daily horoscope and schedule | Partial |12 current dated entries pass validator; pages compare Europe/Riga today and hide stale entries. Daily 03:10 Europe/Istanbul automation now exists, but requires the desktop/app to be running. Future successful publication is not inferred from its creation; stale text is not presented as new. |
| 25 | Real operator and methodology trust pages | Partial | User-supplied operator/contact, privacy, sources, methodology and corrections are implemented without fabricated expertise. External identity certification is not claimed. |
| 26 | Custom 404/About visuals and disclosures | Partial | Custom 404 copy and trust content exist. About/404-specific illustration fidelity and final visual sign-off are not established. |
| 27 | Four annual,48 monthly,all ISOweeks | Verified | Route manifest:4 annual,48 calendar-month and 208 ISOweek pages;2026-W 53/2031-W 01 support pages. Core tests cover the four-year range. |
| 28 | Fifteen distinct PDF designs per category | Verified |13 families×15 designs supported.225 real PDFs cover all 195 family/design pairs plus extra annual/monthly cases; all opened/rendered. Other combinations are generated on demand. |
| 29 | Matching Web P for every PDF | Verified |225 Web Ps decoded and compared with PDF renders. Zero comparison failures; maximum mean pixel error 2.087/255; shared scene data. |
| 30 | Actual 600 ppi raster dimensions | Verified | A 4 portrait 4961×7016 and landscape 7016×4961; all 225 prebuilt Web Ps checked. Low-resolution source photos remain lower effectiveppi and are warned. |
| 31 | Embedded selectable vector PDF text | Verified | All 225 PDFs checked for embedded True Type fonts, Latvian Unicode, A 4 and glyph bounds. Office/home printing; not certified PDF/X/CMYK. |
| 32 | Branding/domain and safe margins | Verified | All 225 PDFs checked for `Kalendārs365 · kalendars365.lv`. Root verified domain in the user's Cloudflare account. Live activation remains separate. |
| 33 | Ten color and five monochrome compositions | Verified |15 layouts vary composition as well as palette.10 color/5 mono; contact sheet and `PRINT_QA.md` record review. |
| 34 | Both current VVCimports and 20 spotchecks | Partial |1013 traditional names imported from official 2018 PDF;20 priority names match historical dates. Current traditional/extended CSV reconciliation remains incomplete; `namesComplete:false`. |
| 35 | Confirmed PMLP 2025 popularity ordering | Pending |69 candidate names/cohorts retained from packet. Official image-based ranking could not be independently extracted. Packet order is not independently verified. |
| 36 | Canonical name pages/year/15 designs | Partial |20 canonical pages and customizer year/design selection exist. All 20 noindex; historical date labeling retained. Current-data release remains gated. |
| 37 | Only announced school dates | Verified | Only verified 2026/27 dates included. Later years are explicitly pending/noindex without guessed vacations. |
| 38 | Holiday/legal category distinctions | Verified | `holiday`, `substitute`, `commemoration`, `observance` plus independent day Off. Confirmed 2028 festival July 9/10 included. Unconfirmed moved workdays are not applied. |
| 39 | Work law 133/135 and assumptions | Verified | Core/planner support 5/6 days, reduced preholiday hours, employer overrides and explicit assumptions.2521 planner assertions. Not individualized employment advice; future moved-day decisions remain a maintenance dependency. |
| 40 | Local data backup/import/delete/privacy | Partial | Local records, JSONbackup/import/delete, ICS and photo rendering implemented. No analytics; CSPrestricts network. Final browser network/storage evidence remains. |
| 41 | ICS dates/timezones/recurrence/escaping | Partial |41 utility checks after repairs; Riga VTIMEZONE,UTF-8 folding,UTCimports,COUNT/UNTIL,spans and edit preservation. Unsupported BYrules/exceptions/DURATION rejected. Full external-calendar interoperability is not claimed. |
| 42 | Stable Ruby/Jekyll lock and green CI | Partial | Ruby 4.0.8,Jekyll 4.4.1,lockfile/workflow; final local build/tests pass. Remote CI on final commit still needs evidence. |
| 43 | Actual Cloudflare HTTPS/customdomain | Pending | Account/domain context verified by root. This local audit does not assert a deployed URL or live HTTPresult. |
| 44 | Separate Git Hubrepo/ownership/main/deploy | Partial | Localorigin is `https://github.com/mateopedersen/kalendars365-latvia.git`; isolated project. Finalpush/branch/remote CI/deployment need confirmation. |
| 45 | Latvian grammar/dates/diacritics | Partial |240 ICUdate samples/480 comparisons,Latvian metadata and PDFfontchecks. No native Latvian proofreader review is claimed. |
| 46 | Useful unique page content | Partial | Period-specific calendars/data,28 source-backed distinct occasion articles and real tools. Shared passages/descriptions remain; pending name/schoolpages are gated. Full editorial sampling remains. |
| 47 | No broken internal/downloads/consoleerrors | Partial | Final local file-target audit has no errors;225 downloadpairs verified. Live HTTPcrawler andbrowserconsole/E2Eremain. File audit is not a browser simulation. |
| 48 | R2/performance cost guard | Verified | No R2 or paid VPS provisioned; no unbounded upload endpoint. Largest prebuilt artifact~1 MB. Future paid infrastructure requires owner decision. |
| 49 | Low-data name release gate | Verified |20 name and 12 name-month pages noindex, excluded from sitemap/search while `namesComplete`false. Gate is deliberate; it does not mean data work is complete. |
| 50 | Astrology entertainment disclaimer | Verified | Signs/daily pages identify entertainment/self-reflection and no scientific predictive basis; no medical/financial advice claim. |
| 51 | Licenses and attribution | Partial | Noto SIL/vendor licenses and CCBY-SA 3.0 Riga author/source/derivative credit recorded; official data provenance retained. Formal legal rights certification is not claimed. |
| 52 | Final URL/status/routes/tests/screenshots | Pending | Local reports exist. Root must supply actual deployment URL, final CI/browser evidence and deliverables. This audit does not replace the final report. |
| 53 | Referencepixel/layout/typography fidelity | Pending | Original reference retained and related structure implemented. No measured pixel-diff/human acceptance artifact established at this checkpoint. |
| 54 | WCAG 2.2 AA target and keyboard/contrast | Partial | Semantic forms,skip navigation,dialog focus,date arrows and themes exist. Latest local Lighthouse accessibility 100; independent axe/keyboard/contrast evidence remains required. No full WCAGcertification claimed. |
| 55 | No false perfection/ranking/traffic claims | Verified | Reports qualify current data,local/production checks andmissinghuman/field evidence. No 100%ranking,traffic orperfect score promise. |
| 56 | Actualcurrent Riga date/time | Verified | Intl Europe/Riga uses real clock and refreshes every 30 seconds; timezone boundary tests. Footerfallback year replaced on load. |
| 57 | Static CDN/no premium external VPS | Verified | Jekyll plus browser-local data/calculation/print and bundled libraries/fonts; no always-running backend required. |
| 58 | Cloudflarefile/size/buildbudget | Partial | Final local build 1,969 files/128,239,935 bytes; crawler enforces 20,000 files/25 Mi Bper file. Printset 676 files/max~1 MB. Remote CIelapsedtime under 20 minutes still needs logs. |

## Focused functional review

- Date calculator: signed date difference, inclusive workdays,5/6 day selection and add/subtract days; endpoint assumptions and out-of-scope year warning visible.
- Work planner: hours, preholiday reduction, employer off/on dates, totals and CSV. Six-day model caps Monday–Friday at 7 hours and Saturday at 5; this is disclosed.
- Leave planner: budget 0–20, up to 12 nonoverlapping alternative periods, selected leave ICS. Each result uses the budget independently; it is not one joint annual allocation. Exhaustive longest-period comparisons passed.
- Customizer:13 families,2027–2030,month/date/ISOweek,15 designs,A 4 portrait/landscape,name/photo,crop/zoom,PDF/Web P. No A 3 option. Family/shift/school templates are blank planning layouts; personal records are not automatically inserted into every print family.
- Daily text: actual date, entertainment label and stale fallback. A validator is a guard, not a publishing engine.

## Repairs arising from this audit

The audit found invalid timed dates silently normalizing into another month, invalid DTEND, month/leap COUNT ending too early, non-UTC timed UNTIL, imported metadata loss on edit, missing calendar closure andexclusive-midnight errors. Frontend repaired these and expanded the utility suite to 41 checks. Recurrence expectations were cross-checked against [RFC 5545 sections 3.3.10 and 3.8.2.2](https://www.rfc-editor.org/rfc/rfc5545).

The audit added content-derived sitemap lastmod and global asset revisions. Six isolated checks demonstrated stable unchanged dates, selective changed dates and cache version changes. `TEST_RESULTS.md` records observed results. Update provisional rows only with actual final evidence.

A separate recurrence oracle audit compared 355,752 date-membership results with Python `dateutil.rrule` and found zero mismatches after the repairs. The matrix used three starts including January31 and February29, four frequencies, intervals1/2/3, counts2/3/7 and nine years of queries per case. This strengthens the supported recurrence evidence; it does not claim every RFC option is implemented.

The subsequent local Lighthouse artifact `../lighthouse-mobile-v2.json` reports performance87, accessibility100, best practices100 and SEO100 at 2026-10-22 09:45:47 UTC, with CLS0 and LCP4.0s. This supersedes the baseline for the tested local revision; field CWV, full WCAG certification and final production results remain separate.

Final local mobile artifact `../lighthouse-mobile-v3.json` (2026-10-22 09:58:24 UTC) supersedes v2: performance 99, accessibility 100, best practices 100, SEO 100; FCP 1.4 s, LCP 2.0 s, TBT 20 ms, CLS 0. These are measured local lab scores, not a guarantee about production or field usage.
