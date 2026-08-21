import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    await requireAdmin();
    const key = new URL(req.url).searchParams.get('key');
    const sql = getDb();
    if (key) {
      const rows = await sql`SELECT key, data, updated_at FROM content_docs WHERE key = ${key}`;
      return NextResponse.json(rows[0] || { key, data: {} });
    }
    const rows = await sql`SELECT key, data, updated_at FROM content_docs ORDER BY key`;
    return NextResponse.json({ docs: rows });
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
    if (!body.key) return NextResponse.json({ error: 'key required' }, { status: 400 });
    const sql = getDb();
    const data = body.data || {};
    await sql`
      INSERT INTO content_docs (key, data, updated_at)
      VALUES (${body.key}, ${JSON.stringify(data)}::jsonb, NOW())
      ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()
    `;

    // Keep affiliations table in sync when editing affiliations form
    if (body.key === 'affiliations-meta' && Array.isArray(data.affiliations)) {
      await sql`DELETE FROM affiliations`;
      for (let i = 0; i < data.affiliations.length; i++) {
        const a = data.affiliations[i] || {};
        await sql`
          INSERT INTO affiliations (name, affiliation_no, period, govt_reg_no, logo, sort_order, note)
          VALUES (
            ${a.name || ''}, ${a.affiliationNo || ''}, ${a.period || ''}, ${a.govtRegNo || ''},
            ${a.logo || ''}, ${i}, ${i === 0 ? data.note || null : null}
          )
        `;
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
