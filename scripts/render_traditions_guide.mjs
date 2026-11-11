import {readFileSync} from 'node:fs';
import C from '../assets/calendar-core.js';
import K from '../assets/category-core.js';
import {traditionCard} from '../assets/tradition-cards.mjs';

const articles = JSON.parse(readFileSync(0, 'utf8'));
process.stdout.write(K.traditions(articles, {year: 2027}).map(a => traditionCard(a, C.dateLabel)).join(''));
