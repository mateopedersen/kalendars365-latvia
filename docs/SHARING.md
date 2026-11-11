# Public sharing

The common sharing control has 55 options: 48 services and seven local/device tools. Calendar A3 and lunar-template cards also expose the exact PDF and original Image URL. Other pages share the reviewed public page and its cover, including daily horoscope sign pages. No content is posted automatically.

`share-services.mjs` distinguishes direct compose links, Mastodon server selection and manual copy/open handoffs. Instagram, TikTok, Snapchat, Threads, Signal and similar services receive explicit instructions, not fictitious compose APIs. Login, platform restrictions and the final publish/send action remain under the visitor's control. Some mobile apps can also be selected through the device's native share sheet.

The initial script is small. Modal CSS, icon sprite and options load on first use; the public cover catalog loads only when resolving a different calendar route. QR code generation and square/story PNG rendering load on demand. There are no remote sharing SDKs, trackers, access tokens or paid services.

Public URLs always use `https://kalendars365.lv`. Only supported date/view/year/month/city settings and the public name-day query survive. Unknown parameters and fragments are discarded. Personal events, notes, tasks, photographs uploaded to the calendar maker and local storage are never read by this feature. Sharing a planner page does not publish personal planner records. To send a personalized calendar, export it using the existing planner and attach that file yourself.

Image controls retain true file extensions; Latvian UI labels say **Attēls**. Public covers are downloadable unchanged. Additional 1080 × 1080 and 1080 × 1920 PNG layouts retain the public artwork and source attribution. Template compositions fit the entire calendar rather than cropping dates. Linked HTML is an image/anchor, not an iframe blocked by the site's frame policy.

Sources reviewed for URL contracts: [Telegram](https://core.telegram.org/widgets/share), [Bluesky](https://bsky.network/docs/intent-links/), [Draugiem](https://www.draugiem.lv/applications/dev/docs/say_en/), [Pinterest](https://developer.pinterest.com/docs/web-features/buttons/), [LINE](https://developers.line.biz/en/docs/line-social-plugins/), [WhatsApp](https://faq.whatsapp.com/425247423114725/), [X Publish](https://publish.x.com/). Compose links are drafts for the visitor to review.

Icons are built locally from Simple Icons 16.37.0 (CC0), original utility drawings and clearly identified name monograms when a brand glyph is unavailable. QR generation uses qrcode-generator 2.0.4 (MIT). Sources and checksums are recorded in `_data/share-art.json`; reproducible dependencies are pinned under `tooling/sharing/`. Brand names and marks identify services only; they imply no endorsement.

Validation: `node --test test/sharing.test.mjs` after `npm ci --prefix tooling/sharing --ignore-scripts`. The tests include exact counts, UTF-8 compose URLs, public/private separation, unsafe URL rejection, correct selected template paths, HTML escaping and real QR pixel decoding. Browser QA covers opening/closing, filtering, direct draft URLs, manual handoffs, image downloads, responsive layout and focus return. QA does not publish or message external accounts.
