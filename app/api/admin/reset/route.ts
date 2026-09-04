import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { applyReset, RESET_SCOPES, type ResetScope } from '@/lib/seed-from-files';

/** Keep in sync with AdminResetButton — blocks API even if UI is bypassed. */
const ADMIN_RESET_ENABLED = false;

export async function POST(req: Request) {
  try {
    await requireAdmin();

    if (!ADMIN_RESET_ENABLED) {
      return NextResponse.json(
        {
          error:
            'Reset is temporarily disabled to protect live website data. Contact the developer if a controlled restore is needed.'
        },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const scope = String(body.scope || '') as ResetScope;
    if (!scope) {
      return NextResponse.json(
        { error: 'scope required', allowed: [...RESET_SCOPES, 'content:<key>'] },
        { status: 400 }
      );
    }
    const known =
      RESET_SCOPES.includes(scope as (typeof RESET_SCOPES)[number]) || scope.startsWith('content:');
    if (!known) {
      return NextResponse.json(
        { error: `Unknown scope: ${scope}`, allowed: [...RESET_SCOPES, 'content:<key>'] },
        { status: 400 }
      );
    }

    const sql = getDb();
    const out = await applyReset(sql, scope);
    return NextResponse.json({
      ok: true,
      ...out,
      message: `Reset "${scope}" from public/data folder defaults`
    });
  } catch (err) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
