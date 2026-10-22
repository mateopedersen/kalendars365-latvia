# Executed test results

Checked on 2026-10-22. These are executed local checks, not claims of complete browser, language, accessibility or production certification. Final suite and build results were confirmed by the root task after integrating the agents' changes.

| Check | Result | Scope / evidence |
|---|---|---|
| Ruby date core | PASS: 8 tests, 3,155 assertions | `test/date_test.rb`; no failures, errors or skips. |
| JavaScript date core | PASS: 7,158 checks | `test/date_core_test.cjs`; 1,461 dates, 48 months, 208 ISO weeks, 198 moon events and Riga timezone cases. |
| Latvian date localization | PASS: 240 samples / 480 comparisons | `test/date_l10n_test.cjs`, `L10N_DATE_SAMPLES.csv`; ICU 78.3 / CLDR 48.0. Not native-speaker proofreading. |
| Frontend utilities | PASS: 41 named checks | `test/frontend_test.cjs`; ICS parsing/export, recurrence edges, validation, escaping, edit preservation, search normalization and USNO solar samples. |
| Independent recurrence oracle | PASS: 355,752 comparisons / 0 mismatches | Actual date membership compared with Python `dateutil.rrule`: 3 start dates (including January31 and February29), 4 frequencies, intervals1/2/3, counts2/3/7 and 9years of queried dates per case. This was a separate audit execution, not part of the CI suite. |
| Work and leave planner | PASS: 2,521 assertions | `test/planning_test.cjs`; independent exhaustive longest-interval comparisons across 4 years, 2 workweeks and 6 budgets; hours, overrides and ICS. |
| Print scenes | PASS: 9,360 combinations | `test/print.test.cjs`; 4 years × 12 months × 13 print families × 15 designs, plus edge cases. |
| Real print artifacts | PASS: 225 PDF/WebP pairs | `PRINT_RESULTS.json`: every PDF opened/rendered and every WebP decoded; fonts, Unicode, branding, A4, 600 ppi dimensions, sRGB and glyph bounds checked. Zero layout-comparison failures; maximum mean pixel error 2.087/255. |
| Daily editorial freshness | PASS: 12 dated entries | `scripts/verify_daily.rb`; current entries were expanded and the previously failing length check now passes. This validates today's content, not tomorrow's publication. |
| Page/asset revision logic | PASS: 6 isolated checks | Temporary generator copy: unchanged pages retained lastmod; changed hash updated only its page; asset revision was stable until an asset changed; every indexable sitemap URL had lastmod. |
| Jekyll and local route audit | PASS: no audit errors | Root final build: 621 matrix routes, 625 HTML files, 580 indexable, 41 noindex, 1,969 total files, 128,239,935 bytes. `site-audit.json` and `SEO_AUDIT.csv`. |

The print manifest contains 225 PDFs, 225 matching WebPs, 225 previews and one manifest: 676 files. Largest print artifact: 1,006,794 bytes. All remaining supported combinations are generated in the browser; they are not falsely counted as prebuilt files.

## Limits of the evidence

- Initial mobile Lighthouse baseline (`../lighthouse-mobile.json`, 2026-10-22 09:36:55 UTC): performance 76, accessibility 86, best practices 100, SEO 100; LCP 4.0 s, CLS 0.234, TBT 40 ms. Frontend is producing a subsequent result; consult final UI QA rather than treating the baseline as the final score. There is no field Core Web Vitals history for this new site.
- Subsequent observed run (`../lighthouse-mobile-v2.json`, 2026-10-22 09:45:47 UTC): performance87, accessibility100, best practices100, SEO100; FCP1.4s, LCP4.0s, TBT60ms, CLS0. This is a local lab result; final UI QA identifies the release run.
- Remote CI, deployed HTTPS routes, real HTTP404, cold-cache updates, browser network/privacy checks and full interaction evidence must be recorded separately by the root/frontend tasks.
- Latest VVC traditional/extended CSV reconciliation is incomplete. The 1,013 traditional names are an explicitly labeled official 2018 snapshot. PMLP 2025 popularity order remains independently unconfirmed.
- Native Latvian proofreading, real mailbox delivery and independent full WCAG 2.2 AA certification have not been performed.
- ICS supports a declared recurrence subset; unsupported BY rules, recurrence exceptions and DURATION are rejected. Full RFC 5545 interoperability is not claimed.
- A4 WebP output has true 600 ppi pixel dimensions. This does not increase the actual detail of a low-resolution uploaded photograph.

See `ACCEPTANCE_AUDIT.md` for the full original 58-criterion review. Preserve these distinctions when adding final deployment and UI evidence.
