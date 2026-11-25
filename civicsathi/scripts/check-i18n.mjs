// Verifies that every translation key used in the code exists in BOTH English and Hindi,
// that both dictionaries have identical keys, and that {placeholders} match.
// Run with:  npm run check:i18n
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const { translations } = await import(pathToFileURL(join(root, 'src/i18n/translations.js')).href);
const { CATEGORIES, HOME_CATEGORIES, STATUSES } = await import(
  pathToFileURL(join(root, 'src/utils/constants.js')).href
);

const PREFIXES =
  'nav|hero|home|how|stats|about|footer|status|cat|auth|login|register|forgot|reset|val|err|common|dash|table|report|track|detail|timeline|admin|notif|profile|privacy|terms|contact|notfound|brand|skip';

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : /\.(jsx?|mjs)$/.test(p) ? [p] : [];
  });
}

const used = new Set();
const literal = new RegExp(`['"\`]((?:${PREFIXES})(?:\\.[A-Za-z0-9_]+)+)['"\`]`, 'g');
for (const file of walk(join(root, 'src'))) {
  if (file.includes('translations.js')) continue;
  const text = readFileSync(file, 'utf8');
  for (const m of text.matchAll(literal)) used.add(m[1]);
}

// keys built dynamically in the code
const expand = (prefix, values, suffix = '') => values.forEach((v) => used.add(`${prefix}${v}${suffix}`));
expand('cat.', CATEGORIES);
expand('status.', STATUSES);
expand('home.cat.', HOME_CATEGORIES);
expand('home.catdesc.', HOME_CATEGORIES);
[1, 2, 3, 4].forEach((n) => {
  used.add(`how.step${n}.title`);
  used.add(`how.step${n}.desc`);
});
['f1', 'f2', 'f3'].forEach((f) => {
  used.add(`about.${f}.title`);
  used.add(`about.${f}.desc`);
});
['submitted', 'pending', 'in_progress', 'resolved', 'rejected'].forEach((s) => {
  used.add(`notif.type.${s}.title`);
  used.add(`notif.type.${s}.msg`);
});
expand('profile.role.', ['citizen', 'admin']);
expand('report.geo.', ['denied', 'timeout', 'unavailable', 'unsupported', 'geocode_failed']);

let problems = 0;
const fail = (msg) => {
  problems += 1;
  console.error('✗', msg);
};

for (const lang of ['en', 'hi']) {
  for (const key of used) if (!(key in translations[lang])) fail(`[${lang}] missing key: ${key}`);
}
for (const key of Object.keys(translations.en)) if (!(key in translations.hi)) fail(`[hi] missing key present in en: ${key}`);
for (const key of Object.keys(translations.hi)) if (!(key in translations.en)) fail(`[en] missing key present in hi: ${key}`);

const placeholders = (s) => (s.match(/\{\w+\}/g) || []).sort().join(',');
for (const key of Object.keys(translations.en)) {
  if (key in translations.hi && placeholders(translations.en[key]) !== placeholders(translations.hi[key])) {
    fail(`placeholder mismatch in "${key}"`);
  }
}

const unused = Object.keys(translations.en).filter((k) => !used.has(k));
if (unused.length) console.log(`ℹ ${unused.length} keys are defined but not referenced by literal usage (fine if built dynamically):`, unused.join(', '));

if (problems) {
  console.error(`\n${problems} problem(s) found.`);
  process.exit(1);
}
console.log(`✓ i18n OK: ${used.size} used keys, ${Object.keys(translations.en).length} keys in each language.`);
