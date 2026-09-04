import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

function slugifyId(raw: string) {
  return String(raw || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

async function rewriteCourseIdRefs(sql: ReturnType<typeof getDb>, fromId: string, toId: string) {
  const cats = await sql`SELECT id, course_ids FROM course_categories`;
  for (const cat of cats) {
    const ids = Array.isArray(cat.course_ids) ? [...cat.course_ids] : [];
    let changed = false;
    const next = ids.map((cid: string) => {
      if (cid === fromId) {
        changed = true;
        return toId;
      }
      return cid;
    });
    if (changed) {
      await sql`
        UPDATE course_categories
        SET course_ids = ${JSON.stringify(next)}::jsonb
        WHERE id = ${cat.id}
      `;
    }
  }

  const docs = await sql`SELECT key, data FROM content_docs WHERE key = 'courses-index'`;
  if (docs[0]?.data) {
    const data = typeof docs[0].data === 'string' ? JSON.parse(docs[0].data) : { ...docs[0].data };
    let touched = false;
    if (Array.isArray(data.featured)) {
      data.featured = data.featured.map((cid: string) => {
        if (cid === fromId) {
          touched = true;
          return toId;
        }
        return cid;
      });
    }
    if (Array.isArray(data.categories)) {
      data.categories = data.categories.map((cat: { courses?: string[] }) => {
        if (!Array.isArray(cat.courses)) return cat;
        return {
          ...cat,
          courses: cat.courses.map((cid) => {
            if (cid === fromId) {
              touched = true;
              return toId;
            }
            return cid;
          })
        };
      });
    }
    if (touched) {
      await sql`
        UPDATE content_docs
        SET data = ${JSON.stringify(data)}::jsonb, updated_at = NOW()
        WHERE key = 'courses-index'
      `;
    }
  }
}

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
    const id = slugifyId(c.id);
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    if (!String(c.title || '').trim()) {
      return NextResponse.json({ error: 'title required' }, { status: 400 });
    }

    const previousId = slugifyId(c.previousId || c.renameFrom || '');
    const sql = getDb();

    // Rename: change primary key + rewrite category / index references
    if (previousId && previousId !== id) {
      const existing = await sql`SELECT id FROM courses WHERE id = ${previousId} LIMIT 1`;
      if (!existing[0]) {
        return NextResponse.json({ error: `Course “${previousId}” not found` }, { status: 404 });
      }
      const clash = await sql`SELECT id FROM courses WHERE id = ${id} LIMIT 1`;
      if (clash[0]) {
        return NextResponse.json(
          { error: `Another course already uses id “${id}”. Choose a different name/slug.` },
          { status: 409 }
        );
      }

      await sql`
        UPDATE courses SET
          id = ${id},
          title = ${c.title},
          short_title = ${c.short_title || ''},
          badge = ${c.badge || ''},
          description = ${c.description || ''},
          image = ${c.image || ''},
          duration = ${c.duration || ''},
          eligibility = ${c.eligibility || ''},
          mode = ${JSON.stringify(c.mode || [])}::jsonb,
          fee = ${c.fee || ''},
          packages = ${JSON.stringify(c.packages || [])}::jsonb,
          modules = ${JSON.stringify(c.modules || [])}::jsonb,
          schedule = ${c.schedule || null},
          sort_order = ${Number(c.sort_order) || 0},
          is_featured = ${c.is_featured !== false},
          is_published = ${c.is_published !== false},
          updated_at = NOW()
        WHERE id = ${previousId}
      `;
      await rewriteCourseIdRefs(sql, previousId, id);
      return NextResponse.json({ ok: true, renamed: true, from: previousId, id });
    }

    await sql`
      INSERT INTO courses (
        id, title, short_title, badge, description, image, duration, eligibility,
        mode, fee, packages, modules, schedule, sort_order, is_featured, is_published, updated_at
      ) VALUES (
        ${id}, ${c.title}, ${c.short_title || ''}, ${c.badge || ''}, ${c.description || ''},
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
    return NextResponse.json({ ok: true, id });
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
