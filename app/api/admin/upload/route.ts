import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { promises as fs } from 'fs';
import path from 'path';
import { requireAdmin } from '@/lib/auth';

export const runtime = 'nodejs';

const MAX_BYTES = 50 * 1024 * 1024; // 50 MB
const MAX_DATA_URL_BYTES = 900 * 1024; // ~900KB fallback when Blob is not configured
const ALLOWED = new Set([
  'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml',
  'video/mp4', 'video/webm', 'video/quicktime'
]);

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export async function GET() {
  try {
    await requireAdmin();
    const blobConfigured = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
    return json({
      ok: true,
      blobConfigured,
      mode: blobConfigured ? 'blob' : (process.env.VERCEL ? 'data-url-fallback' : 'local-folder-fallback'),
      message: blobConfigured
        ? 'Uploads go to Vercel Blob.'
        : 'Blob token missing. Using temporary fallback (local folder or small data-URL). Add BLOB_READ_WRITE_TOKEN for production media storage.'
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
    const token = process.env.BLOB_READ_WRITE_TOKEN;

    // Preferred: Vercel Blob
    if (token) {
      const pathname = `spedics/${folder}/${Date.now()}-${safeName}`;
      const blob = await put(pathname, file, {
        access: 'public',
        token,
        contentType: file.type || undefined
      });
      return json({
        ok: true,
        url: blob.url,
        pathname: blob.pathname,
        contentType: file.type,
        kind,
        fileName: file.name,
        size: file.size,
        storage: 'blob'
      });
    }

    // Local/dev fallback: write under public/uploads (works with npm run dev)
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
        warning: 'Saved to local public/uploads. Add BLOB_READ_WRITE_TOKEN for Vercel production uploads.'
      });
    }

    // Production without Blob: small images as data URL so admin still works
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
        warning: 'Blob token missing — image stored temporarily as data URL. Create Vercel Blob and set BLOB_READ_WRITE_TOKEN for proper storage.'
      });
    }

    return json(
      {
        error:
          'Photo upload needs BLOB_READ_WRITE_TOKEN. In Vercel: Storage → Create Blob → copy token → Project Settings → Environment Variables → BLOB_READ_WRITE_TOKEN (Production + Preview), then Redeploy. For local: add the same line to .env.local and restart npm run dev. Videos and large images require Blob.'
      },
      503
    );
  } catch (err) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return json({ error: 'Unauthorized' }, 401);
    }
    return json({ error: String(err) }, 500);
  }
}
