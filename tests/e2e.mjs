// Field tour end to end against `vite preview`, with every Appwrite call mocked.
// Run: VITE_APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io/v1 VITE_APPWRITE_PROJECT_ID=test npm run build
//      && (npx vite preview --port 4174 &) && node tests/e2e.mjs [real-photo.png approved-sign.png]
import { chromium } from 'playwright';
import fs from 'node:fs';

const BASE = process.env.BASE ?? 'http://localhost:4174/SignAshdod-GH';
const SHOTS = new URL('./shots/', import.meta.url).pathname;
fs.mkdirSync(SHOTS, { recursive: true });
const AOA = process.env.AOA_PUBLIC ?? '/home/user/AppOfApp-GH/public';
const [photoPath, signPath] = process.argv.slice(2);
// a valid 2x2 PNG when no real image is given
const tiny = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFklEQVR4nGP8z8DAwMDAxMDAwMDAAAANHQEDasKb6QAAAABJRU5ErkJggg==', 'base64');
const photo = photoPath ? fs.readFileSync(photoPath) : tiny;
const signImg = signPath ? fs.readFileSync(signPath) : tiny;

let failures = 0;
const ok = (c, m) => {
  console.log(`${c ? 'PASS' : 'FAIL'}  ${m}`);
  if (!c) failures++;
};

const now = new Date().toISOString();
const row = (id, data) => ({ $id: id, $createdAt: now, $updatedAt: now, $permissions: [], ...data });
const requests = [
  row('r1', { request_type: 'project_sign', status: 'approved', site_address: 'שדרות הרצל 12, אשדוד', project_name: 'מגדלי הים', permit_number: '2024-118', developer_name: 'אחים כהן', sign_example_file: 'https://fra.cloud.appwrite.io/v1/storage/buckets/uploads/files/sign1/view?project=test' }),
  row('r2', { request_type: 'talking_fence', status: 'under_review', site_address: 'רחוב הנשיא 4, אשדוד', project_name: 'פינוי בינוי הנשיא', permit_number: '2025-031' }),
  row('r3', { request_type: 'project_sign', status: 'draft', site_address: 'טיוטה שלא אמורה להופיע' }),
];
const notes = [];

async function setup(context, calls, admin = true) {
  await context.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  await context.route(/appofapp-gh\.vercel\.app\/([\w.-]+\.(js|png))/, (r) => {
    const f = `${AOA}/${new URL(r.request().url()).pathname.slice(1)}`;
    return fs.existsSync(f) ? r.fulfill({ body: fs.readFileSync(f), contentType: f.endsWith('.js') ? 'text/javascript' : 'image/png', headers: { 'access-control-allow-origin': '*' } }) : r.fulfill({ status: 404, body: '' });
  });
  await context.route(/fra\.cloud\.appwrite\.io\/v1\/(.*)/, async (r) => {
    const req = r.request();
    const url = new URL(req.url());
    const path = url.pathname.replace('/v1', '');
    // Appwrite sends credentials, so CORS needs the exact origin, never '*'
    const cors = { 'access-control-allow-origin': new URL(BASE).origin, 'access-control-allow-credentials': 'true' };
    const json = (body, status = 200) => r.fulfill({ status, contentType: 'application/json', headers: cors, body: JSON.stringify(body) });
    if (req.method() === 'OPTIONS') return r.fulfill({ status: 204, headers: { ...cors, 'access-control-allow-headers': req.headers()['access-control-request-headers'] || '*', 'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE' } });
    if (path === '/account') return json({ $id: 'u1', email: 'pakach@ashdod.muni.il', name: 'פקח השילוט', labels: admin ? ['admin'] : [] });
    if (/\/storage\/buckets\/uploads\/files\/[^/]+\/view/.test(path)) return r.fulfill({ contentType: 'image/png', body: signImg });
    if (path === '/storage/buckets/uploads/files' && req.method() === 'POST') {
      calls.push({ action: 'upload', size: req.postDataBuffer()?.length ?? 0 });
      return json({ $id: 'photo1', bucketId: 'uploads', name: 'field.jpg', chunksTotal: 1, chunksUploaded: 1 });
    }
    const m = path.match(/^\/tablesdb\/signash\/tables\/(\w+)\/rows(?:\/(\w+))?$/);
    if (m) {
      const [, table, id] = m;
      const list = table === 'signage_requests' ? requests : notes;
      if (req.method() === 'POST') {
        const body = JSON.parse(req.postData() || '{}');
        const doc = row(`n${notes.length + 1}`, body.data);
        calls.push({ action: 'create', table, data: body.data, permissions: body.permissions });
        if (table === 'request_notes') notes.unshift(doc);
        return json(doc, 201);
      }
      if (id) {
        const doc = list.find((x) => x.$id === id);
        return doc ? json(doc) : json({ message: 'not found' }, 404);
      }
      const qs = url.searchParams.getAll('queries[]').join(' ');
      const rid = qs.match(/"request_id".*?\["(\w+)"\]/)?.[1];
      const rows = rid ? list.filter((x) => x.request_id === rid) : list;
      return json({ total: rows.length, rows });
    }
    return json({});
  });
}

