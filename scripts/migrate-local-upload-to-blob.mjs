import fs from 'fs';
import { put } from '@vercel/blob';
import pg from 'pg';

function loadEnv(file) {
  if (!fs.existsSync(file)) return;
  const text = fs.readFileSync(file, 'utf8');
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m || process.env[m[1]]) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    v = v.replace(/\\n/g, '\n').replace(/\r/g, '');
    process.env[m[1]] = v;
  }
}

loadEnv('.env.local.clean');
loadEnv('.env.local');

const filePath = 'public/uploads/gallery/1787236480368-eb391650-90e7-4179-a001-677c0daf9233.jpeg';
const buf = fs.readFileSync(filePath);
const pathname = 'spedics/gallery/1787236480368-eb391650-90e7-4179-a001-677c0daf9233.jpeg';
const token = process.env.BLOB_READ_WRITE_TOKEN;
const storeId = (process.env.BLOB_STORE_ID || process.env.BLOB_READ_WRITE_TOKEN_STORE_ID || '').replace(/\r/g, '');

console.log('token?', Boolean(token), 'storeId', storeId);

const blob = await put(pathname, buf, {
  access: 'private',
  contentType: 'image/jpeg',
  token,
  storeId,
  allowOverwrite: true
});

const publicUrl = `/api/public/media?pathname=${encodeURIComponent(blob.pathname)}`;
console.log('blob', blob.pathname, '→', publicUrl);

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});
await client.connect();
const r = await client.query(
  `UPDATE gallery_items
   SET image_url = $1, file_name = $2, updated_at = NOW()
   WHERE image_url LIKE '%uploads/gallery/1787236480368%' OR id = 'test111111111'
   RETURNING id, title, image_url`,
  [publicUrl, 'eb391650-90e7-4179-a001-677c0daf9233.jpeg']
);
console.log('updated', r.rows);
await client.end();
console.log('DONE');
