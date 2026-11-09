# Calendar interface and city release, 2026-11-09

The homepage uses the Koledar365 information hierarchy: two navigation levels,
short introduction, city/time card, interactive calendar, personal planner,
six useful calendar cards, three tool cards and grouped footer. Kalendārs365's
burgundy navigation, national accent and warm cream surfaces are preserved.

Reference: https://koledar365.si/ and
https://github.com/mateopedersen/koledar365-si . Material SVG symbols are adapted
from `public/visuals/ui-material-v3.svg`; the calendar brand mark is adapted from
`public/visuals/brand-calendar-v3.svg` in that owner's repository. The logo is
inlined with distinct header/footer gradient IDs. No external logo request is
required. The interface uses the reference's Avenir/Avenir Next/system font stack;
licensed Avenir files are not redistributed. Existing DM Sans print files remain.

The shared city catalog has 82 cities, including Carnikava's 2026 status change.
Each has a real local WebP photograph, coordinate, source and license. See
`CITY_PHOTOS_RESEARCH.md`, `_data/cities.json` and the public
`/pilsetas-un-fotografijas/` page. Clock seconds and analog hands use Europe/Riga;
all Latvian cities share that zone. Sunrise/sunset and daylight use the selected
city's coordinates and the existing approximate solar calculation. The choice is
remembered locally without modifying personal events, notes or tasks. Missing
photographs produce an explicit message instead of a different city's image.

All 82 solar city routes are generated through the existing search and sitemap
pipeline. Existing pending source and noindex decisions remain in place.

Validation before publication:
- Jekyll 4.4.1 build succeeded; generated JavaScript parses.
- Existing frontend regression suite: 50 checks passed.
- Existing planning suite: 2,551 assertions passed.
- New city regression checks: 82 records, 164 SHA-256 verified WebP files,
  coordinates, attribution, runtime serialization and 82 built solar routes.
- Site audit: 694 manifest routes, 698 HTML files, zero errors.
- Built-page local links and SVG symbol references resolve; no duplicate H1.
- Browser city selection changes photo, caption, license link and solar values;
  Rīga 07:50/16:23 and Liepāja 08:01/16:38 on 2026-11-09.
- Browser layout checks at 375, 390, 768, 1024 and 1440 CSS pixels found no
  horizontal overflow. Temporary viewport emulation is cleared after checking.

These are local build and browser observations; production publication is
confirmed separately after Cloudflare finishes deploying the pushed commit.
