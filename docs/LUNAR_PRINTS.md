# Latvian lunar print collection

2027–2030: 48 months × 4 designs = 192 monthly PDFs and matching images.
Four annual designs × 4 years = 16 annual pairs. The 2026 archive also has
the same four monthly and annual designs: 52 additional pairs, 260 in total.

Monthly sheets use A4, annual posters use A3 so all 365/366 daily discs remain
readable. DM Sans Regular and Bold are embedded in the PDFs under the bundled
SIL Open Font License. The image is rendered directly from its PDF at 600 dpi,
with an sRGB profile and explicit 600 dpi EXIF resolution. PDF text remains
vector text. Every embedded Moon has at least 600 pixels per printed inch.

The original four monthly compositions are Nakts atlants, Gaišais kalendārs,
Novērojumu piezīmes and Nedēļu ritms. Annual compositions are Gada atlants,
Divpadsmit mēneši, Nakts panorāma and Mēness ciklu karte. Files are static,
same-origin downloads, available without browser generation or JavaScript.
Visible image controls say Attēls; the actual WebP format/MIME is preserved.
The footer wordmark is a branding treatment, without a registration claim.

The calculation is geocentric, at 12:00 Europe/Riga for each civil date.
It is a general Latvian calendar, without a city-specific horizon rotation.
The shader uses Sun/Moon vectors for the terminator and IAU lunar rotation
for the changing visible surface. Celestial north is up. It uses the LROC
surface color map as a spherical albedo texture, not a flat shaded photograph.
These are computed illustrations of future dates, not future observations.
The rendering does not model eclipses, weather, atmospheric refraction or
fine terrain self-shadowing. Main phase times use the archived USNO events.

Source and derivative hashes are in lib/lunar-print-source.json. The public
photo/license page also credits NASA SVS / LRO / LROC and explains the model.

## Rebuild

Requires Node, Python with NumPy, Pillow and ReportLab, and Poppler pdftoppm.
Use a private work directory outside the site. The source map is checked in.

```sh
node scripts/lunar_print_data.mjs /private/tmp/k365-lunar/lunar-days.json
python scripts/generate_lunar_prints.py --work /private/tmp/k365-lunar --texture lib/lroc-color-4k.jpg --resume
node test/lunar-prints.test.mjs
python scripts/verify_lunar_prints.py
```

Run the site generator/build before the Node test, which also checks all 65
published monthly/annual galleries. The full artifact verifier inspects page
counts, embedded fonts, every image placement and effective resolution,
month/year disc counts, metadata and decoded image dimensions. These are
automated numerical/artifact checks, not an expert astronomer certification.
