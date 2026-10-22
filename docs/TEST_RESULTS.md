# Executed test results

Checked on 2026-10-22. These are executed local checks, not claims of complete browser, language, accessibility or production certification. Final suite and build results were confirmed by the root task after integrating the agents' changes.

| Check | Result | Scope / evidence |
|---|---|---|
| Ruby date core | PASS: 8 tests, 3,155 assertions | `test/date_test.rb`; no failures, errors or skips. |
| JavaScript date core | PASS: 7,158 checks | `test/date_core_test.cjs`; 1,461 dates, 48 months, 208 ISO weeks, 198 moon events and Riga timezone cases. |
| Latvian date localization | PASS: 240 samples / 480 comparisons | `test/date_l10n_test.cjs`, `L10N_DATE_SAMPLES.csv`; ICU 78.3 / CLDR 48.0. Not native-speaker proofreading. |
| Frontend utilities | PASS: 47 named checks | `test/frontend_test.cjs`; ICS parsing/export, recurrence edges, validation, escaping, edit preservation, search normalization and USNO solar samples. |
| Independent recurrence oracle | PASS: 355,752 comparisons / 0 mismatches | Actual date membership compared with Python `dateutil.rrule`: 3 start dates (including January31 and February29), 4 frequencies, intervals1/2/3, counts2/3/7 and 9years of queried dates per case. This was a separate audit execution, not part of the CI suite. |
| Work and leave planner | PASS: 2,551 assertions | `test/planning_test.cjs`; independent exhaustive longest-interval comparisons across 4 years, 2 workweeks and 6 budgets; hours, overrides and ICS. |
| Print scenes | PASS: 9,360 combinations | `test/print.test.cjs`; 4 years × 12 months × 13 print families × 15 designs, plus edge cases. |
| Real print artifacts | PASS: 225 PDF/WebP pairs | `PRINT_RESULTS.json`: every PDF opened/rendered and every WebP decoded; fonts, Unicode, branding, A4, 600 ppi dimensions, sRGB and glyph bounds checked. Zero layout-comparison failures; maximum mean pixel error 2.314/255. |
| Daily editorial freshness | PASS: 12 dated entries | `scripts/verify_daily.rb`; current entries were expanded and the previously failing length check now passes. This validates today's content, not tomorrow's publication. |
| Page/asset revision logic | PASS: 6 isolated checks | Temporary generator copy: unchanged pages retained lastmod; changed hash updated only its page; asset revision was stable until an asset changed; every indexable sitemap URL had lastmod. |
| Jekyll and local route audit | PASS: no audit errors | Root final build: 621 matrix routes, 625 HTML files, 580 indexable, 41 noindex, 1,969 total files, 128,239,935 bytes. `site-audit.json` and `SEO_AUDIT.csv`. |

The print manifest contains 225 PDFs, 225 matching WebPs, 225 previews and one manifest: 676 files. Largest print artifact: 983,786 bytes. All remaining supported combinations are generated in the browser; they are not falsely counted as prebuilt files.

## Limits of the evidence

- Initial mobile Lighthouse baseline (`../lighthouse-mobile.json`, 2026-10-22 09:36:55 UTC): performance 76, accessibility 86, best practices 100, SEO 100; LCP 4.0 s, CLS 0.234, TBT 40 ms. Frontend is producing a subsequent result; consult final UI QA rather than treating the baseline as the final score. There is no field Core Web Vitals history for this new site.
- Subsequent observed run (`../lighthouse-mobile-v2.json`, 2026-10-22 09:45:47 UTC): performance87, accessibility100, best practices100, SEO100; FCP1.4s, LCP4.0s, TBT60ms, CLS0. This is a local lab result; final UI QA identifies the release run.
- Latest observed mobile run (`../lighthouse-mobile-v3.json`, 2026-10-22 09:58:24 UTC): performance 99, accessibility 100, best practices 100, SEO 100; FCP 1.4 s, LCP 2.0 s, TBT 20 ms, CLS 0. This supersedes the earlier local baselines for the tested revision; live-site and field results remain unverified.
- Remote CI, deployed HTTPS routes, real HTTP404, cold-cache updates, browser network/privacy checks and full interaction evidence must be recorded separately by the root/frontend tasks.
- Latest VVC traditional/extended CSV reconciliation is incomplete. The 1,013 traditional names are an explicitly labeled official 2018 snapshot. PMLP 2025 popularity order remains independently unconfirmed.
- Native Latvian proofreading, real mailbox delivery and independent full WCAG 2.2 AA certification have not been performed.
- ICS supports a declared recurrence subset; unsupported BY rules, recurrence exceptions and DURATION are rejected. Full RFC 5545 interoperability is not claimed.
- A4 WebP output has true 600 ppi pixel dimensions. This does not increase the actual detail of a low-resolution uploaded photograph.

See `ACCEPTANCE_AUDIT.md` for the full original 58-criterion review. Preserve these distinctions when adding final deployment and UI evidence.

## Final navigation and daily-maintenance additions

Static annual/monthly calendar dates now link to `/?date=YYYY-MM-DD&view=day`, including adjacent 2026/2031 dates. Full Latvian date labels are attached for assistive technology; links inherit their cell colors and preserve grid dimensions. All 1,743 generated annual date links were checked for matching target/date, labels and both boundary years.

Root created the daily editorial automation for 03:10 Europe/Istanbul: prepare twelve original dated entries, validate and publish through the project workflow. It is a local desktop automation and requires the computer and app to be running. If it cannot run, the site hides stale content instead of relabeling it.

## Garet and light-only release

Garet Book/Heavy replace earlier fonts in the UI, favicon outlines, all225PDF/WebPpairs and621routeOGimages plus24fallbackcards. All225filesets independently verified;39,181actual-font text commands checked. Dark-mode rules, system-preference listener and controls removed;47frontendchecks include safe migration and visible-event accessible labels. Work/leave/date tools render initial markup before scripts:2,551planningassertions and11SSRroutechecks pass. Cloudflare _headers/_redirects inclusion is now audited.

## DM Sans final revision

The latest user instruction supersedes the previous Garet font choice. DM Sans now covers all625HTML documents, the favicon,225PDF/WebP pairs and645social images. Full self-hosted WOFF2:54,284bytes, including all original characters and weights100–1000. All225PDFs embed the actual DMSans-Regular/Bold fonts;9,360scenes and1,884,081text commands pass font/glyph/bounds checks. All675print/raster/preview files open and decode. Largest artifact1,008,512bytes; full PDF/WebP total102,735,275bytes. Build audit:621matrix routes,580indexable,41noindex,625HTML,1,974files,160,144,662bytes,zeroerrors.

Ruby3,155assertions,JSdate7,158,frontend48,planning2,551and480Latvian ICU comparisons pass. The initial Garet-era scores above are historical baselines. Final DM Sans live and performance evidence is recorded separately after publication. Seven responsive widths320/375/430/768/1024/1448/1920show only DM Sans text and no horizontal page overflow.
