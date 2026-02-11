// tools/generate-project-cards.mjs
// ----------------------------------------------------------
// Generates (build artifacts):
//   content/de/projects.cards.json
//   content/en/projects.cards.json
//
// Source of truth:
//   content/<lang>/projects/*.json  (each project must include a "card" block)
//
// Rules:
// - Ignore files starting with "_" (examples / drafts)
// - Ignore visibility: "private" (do not list in cards)
// - pinned: true sorts above everything else
// - Adds computed fields:
//     url: "projects/project.html?slug=<slug>"
//     slug: "<slug>"
//
// Run:
//   node tools/generate-project-cards.mjs
// ----------------------------------------------------------

import fs from 'node:fs/promises';
import path from 'node:path';

const LANGS = ['de', 'en'];
const ROOT = process.cwd();

function isJsonFile(name) {
  return name.endsWith('.json') && !name.endsWith('.schema.json');
}

function slugFromFilename(filename) {
  return filename.replace(/\.json$/i, '');
}

async function readJson(filePath) {
  const raw = await fs.readFile(filePath, 'utf8');
  return JSON.parse(raw);
}

function cleanString(v) {
  return String(v ?? '').trim();
}

function ensureArray(v) {
  return Array.isArray(v) ? v : [];
}

function normalizeDate(dateStr) {
  const s = cleanString(dateStr);
  // Accept "YYYY-MM" or "YYYY-MM-DD"
  if (/^\d{4}-\d{2}$/.test(s)) return `${s}-01`;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  return '';
}

function dateToTs(dateStr) {
  const iso = normalizeDate(dateStr);
  const t = Date.parse(iso);
  return Number.isFinite(t) ? t : 0;
}

function warn(warnings, msg) {
  warnings.push(msg);
}

function buildCard(slug, projectJson, warnings) {
  const card = projectJson?.card;
  if (!card || typeof card !== 'object') {
    throw new Error(`Missing required "card" block`);
  }

  const title = cleanString(card.title);
  const date = cleanString(card.date);
  const description = cleanString(card.description);
  const image = cleanString(card.image);

  if (!title) throw new Error(`card.title is required`);
  if (!date) throw new Error(`card.date is required`);
  if (!description) throw new Error(`card.description is required`);
  if (!image) throw new Error(`card.image is required`);

  // visibility: public|private (private => skip listing)
  const visibility = cleanString(card.visibility || 'public').toLowerCase();

  // pinned: boolean
  const pinned = !!card.pinned;

  // tags
  const tagsRaw = card.tags;
  if (!Array.isArray(tagsRaw)) {
    warn(warnings, `card.tags is missing or not an array -> using []`);
  }
  const tags = ensureArray(tagsRaw)
    .map((t) => cleanString(t))
    .filter(Boolean);

  // date format sanity
  if (!normalizeDate(date)) {
    warn(warnings, `card.date "${date}" is not YYYY-MM or YYYY-MM-DD (sorting may be wrong)`);
  }

  // optional
  const github = cleanString(card.github);

  return {
    slug,
    title,
    date,
    description,
    image,
    url: `projects/project.html?slug=${encodeURIComponent(slug)}`,
    github: github || '',
    visibility,
    pinned,
    tags,
  };
}

async function generateForLang(lang) {
  const dir = path.join(ROOT, 'content', lang, 'projects');
  const outFile = path.join(ROOT, 'content', lang, 'projects.cards.json');

  const entries = await fs.readdir(dir, { withFileTypes: true });

  const projectFiles = entries
    .filter((e) => e.isFile() && isJsonFile(e.name))
    .filter((e) => !e.name.startsWith('_')) // ignore _example, drafts, etc.
    .map((e) => e.name);

  const cards = [];
  const warnings = [];

  for (const file of projectFiles) {
    const slug = slugFromFilename(file);
    const filePath = path.join(dir, file);

    try {
      const json = await readJson(filePath);
      const card = buildCard(slug, json, warnings);

      // Skip private projects
      if (card.visibility === 'private') continue;

      cards.push(card);
    } catch (err) {
      throw new Error(`[${lang}] ${file}: ${err.message}`);
    }
  }

  // Sort:
  // 1) pinned true first
  // 2) date newest -> oldest
  // 3) title (stable)
  cards.sort((a, b) => {
    const ap = a.pinned ? 1 : 0;
    const bp = b.pinned ? 1 : 0;
    if (ap !== bp) return bp - ap;

    const at = dateToTs(a.date);
    const bt = dateToTs(b.date);
    if (at !== bt) return bt - at;

    return String(a.title).localeCompare(String(b.title), 'en', { sensitivity: 'base' });
  });

  await fs.writeFile(outFile, JSON.stringify(cards, null, 2) + '\n', 'utf8');

  console.log(`[OK] Wrote ${outFile} (${cards.length} cards)`);

  // Print warnings (non-fatal)
  if (warnings.length) {
    console.log(`[WARN] ${lang}: ${warnings.length} warning(s)`);
    for (const w of warnings) console.log(`  - ${w}`);
  }
}

async function main() {
  for (const lang of LANGS) {
    await generateForLang(lang);
  }
}

main().catch((err) => {
  console.error('[ERROR]', err.message);
  process.exit(1);
});
