# Kalendārs365 — Latvijas kalendāri 2027–2030

Independent Latvian calendar and planning site, built with Ruby 4.0.8, Jekyll 4.4.1 and browser JavaScript. Published through Cloudflare Pages from this repository. Operator: Mateo Pedersen, kalendars365@gmail.com.

## Build

```sh
bundle install
bundle exec ruby scripts/generate.rb
bundle exec jekyll build
bundle exec ruby scripts/audit.rb
```

Cloudflare build command: `bash scripts/cloudflare-build.sh`; output directory `_site`; environment `RUBY_VERSION=3.2.2` and `SKIP_DEPENDENCY_INSTALL=true`. The platform's preinstalled Ruby only starts the build. The script uses the site's pinned Ruby **4.0.8** and Bundler **4.0.20** for dependency installation and Jekyll.

`scripts/bootstrap-ruby.sh` reuses a functional Ruby 4.0.8 or compiles the [official source archive](https://www.ruby-lang.org/en/downloads/) after checking its pinned SHA-256. Source it to export the runtime on `PATH`. It checks OpenSSL and Psych before use. Runtime and gems live under ignored `node_modules/.cache/`; enable the Cloudflare build cache to reuse them when supported. GitHub verification caches both directories explicitly and installs compilation headers. A cold build needs a C toolchain plus OpenSSL, libyaml, readline, zlib and libffi development headers. Daily editorial freshness uses the Ubuntu runner's system Ruby and standard libraries only.

## Verify

```sh
bundle exec ruby test/date_test.rb
node test/date_core_test.cjs
node test/date_l10n_test.cjs
node test/frontend_test.cjs
node test/planning_test.cjs
node test/print.test.cjs
ruby scripts/verify_daily.rb
```

The repository contains the real downloadable PDF/WebP files. Regeneration uses `scripts/generate_print.cjs` and the dependencies declared in `scripts/package.json` / `scripts/print-requirements.txt`. `scripts/verify_print.py` opens and checks the files.

See `STATUS.md`, `docs/SOURCES.md`, `docs/DATA_AUDIT.md`, `docs/PRINT_QA.md`, `docs/TEST_RESULTS.md` and `docs/WORKLOG.md` for evidence and known limits. Personal calendar data stays in the visitor's browser; no account or server database is required.

Data is not uniformly complete: name days are explicitly marked as the official 2018 snapshot, unverified future school terms are withheld, and affected routes are noindex. Astrology is entertainment, with dated AI-assisted original editorial content and a freshness guard. No search-ranking or universal performance guarantee is made.
