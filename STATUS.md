# Kalendārs365 — release status

Updated 2026-10-22. Public repository: https://github.com/mateopedersen/kalendars365-latvia.

## Implemented and tested
- Ruby 4.0.8 / Jekyll 4.4.1; all 621 routes from the supplied matrix.
- 580 indexable routes, 41 explicitly noindex pending current name/school verification or utility-only use.
- Calendar data for 2027–2030, 198 USNO Moon phases, 24 season events, 28 sourced occasion articles.
- Responsive five-view calendar, local events/tasks/notes, recurrence, JSON backups, ICS import/export and search.
- Date, workday/hour, leave optimization, shift, solar, zodiac and countdown tools.
- 15 print designs, 13 families, 225 actual PDF/WebP pairs and previews. Vector PDF with embedded fonts; A4 WebP 600 ppi.
- Personalized print output, photo crop position/zoom and local processing.
- Source methodology, owner/contact, privacy, cookie, accessibility and error pages.
- Unique metadata and social images, canonical/sitemap, structured data, asset revisions and security headers.

## Evidence and limits
See docs/TEST_RESULTS.md, DATA_AUDIT.md, PRINT_QA.md, UI_QA.md and ACCEPTANCE_AUDIT.md.
Name-day data is the official 2018 snapshot; current edition and extended list are not verified. Future school terms are pending official verification. No independent native Latvian editor certification. Print uses RGB and A4. Daily editorial freshness is checked; recurring publication configuration is being completed.

## Release work in progress
Push complete source, verify Cloudflare build, attach verified owned domain kalendars365.lv, verify HTTPS/downloads/live Lighthouse and document exact results. No live-release claim until verified.

Existing Lithuania/Slovenia projects remain untouched. Operator: Mateo Pedersen, kalendars365@gmail.com. No paid resource created.
