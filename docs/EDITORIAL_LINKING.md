# Contextual editorial links

This layer connects useful prose to the relevant published tool, period or guide.
It complements the site hierarchy without adding another navigation or related
cards section. Keep the existing page layout and accepted assets intact.

## Where decisions live

- `_content/blog/*.md`: reviewed anchors in the body of each long-form guide.
- `_data/editorial-links.json`: exact phrases in named page or family scopes.
- `scripts/editorial_links.rb`: preserves each paragraph verbatim, adding escaped
  link tokens only where its reviewed phrase occurs.
- `docs/EDITORIAL_PROSE_LINKS.json`: generated per-page application record.
- `scripts/audit_editorial_links.py`: inspects actual generated paragraphs. Menus,
  breadcrumbs, recommendation cards, footer links and source lists do not count.

## Editorial checks

Read the paragraph and the destination before choosing an anchor. The reader
should understand what opens from the visible wording and surrounding sentence.
Use the appropriate year, month, crop or city when the paragraph names one.
Do not point a future-year page to a different year's dates. A general explanatory
article may be relevant across years only when it explains a stable concept.

A guide should offer its useful tool while the reader is considering that task,
not solely in the closing paragraph. A tool explanation should lead back to a
specific guide when the guide answers a natural follow-up question. Do not create
reciprocal links merely to satisfy a numeric quota.

Preserve primary-source links and their qualifications. Avoid broad label
substitution, hidden links, repeated links to the same destination inside the
same article, unnatural keyword strings, and links in headings solely for SEO.
Do not add a generic paragraph or an unrelated destination just to increase counts.

The paragraph renderer has a ceiling of two contextual links per paragraph and
four per short explanation. These are readability limits, not a Google formula,
minimum target or promised ranking advantage. A page can legitimately have fewer.

The build rejects an explicit phrase that no longer occurs, an unknown page or
an unpublished destination. Family rules are optional and apply only to a known
page family. The current crop list can enrich a garden month only with crops
actually named in that month's data.

## Validation

After a build:

```
node --test test/editorial-links.test.mjs test/internal-navigation.test.mjs
python3 scripts/audit_editorial_links.py --site _site --output /tmp/editorial-links.json --strict
python3 scripts/audit_internal_links.py --site _site --output /tmp/internal-links.json --strict
```

Review the rendered prose for clarity and test representative links in a browser.
The audit records early article-to-tool links and tool-to-article prose links; it
does not equate link counts with search performance. Full click-through and query
performance requires real Search Console data after an authorized publication.

References:

- [Google Search Central: link best practices](https://developers.google.com/search/docs/crawling-indexing/links-crawlable)
- [Google Search Central: helpful, reliable content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)
