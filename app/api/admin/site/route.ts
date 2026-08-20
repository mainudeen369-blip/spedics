import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET() {
  try {
    await requireAdmin();
    const sql = getDb();
    const rows = await sql`SELECT data, theme, updated_at FROM site_config WHERE id = 1`;
    return NextResponse.json(rows[0] || { data: {}, theme: {} });
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
    await sql`
      INSERT INTO site_config (id, data, theme, updated_at)
      VALUES (1, ${JSON.stringify(body.data || {})}::jsonb, ${JSON.stringify(body.theme || {})}::jsonb, NOW())
      ON CONFLICT (id) DO UPDATE SET
        data = COALESCE(${body.data != null ? JSON.stringify(body.data) : null}::jsonb, site_config.data),
        theme = COALESCE(${body.theme != null ? JSON.stringify(body.theme) : null}::jsonb, site_config.theme),
        updated_at = NOW()
    `;
    const rows = await sql`SELECT data, theme, updated_at FROM site_config WHERE id = 1`;
    return NextResponse.json(rows[0]);
  } catch (err) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
