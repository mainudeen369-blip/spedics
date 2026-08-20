import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET() {
  try {
    await requireAdmin();
    const sql = getDb();
    const items = await sql`SELECT * FROM faq_items ORDER BY sort_order ASC`;
    return NextResponse.json({ items });
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

    if (Array.isArray(body.items)) {
      await sql`DELETE FROM faq_items`;
      for (let i = 0; i < body.items.length; i++) {
        const it = body.items[i];
        await sql`
          INSERT INTO faq_items (question, answer, answer_with_fees, sort_order, is_published)
          VALUES (${it.question}, ${it.answer}, ${it.answer_with_fees || null}, ${i}, ${it.is_published !== false})
        `;
      }
      return NextResponse.json({ ok: true });
    }

    const it = body;
    if (it.id) {
      await sql`
        UPDATE faq_items SET
          question = ${it.question},
          answer = ${it.answer},
          answer_with_fees = ${it.answer_with_fees || null},
          sort_order = ${Number(it.sort_order) || 0},
          is_published = ${it.is_published !== false},
          updated_at = NOW()
        WHERE id = ${it.id}
      `;
    } else {
      await sql`
        INSERT INTO faq_items (question, answer, answer_with_fees, sort_order)
        VALUES (${it.question}, ${it.answer}, ${it.answer_with_fees || null}, ${Number(it.sort_order) || 0})
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
    const id = new URL(req.url).searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const sql = getDb();
    await sql`DELETE FROM faq_items WHERE id = ${id}`;
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
