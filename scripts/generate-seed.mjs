/**
 * Generate db/seed.sql from current data/*.json
 * Usage: node scripts/generate-seed.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DATA = path.join(ROOT, 'public', 'data');
const OUT = path.join(ROOT, 'db', 'seed.sql');

function readJSON(rel) {
  return JSON.parse(fs.readFileSync(path.join(DATA, rel), 'utf8'));
}

function esc(str) {
  if (str == null) return 'NULL';
  return "'" + String(str).replace(/'/g, "''") + "'";
}

function j(val) {
  // Dollar-quote so JSON backslashes stay valid for Postgres jsonb
  const raw = JSON.stringify(val ?? null);
  return `$json$${raw}$json$::jsonb`;
}

const theme = {
  primary: '#1d4ed8',
  primaryLight: '#3b82f6',
  primaryDark: '#1e3a8a',
  accent: '#0ea5e9',
  accentLight: '#38bdf8',
  violet: '#2563eb',
  violetLight: '#93c5fd',
  coral: '#0284c7',
  dark: '#0f172a',
  darkSoft: '#334155',
  text: '#1e293b',
  textMuted: '#64748b',
  bg: '#f8fafc',
  bgWarm: '#eff6ff',
  bgSoft: '#f1f5f9',
  white: '#ffffff',
  gradientBrand: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 40%, #2563eb 70%, #0ea5e9 100%)',
  gradientHero: 'linear-gradient(125deg, #0f172a 0%, #1e3a8a 32%, #1d4ed8 62%, #0ea5e9 100%)',
  gradientDark: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 55%, #1d4ed8 100%)'
};

const lines = [];
lines.push('-- SPEDICS seed data — auto-generated from data/*.json');
lines.push('-- Regenerate: node scripts/generate-seed.mjs');
lines.push('-- Apply: psql "$DATABASE_URL" -f db/schema.sql && psql "$DATABASE_URL" -f db/seed.sql');
lines.push('');
lines.push('BEGIN;');
lines.push('');
lines.push('-- Clear existing (safe re-seed)');
lines.push('TRUNCATE gallery_items, gallery_meta, courses, course_categories, faq_items,');
lines.push('  affiliations, testimonials, guides, guides_meta, content_docs, site_config, admin_users CASCADE;');
lines.push('');

// site_config
const site = readJSON('site.json');
lines.push('-- site_config');
lines.push(`INSERT INTO site_config (id, data, theme) VALUES (1, ${j(site)}, ${j(theme)});`);
lines.push('');

// content_docs
const contentKeys = [
  ['about', 'about.json'],
  ['admissions', 'admissions.json'],
  ['fees', 'fees.json'],
  ['learning-modes', 'learning-modes.json'],
  ['careers', 'careers.json'],
  ['affiliations-meta', 'affiliations.json'],
  ['certificates-index', 'certificates/index.json']
];
lines.push('-- content_docs');
for (const [key, file] of contentKeys) {
  try {
    const data = readJSON(file);
    lines.push(`INSERT INTO content_docs (key, data) VALUES (${esc(key)}, ${j(data)});`);
  } catch (e) {
    console.warn('Skip', file, e.message);
  }
}
lines.push('');

// courses
const index = readJSON('courses/courses-index.json');
const featured = index.featured || [];
const allIds = [...new Set([
  ...featured,
  ...index.categories.flatMap((c) => c.courses)
])];
lines.push('-- courses');
allIds.forEach((id, i) => {
  const c = readJSON(`courses/${id}.json`);
  lines.push(`INSERT INTO courses (id, title, short_title, badge, description, image, duration, eligibility, mode, fee, packages, modules, schedule, sort_order, is_featured, is_published)
VALUES (
  ${esc(c.id)}, ${esc(c.title)}, ${esc(c.shortTitle || '')}, ${esc(c.badge || '')},
  ${esc(c.description || '')}, ${esc(c.image || '')}, ${esc(c.duration || '')}, ${esc(c.eligibility || '')},
  ${j(c.mode || [])}, ${esc(c.fee || '')}, ${j(c.packages || [])}, ${j(c.modules || [])},
  ${esc(c.schedule || null)}, ${i}, ${featured.includes(id)}, TRUE
);`);
});
lines.push('');

lines.push('-- course_categories');
(index.categories || []).forEach((cat, i) => {
  lines.push(`INSERT INTO course_categories (id, name, sort_order, course_ids) VALUES (${esc(cat.id)}, ${esc(cat.name)}, ${i}, ${j(cat.courses)});`);
});
lines.push(`INSERT INTO content_docs (key, data) VALUES ('courses-index', ${j(index)})
ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data;`);
lines.push('');

// FAQ
lines.push('-- faq_items');
const faq = readJSON('faq.json');
(faq.items || []).forEach((item, i) => {
  lines.push(`INSERT INTO faq_items (question, answer, answer_with_fees, sort_order) VALUES (
  ${esc(item.question)}, ${esc(item.answer)}, ${esc(item.answerWithFees || null)}, ${i}
);`);
});
lines.push(`INSERT INTO content_docs (key, data) VALUES ('faq-meta', ${j({ title: faq.title })})
ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data;`);
lines.push('');

// Gallery
const galleryIndex = readJSON('gallery/index.json');
lines.push('-- gallery');
lines.push(`INSERT INTO gallery_meta (id, title, subtitle) VALUES (1, ${esc(galleryIndex.title)}, ${esc(galleryIndex.subtitle || '')});`);
(galleryIndex.items || []).forEach((folder, i) => {
  const g = readJSON(`gallery/${folder}/data.json`);
  const file = g.file || g.image || 'photo.jpeg';
  const imageUrl = `data/gallery/${folder}/${file}`;
  lines.push(`INSERT INTO gallery_items (id, title, description, file_name, image_url, category, sort_order) VALUES (
  ${esc(g.id || folder)}, ${esc(g.title)}, ${esc(g.description || '')}, ${esc(file)}, ${esc(imageUrl)}, ${esc(g.category || '')}, ${i}
);`);
});
lines.push('');

// Affiliations
const aff = readJSON('affiliations.json');
lines.push('-- affiliations');
(aff.affiliations || []).forEach((a, i) => {
  lines.push(`INSERT INTO affiliations (name, affiliation_no, period, govt_reg_no, logo, sort_order, note) VALUES (
  ${esc(a.name)}, ${esc(a.affiliationNo || '')}, ${esc(a.period || '')}, ${esc(a.govtRegNo || '')},
  ${esc(a.logo || '')}, ${i}, ${esc(i === 0 ? aff.note || '' : null)}
);`);
});
lines.push('');

// Testimonials
try {
  const t = readJSON('testimonials.json');
  const items = t.items || t.testimonials || [];
  lines.push('-- testimonials');
  items.forEach((item, i) => {
    lines.push(`INSERT INTO testimonials (name, location, course, quote, avatar, sort_order) VALUES (
    ${esc(item.name)}, ${esc(item.location || '')}, ${esc(item.course || '')},
    ${esc(item.quote)}, ${esc(item.avatar || '')}, ${i}
  );`);
  });
  lines.push(`INSERT INTO content_docs (key, data) VALUES ('testimonials-meta', ${j({ title: t.title, subtitle: t.subtitle })})
ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data;`);
  lines.push('');
} catch (e) {
  console.warn('testimonials', e.message);
}

// Guides
const guidesIndex = readJSON('guides/index.json');
lines.push('-- guides');
lines.push(`INSERT INTO guides_meta (id, title, subtitle, item_ids) VALUES (1, ${esc(guidesIndex.title)}, ${esc(guidesIndex.subtitle || '')}, ${j(guidesIndex.items || [])});`);
(guidesIndex.items || []).forEach((id, i) => {
  const g = readJSON(`guides/${id}.json`);
  lines.push(`INSERT INTO guides (id, title, meta_description, intro, sections, related_courses, related_guides, faqs, sort_order) VALUES (
  ${esc(g.id)}, ${esc(g.title)}, ${esc(g.metaDescription || '')}, ${esc(g.intro || '')},
  ${j(g.sections || [])}, ${j(g.relatedCourses || [])}, ${j(g.relatedGuides || [])}, ${j(g.faqs || [])}, ${i}
);`);
});
lines.push('');

lines.push('-- admin user');
lines.push(`INSERT INTO admin_users (email, password_hash, name) VALUES (
  'admin@spedics.local',
  '$2a$10$Ya5FdmsyiS2qBZGFq7TKV.JPmPDNjvAGr4pG2Aad7Z72Bs1aG1yFK',
  'SPEDICS Admin'
) ON CONFLICT (email) DO NOTHING;`);
lines.push('-- Default password: Admin@123 — change after first login');
lines.push('');

lines.push('COMMIT;');
lines.push('');

fs.writeFileSync(OUT, lines.join('\n'), 'utf8');
console.log(`Wrote ${OUT} (${lines.length} lines)`);
console.log(`Courses: ${allIds.length}, Gallery: ${(galleryIndex.items || []).length}`);