const browser = await chromium.launch();

// ---------- computer: the dashboard hands the tour to the phone ----------
{
  const context = await browser.newContext({ viewport: { width: 1280, height: 860 } });
  const calls = [];
  await setup(context, calls);
  const page = await context.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  await page.goto(BASE + '/');
  await page.waitForSelector('.field-qr-code svg');
  ok(await page.locator('header nav a', { hasText: 'סיור שטח' }).isVisible(), 'desktop: the nav has the field tour for staff');
  ok((await page.locator('.field-qr').textContent()).includes('מצלמים את השלט'), 'desktop: the QR card says what it does');
  ok((await page.locator('ai-menu').getAttribute('brand')) === 'ashdod', 'desktop: a municipal app shows the Ashdod logo button');
  await page.waitForTimeout(300);
  await page.screenshot({ path: SHOTS + 'desktop-dashboard.png' });
  ok(errs.length === 0, `desktop: no page errors (${errs.join(' | ')})`);
  await context.close();
}

// ---------- phone: the tour itself ----------
{
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true,
    geolocation: { latitude: 31.80142, longitude: 34.64357, accuracy: 9 }, permissions: ['geolocation'],
  });
  const calls = [];
  await setup(context, calls);
  const page = await context.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  await page.goto(BASE + '/field');
  await page.waitForSelector('.field-site');
  ok((await page.locator('.field-site').count()) === 2, 'phone: drafts are left out of the tour');
  ok((await page.locator('.field-site').first().textContent()).includes('הרצל'), 'phone: approved sites come first');
  await page.locator('.field-search').fill('הנשיא');
  ok((await page.locator('.field-site').count()) === 1, 'phone: search narrows by street');
  await page.locator('.field-search').fill('');
  await page.screenshot({ path: SHOTS + 'phone-list.png' });
  await page.locator('.field-site').first().click();
  ok(await page.locator('img[alt="השלט שאושר"]').isVisible(), 'phone: the approved sign shows next to the camera');
  ok((await page.locator('.field-save').isDisabled()), 'phone: no save before a verdict');
  ok((await page.locator('input[type=file]').getAttribute('capture')) === 'environment', 'phone: opens the back camera');
  await page.locator('input[type=file]').setInputFiles({ name: 'site.png', mimeType: 'image/png', buffer: photo });
  await page.waitForSelector('img[alt="השלט שצולם באתר"]');
  await page.waitForSelector('.field-loc a');
  ok((await page.locator('.field-loc').textContent()).includes('דיוק 9'), 'phone: the location is taken with its accuracy');
  await page.locator('.field-verdict-btn', { hasText: 'שונה מהמאושר' }).click();
  await page.locator('textarea').fill('השלט קטן מהמאושר ומוסתר מאחורי הגדר');
  await page.waitForTimeout(400);
  await page.screenshot({ path: SHOTS + 'phone-check.png' });
  await page.locator('.field-save').click();
  await page.waitForSelector('.field-saved');
  const created = calls.find((c) => c.action === 'create' && c.table === 'request_notes');
  ok(calls.some((c) => c.action === 'upload'), 'phone: the photo is uploaded');
  ok(created?.data?.note_type === 'field_check' && created.data.request_id === 'r1', 'phone: saved on the request as a field check');
  ok(created?.data?.note_text.includes('בדיקת שטח: שונה מהמאושר') && created.data.note_text.includes('31.80142,34.64357') && created.data.note_text.includes('/files/photo1/view'), 'phone: verdict, place and photo are in the note');
  ok(!(created?.permissions ?? []).some((p) => p.includes('user:') && !p.includes('u1')), 'phone: the applicant is not given read access');
  ok((await page.locator('.field-saved').textContent()).includes('הרצל'), 'phone: the tour lists what was saved');
  ok(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1), 'phone: no horizontal scroll');
  await page.screenshot({ path: SHOTS + 'phone-saved.png' });

  // the request page shows the check with its photo and map link
  await page.goto(BASE + '/request/r1');
  await page.waitForSelector('.field-note');
  ok((await page.locator('.field-note .field-verdict').textContent()) === 'שונה מהמאושר', 'request: the field check shows its verdict');
  ok((await page.locator('.field-note a[href*="google.com/maps"]').count()) === 1, 'request: the check links to the map');
  ok(errs.length === 0, `phone: no page errors (${errs.join(' | ')})`);
  await context.close();
}

// ---------- an applicant does not get the tour ----------
{
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await setup(context, [], false);
  const page = await context.newPage();
  await page.goto(BASE + '/field');
  await page.waitForSelector('main h1');
  ok((await page.locator('main h1').textContent()).includes('לצוות העירייה'), 'applicant: the tour explains it is for staff');
  ok((await page.locator('.field-qr').count()) === 0, 'applicant: no QR card');
  await context.close();
}

await browser.close();
console.log(failures ? `\n${failures} FAILED` : '\nALL PASSED');
process.exit(failures ? 1 : 0);
