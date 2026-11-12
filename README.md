# Kalendārs365 — Latvijas kalendāri 2027–2030

Independent Latvian calendar and planning site, built with Ruby 4.0.9, Jekyll 4.4.1 and browser JavaScript. Published through Cloudflare Pages from this repository. Operator: Silvis Balodis, kalendars365@gmail.com.

## Build

```sh
bundle install
bundle exec ruby scripts/generate.rb
bundle exec jekyll build
bundle exec ruby scripts/audit.rb
```

Cloudflare build command: `bash scripts/cloudflare-build.sh`; output directory `_site`; environment `RUBY_VERSION=3.2.2` and `SKIP_DEPENDENCY_INSTALL=true`. The platform's preinstalled Ruby only starts the build. The script uses the site's pinned Ruby **4.0.9** and Bundler **4.0.20** for dependency installation and Jekyll.

`scripts/bootstrap-ruby.sh` reuses a functional Ruby 4.0.9 or compiles the [official source archive](https://www.ruby-lang.org/en/downloads/) after checking its pinned SHA-256. Source it to export the runtime on `PATH`. It checks OpenSSL and Psych before use. Runtime and gems live under ignored `node_modules/.cache/`; enable the Cloudflare build cache to reuse them when supported. GitHub verification caches both directories explicitly and installs compilation headers. A cold build needs a C toolchain plus OpenSSL, libyaml, readline, zlib and libffi development headers. Daily editorial freshness uses the Ubuntu runner's system Ruby and standard libraries only.

## Verify

```sh
bundle exec ruby test/date_test.rb
ruby scripts/name_day_sources.rb
node test/date_core_test.cjs
node test/date_l10n_test.cjs
node test/frontend_test.cjs
node test/planning_test.cjs
node test/print.test.cjs
ruby scripts/verify_daily.rb
```

The repository contains the real downloadable PDF/WebP files. Regeneration uses `scripts/generate_print.cjs` and the dependencies declared in `scripts/package.json` / `scripts/print-requirements.txt`. `scripts/verify_print.py` opens and checks the files.

See `STATUS.md`, `docs/SOURCES.md`, `docs/DATA_AUDIT.md`, `docs/PRINT_QA.md`, `docs/TEST_RESULTS.md` and `docs/WORKLOG.md` for evidence and known limits. Personal calendar data stays in the visitor's browser; no account or server database is required.

Data is not uniformly complete: name days use the checked 2026 VVC edition, with 1,032 traditional entries and 4,620 additional extended entries. Unverified future school dates are withheld; the year pages remain indexable and clearly state when an official schedule is not yet published. Astrology is entertainment, with dated AI-assisted original editorial content and a freshness guard. No search-ranking or universal performance guarantee is made.

## Indexing and image discovery

All public content pages are indexable, including the search landing page and the ISO week spanning December 2030 and January 2031. Only `/pilsetas-un-fotografijas/` is excluded from search engines; 404 and temporary-error documents retain `noindex` as error screens. The licensing page remains crawlable so its `noindex,follow` directive can be read and its attribution links followed. Technical API responses retain their separate `noindex` policy.

`scripts/indexing_policy.rb` and the Jekyll indexing hook reject unintended page exclusions, conflicting response headers and blocked crawling. Indexable pages allow large image previews. The build creates `/image-sitemap.xml` from real rendered image references, responsive variants, linked Image downloads and current sharing covers, with a canonical landing page and existence check for every image. Both sitemaps are advertised in `robots.txt`. `docs/indexability-audit.json` records the generated coverage. These controls establish crawl/index eligibility; search engines decide actual indexing.

## Sharing covers

Every HTML page has its own 1200 × 630 JPEG sharing cover. `_data/social-images.json` is the shared Open Graph, Twitter and structured-image source. Production builds verify every output and source checksum, title binding and unique subject panel. See `tooling/social-cards/README.md` for regeneration; committed verified covers do not require Python or an image generation service during publication.

Zodiaka oriģinālās SVG skulptūras un to 360° modeļus vienādi atjauno ar `node scripts/build_zodiac_art.mjs`. Avota ģeometrija ir `scripts/artwork/zodiac-sculptures.mjs`; failu kontrolsummas un virsotņu skaits ir `_data/zodiac-models.json`. Telpisko modeli ielādē tikai pēc lietotāja izvēles. Publicēšanas būve pārbauda avotu un pieņemto SVG/modeļu SHA-256 ar `scripts/verify_zodiac_art.mjs`; tā nepārzīmē ilustrācijas citā procesora arhitektūrā. Pēc avota izmaiņām vispirms atjauno mākslas failus un skarto sociālo vāku reģistru. Pārbaude: `node --test test/zodiac-sculptures.test.mjs`.

## Latvian information and help pages

Six information routes use `_data/trust-pages.json`, the actual nine-group storage inventory in `_data/privacy-storage.json` and 25 source-specific FAQ answers. FAQ filtering runs locally. The contact page embeds the published Google Form from `_data/contact.json`, with a direct form link and email fallback. Form submissions and new-response notifications are handled by Google Forms and Gmail; the privacy page describes that separate flow. The privacy banner acknowledges an information notice for 180 days and grants no future analytics/advertising consent.

The 2026-11-12 legal-source review and local validation are recorded in `docs/trust-pages-review.json`. The official provider address is still unavailable and must be supplied through `ownerAddress`; no address was invented. These changes remain local, with no deployment performed.

## Calendar Studio downloads

The local Calendar Studio exports genuine PDF, DOCX, XLSX, JPG, PNG and SVG files. New projects default to 600 dpi; 300 and 150 dpi remain available. Word preserves the design as full-resolution page images and can append editable personal events and notes. Excel includes editable date cells, complete data sheets and an exact design image sheet. Multiple image pages download as one ZIP. All processing stays in the browser; the export modules load only on demand.

`docs/studio-export-review.json` records format contracts and local file/render checks. Run `node --test test/calendar-studio.test.mjs test/studio-exports.test.mjs`. Accepted year/month download collections are untouched. No publication was performed.
