# Kalendārs365 — release status

Updated 2026-10-22. Public repository: https://github.com/mateopedersen/kalendars365-latvia.
Production: https://kalendars365.lv/ — Cloudflare Pages, Active domain with SSL.

## Implemented and tested
- Ruby 4.0.8 / Jekyll 4.4.1; all 621 supplied matrix routes, 625 HTML documents including boundary and error pages.
- 580 indexable routes; 41 intentionally noindex pending current name/school verification or utility-only use.
- Four complete years, 198 USNO Moon phases, 24 season events, 28 sourced occasion articles.
- Responsive five-view calendar, local events/tasks/notes, recurrence, JSON backups, ICS import/export and search.
- Date, workday/hour, leave optimization, shift, solar, zodiac and countdown tools; initial work/leave/date tool content rendered in HTML.
- 15 print designs, 13 families, 225 actual PDF/WebP pairs plus previews. Vector PDF with embedded DM Sans; A4 WebP 600 ppi.
- Latest user change: DM Sans throughout the UI, print library and social cards; light theme only. Dark styles and controls removed; old preferences migrated safely.
- Source methodology, operator/contact, privacy, cookie, accessibility and error pages; metadata, social images, canonical/sitemap and structured data.
- Cloudflare security headers, daily content freshness checks, versioned assets and enabled build cache. Zone RUM and Pages Web Analytics disabled.

## Executed evidence
DM Sans revision68b41a9 is live; GitHub verification succeeded. Final HTTP/Lighthouse audit follows the personal-print-title correction. Ruby 3,155 assertions; JS date 7,158; frontend 48; planning 2,551; print 9,360 scene combinations. All225DM Sans pairs opened/rendered/decoded and matched. Actual-font preflight passed9,360scenes and1,884,081text commands. See docs/TEST_RESULTS.md, DATA_AUDIT.md, PRINT_QA.md, UI_QA.md and ACCEPTANCE_AUDIT.md.

## Explicit limits
Names use an identified official 2018 snapshot; the current edition and extended list are not verified. Future school terms await official verification. No independent native Latvian editor certification. Print uses RGB and A4. Original daily content automation is active at 03:10 Europe/Istanbul and requires the computer and Codex app running; stale content is hidden. There is no field Core Web Vitals history for this new site; measured lab scores are recorded separately, with no guaranteed100 claim.

Existing Lithuania/Slovenia projects remain untouched. Operator: Mateo Pedersen, kalendars365@gmail.com. No paid resource created.
