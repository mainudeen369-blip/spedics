import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { MAX_GALLERY_ITEMS, RECOMMENDED_GALLERY_ITEMS, mediaLimitsPublic } from '@/lib/media-limits';

export async function GET() {
  try {
    await requireAdmin();
    const sql = getDb();
    const meta = await sql`SELECT title, subtitle FROM gallery_meta WHERE id = 1`;
    const items = await sql`
      SELECT id, title, description, file_name, image_url, category, sort_order, is_published, updated_at
      FROM gallery_items ORDER BY sort_order ASC, title ASC
    `;
    return NextResponse.json({
      meta: meta[0] || { title: 'Our Gallery', subtitle: '' },
      items,
      limits: mediaLimitsPublic,
      counts: {
        total: items.length,
        max: MAX_GALLERY_ITEMS,
        recommended: RECOMMENDED_GALLERY_ITEMS
      }
    });
  } catch (err) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();
    const sql = getDb();
    const id = String(body.id || '').trim();
    if (!id || !body.title) {
      return NextResponse.json({ error: 'id and title required' }, { status: 400 });
    }

    const existing = await sql`SELECT id FROM gallery_items WHERE id = ${id} LIMIT 1`;
    if (!existing[0]) {
      const countRows = await sql`SELECT COUNT(*)::int AS n FROM gallery_items`;
      const n = Number(countRows[0]?.n || 0);
      if (n >= MAX_GALLERY_ITEMS) {
        return NextResponse.json(
          {
            error: `Gallery limit reached (${MAX_GALLERY_ITEMS} items). Delete older items before adding more — too many media files slow the website.`
          },
          { status: 400 }
        );
      }
    }

    await sql`
      INSERT INTO gallery_items (id, title, description, file_name, image_url, category, sort_order, is_published, updated_at)
      VALUES (
        ${id}, ${body.title}, ${body.description || ''}, ${body.file_name || ''},
        ${body.image_url || ''}, ${body.category || ''}, ${Number(body.sort_order) || 0},
        ${body.is_published !== false}, NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        file_name = EXCLUDED.file_name,
        image_url = EXCLUDED.image_url,
        category = EXCLUDED.category,
        sort_order = EXCLUDED.sort_order,
        is_published = EXCLUDED.is_published,
        updated_at = NOW()
    `;
    return NextResponse.json({ ok: true, id, limits: mediaLimitsPublic });
  } catch (err) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();
    const sql = getDb();
    if (body.meta) {
      await sql`
        INSERT INTO gallery_meta (id, title, subtitle, updated_at)
        VALUES (1, ${body.meta.title || 'Our Gallery'}, ${body.meta.subtitle || ''}, NOW())
        ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, subtitle = EXCLUDED.subtitle, updated_at = NOW()
      `;
    }
    if (body.item) {
      const i = body.item;
      await sql`
        UPDATE gallery_items SET
          title = ${i.title},
          description = ${i.description || ''},
          file_name = ${i.file_name || ''},
          image_url = ${i.image_url || ''},
          category = ${i.category || ''},
          sort_order = ${Number(i.sort_order) || 0},
          is_published = ${i.is_published !== false},
          updated_at = NOW()
        WHERE id = ${i.id}
      `;
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const sql = getDb();
    await sql`DELETE FROM gallery_items WHERE id = ${id}`;
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
