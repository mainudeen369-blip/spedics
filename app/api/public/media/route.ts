import { NextResponse } from 'next/server';
import { get } from '@vercel/blob';

export const runtime = 'nodejs';

/**
 * Streams private Vercel Blob files for the public website.
 * Gallery/admin store paths as /api/public/media?pathname=...
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const pathname = searchParams.get('pathname');
    if (!pathname || pathname.includes('..')) {
      return NextResponse.json({ error: 'pathname required' }, { status: 400 });
    }

    const token = process.env.BLOB_READ_WRITE_TOKEN;
    const storeId =
      process.env.BLOB_STORE_ID ||
      process.env.BLOB_READ_WRITE_TOKEN_STORE_ID;
    const oidcToken = process.env.VERCEL_OIDC_TOKEN;

    if (!token && !storeId) {
      return NextResponse.json({ error: 'Blob not configured' }, { status: 503 });
    }

    const result = await get(pathname, {
      access: 'private',
      ...(token ? { token } : {}),
      ...(storeId ? { storeId } : {}),
      ...(!token && oidcToken ? { oidcToken } : {})
    });

    if (!result || result.statusCode !== 200 || !result.stream) {
      return new NextResponse('Not found', { status: 404 });
    }

    const headers = new Headers();
    headers.set('Content-Type', result.blob.contentType || 'application/octet-stream');
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    headers.set('X-Content-Type-Options', 'nosniff');

    return new NextResponse(result.stream, { headers });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
