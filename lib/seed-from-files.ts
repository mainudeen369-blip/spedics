import fs from 'fs';
import path from 'path';
import { DEFAULT_TEAL_THEME } from '@/lib/default-theme';

/** Neon tagged-template client (avoid tight generic coupling). */
type Sql = (strings: TemplateStringsArray, ...values: any[]) => Promise<any>;

const CONTENT_FILES: Array<[string, string]> = [
  ['about', 'about.json'],
  ['admissions', 'admissions.json'],
  ['fees', 'fees.json'],
  ['learning-modes', 'learning-modes.json'],
  ['careers', 'careers.json'],
  ['affiliations-meta', 'affiliations.json'],
  ['certificates-index', 'certificates/index.json']
];

export type ResetScope =
  | 'site'
  | 'faq'
  | 'courses'
  | 'gallery'
  | 'content'
  | 'testimonials'
  | 'affiliations'
  | 'guides'
  | 'all'
  | `content:${string}`;

function dataRoot() {
  return path.join(process.cwd(), 'public', 'data');
}

export function readDataJSON<T = unknown>(rel: string): T {
  const full = path.join(dataRoot(), rel);
  return JSON.parse(fs.readFileSync(full, 'utf8')) as T;
}

async function upsertContentDoc(sql: Sql, key: string, data: unknown) {
  await sql`
    INSERT INTO content_docs (key, data, updated_at)
    VALUES (${key}, ${JSON.stringify(data ?? {})}::jsonb, NOW())
    ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()
  `;
}

export async function resetSite(sql: Sql) {
  const site = readDataJSON('site.json');
  await sql`
    INSERT INTO site_config (id, data, theme, updated_at)
    VALUES (1, ${JSON.stringify(site)}::jsonb, ${JSON.stringify(DEFAULT_TEAL_THEME)}::jsonb, NOW())
    ON CONFLICT (id) DO UPDATE SET
      data = EXCLUDED.data,
      theme = EXCLUDED.theme,
      updated_at = NOW()
  `;
  return { site: true, theme: 'teal' };
}

export async function resetContentDoc(sql: Sql, key: string) {
  const entry = CONTENT_FILES.find(([k]) => k === key);
  if (!entry) {
    throw new Error(`Unknown content key: ${key}. Known: ${CONTENT_FILES.map(([k]) => k).join(', ')}`);
  }
  const data = readDataJSON(entry[1]);
  await upsertContentDoc(sql, key, data);
  if (key === 'affiliations-meta') {
    await resetAffiliationsTable(sql, data as { affiliations?: Array<Record<string, string>>; note?: string });
  }
  return { key };
}

export async function resetAllContentDocs(sql: Sql) {
  const keys: string[] = [];
  for (const [key, file] of CONTENT_FILES) {
    try {
      const data = readDataJSON(file);
      await upsertContentDoc(sql, key, data);
      keys.push(key);
    } catch {
      // optional files (e.g. certificates) may be missing
    }
  }
  try {
    const aff = readDataJSON<{ affiliations?: Array<Record<string, string>>; note?: string }>('affiliations.json');
    await resetAffiliationsTable(sql, aff);
  } catch {
    /* ignore */
  }
  return { keys };
}

async function resetAffiliationsTable(
  sql: Sql,
  aff: { affiliations?: Array<Record<string, string>>; note?: string }
) {
  await sql`DELETE FROM affiliations`;
  const list = aff.affiliations || [];
  for (let i = 0; i < list.length; i++) {
    const a = list[i];
    await sql`
      INSERT INTO affiliations (name, affiliation_no, period, govt_reg_no, logo, sort_order, note)
      VALUES (
        ${a.name || ''}, ${a.affiliationNo || ''}, ${a.period || ''}, ${a.govtRegNo || ''},
        ${a.logo || ''}, ${i}, ${i === 0 ? aff.note || null : null}
      )
    `;
  }
}

