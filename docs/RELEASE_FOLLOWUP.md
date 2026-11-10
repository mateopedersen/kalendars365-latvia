# Latvia follow-up — 2026-11-10

- Replaced all 19 category illustrations with deterministic SVG projections of original 3D geometry, surface normals, studio lighting and contact shadows. 29 thematic sprite symbols reuse the new assets. UI action symbols and the brand mark retain their readable semantics.
- Corrected special-page visual mapping: study/exam/school pages use school art, memorial pages use memorial art, payment pages use work art, editorial policy uses about art, and astronomical pages retain astronomy art.
- Added four source-confirmed public dates to VeA/NAA cards. They are onboarding/matriculation dates, explicitly not inferred holiday dates. Full unpublished vacation schedules remain unavailable.
- Horoscope API and middleware already generate the current Riga edition at request time. Added cache expiration capped at Riga midnight, including DST-aware boundaries. 39 regression assertions cover winter, summer, DST, date rollover, future dates and unknown signs.
- Local build: 998 routes, 943 indexable, 55 noindex; 1001 HTML files; static audit errors: 0. Existing frontend 50 checks and locale 480 comparisons passed.
- A visible-text scan of all generated HTML checked distinctive Slovenian residues. This automated/editorial work is not a claim of independent native-language certification.
- Two university photographs remain unpublished because reuse rights were not verified. No substitute city photo is presented as a campus.
