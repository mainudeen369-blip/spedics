import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

/** Public read APIs used by the website (no auth). Falls back gracefully. */

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'site';

  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ source: 'unavailable', error: 'DATABASE_URL not configured' }, { status: 503 });
    }
    const sql = getDb();

    if (type === 'site') {
      const rows = await sql`SELECT data, theme FROM site_config WHERE id = 1`;
      return NextResponse.json({ source: 'db', ...(rows[0] || { data: {}, theme: {} }) });
    }

    if (type === 'gallery') {
      const meta = await sql`SELECT title, subtitle FROM gallery_meta WHERE id = 1`;
      const items = await sql`
        SELECT id, title, description, file_name AS file, image_url, category
        FROM gallery_items WHERE is_published = TRUE ORDER BY sort_order ASC
      `;
      return NextResponse.json({
        source: 'db',
        title: meta[0]?.title || 'Our Gallery',
        subtitle: meta[0]?.subtitle || '',
        items
      });
    }

    if (type === 'courses') {
      const courses = await sql`SELECT * FROM courses WHERE is_published = TRUE ORDER BY sort_order ASC`;
      const categories = await sql`SELECT * FROM course_categories ORDER BY sort_order ASC`;
      return NextResponse.json({ source: 'db', courses, categories });
    }

    if (type === 'faq') {
      const items = await sql`
        SELECT question, answer, answer_with_fees AS "answerWithFees"
        FROM faq_items WHERE is_published = TRUE ORDER BY sort_order ASC
      `;
      return NextResponse.json({ source: 'db', title: 'Frequently Asked Questions', items });
    }

    if (type === 'content') {
      const key = searchParams.get('key');
      if (!key) return NextResponse.json({ error: 'key required' }, { status: 400 });
      const rows = await sql`SELECT data FROM content_docs WHERE key = ${key}`;
      return NextResponse.json({ source: 'db', key, data: rows[0]?.data || {} });
    }

    return NextResponse.json({ error: 'Unknown type' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ source: 'error', error: String(err) }, { status: 500 });
  }
}
