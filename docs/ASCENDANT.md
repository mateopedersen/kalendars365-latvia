# Ascendant calculator

The inline tool on `/horoskops/` and `/horoskopa-zimes-kalkulators/` computes the tropical rising longitude, not an approximate Sun sign from a month/day table. All twelve horoscope pages and the zodiac directory link to it. The existing Sun-sign tool remains separate.

## Calculation

`assets/ascendant-core.mjs` uses the already accepted MIT Astronomy Engine module for Greenwich apparent sidereal time (GAST) and true obliquity of date. With geographic latitude φ, east longitude L, local apparent sidereal angle θ = GAST × 15° + L, and true obliquity ε:

```
A = cos φ cos θ
B = cos φ sin θ cos ε + sin φ sin ε
λ = atan2(−A, B)
```

The second antipodal solution is selected when necessary so the ecliptic point has a positive projection onto local east. This follows directly from the zero dot product between the ecliptic point `(cos λ, sin λ cos ε, sin λ sin ε)` and local zenith. No Swiss Ephemeris implementation is bundled or translated. No houses or planetary positions are inferred. UTC approximates UT1; refraction and a terrain horizon do not define the astrological ascendant.

Longitude is normalized to `[0, 360)`. The sign is selected from **unrounded** longitude, and the displayed within-sign arcminutes are truncated so 29°59′ never becomes 30° in the wrong sign. A distance of less than one arcminute to a sign cusp triggers a visible uncertainty message. Input dates are 1900–2100, geographic latitude is strictly inside ±89.999°, longitude is ±180°. Singular ecliptic/horizon intersections fail explicitly.

Optional birth-time uncertainty uses one-second samples across the entire ±1/5/15/30/60-minute interval, including both endpoints, on the UTC timeline after resolving any civil-time ambiguity. Multiple signs and rapidly changing polar geometry receive explicit notices. Unknown birth time is never replaced with noon. Near polar singularities sampled intervals do not constitute an absolute mathematical guarantee.

## Civil time and place

The pinned Moment Timezone 0.6.6 package ships full IANA 2026f history. We do **not** use its automatic gap/fold coercion: enumerate every distinct offset of the selected zone, construct UTC candidates and accept only exact local-time round trips. No candidates means a gap; two candidates require a user choice. Fractional-minute historical offsets retain seconds. This works independently of the browser's timezone or date parser. Before-1970 records and future political timezone changes have the limits described in IANA's theory documentation; these are explained in the tool.

82 Latvian city centres come from the existing reviewed city catalogue. Other places are country-split GeoNames `cities15000` records, 34,281 places total including Latvia, not every village. Manual geographic coordinates plus a validated IANA timezone cover unlisted birthplaces. Names and regions are source proper nouns; country labels are generated with Latvian `Intl.DisplayNames`. Search supports diacritic folding, native names and GeoNames transliterations/aliases. Matching names in different regions remain separate options.

The GeoNames source ZIP, readme and administrative regions are checksum-bound in `docs/sources/ascendant/`, excluded from production. Attribution: GeoNames, CC BY 4.0. Rebuild from those snapshots with `python3 scripts/build_ascendant_places.py` (Node on PATH). Rebuild the isolated MIT vendor module with `npm ci --prefix tooling/ascendant --ignore-scripts && npm run build --prefix tooling/ascendant`. Both package lock and license notices are retained.

## Privacy and loading

Birth date, time, manual coordinates and results are neither saved to local/session storage nor put into URLs nor sent to a server. A world-country selection downloads only a public, static country catalogue from this site; no birth fields are included in that request. There is no external geocoding or astrology API, tracking event or paid inference. Calculation modules load only when calculating or opening the advanced timezone selector. The ordinary homepage and twelve horoscope profiles do not load them. Reset clears the current form; editing input hides an old result, and generation tokens reject stale asynchronous results.

## Verification

`test/fixtures/ascendant-swiss.json` contains numerical oracle results from a private test-only PySwisseph 2.10.3.2 / Swiss Ephemeris 2.10.03 installation: 492 Latvia samples (all 82 cities, six dates) plus 1,000 seeded worldwide samples, both hemispheres and latitudes up to ±85°, 1900–2100. Swiss software stays in the private report environment and is not a runtime or build dependency. The test measures angular error and identical signs and records its fixture hash and measured maxima in `docs/ASCENDANT_REFERENCE_RESULTS.json`. A 10-arcsecond regression threshold is a test threshold, not an absolute future guarantee or professional certification.

Thirteen independent Python `zoneinfo` fixtures cover Riga's 1900 offset (01:36:34), modern gaps/folds in Riga and New York, Lord Howe's 30-minute changes, Warsaw's 1915 24-minute fold, Kathmandu's 15-minute gap, Apia's skipped date and London's 1941 double summer time. Additional tests cover invalid dates, leap days, sign cusps, nonnumeric coordinates, uncertainty ranges, source integrity, catalogue zones, privacy and generated-page integration. Run `node --test test/ascendant.test.mjs` after building the site.

Primary references:

* [Astronomy Engine JavaScript reference](https://github.com/cosinekitty/astronomy/tree/master/source/js)
* [IANA timezone theory and historical limits](https://data.iana.org/time-zones/tzdb/theory.html)
* [Moment Timezone zone objects and ambiguities](https://momentjs.com/timezone/docs/)
* [Swiss Ephemeris programming reference (independent test oracle)](https://www.astro.com/swisseph/swephprg.htm)
* [GeoNames extract format and license](https://download.geonames.org/export/dump/readme.txt)
