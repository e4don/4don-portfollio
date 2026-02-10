// tools/generate-project-cards.mjs
// ----------------------------------------------------------
// Generates:
//   content/de/projects.cards.json
//   content/en/projects.cards.json
//
// Source of truth:
//   content/<lang>/projects/*.json  (each project must include a "card" block)
//
// Adds computed fields:
//   - url: "projects/project.html?slug=<slug>"
//   - slug: "<slug>" (helpful for debugging / future features)
//
// Usage:
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

function normalizeDate(dateStr) {
  const s = String(dateStr ?? '').trim();
  // Allow "YYYY-MM" or "YYYY-MM-DD"
  if (/^\d{4}-\d{2}$/.test(s)) return `${s}-01`;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  return '';
}

function dateToTs(dateStr) {
  const iso = normalizeDate(dateStr);
  const t = Date.parse(iso);
  return Number.isFinite(t) ? t : 0;
}

function ensureArray(v) {
  return Array.isArray(v) ? v : [];
}

function cleanString(v) {
  const s = String(v ?? '').trim();
  return s;
}

function buildCard(slug, projectJson) {
  const card = projectJson?.card;
  if (!card || typeof card !== 'object') {
    throw new Error(`Missing required "card" block`);
  }

  const title = cleanString(card.title);
  const date = cleanString(card.date);
  const description = cleanString(card.description);
  const image = cleanString(card.image);
  const tags = ensureArray(card.tags)
    .map((t) => cleanString(t))
    .filter(Boolean);

  if (!title) throw new Error(`card.title is required`);
  if (!date) throw new Error(`card.date is required`);
  if (!description) throw new Error(`card.description is required`);
  if (!image) throw new Error(`card.image is required`);

  const github = cleanString(card.github);
  const visibility = cleanString(card.visibility) || 'public';

  return {
    slug,
    title,
    date,
    description,
    image,
    url: `projects/project.html?slug=${encodeURIComponent(slug)}`,
    github: github || '',
    visibility,
    tags,
  };
}

async function generateForLang(lang) {
  const dir = path.join(ROOT, 'content', lang, 'projects');
  const outFile = path.join(ROOT, 'content', lang, 'projects.cards.json');

  const entries = await fs.readdir(dir, { withFileTypes: true });

  const projectFiles = entries
    .filter((e) => e.isFile() && isJsonFile(e.name))
    // ignore files starting with "_" if you want to keep examples out of listing:
    .filter((e) => !e.name.startsWith('_'))
    .map((e) => e.name);

  const cards = [];

  for (const file of projectFiles) {
    const slug = slugFromFilename(file);
    const filePath = path.join(dir, file);

    try {
      const json = await readJson(filePath);
      const card = buildCard(slug, json);
      cards.push(card);
    } catch (err) {
      throw new Error(`[${lang}] ${file}: ${err.message}`);
    }
  }

  // Sort newest -> oldest by date
  cards.sort((a, b) => dateToTs(b.date) - dateToTs(a.date));

  await fs.writeFile(outFile, JSON.stringify(cards, null, 2) + '\n', 'utf8');
  console.log(`[OK] Wrote ${outFile} (${cards.length} cards)`);
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
