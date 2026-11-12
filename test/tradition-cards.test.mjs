import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {traditionCard} from '../assets/tradition-cards.mjs';
import K from '../assets/category-core.js';
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));

test('archived vector artwork for the 25 cultural topics stays intact', () => {
  const topics = read('_data/latvia-extra-pages.json').culturalPages;
  const art = read('_data/tradition-illustrations.json');
  assert.equal(topics.length, 25);
  assert.deepEqual(Object.keys(art).sort(), topics.map(a => a.url.split('/').filter(Boolean).at(-1)).sort());
  const hashes = new Set();
  for (const [slug, image] of Object.entries(art)) {
    assert.equal(image.src, `/assets/traditions/${slug}.svg`);
    assert(image.alt.length > 10, slug);
    const svg = fs.readFileSync(image.src.slice(1), 'utf8');
    assert.match(svg, /viewBox="0 0 640 360"/);
    assert.doesNotMatch(svg, /<(?:image|script|foreignObject)\b|(?:href|src)="https?:|data:image/);
    assert(Buffer.byteLength(svg) < 16000, slug);
    hashes.add(crypto.createHash('sha256').update(svg).digest('hex'));
    assert(fs.existsSync('_site' + image.src), slug + ' published asset');
  }
  assert.equal(hashes.size, 25);
});

test('the full guide preserves topics and dates without repeated photo-license calls to action', () => {
  const articles = read('assets/category-data.json').articles;
  assert.equal(articles.length, 73);
  for (const year of [2027, 2028, 2029, 2030]) {
    const selected = K.traditions(articles, {year});
    assert.equal(selected.length, 73);
    for (const article of selected) {
      const card = traditionCard(article, date => date, 'checked-version');
      assert(card.includes('href="' + article.url + '"'), article.url);
      const image = article.photo || article.illustration;
      assert(image?.src, article.url);
      assert(card.includes(image.src + '?v=checked-version'), article.url);
      assert(!card.includes('/category-vector/holiday.svg'));
      for (const date of article.dates) assert(card.includes(`datetime="${date.date}"`), article.url);
      assert(!card.includes('/pilsetas-un-fotografijas/'), article.url);
    }
  }
});

test('card rendering escapes labels and fails clearly when an illustration is missing', () => {
  const article = {url:'/svetki-un-tradicijas/example/',title:'<img src=x onerror="x">',description:'A & B',type:'culture',dates:[],illustration:{src:'/assets/traditions/example.svg',alt:'<script>'}};
  const card = traditionCard(article, date => date);
  assert(card.includes('&lt;img src=x onerror=&quot;x&quot;&gt;'));
  assert(card.includes('A &amp; B'));
  assert(!card.includes('<script>'));
  assert.throws(() => traditionCard({...article,illustration:undefined}, date => date), /Missing tradition card visual/);
});