export async function resetFaq(sql: Sql) {
  const faq = readDataJSON<{ title?: string; items?: Array<Record<string, string>> }>('faq.json');
  await sql`DELETE FROM faq_items`;
  const items = faq.items || [];
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    await sql`
      INSERT INTO faq_items (question, answer, answer_with_fees, sort_order, is_published)
      VALUES (${it.question || ''}, ${it.answer || ''}, ${it.answerWithFees || null}, ${i}, TRUE)
    `;
  }
  await upsertContentDoc(sql, 'faq-meta', { title: faq.title || 'FAQ' });
  return { count: items.length };
}

export async function resetCourses(sql: Sql) {
  const index = readDataJSON<{
    featured?: string[];
    categories?: Array<{ id: string; name: string; courses: string[] }>;
  }>('courses/courses-index.json');
  const featured = index.featured || [];
  const allIds = [
    ...new Set([...(featured || []), ...(index.categories || []).flatMap((c) => c.courses || [])])
  ];

  await sql`DELETE FROM course_categories`;
  await sql`DELETE FROM courses`;

  for (let i = 0; i < allIds.length; i++) {
    const id = allIds[i];
    const c = readDataJSON<Record<string, unknown>>(`courses/${id}.json`);
    await sql`
      INSERT INTO courses (
        id, title, short_title, badge, description, image, duration, eligibility,
        mode, fee, packages, modules, schedule, sort_order, is_featured, is_published, updated_at
      ) VALUES (
        ${String(c.id || id)}, ${String(c.title || '')}, ${String(c.shortTitle || '')},
        ${String(c.badge || '')}, ${String(c.description || '')}, ${String(c.image || '')},
        ${String(c.duration || '')}, ${String(c.eligibility || '')},
        ${JSON.stringify(c.mode || [])}::jsonb, ${String(c.fee || '')},
        ${JSON.stringify(c.packages || [])}::jsonb, ${JSON.stringify(c.modules || [])}::jsonb,
        ${c.schedule != null ? String(c.schedule) : null}, ${i},
        ${featured.includes(id)}, TRUE, NOW()
      )
    `;
  }

  for (let i = 0; i < (index.categories || []).length; i++) {
    const cat = index.categories![i];
    await sql`
      INSERT INTO course_categories (id, name, sort_order, course_ids)
      VALUES (${cat.id}, ${cat.name}, ${i}, ${JSON.stringify(cat.courses || [])}::jsonb)
    `;
  }
  await upsertContentDoc(sql, 'courses-index', index);
  return { courses: allIds.length, categories: (index.categories || []).length };
}

export async function resetGallery(sql: Sql) {
  const galleryIndex = readDataJSON<{ title?: string; subtitle?: string; items?: string[] }>(
    'gallery/index.json'
  );
  await sql`DELETE FROM gallery_items`;
  await sql`
    INSERT INTO gallery_meta (id, title, subtitle, updated_at)
    VALUES (1, ${galleryIndex.title || 'Our Gallery'}, ${galleryIndex.subtitle || ''}, NOW())
    ON CONFLICT (id) DO UPDATE SET
      title = EXCLUDED.title,
      subtitle = EXCLUDED.subtitle,
      updated_at = NOW()
  `;
  const folders = galleryIndex.items || [];
  for (let i = 0; i < folders.length; i++) {
    const folder = folders[i];
    const g = readDataJSON<Record<string, string>>(`gallery/${folder}/data.json`);
    const file = g.file || g.image || 'photo.jpeg';
    const imageUrl = `data/gallery/${folder}/${file}`;
    await sql`
      INSERT INTO gallery_items (id, title, description, file_name, image_url, category, sort_order, is_published, updated_at)
      VALUES (
        ${g.id || folder}, ${g.title || folder}, ${g.description || ''}, ${file},
        ${imageUrl}, ${g.category || ''}, ${i}, TRUE, NOW()
      )
    `;
  }
  return { count: folders.length };
}

