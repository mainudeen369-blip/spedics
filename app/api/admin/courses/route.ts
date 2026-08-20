import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET() {
  try {
    await requireAdmin();
    const sql = getDb();
    const courses = await sql`SELECT * FROM courses ORDER BY sort_order ASC`;
    const categories = await sql`SELECT * FROM course_categories ORDER BY sort_order ASC`;
    return NextResponse.json({ courses, categories });
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
    const c = await req.json();
    if (!c.id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const sql = getDb();
    await sql`
      INSERT INTO courses (
        id, title, short_title, badge, description, image, duration, eligibility,
        mode, fee, packages, modules, schedule, sort_order, is_featured, is_published, updated_at
      ) VALUES (
        ${c.id}, ${c.title}, ${c.short_title || ''}, ${c.badge || ''}, ${c.description || ''},
        ${c.image || ''}, ${c.duration || ''}, ${c.eligibility || ''},
        ${JSON.stringify(c.mode || [])}::jsonb, ${c.fee || ''},
        ${JSON.stringify(c.packages || [])}::jsonb, ${JSON.stringify(c.modules || [])}::jsonb,
        ${c.schedule || null}, ${Number(c.sort_order) || 0},
        ${c.is_featured !== false}, ${c.is_published !== false}, NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        short_title = EXCLUDED.short_title,
        badge = EXCLUDED.badge,
        description = EXCLUDED.description,
        image = EXCLUDED.image,
        duration = EXCLUDED.duration,
        eligibility = EXCLUDED.eligibility,
        mode = EXCLUDED.mode,
        fee = EXCLUDED.fee,
        packages = EXCLUDED.packages,
        modules = EXCLUDED.modules,
        schedule = EXCLUDED.schedule,
        sort_order = EXCLUDED.sort_order,
        is_featured = EXCLUDED.is_featured,
        is_published = EXCLUDED.is_published,
        updated_at = NOW()
    `;
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
    const id = new URL(req.url).searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const sql = getDb();
    await sql`DELETE FROM courses WHERE id = ${id}`;
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
