import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { createSession, verifyPassword } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    const sql = getDb();
    const rows = await sql`SELECT email, password_hash FROM admin_users WHERE email = ${email} LIMIT 1`;

    let ok = false;
    if (rows[0]) {
      ok = await verifyPassword(password, rows[0].password_hash as string);
    } else if (
      email === (process.env.ADMIN_EMAIL || 'admin@spedics.local') &&
      password === (process.env.ADMIN_PASSWORD || 'Admin@123')
    ) {
      ok = true;
    }

    if (!ok) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    await createSession(email);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Login failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