export async function resetTestimonials(sql: Sql) {
  const t = readDataJSON<{
    title?: string;
    subtitle?: string;
    items?: Array<Record<string, string>>;
    testimonials?: Array<Record<string, string>>;
  }>('testimonials.json');
  await sql`DELETE FROM testimonials`;
  const items = t.items || t.testimonials || [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    await sql`
      INSERT INTO testimonials (name, location, course, quote, avatar, sort_order)
      VALUES (
        ${item.name || ''}, ${item.location || ''}, ${item.course || ''},
        ${item.quote || ''}, ${item.avatar || ''}, ${i}
      )
    `;
  }
  await upsertContentDoc(sql, 'testimonials-meta', { title: t.title, subtitle: t.subtitle });
  return { count: items.length };
}

export async function resetGuides(sql: Sql) {
  const guidesIndex = readDataJSON<{ title?: string; subtitle?: string; items?: string[] }>(
    'guides/index.json'
  );
  await sql`DELETE FROM guides`;
  await sql`
    INSERT INTO guides_meta (id, title, subtitle, item_ids, updated_at)
    VALUES (
      1,
      ${guidesIndex.title || 'Guides'},
      ${guidesIndex.subtitle || ''},
      ${JSON.stringify(guidesIndex.items || [])}::jsonb,
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      title = EXCLUDED.title,
      subtitle = EXCLUDED.subtitle,
      item_ids = EXCLUDED.item_ids,
      updated_at = NOW()
  `;
  const ids = guidesIndex.items || [];
  for (let i = 0; i < ids.length; i++) {
    const id = ids[i];
    const g = readDataJSON<Record<string, unknown>>(`guides/${id}.json`);
    await sql`
      INSERT INTO guides (
        id, title, meta_description, intro, sections, related_courses, related_guides, faqs, sort_order
      ) VALUES (
        ${String(g.id || id)}, ${String(g.title || '')}, ${String(g.metaDescription || '')},
        ${String(g.intro || '')}, ${JSON.stringify(g.sections || [])}::jsonb,
        ${JSON.stringify(g.relatedCourses || [])}::jsonb,
        ${JSON.stringify(g.relatedGuides || [])}::jsonb,
        ${JSON.stringify(g.faqs || [])}::jsonb, ${i}
      )
    `;
  }
  return { count: ids.length };
}

export async function resetAffiliations(sql: Sql) {
  const aff = readDataJSON<{
    title?: string;
    subtitle?: string;
    note?: string;
    affiliations?: Array<Record<string, string>>;
  }>('affiliations.json');
  await upsertContentDoc(sql, 'affiliations-meta', aff);
  await resetAffiliationsTable(sql, aff);
  return { count: (aff.affiliations || []).length };
}

export async function applyReset(sql: Sql, scope: ResetScope) {
  if (scope === 'site') return { scope, result: await resetSite(sql) };
  if (scope === 'faq') return { scope, result: await resetFaq(sql) };
  if (scope === 'courses') return { scope, result: await resetCourses(sql) };
  if (scope === 'gallery') return { scope, result: await resetGallery(sql) };
  if (scope === 'content') return { scope, result: await resetAllContentDocs(sql) };
  if (scope === 'testimonials') return { scope, result: await resetTestimonials(sql) };
  if (scope === 'affiliations') return { scope, result: await resetAffiliations(sql) };
  if (scope === 'guides') return { scope, result: await resetGuides(sql) };
  if (scope.startsWith('content:')) {
    const key = scope.slice('content:'.length);
    return { scope, result: await resetContentDoc(sql, key) };
  }
  if (scope === 'all') {
    const result = {
      site: await resetSite(sql),
      content: await resetAllContentDocs(sql),
      courses: await resetCourses(sql),
      faq: await resetFaq(sql),
      gallery: await resetGallery(sql),
      testimonials: await resetTestimonials(sql),
      guides: await resetGuides(sql)
    };
    return { scope, result };
  }
  throw new Error(`Unknown reset scope: ${scope}`);
}

export const RESET_SCOPES = [
  'site',
  'faq',
  'courses',
  'gallery',
  'content',
  'testimonials',
  'affiliations',
  'guides',
  'all'
] as const;
