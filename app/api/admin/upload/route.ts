import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { promises as fs } from 'fs';
import path from 'path';
import { requireAdmin } from '@/lib/auth';

export const runtime = 'nodejs';

const MAX_BYTES = 50 * 1024 * 1024; // 50 MB
const MAX_DATA_URL_BYTES = 900 * 1024;
const ALLOWED = new Set([
  'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml',
  'video/mp4', 'video/webm', 'video/quicktime'
]);

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

function blobAuthOptions() {
  const token = (process.env.BLOB_READ_WRITE_TOKEN || '').replace(/\r/g, '') || undefined;
  const storeId = (
    process.env.BLOB_STORE_ID ||
    process.env.BLOB_READ_WRITE_TOKEN_STORE_ID ||
    ''
  ).replace(/\r/g, '') || undefined;
  const oidcToken = (process.env.VERCEL_OIDC_TOKEN || '').replace(/\r/g, '') || undefined;
  const opts: { token?: string; storeId?: string; oidcToken?: string } = {};
  // Prefer static RW token (works in all environments); OIDC only if no token
  if (token) opts.token = token;
  if (storeId) opts.storeId = storeId;
  if (!token && oidcToken) opts.oidcToken = oidcToken;
  return opts;
}

function isBlobConfigured() {
  return Boolean(
    process.env.BLOB_READ_WRITE_TOKEN ||
      process.env.BLOB_STORE_ID ||
      process.env.BLOB_READ_WRITE_TOKEN_STORE_ID
  );
}

/** Store is Private (spedics-blob) — use private access + public media proxy URL for the website. */
const BLOB_ACCESS = 'private' as const;

export async function GET() {
  try {
    await requireAdmin();
    const blobConfigured = isBlobConfigured();
    return json({
      ok: true,
      blobConfigured,
      mode: blobConfigured
        ? 'blob-private'
        : process.env.VERCEL
          ? 'data-url-fallback'
          : 'local-folder-fallback',
      message: blobConfigured
        ? 'Uploads go to Vercel Blob (private store). Website loads them via /api/public/media.'
        : 'Blob store not linked. Using temporary fallback. Connect spedics-blob to this project (include Development) or add BLOB_READ_WRITE_TOKEN_STORE_ID.'
    });
  } catch (err) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return json({ error: 'Unauthorized' }, 401);
    }
    return json({ error: String(err) }, 500);
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();

    const form = await req.formData();
    const file = form.get('file');
    if (!(file instanceof File)) {
      return json({ error: 'file is required' }, 400);
    }
    if (file.size > MAX_BYTES) {
      return json({ error: 'File too large (max 50MB)' }, 400);
    }
    if (file.type && !ALLOWED.has(file.type)) {
      return json({ error: `Unsupported type: ${file.type}` }, 400);
    }

    const folder = String(form.get('folder') || 'gallery').replace(/[^a-z0-9-_]/gi, '');
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const kind = file.type.startsWith('video/') ? 'video' : 'image';

    if (isBlobConfigured()) {
      const pathname = `spedics/${folder}/${Date.now()}-${safeName}`;
      const blob = await put(pathname, file, {
        access: BLOB_ACCESS,
        contentType: file.type || undefined,
        ...blobAuthOptions()
      });
      // Public website cannot open private blob URLs directly — use our proxy
      const publicUrl = `/api/public/media?pathname=${encodeURIComponent(blob.pathname)}`;
      return json({
        ok: true,
        url: publicUrl,
        blobUrl: blob.url,
        pathname: blob.pathname,
        contentType: file.type,
        kind,
        fileName: file.name,
        size: file.size,
        storage: 'blob-private'
      });
    }

    if (!process.env.VERCEL) {
      const relDir = path.join('uploads', folder);
      const absDir = path.join(process.cwd(), 'public', relDir);
      await fs.mkdir(absDir, { recursive: true });
      const fileName = `${Date.now()}-${safeName}`;
      const absPath = path.join(absDir, fileName);
      const buf = Buffer.from(await file.arrayBuffer());
      await fs.writeFile(absPath, buf);
      const url = `/${relDir.replace(/\\/g, '/')}/${fileName}`;
      return json({
        ok: true,
        url,
        pathname: url,
        contentType: file.type,
        kind,
        fileName: file.name,
        size: file.size,
        storage: 'local',
        warning: 'Saved locally. Connect Blob store to Development for production-like uploads.'
      });
    }

    if (kind === 'image' && file.size <= MAX_DATA_URL_BYTES) {
      const buf = Buffer.from(await file.arrayBuffer());
      const url = `data:${file.type || 'image/jpeg'};base64,${buf.toString('base64')}`;
      return json({
        ok: true,
        url,
        pathname: '',
        contentType: file.type,
        kind,
        fileName: file.name,
        size: file.size,
        storage: 'data-url',
        warning: 'Blob env missing on this deployment — temporary data URL used.'
      });
    }

    return json(
      {
        error:
          'Blob store not ready on this environment. In Vercel Storage → spedics-blob → connect to project spedics and enable Production, Preview, and Development. Then Redeploy. Locally run: npx vercel env pull .env.local'
      },
      503
    );
  } catch (err) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return json({ error: 'Unauthorized' }, 401);
    }
    const msg = String(err);
    if (msg.includes('OIDC is enabled') && msg.includes('development')) {
      return json(
        {
          error:
            'Blob OIDC is not enabled for Development. In Vercel: Storage → spedics-blob → Projects → ⋯ (spedics) → Update Project Connection → enable Development + Preview + Production → Save. Then run: npx vercel env pull .env.local and restart npm run dev.'
        },
        503
      );
    }
    return json({ error: msg }, 500);
  }
}
