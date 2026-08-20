import fs from 'fs';
import pg from 'pg';

function loadEnv(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
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

const imageUrl = 'data/gallery/test111111111/photo.jpeg';
const client = new pg.Client({
  connectionString: process.env.DATABASE_URL.replace(/\r/g, ''),
  ssl: { rejectUnauthorized: false }
});
await client.connect();
const r = await client.query(
  `UPDATE gallery_items
   SET image_url = $1, file_name = 'photo.jpeg', updated_at = NOW()
   WHERE id = 'test111111111' OR image_url LIKE '%1787236480368%'
   RETURNING id, title, image_url`,
  [imageUrl]
);
console.log(r.rows);
await client.end();
