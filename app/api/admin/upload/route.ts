import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { promises as fs } from 'fs';
import path from 'path';
import { requireAdmin } from '@/lib/auth';
import {
  MEDIA_HINTS,
  mediaLimitsPublic,
  validateMediaFile
} from '@/lib/media-limits';

export const runtime = 'nodejs';

// Re-export constant used below — keep fallback small
const MAX_DATA_URL_BYTES = 900 * 1024;

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

const BLOB_ACCESS = 'private' as const;

export async function GET() {
  try {
    await requireAdmin();
    const blobConfigured = isBlobConfigured();
    return json({
      ok: true,
      blobConfigured,
      limits: mediaLimitsPublic,
      mode: blobConfigured
        ? 'blob-private'
        : process.env.VERCEL
          ? 'data-url-fallback'
          : 'local-folder-fallback',
      message: blobConfigured
        ? 'Uploads go to Vercel Blob (private store). Website loads them via /api/public/media.'
        : 'Blob store not linked. Using temporary fallback.',
      hint: MEDIA_HINTS.body
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

    const check = validateMediaFile(file);
    if (!check.ok) {
      return json({ error: check.error }, 400);
    }
    const kind = check.kind;

    const folder = String(form.get('folder') || 'gallery').replace(/[^a-z0-9-_]/gi, '');
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');

    if (isBlobConfigured()) {
      const pathname = `spedics/${folder}/${Date.now()}-${safeName}`;
      const blob = await put(pathname, file, {
        access: BLOB_ACCESS,
        contentType: file.type || undefined,
        ...blobAuthOptions()
      });
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
        storage: 'blob-private',
        limits: mediaLimitsPublic
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
        warning: 'Saved locally. Connect Blob for production uploads.',
        limits: mediaLimitsPublic
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
        warning: 'Blob env missing — temporary data URL used.',
        limits: mediaLimitsPublic
      });
    }

    return json(
      {
        error:
          'Blob store not ready. Connect spedics-blob for Production, Preview, and Development, then redeploy.'
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
            'Blob OIDC is not enabled for Development. Update Project Connection to include Development, then run vercel env pull.'
        },
        503
      );
    }
    return json({ error: msg }, 500);
  }
}
