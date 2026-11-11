# Kalendārs365 social covers

All HTML pages receive their own original 1200 × 630 JPEG. The registry is
`_data/social-images.json`; `_plugins/social_images.rb` stops a site build if a
page has no individual cover, its title changed, an input was replaced, or an
output checksum fails. Open Graph, Twitter and structured images use this one
registry. Error and noindex pages have their own covers too.

The imagery is a native graphic composition rather than an inference-generated
bitmap: exact Latvian text, real calendar/ISO dates, local-noon lunar phase
geometry, existing original vector illustrations and approved licensed photos.
There is no paid inference. Actual photographs are archival illustrations.
Moon appearances use the documented NASA Apollo 17 photograph as a texture;
lighting is computed, not a photograph taken on the represented future date.

## Build

Use Node 24 and Python with Pillow and NumPy. Set `SOCIAL_CARDS_PYTHON` to the
Python executable in an environment that has these dependencies; otherwise use
that executable directly in the command below. The owner machine has a bundled
Codex Python runtime with these packages. Nothing is installed into system Python.

```sh
ruby scripts/generate.rb
npm ci --prefix tooling/social-cards --ignore-scripts --no-audit --no-fund
node tooling/social-cards/prepare.mjs
"${SOCIAL_CARDS_PYTHON:-python3}" scripts/social_images.py
ruby scripts/generate.rb
JEKYLL_ENV=production JEKYLL_NO_BUNDLER_REQUIRE=1 jekyll build
```

Preparation rasterizes the original repo-native SVGs with pinned resvg 2.6.2 and
computes daily moon values using the site's vendored Astronomy Engine and
Europe/Riga conversion. The ignored `cache/` directory is reproducible.

The renderer uses the actual DM Sans fonts from the site and supersamples at 2×.
It validates complete text bounds, exact dimensions, image decoding, 900 distinct
pixel images and 900 distinct subject panels. A failure does not replace the
accepted registry. `--only /path/ /another-path/` produces previews without
replacing that registry.

Photo credits, source URLs and license URLs are stored per output, included in
image attribution and summarized on the existing photography/permissions page.
Source images and accepted PDF/Image download collections are never changed.
The native layouts, data widgets and artwork are original to Kalendārs365;
photographs retain their recorded licenses and attribution.

## Verification

```sh
node --test test/seo-performance.test.cjs test/social-covers.test.cjs
ruby scripts/audit.rb
```

A route addition or a page-title change requires a new renderer run before the
site can build. The supported route inventory consists of the published route
manifest plus the two error pages and the ISO week crossing into 2031.
