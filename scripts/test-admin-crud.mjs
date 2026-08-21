/**
 * Smoke-test admin CRUD against local Next.js + Neon
 * Usage: node scripts/test-admin-crud.mjs [baseUrl]
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
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    process.env[m[1]] = v;
  }
}

const BASE = process.argv[2] || 'http://localhost:3000';
const email = process.env.ADMIN_EMAIL || 'admin@spedics.local';
const password = process.env.ADMIN_PASSWORD || 'Admin@123';

let cookie = '';
const results = [];

function pass(name, detail = '') {
  results.push({ name, ok: true, detail });
  console.log(`PASS  ${name}${detail ? ' — ' + detail : ''}`);
}
function fail(name, detail = '') {
  results.push({ name, ok: false, detail });
  console.log(`FAIL  ${name}${detail ? ' — ' + detail : ''}`);
}

async function req(method, urlPath, body) {
  const headers = { Cookie: cookie };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const res = await fetch(`${BASE}${urlPath}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    redirect: 'manual'
  });
  const setCookie = res.headers.getSetCookie?.() || [];
  const raw = res.headers.get('set-cookie');
  if (setCookie.length) {
    cookie = setCookie.map((c) => c.split(';')[0]).join('; ');
  } else if (raw) {
    cookie = raw.split(',').map((c) => c.split(';')[0].trim()).join('; ');
  }
  let data = null;
  const text = await res.text();
  try { data = JSON.parse(text); } catch { data = text; }
  return { status: res.status, data };
}

async function main() {
  console.log(`Testing admin CRUD at ${BASE}\n`);

  // 1) Login
  let r = await req('POST', '/api/admin/login', { email, password });
  if (r.status === 200 && r.data?.ok) pass('Login', email);
  else fail('Login', `${r.status} ${JSON.stringify(r.data)}`);

  // 2) Me
  r = await req('GET', '/api/admin/me');
  if (r.status === 200 && r.data?.authenticated) pass('Session /me', r.data.email);
  else fail('Session /me', `${r.status} ${JSON.stringify(r.data)}`);

  // 3) Site GET
  r = await req('GET', '/api/admin/site');
  if (r.status === 200 && r.data?.data) pass('Site GET', r.data.data.shortName || 'ok');
  else fail('Site GET', `${r.status} ${JSON.stringify(r.data)}`);

  // 4) Site PUT (theme tweak then restore)
  const prevTheme = r.data?.theme || {};
  const prevData = r.data?.data || {};
  r = await req('PUT', '/api/admin/site', {
    data: { ...prevData, tagline: prevData.tagline || 'test' },
    theme: { ...prevTheme, primary: prevTheme.primary || '#1d4ed8' }
  });
  if (r.status === 200 && r.data?.data) pass('Site PUT');
  else fail('Site PUT', `${r.status} ${JSON.stringify(r.data)}`);

  // 5) Gallery GET
  r = await req('GET', '/api/admin/gallery');
  if (r.status === 200 && Array.isArray(r.data?.items)) pass('Gallery GET', `${r.data.items.length} items`);
  else fail('Gallery GET', `${r.status} ${JSON.stringify(r.data)}`);

  // 6) Gallery CREATE
  const testId = `crud-test-${Date.now()}`;
  r = await req('POST', '/api/admin/gallery', {
    id: testId,
    title: 'CRUD Test Item',
    description: 'Temporary test',
    image_url: 'images/placeholders/default.svg',
    category: 'test',
    sort_order: 99,
    is_published: false
  });
  if (r.status === 200 && r.data?.ok) pass('Gallery CREATE', testId);
  else fail('Gallery CREATE', `${r.status} ${JSON.stringify(r.data)}`);

  // 7) Gallery UPDATE
  r = await req('PUT', '/api/admin/gallery', {
    item: {
      id: testId,
      title: 'CRUD Test Item Updated',
      description: 'Updated',
      image_url: 'images/placeholders/default.svg',
      category: 'test',
      sort_order: 99,
      is_published: false
    }
  });
  if (r.status === 200 && r.data?.ok) pass('Gallery UPDATE');
  else fail('Gallery UPDATE', `${r.status} ${JSON.stringify(r.data)}`);

  // 8) Gallery DELETE
  r = await req('DELETE', `/api/admin/gallery?id=${encodeURIComponent(testId)}`);
  if (r.status === 200 && r.data?.ok) pass('Gallery DELETE');
  else fail('Gallery DELETE', `${r.status} ${JSON.stringify(r.data)}`);

  // 9) Courses GET
  r = await req('GET', '/api/admin/courses');
  const courses = r.data?.courses || [];
  if (r.status === 200 && courses.length) pass('Courses GET', `${courses.length} courses`);
  else fail('Courses GET', `${r.status} ${JSON.stringify(r.data)}`);

  // 10) Courses PUT (update first course badge then restore)
  if (courses[0]) {
    const c = courses[0];
    const originalBadge = c.badge;
    r = await req('PUT', '/api/admin/courses', { ...c, badge: originalBadge });
    if (r.status === 200 && r.data?.ok) pass('Courses UPDATE', c.id);
    else fail('Courses UPDATE', `${r.status} ${JSON.stringify(r.data)}`);
  } else {
    fail('Courses UPDATE', 'no courses');
  }

  // 11) FAQ GET
  r = await req('GET', '/api/admin/faq');
  const faqItems = r.data?.items || [];
  if (r.status === 200 && Array.isArray(faqItems)) pass('FAQ GET', `${faqItems.length} items`);
  else fail('FAQ GET', `${r.status} ${JSON.stringify(r.data)}`);

  // 12) FAQ PUT round-trip
  r = await req('PUT', '/api/admin/faq', { items: faqItems });
  if (r.status === 200 && r.data?.ok) pass('FAQ PUT round-trip');
  else fail('FAQ PUT round-trip', `${r.status} ${JSON.stringify(r.data)}`);

  // 13) Content GET/PUT
  r = await req('GET', '/api/admin/content?key=admissions');
  if (r.status === 200 && r.data?.data) pass('Content GET admissions');
  else fail('Content GET admissions', `${r.status} ${JSON.stringify(r.data)}`);

  const admissionsBefore = r.data.data;
  const patched = {
    ...admissionsBefore,
    title: admissionsBefore.title || 'Admission Process',
    courseFee: admissionsBefore.courseFee || ''
  };
  r = await req('PUT', '/api/admin/content', { key: 'admissions', data: patched });
  if (r.status === 200 && r.data?.ok) pass('Content PUT admissions (form-shaped)');
  else fail('Content PUT admissions (form-shaped)', `${r.status} ${JSON.stringify(r.data)}`);

  // 13b) Reset scoped content from public/data
  r = await req('POST', '/api/admin/reset', { scope: 'content:admissions' });
  if (r.status === 200 && r.data?.ok) pass('Reset content:admissions');
  else fail('Reset content:admissions', `${r.status} ${JSON.stringify(r.data)}`);

  r = await req('GET', '/api/admin/content?key=admissions');
  if (r.status === 200 && r.data?.data?.title) pass('Admissions after reset', r.data.data.title);
  else fail('Admissions after reset', `${r.status} ${JSON.stringify(r.data)}`);

  // 13c) Reset FAQ round-trip (restore folder defaults)
  r = await req('POST', '/api/admin/reset', { scope: 'faq' });
  if (r.status === 200 && r.data?.ok) pass('Reset faq', `count=${r.data?.result?.count}`);
  else fail('Reset faq', `${r.status} ${JSON.stringify(r.data)}`);

  // 14) Public API
  r = await req('GET', '/api/public/content?type=gallery');
  if (r.status === 200 && r.data?.source === 'db') pass('Public gallery API', `${(r.data.items || []).length} published`);
  else fail('Public gallery API', `${r.status} ${JSON.stringify(r.data)}`);

  r = await req('GET', '/api/public/content?type=site');
  if (r.status === 200 && r.data?.source === 'db') pass('Public site API');
  else fail('Public site API', `${r.status} ${JSON.stringify(r.data)}`);

  // 15) Logout
  r = await req('POST', '/api/admin/logout');
  if (r.status === 200) pass('Logout');
  else fail('Logout', `${r.status}`);

  r = await req('GET', '/api/admin/me');
  if (r.status === 401) pass('Session cleared after logout');
  else fail('Session cleared after logout', `${r.status}`);

  const failed = results.filter((x) => !x.ok);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  if (failed.length) {
    console.log('Failed:', failed.map((f) => f.name).join(', '));
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
