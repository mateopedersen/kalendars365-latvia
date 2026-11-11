import {build} from 'esbuild';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const dir = path.dirname(fileURLToPath(import.meta.url));
await build({entryPoints: [path.join(dir, 'vendor-entry.mjs')], outfile: path.join(dir, '../../assets/vendor/ascendant-timezones.mjs'),
  bundle: true, format: 'esm', platform: 'browser', minify: true, legalComments: 'none', target: ['es2020'],
  banner: {js: '/*! Moment 2.31.0 / Moment Timezone 0.6.6 — MIT. Full IANA history. See ascendant-timezones.LICENSE.txt. */'}});
const licenses = await Promise.all(['moment/LICENSE', 'moment-timezone/LICENSE'].map(p => fs.readFile(path.join(dir, 'node_modules', p), 'utf8')));
await fs.writeFile(path.join(dir, '../../assets/vendor/ascendant-timezones.LICENSE.txt'), licenses.join('\n\n'));
