# Operations

## Hosting and updates

Repository: https://github.com/mateopedersen/kalendars365-latvia. Cloudflare Pages project: kalendars365-latvia. The owned domain kalendars365.lv is the canonical host. Main-branch commits trigger builds. Do not modify the separate Lithuanian or Slovenian projects.

Ruby 4.0.8 was released on 2026-10-22 and was initially absent from Cloudflare/GitHub runtime catalogues. `scripts/bootstrap-ruby.sh` validates the official source SHA-256 before compiling it. The platform's initial Ruby version is 3.2.2; the actual site build uses verified 4.0.8 and Jekyll 4.4.1. Cloudflare environment: RUBY_VERSION=3.2.2, SKIP_DEPENDENCY_INSTALL=true. Build: `bash scripts/cloudflare-build.sh`; output `_site`. Build caches are optional accelerators, not a correctness requirement.

## Daily editorial content

The desktop app scheduled task **Kalendārs365 günlük özgün içerik** is active at 03:10 Europe/Istanbul. It returns to the implementation chat, checks the live Europe/Riga date, authors twelve new Latvian texts when missing, validates them, commits only the relevant files and verifies the Cloudflare publication. It must never relabel or rotate old text. The public text discloses AI assistance, entertainment status and absence of an individual birth-chart calculation.

This is a local scheduled task: **the computer and desktop app must be running**. It is not an always-on Cloudflare Worker. The GitHub scheduled workflow independently detects stale content at 01:30 UTC. The site suppresses stale readings instead of displaying them as current. No paid API or background server was created. This hosting-independent editorial availability limitation is explicit.

## Local maintenance

The task workspace contains a Ruby 4.0.8 installation under `work/runtime/installs/ruby/4.0.8/bin`. Set that directory first on PATH and use BUNDLE_PATH=vendor/bundle in the source project. Run `scripts/generate.rb`, the relevant tests, Jekyll build and `scripts/audit.rb` before publication. Asset queries derive from content hashes; sitemap lastmod derives from meaningful page changes.

The repository's GitHub Actions workflow independently builds and tests Linux. A green local test does not imply a successful remote deployment; check both the Actions run and Cloudflare deployment.

## Personal data

Visitor events, notes, tasks and uploaded photos stay in the browser. JSON backups are user-controlled. No user-event database or account synchronization is provisioned. Keep the privacy copy aligned with any future analytics, advertising or server feature.

## Production release and latest UI steering

- Verified production HTTPS: https://kalendars365.lv/ (2026-10-22); Cloudflare custom domain is Active with SSL enabled.
- GitHub main a544829 deployed as 1a95a81e-ab72-454d-8280-fe1f2b10c023 before the Garet update. CI passed.
- DNS migration at the owned Latvia root only: previous A @ 2.57.91.91 → CNAME @ kalendars365-latvia.pages.dev; automatic TTL.
- Cloudflare build cache enabled. Zone RUM disabled; verified live HTML contains neither data-cf-beacon nor static.cloudflareinsights.com. Pages Web Analytics remains disabled.
- Latest user instruction: DM Sans throughout, light theme only. Legacy appearance preferences are removed without deleting calendar data.
- DM Sans is self-hosted from the official Google Fonts distribution under the bundled SIL Open Font License1.1. The full-character WOFF2 retains weights100–1000 at optical size14; PDF and image rendering use actual regular400 and bold700 static instances. All Latvian letters verified. File hashes and provenance are in assets/fonts/DM-Sans-SOURCE.json.
- Jekyll now explicitly includes _headers and _redirects; the shared CSS is embedded at build time to avoid blocking stylesheet round trips.

- Canonical WWW redirect is active: host www.kalendars365.lv → HTTPS kalendars365.lv with the original path and query, HTTP301. The single free rule is scoped to that host only.
