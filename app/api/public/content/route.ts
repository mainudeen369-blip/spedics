import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

/** Public read APIs used by the website (no auth). */

function json(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'site';

  try {
    if (!process.env.DATABASE_URL) {
      return json({ source: 'unavailable', error: 'DATABASE_URL not configured' }, 503);
    }
    const sql = getDb();

    if (type === 'site') {
      const rows = await sql`SELECT data, theme FROM site_config WHERE id = 1`;
      return json({ source: 'db', ...(rows[0] || { data: {}, theme: {} }) });
    }

    if (type === 'gallery') {
      const meta = await sql`SELECT title, subtitle FROM gallery_meta WHERE id = 1`;
      const items = await sql`
        SELECT id, title, description, file_name AS file, image_url, category, sort_order
        FROM gallery_items WHERE is_published = TRUE ORDER BY sort_order ASC
      `;
      return json({
        source: 'db',
        title: meta[0]?.title || 'Our Gallery',
        subtitle: meta[0]?.subtitle || '',
        items
      });
    }

    if (type === 'courses') {
      const courses = await sql`SELECT * FROM courses WHERE is_published = TRUE ORDER BY sort_order ASC`;
      const categories = await sql`SELECT * FROM course_categories ORDER BY sort_order ASC`;
      return json({ source: 'db', courses, categories });
    }

    if (type === 'course') {
      const id = searchParams.get('id');
      if (!id) return json({ error: 'id required' }, 400);
      const rows = await sql`SELECT * FROM courses WHERE id = ${id} AND is_published = TRUE LIMIT 1`;
      if (!rows[0]) return json({ source: 'db', course: null }, 404);
      return json({ source: 'db', course: rows[0] });
    }

    if (type === 'faq') {
      const items = await sql`
        SELECT question, answer, answer_with_fees AS "answerWithFees"
        FROM faq_items WHERE is_published = TRUE ORDER BY sort_order ASC
      `;
      return json({ source: 'db', title: 'Frequently Asked Questions', items });
    }

    if (type === 'testimonials') {
      const items = await sql`
        SELECT id, name, location, course, quote, avatar
        FROM testimonials WHERE is_published = TRUE ORDER BY sort_order ASC
      `;
      return json({ source: 'db', items });
    }

    if (type === 'affiliations') {
      const meta = await sql`SELECT data FROM content_docs WHERE key = 'affiliations-meta'`;
      if (meta[0]?.data) {
        return json({ source: 'db', ...(meta[0].data as object) });
      }
      const rows = await sql`
        SELECT name, affiliation_no AS "affiliationNo", period, govt_reg_no AS "govtRegNo", logo
        FROM affiliations WHERE is_published = TRUE ORDER BY sort_order ASC
      `;
      return json({ source: 'db', title: 'Certification & Affiliation', affiliations: rows });
    }

    if (type === 'guides') {
      const meta = await sql`SELECT title, subtitle FROM guides_meta WHERE id = 1`;
      const items = await sql`
        SELECT id, title, meta_description AS "metaDescription", intro, sections, faqs,
               related_courses AS "relatedCourses", related_guides AS "relatedGuides", sort_order
        FROM guides WHERE is_published = TRUE ORDER BY sort_order ASC
      `;
      return json({
        source: 'db',
        title: meta[0]?.title || 'Guides',
        subtitle: meta[0]?.subtitle || '',
        items
      });
    }

    if (type === 'guide') {
      const id = searchParams.get('id');
      if (!id) return json({ error: 'id required' }, 400);
      const rows = await sql`
        SELECT id, title, meta_description AS "metaDescription", intro, sections, faqs,
               related_courses AS "relatedCourses", related_guides AS "relatedGuides"
        FROM guides WHERE id = ${id} AND is_published = TRUE LIMIT 1
      `;
      if (!rows[0]) return json({ source: 'db', guide: null }, 404);
      return json({ source: 'db', guide: rows[0] });
    }

    if (type === 'content') {
      const key = searchParams.get('key');
      if (!key) return json({ error: 'key required' }, 400);
      const rows = await sql`SELECT data FROM content_docs WHERE key = ${key}`;
      return json({ source: 'db', key, data: rows[0]?.data || {} });
    }

    return json({ error: 'Unknown type' }, 400);
  } catch (err) {
    return json({ source: 'error', error: String(err) }, 500);
  }
}
