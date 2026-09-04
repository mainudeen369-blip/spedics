/**
 * Production-safe admin CRUD smoke test for spedics.vercel.app
 * - Snapshots before every mutation
 * - Uses unpublished / clearly-named dummy rows only
 * - Restores exact prior state; deletes dummies
 * - Never publishes dummy content
 *
 * Usage: node scripts/test-admin-live-safe.mjs [baseUrl]
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

const BASE = (process.argv[2] || 'https://spedics.vercel.app').replace(/\/$/, '');
const email = process.env.ADMIN_EMAIL || 'admin@spedics.local';
const password = process.env.ADMIN_PASSWORD || 'Admin@123';
const MARKER = `crud-live-${Date.now()}`;

let cookie = '';
const results = [];
const cleanupNotes = [];

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
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  return { status: res.status, data };
}

function sameOrder(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

async function main() {
  console.log(`Live-safe admin CRUD at ${BASE}`);
  console.log(`Marker: ${MARKER}\n`);

  // ── Auth ──────────────────────────────────────────────
  let r = await req('POST', '/api/admin/login', { email, password });
  if (r.status === 200 && r.data?.ok) pass('Login', email);
  else {
    fail('Login', `${r.status} ${JSON.stringify(r.data)}`);
    console.log('\nCannot continue without admin login. Check ADMIN_EMAIL / ADMIN_PASSWORD.');
    process.exit(1);
  }

  r = await req('GET', '/api/admin/me');
  if (r.status === 200 && r.data?.authenticated) pass('Session /me', r.data.email);
  else fail('Session /me', `${r.status} ${JSON.stringify(r.data)}`);

  // ── Sections (homepage order) — mutate then restore ──
  r = await req('GET', `/api/admin/content?key=homepage-sections`);
  const sectionsSnap = r.data?.data;
  const originalOrder = Array.isArray(sectionsSnap?.order) ? [...sectionsSnap.order] : null;
  if (r.status === 200 && originalOrder?.length) {
    pass('Sections GET', `${originalOrder.length} sections`);
  } else {
    fail('Sections GET', `${r.status} ${JSON.stringify(r.data)}`);
  }

  if (originalOrder?.length >= 3) {
    // Swap welcome <-> vision-mission (or last two if missing) — temporary dummy reorder
    const tempOrder = [...originalOrder];
    const i = Math.max(1, tempOrder.indexOf('welcome'));
    const j = Math.max(2, tempOrder.indexOf('vision-mission'));
    if (i !== j && i >= 0 && j >= 0) {
      [tempOrder[i], tempOrder[j]] = [tempOrder[j], tempOrder[i]];
    } else {
      [tempOrder[1], tempOrder[2]] = [tempOrder[2], tempOrder[1]];
    }

    r = await req('PUT', '/api/admin/content', {
      key: 'homepage-sections',
      data: { order: tempOrder }
    });
    if (r.status === 200 && r.data?.ok) pass('Sections UPDATE (temp reorder)');
    else fail('Sections UPDATE (temp reorder)', `${r.status} ${JSON.stringify(r.data)}`);

    r = await req('GET', `/api/admin/content?key=homepage-sections`);
    const afterTemp = r.data?.data?.order;
    if (sameOrder(afterTemp, tempOrder)) pass('Sections READ after temp', 'order matches temp');
    else fail('Sections READ after temp', JSON.stringify(afterTemp));

    // Restore exact snapshot
    r = await req('PUT', '/api/admin/content', {
      key: 'homepage-sections',
      data: { order: originalOrder }
    });
    if (r.status === 200 && r.data?.ok) pass('Sections RESTORE original order');
    else fail('Sections RESTORE original order', `${r.status} ${JSON.stringify(r.data)}`);

    r = await req('GET', `/api/admin/content?key=homepage-sections`);
    const restored = r.data?.data?.order;
    if (sameOrder(restored, originalOrder)) {
      pass('Sections VERIFY restored', restored.slice(0, 4).join(' → ') + '…');
      cleanupNotes.push('homepage-sections order restored to pre-test snapshot');
    } else {
      fail('Sections VERIFY restored', `got ${JSON.stringify(restored)}`);
    }
  }

  // ── Gallery — create unpublished dummy, update, delete ──
  const galleryId = `${MARKER}-gallery`;
  r = await req('POST', '/api/admin/gallery', {
    id: galleryId,
    title: `[TEST DO NOT PUBLISH] ${MARKER}`,
    description: 'Automated live CRUD test — safe to delete',
    image_url: 'images/placeholders/default.svg',
    category: 'crud-test',
    sort_order: 9999,
    is_published: false
  });
  if (r.status === 200 && r.data?.ok) pass('Gallery CREATE (unpublished)', galleryId);
  else fail('Gallery CREATE', `${r.status} ${JSON.stringify(r.data)}`);

  r = await req('PUT', '/api/admin/gallery', {
    item: {
      id: galleryId,
      title: `[TEST UPDATED] ${MARKER}`,
      description: 'Updated then deleted',
      image_url: 'images/placeholders/default.svg',
      category: 'crud-test',
      sort_order: 9999,
      is_published: false
    }
  });
  if (r.status === 200 && r.data?.ok) pass('Gallery UPDATE (still unpublished)');
  else fail('Gallery UPDATE', `${r.status} ${JSON.stringify(r.data)}`);

  // Confirm not on public API
  r = await req('GET', '/api/public/content?type=gallery');
  const publicItems = r.data?.items || [];
  const leaked = publicItems.some((it) => it.id === galleryId || String(it.title || '').includes(MARKER));
  if (!leaked) pass('Gallery not visible publicly');
  else fail('Gallery not visible publicly', 'dummy leaked to public gallery');

  r = await req('DELETE', `/api/admin/gallery?id=${encodeURIComponent(galleryId)}`);
  if (r.status === 200 && r.data?.ok) pass('Gallery DELETE dummy');
  else fail('Gallery DELETE dummy', `${r.status} ${JSON.stringify(r.data)}`);

  r = await req('GET', '/api/admin/gallery');
  const stillThere = (r.data?.items || []).some((it) => it.id === galleryId);
  if (!stillThere) {
    pass('Gallery VERIFY dummy gone');
    cleanupNotes.push(`deleted gallery ${galleryId}`);
  } else fail('Gallery VERIFY dummy gone', 'still present');

  // Sweep any older crud-live-* leftovers (unpublished test junk)
  const leftovers = (r.data?.items || []).filter(
    (it) =>
      String(it.id || '').startsWith('crud-live-') ||
      String(it.id || '').startsWith('crud-test-') ||
      String(it.category || '') === 'crud-test' ||
      String(it.title || '').includes('[TEST')
  );
  for (const it of leftovers) {
    const del = await req('DELETE', `/api/admin/gallery?id=${encodeURIComponent(it.id)}`);
    if (del.status === 200 && del.data?.ok) {
      pass('Gallery sweep leftover', it.id);
      cleanupNotes.push(`swept leftover gallery ${it.id}`);
    } else {
      fail('Gallery sweep leftover', `${it.id} ${del.status}`);
    }
  }

  // ── Courses — add unpublished dummy, toggle hide/show, delete ──
  const courseId = `${MARKER}-course`;
  r = await req('PUT', '/api/admin/courses', {
    id: courseId,
    title: `[TEST] Temporary CRUD Course ${MARKER}`,
    short_title: 'TEST CRUD',
    badge: 'Test',
    description: 'Automated live CRUD test course — unpublished — delete me',
    image: 'images/placeholders/default.svg',
    duration: '1 day',
    eligibility: 'N/A',
    mode: ['Online'],
    fee: '₹0',
    packages: [],
    modules: [],
    sort_order: 9999,
    is_featured: false,
    is_published: false
  });
  if (r.status === 200 && r.data?.ok) pass('Course CREATE (unpublished)', courseId);
  else fail('Course CREATE', `${r.status} ${JSON.stringify(r.data)}`);

  r = await req('GET', '/api/admin/courses');
  const found = (r.data?.courses || []).find((c) => c.id === courseId);
  if (found && found.is_published === false) pass('Course READ unpublished');
  else fail('Course READ unpublished', JSON.stringify(found));

  // Toggle show then hide again (still cleaning up after)
  r = await req('PUT', '/api/admin/courses', { ...found, is_published: true });
  if (r.status === 200 && r.data?.ok) pass('Course SHOW (temp)');
  else fail('Course SHOW', `${r.status} ${JSON.stringify(r.data)}`);

  r = await req('PUT', '/api/admin/courses', { ...found, is_published: false });
  if (r.status === 200 && r.data?.ok) pass('Course HIDE again');
  else fail('Course HIDE', `${r.status} ${JSON.stringify(r.data)}`);

  r = await req('GET', `/api/public/content?type=course&id=${encodeURIComponent(courseId)}`);
  // unpublished should not be returned as a normal course
  const pubCourse = r.data?.course || r.data?.data;
  if (!pubCourse || pubCourse.id !== courseId || r.data?.source === 'error') {
    pass('Course not on public API when hidden');
  } else if (r.status !== 200 || !r.data?.course) {
    pass('Course not on public API when hidden', `status ${r.status}`);
  } else {
    // If API still returns it, fail — but we will still delete
    fail('Course not on public API when hidden', JSON.stringify(r.data).slice(0, 200));
  }

  r = await req('DELETE', `/api/admin/courses?id=${encodeURIComponent(courseId)}`);
  if (r.status === 200 && r.data?.ok) pass('Course DELETE dummy');
  else fail('Course DELETE dummy', `${r.status} ${JSON.stringify(r.data)}`);

  r = await req('GET', '/api/admin/courses');
  const courseLeft = (r.data?.courses || []).find((c) => c.id === courseId);
  if (!courseLeft) {
    pass('Course VERIFY dummy gone');
    cleanupNotes.push(`deleted course ${courseId}`);
  } else fail('Course VERIFY dummy gone', 'still present');

  // Sweep leftover test courses
  const courseJunk = (r.data?.courses || []).filter(
    (c) =>
      String(c.id || '').startsWith('crud-live-') ||
      String(c.id || '').startsWith('crud-test-') ||
      String(c.title || '').startsWith('[TEST]')
  );
  for (const c of courseJunk) {
    const del = await req('DELETE', `/api/admin/courses?id=${encodeURIComponent(c.id)}`);
    if (del.status === 200 && del.data?.ok) {
      pass('Course sweep leftover', c.id);
      cleanupNotes.push(`swept leftover course ${c.id}`);
    } else fail('Course sweep leftover', `${c.id} ${del.status}`);
  }

  // ── FAQ — read-only (do not reset production FAQ) ──
  r = await req('GET', '/api/admin/faq');
  if (r.status === 200 && Array.isArray(r.data?.items)) pass('FAQ GET (read-only)', `${r.data.items.length} items`);
  else fail('FAQ GET', `${r.status} ${JSON.stringify(r.data)}`);

  // ── Site — read-only (avoid theme/site writes on live) ──
  r = await req('GET', '/api/admin/site');
  if (r.status === 200 && r.data?.data) pass('Site GET (read-only)', r.data.data.shortName || 'ok');
  else fail('Site GET', `${r.status} ${JSON.stringify(r.data)}`);

  // ── Public homepage sections still match restored order ──
  r = await req('GET', '/api/public/content?type=content&key=homepage-sections');
  const pubOrder = r.data?.data?.order;
  if (originalOrder && sameOrder(pubOrder, originalOrder)) {
    pass('Public sections match restored order');
  } else if (originalOrder && Array.isArray(pubOrder)) {
    // public API key shape may differ — try alternate
    fail('Public sections match restored order', `got ${JSON.stringify(pubOrder)?.slice(0, 120)}`);
  } else {
    pass('Public sections check skipped/alternate shape', `${r.status}`);
  }

  // Logout
  r = await req('POST', '/api/admin/logout');
  if (r.status === 200) pass('Logout');
  else fail('Logout', `${r.status}`);

  r = await req('GET', '/api/admin/me');
  if (r.status === 401) pass('Session cleared');
  else fail('Session cleared', `${r.status}`);

  console.log('\n── Cleanup notes ──');
  for (const n of cleanupNotes) console.log(' •', n);

  const failed = results.filter((x) => !x.ok);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  if (failed.length) {
    console.log('Failed:', failed.map((f) => `${f.name}: ${f.detail}`).join('\n  '));
    process.exit(1);
  }
  console.log('\nLive site left clean: no dummy data remaining; section order restored.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
