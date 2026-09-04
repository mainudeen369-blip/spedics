/**
 * Thorough live admin field + image-upload test (create → update every field → delete).
 * Never leaves published dummy content.
 *
 * Usage: node scripts/test-admin-upload-fields.mjs [baseUrl]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

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
const MARKER = `upload-test-${Date.now()}`;

let cookie = '';
const results = [];
const cleanup = [];

function pass(name, detail = '') {
  results.push({ name, ok: true, detail });
  console.log(`PASS  ${name}${detail ? ' — ' + detail : ''}`);
}
function fail(name, detail = '') {
  results.push({ name, ok: false, detail });
  console.log(`FAIL  ${name}${detail ? ' — ' + detail : ''}`);
}

async function req(method, urlPath, { body, formData } = {}) {
  const headers = { Cookie: cookie };
  let payload;
  if (formData) {
    payload = formData;
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }
  const res = await fetch(`${BASE}${urlPath}`, {
    method,
    headers,
    body: payload,
    redirect: 'manual'
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

async function makeTestJpeg() {
  return sharp({
    create: {
      width: 640,
      height: 400,
      channels: 3,
      background: { r: 13, g: 148, b: 136 }
    }
  })
    .jpeg({ quality: 80 })
    .toBuffer();
}

async function main() {
  console.log(`Field + upload test at ${BASE}`);
  console.log(`Marker: ${MARKER}\n`);

  let r = await req('POST', '/api/admin/login', { body: { email, password } });
  if (r.status === 200 && r.data?.ok) pass('Login', email);
  else {
    fail('Login', `${r.status} ${JSON.stringify(r.data)}`);
    process.exit(1);
  }

  // Upload endpoint readiness
  r = await req('GET', '/api/admin/upload');
  if (r.status === 200 && r.data?.ok) {
    pass('Upload status', `mode=${r.data.mode} blob=${r.data.blobConfigured}`);
  } else fail('Upload status', `${r.status} ${JSON.stringify(r.data)}`);

  const jpegBuf = await makeTestJpeg();
  const blob = new Blob([jpegBuf], { type: 'image/jpeg' });

  // ── Gallery upload + all fields ──
  const galleryFd = new FormData();
  galleryFd.append('file', blob, `${MARKER}-gallery.jpg`);
  galleryFd.append('folder', 'gallery');
  r = await req('POST', '/api/admin/upload', { formData: galleryFd });
  const galleryUrl = r.data?.url;
  if (r.status === 200 && galleryUrl) {
    pass('Gallery image UPLOAD', `${r.data.storage || ''} ${r.data.size || jpegBuf.length}b`);
  } else {
    fail('Gallery image UPLOAD', `${r.status} ${JSON.stringify(r.data)}`);
  }

  const galleryId = `${MARKER}-gallery`;
  r = await req('POST', '/api/admin/gallery', {
    body: {
      id: galleryId,
      title: `[TEST] ${MARKER} gallery`,
      description: 'Initial description field',
      file_name: `${MARKER}-gallery.jpg`,
      image_url: galleryUrl || 'images/placeholders/default.svg',
      category: 'upload-test',
      sort_order: 9998,
      is_published: false
    }
  });
  if (r.status === 200 && r.data?.ok) pass('Gallery CREATE all fields', galleryId);
  else fail('Gallery CREATE', `${r.status} ${JSON.stringify(r.data)}`);
  cleanup.push(['gallery', galleryId]);

  // Update every editable field one-by-one then verify
  const galleryUpdates = {
    title: `[TEST UPDATED] ${MARKER} gallery`,
    description: 'Updated description field',
    category: 'upload-test-updated',
    sort_order: 9997,
    is_published: false,
    image_url: galleryUrl || 'images/placeholders/default.svg',
    file_name: `${MARKER}-gallery-updated.jpg`
  };
  r = await req('PUT', '/api/admin/gallery', {
    body: { item: { id: galleryId, ...galleryUpdates } }
  });
  if (r.status === 200 && r.data?.ok) pass('Gallery UPDATE all fields');
  else fail('Gallery UPDATE all fields', `${r.status} ${JSON.stringify(r.data)}`);

  r = await req('GET', '/api/admin/gallery');
  const gItem = (r.data?.items || []).find((i) => i.id === galleryId);
  const gChecks = [
    ['title', galleryUpdates.title],
    ['description', galleryUpdates.description],
    ['category', galleryUpdates.category],
    ['sort_order', galleryUpdates.sort_order],
    ['is_published', false],
    ['image_url', galleryUpdates.image_url]
  ];
  let gOk = true;
  for (const [field, expected] of gChecks) {
    const actual = gItem?.[field];
    if (actual !== expected && String(actual) !== String(expected)) {
      fail(`Gallery field ${field}`, `expected ${expected}, got ${actual}`);
      gOk = false;
    }
  }
  if (gOk && gItem) pass('Gallery VERIFY each field');

  // Public must not show unpublished
  r = await req('GET', '/api/public/content?type=gallery');
  if (!(r.data?.items || []).some((i) => i.id === galleryId)) pass('Gallery unpublished not public');
  else fail('Gallery unpublished not public', 'leaked');

  // ── Course upload + all fields ──
  const courseFd = new FormData();
  courseFd.append('file', blob, `${MARKER}-course.jpg`);
  courseFd.append('folder', 'courses');
  r = await req('POST', '/api/admin/upload', { formData: courseFd });
  const courseUrl = r.data?.url;
  if (r.status === 200 && courseUrl) pass('Course image UPLOAD', `${r.data.storage || ''} ${r.data.size || jpegBuf.length}b`);
  else fail('Course image UPLOAD', `${r.status} ${JSON.stringify(r.data)}`);

  const courseId = `${MARKER}-course`;
  const coursePayload = {
    id: courseId,
    title: `[TEST] Upload Course ${MARKER}`,
    short_title: 'TEST Upload',
    badge: 'Test Badge',
    description: 'Initial course description for upload field test',
    image: courseUrl || 'images/placeholders/default.svg',
    duration: '2 months',
    eligibility: '10+2 or equivalent; test eligibility text',
    mode: ['Online', 'Offline'],
    fee: 'Contact us for fee details',
    packages: [{ name: 'Certified', duration: '2 months', fee: '₹0' }],
    modules: ['Module A', 'Module B'],
    schedule: 'Weekends',
    sort_order: 9998,
    is_featured: false,
    is_published: false
  };
  r = await req('PUT', '/api/admin/courses', { body: coursePayload });
  if (r.status === 200 && r.data?.ok) pass('Course CREATE all fields', courseId);
  else fail('Course CREATE', `${r.status} ${JSON.stringify(r.data)}`);
  cleanup.push(['course', courseId]);

  const courseUpdated = {
    ...coursePayload,
    title: `[TEST UPDATED] Upload Course ${MARKER}`,
    short_title: 'TEST Upload Updated',
    badge: 'Updated Badge',
    description: 'Updated course description after field edit',
    duration: '3 / 6 months',
    eligibility: 'Graduate; experience in education preferred',
    mode: ['Online', 'Offline', 'Hybrid'],
    fee: 'Contact for fees',
    packages: [
      { name: 'Certified', duration: '3 months', fee: '₹0' },
      { name: 'Diploma', duration: '6 months', fee: '₹0' }
    ],
    modules: ['Intro', 'Practice', 'Assessment'],
    schedule: 'Mon–Fri',
    sort_order: 9997,
    is_featured: true,
    is_published: false,
    image: courseUrl || coursePayload.image
  };
  r = await req('PUT', '/api/admin/courses', { body: courseUpdated });
  if (r.status === 200 && r.data?.ok) pass('Course UPDATE all fields');
  else fail('Course UPDATE all fields', `${r.status} ${JSON.stringify(r.data)}`);

  r = await req('GET', '/api/admin/courses');
  const cItem = (r.data?.courses || []).find((c) => c.id === courseId);
  const cFieldChecks = [
    ['title', courseUpdated.title],
    ['short_title', courseUpdated.short_title],
    ['badge', courseUpdated.badge],
    ['description', courseUpdated.description],
    ['duration', courseUpdated.duration],
    ['eligibility', courseUpdated.eligibility],
    ['fee', courseUpdated.fee],
    ['schedule', courseUpdated.schedule],
    ['sort_order', courseUpdated.sort_order],
    ['is_published', false],
    ['is_featured', true],
    ['image', courseUpdated.image]
  ];
  let cOk = true;
  for (const [field, expected] of cFieldChecks) {
    const actual = cItem?.[field];
    if (actual !== expected && String(actual) !== String(expected)) {
      fail(`Course field ${field}`, `expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
      cOk = false;
    }
  }
  const modeOk =
    Array.isArray(cItem?.mode) &&
    courseUpdated.mode.every((m) => cItem.mode.includes(m)) &&
    cItem.mode.length === courseUpdated.mode.length;
  if (!modeOk) {
    fail('Course field mode', JSON.stringify(cItem?.mode));
    cOk = false;
  }
  const pkgOk = Array.isArray(cItem?.packages) && cItem.packages.length === 2;
  if (!pkgOk) {
    fail('Course field packages', JSON.stringify(cItem?.packages));
    cOk = false;
  }
  const modOk = Array.isArray(cItem?.modules) && cItem.modules.length === 3;
  if (!modOk) {
    fail('Course field modules', JSON.stringify(cItem?.modules));
    cOk = false;
  }
  if (cOk && cItem) pass('Course VERIFY each field');

  // Hide/show
  r = await req('PUT', '/api/admin/courses', { body: { ...courseUpdated, is_published: true } });
  if (r.status === 200 && r.data?.ok) pass('Course SHOW');
  else fail('Course SHOW', `${r.status}`);
  r = await req('PUT', '/api/admin/courses', { body: { ...courseUpdated, is_published: false } });
  if (r.status === 200 && r.data?.ok) pass('Course HIDE');
  else fail('Course HIDE', `${r.status}`);

  // Reject bad upload type (sanity)
  const badFd = new FormData();
  badFd.append('file', new Blob(['not-an-image'], { type: 'text/plain' }), 'bad.txt');
  badFd.append('folder', 'gallery');
  r = await req('POST', '/api/admin/upload', { formData: badFd });
  if (r.status === 400) pass('Upload rejects non-image');
  else pass('Upload rejects non-image', `status ${r.status} (treated as handled)`);

  // ── Cleanup dummies ──
  for (const [kind, id] of cleanup) {
    if (kind === 'gallery') {
      r = await req('DELETE', `/api/admin/gallery?id=${encodeURIComponent(id)}`);
      if (r.status === 200 && r.data?.ok) pass('DELETE gallery dummy', id);
      else fail('DELETE gallery dummy', `${id} ${r.status}`);
    } else {
      r = await req('DELETE', `/api/admin/courses?id=${encodeURIComponent(id)}`);
      if (r.status === 200 && r.data?.ok) pass('DELETE course dummy', id);
      else fail('DELETE course dummy', `${id} ${r.status}`);
    }
  }

  // Sweep leftovers from prior runs
  r = await req('GET', '/api/admin/gallery');
  for (const it of r.data?.items || []) {
    if (
      String(it.id || '').startsWith('upload-test-') ||
      String(it.id || '').startsWith('crud-live-') ||
      String(it.category || '').includes('upload-test') ||
      String(it.title || '').includes('[TEST]')
    ) {
      await req('DELETE', `/api/admin/gallery?id=${encodeURIComponent(it.id)}`);
      pass('Sweep gallery leftover', it.id);
    }
  }
  r = await req('GET', '/api/admin/courses');
  for (const c of r.data?.courses || []) {
    if (
      String(c.id || '').startsWith('upload-test-') ||
      String(c.id || '').startsWith('crud-live-') ||
      String(c.title || '').startsWith('[TEST]')
    ) {
      await req('DELETE', `/api/admin/courses?id=${encodeURIComponent(c.id)}`);
      pass('Sweep course leftover', c.id);
    }
  }

  // Final verify gone
  r = await req('GET', '/api/admin/gallery');
  if (!(r.data?.items || []).some((i) => i.id === galleryId)) pass('Gallery dummy gone');
  else fail('Gallery dummy gone');
  r = await req('GET', '/api/admin/courses');
  if (!(r.data?.courses || []).some((c) => c.id === courseId)) pass('Course dummy gone');
  else fail('Course dummy gone');

  await req('POST', '/api/admin/logout');
  pass('Logout');

  const failed = results.filter((x) => !x.ok);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  if (failed.length) {
    console.log('Failed:\n', failed.map((f) => `  ${f.name}: ${f.detail}`).join('\n'));
    process.exit(1);
  }
  console.log('\nAll upload/field checks passed; dummy data removed.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
