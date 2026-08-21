/**
 * Extra reset smoke test: node scripts/test-admin-reset.mjs [baseUrl]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

for (const name of ['.env.local', '.env']) {
  const p = path.join(ROOT, name);
  if (!fs.existsSync(p)) continue;
  for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m || process.env[m[1]]) continue;
    let v = m[2].trim().replace(/\r/g, '');
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    process.env[m[1]] = v;
  }
}

const BASE = process.argv[2] || 'http://localhost:3000';
const email = process.env.ADMIN_EMAIL || 'admin@spedics.local';
const password = process.env.ADMIN_PASSWORD || 'Admin@123';
let cookie = '';

async function req(method, urlPath, body) {
  const headers = { Cookie: cookie };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const res = await fetch(`${BASE}${urlPath}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined
  });
  const setCookie = res.headers.getSetCookie?.() || [];
  const raw = res.headers.get('set-cookie');
  if (setCookie.length) cookie = setCookie.map((c) => c.split(';')[0]).join('; ');
  else if (raw) cookie = raw.split(',').map((c) => c.split(';')[0].trim()).join('; ');
  const text = await res.text();
  let data = null;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  return { status: res.status, data };
}

const r0 = await req('POST', '/api/admin/login', { email, password });
if (r0.status !== 200 || !r0.data?.ok) {
  console.error('Login failed', r0);
  process.exit(1);
}
console.log('Login OK');

for (const scope of ['site', 'courses', 'gallery', 'content']) {
  const r = await req('POST', '/api/admin/reset', { scope });
  console.log(scope, r.status, r.data?.ok, r.data?.message || r.data?.error);
  if (!r.data?.ok) process.exit(1);
}

const site = await req('GET', '/api/admin/site');
const courses = await req('GET', '/api/admin/courses');
const gallery = await req('GET', '/api/admin/gallery');
console.log('theme primary', site.data?.theme?.primary);
console.log('courses', (courses.data?.courses || []).length);
console.log('gallery', (gallery.data?.items || []).length);
if (site.data?.theme?.primary !== '#0d9488') {
  console.error('Expected teal primary after site reset');
  process.exit(1);
}
if ((courses.data?.courses || []).length < 10) {
  console.error('Expected courses after reset');
  process.exit(1);
}
console.log('ALL EXTRA RESETS OK');
