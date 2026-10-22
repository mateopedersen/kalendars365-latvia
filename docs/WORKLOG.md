# Work log

## 2026-10-22
- Read user request and extracted the twenty-file application brief into the workspace.
- Inspected reference image and primary implementation specification.
- Delegated data validation, print output and UI implementation to independent agents.
- Confirmed GitHub signed-in account mateopedersen and Cloudflare signed-in account with Latvia domain listed.
- User supplied operator/contact: Mateo Pedersen; kalendars365@gmail.com.

### Implementation and verification
- Built Ruby 4.0.8 locally and installed Jekyll 4.4.1 with locked dependencies.
- Verified the owned Cloudflare domain and created the public Latvia GitHub repository. User explicitly approved adding this repository to the existing Cloudflare app installation.
- Implemented the complete route registry and source-aware indexing gates, unique Open Graph images and content revision tracking.
- Completed independent data, frontend and print implementations and repaired issues found in recurrence, invalid ICS dates, event editing and layout shifts.
- Added work-hour CSV and leave-budget optimization with ICS export; exhaustive comparisons pass for four years, two workweeks and six budgets.
- Rendered and opened all 225 PDF/WebP pairs. All 9360 print scene checks passed.
- Local mobile Lighthouse improved from performance76/accessibility86 to 87/100; best practices and SEO100. Smaller responsive hero added afterwards. Live results pending.

## 2026-10-22 — production and final typography change

Published main a544829 to Cloudflare Pages; attached owned kalendars365.lv and verified Active SSL. Full live audit:621routes+863assets+450PDF/WebPdownloads pass. Found and disabled zone RUM injection, preserving no-analytics behavior; build cache enabled. User then requested Garet everywhere and complete dark-mode removal. Integrated genuine free Garet Book/Heavy with bundled license, WOFF2 preloads, inline CSS and complete PDF/WebP/OG regeneration. Fixed work/leave/date tools' initial layout shift with shared server-rendered markup; corrected font-induced320px overflow. All225Garetpairs and allOGcards verified. Added explicit Jekyll inclusion and auditing of Cloudflare headers/redirects.

## 2026-10-22 — DM Sans user revision

User replaced the earlier Garet choice with DM Sans everywhere. Downloaded the official Google Fonts variable source and bundled SIL OFL1.1; generated a54,284-byte full-character webfont and genuine static regular/bold print instances. Updated all interface font declarations and favicon outlines; removed Garet font files. All225DM Sans print pairs and645social assets regenerated and verified. Actual-font preflight passes9,360scenes and1,884,081text commands;625HTMLdocuments all use DM Sans. Kept light-only mode and safe migration. Reduced duplicate calendar rendering/date formatting; repaired annual-calendar contrast, heading levels and mobile touch targets.

### Personal print headline regression found in browser QA

An optional headline changed the filename but was absent from non-named print pages. All13types now display it, with actual DM Sans width fitting in PDF and Canvas.390custom scenes (13types×15designs×2orientations) pass, including80-character Latvian names and photos. All225prebuilt sceneJSONs and rendered text sizes remain unchanged. Real browser downloads verified photo position0.75, zoom1.5, one embedded photo,600ppi WebP dimensions/sRGB and the honest59ppi-photo warning. Newfont and personalization checks added to CI.

### Live font cache and mobile startup verification

Final49e83b8 production audit passed621routes and1,313asset/download requests after selective cache purges for only /downloads/ and /assets/og/. An initial audit correctly caught450stale Garet binary lengths; the narrow purge fixed every file. The bare2027PDF was downloaded and compared byte-for-byte with the DM Sans source. Real personalized2030PDF/WebP downloads passed actualfont/title/sRGB/600ppi checks with zero browser console errors and unchanged CSP.

Lighthouse99mobile/100desktop home,99annual and99gallery; all accessibility/best-practices/SEO100. The first mobile home run71 and work run90 exposed startup variability; preserve them as baselines. Removed unused formatter construction and calendar-sidebar work from non-calendar pages. Existing48frontend and2,551planning checks pass. Final post-optimization measurements follow publication.
