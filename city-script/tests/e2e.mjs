// בדיקת קצה לקצה: כל דף, כל כפתור מרכזי, עם מוקים ל-Supabase ול-Nominatim.
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const BASE = process.env.BASE || 'http://localhost:4173'
const OUT = process.env.OUT || 'test-results'
mkdirSync(OUT, { recursive: true })
const SB = 'https://cbhexpybdggwzyakgagd.supabase.co'

const quarters = [
  { id: 'q-a', name: "רובע א'", polygon: [[34.6322, 31.8017], [34.6482, 31.8017], [34.6482, 31.8147], [34.6322, 31.8147], [34.6322, 31.8017]] },
  { id: 'q-city', name: 'הקריה (הסיטי)', polygon: [[34.6175, 31.8017], [34.6335, 31.8017], [34.6335, 31.8147], [34.6175, 31.8147], [34.6175, 31.8017]] },
]
const routes = [{ id: 'r8', slug: 'route-8', title: 'חוף הים — מהמצודה ועד הנמל', description: 'מסלול חוף', theme: 'חוף' }]
const buildings = [
  { id: 'b1', name: 'מצודת אשדוד ים', lat: 31.7803, lng: 34.6217, protection_level: 'א' },
  { id: 'b2', name: 'המרינה', lat: 31.797, lng: 34.632, protection_level: 'ב' },
  { id: 'b3', name: 'מרכז רובעי א׳', lat: 31.80798, lng: 34.64525, protection_level: 'א' },
]
const sites = [{ route_id: 'r8', building_id: 'b1', position: 1, narrative_text: 'המצודה' }, { route_id: 'r8', building_id: 'b2', position: 2, narrative_text: 'המרינה' }]
const app = { id: 'a1', tracking_code: 'KS-TEST01', applicant_name: 'דנה', business_name: 'קפה הים', address: 'שבי ציון 12', category_slug: 'business', status: 'התקבלה', license_valid_until: null, check_result: { overall: 'review', items: [{ section: '2.1.6', text: 'סף תחתון', status: 'pass' }] }, created_at: new Date().toISOString() }

const PNG = 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAKCAIAAAAy3EnLAAAAF0lEQVR4nGOsWLCPgRTARJLqUQ2DRgMAlOUB6kRTKmQAAAAASUVORK5CYII='
const errors = []
const requests = []
const json = (route, body, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })

async function setup(page, { staff = false, schema = false, isStaff = staff } = {}) {
  page.on('pageerror', (e) => errors.push(`${page.url()} :: ${e.message}`))
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|net::|ERR_|tiles|style|AJAXError|openfreemap|unpkg|fonts/i.test(m.text())) errors.push(`${page.url()} :: console ${m.text()}`) })
  await page.route('https://nominatim.openstreetmap.org/**', (r) => r.request().url().includes('/reverse')
    ? json(r, { display_name: 'הרצל 5, רובע א, אשדוד', address: { road: 'הרצל', house_number: '5', suburb: "רובע א'" } })
    : json(r, [{ display_name: 'שבי ציון 12, רובע א, אשדוד, ישראל', lat: '31.808', lon: '34.645' }]))
  await page.route('https://tiles.openfreemap.org/**', (r) => r.abort())
  await page.route('https://unpkg.com/**', (r) => r.abort())
  await page.route(`${SB}/**`, async (route) => {
    const req = route.request()
    const url = new URL(req.url())
    const p = url.pathname
    requests.push(`${req.method()} ${p}${url.search}`)
    if (p.startsWith('/auth/v1/user')) return json(route, { id: 'u1', email: 'shtanat5@gmail.com', aud: 'authenticated', role: 'authenticated' })
    if (p.startsWith('/auth/v1/otp')) return json(route, {})
    if (p.startsWith('/auth/v1/verify')) {
      const body = req.postDataJSON?.() || {}
      if (body.token_hash !== 'goodhash') return json(route, { code: 403, error_code: 'otp_expired', msg: 'Email link is invalid or has expired' }, 403)
      return json(route, { access_token: 'x.eyJleHAiOjk5OTk5OTk5OTl9.x', token_type: 'bearer', expires_in: 3600, expires_at: 9999999999, refresh_token: 'r2', user: { id: 'u1', email: 'shtanat5@gmail.com', aud: 'authenticated', role: 'authenticated' } })
    }
    if (p.startsWith('/auth/v1/logout')) return route.fulfill({ status: 204 })
    if (p === '/rest/v1/rpc/is_staff') return json(route, isStaff)
    if (p === '/rest/v1/rpc/ks_submit_application') return json(route, 'KS-ABC123')
    if (p === '/rest/v1/rpc/ks_track_application') return json(route, [{ ...app, category: 'שלט בית עסק', last_decision: null, updated_at: app.created_at }])
    if (p === '/rest/v1/rpc/ks_track_by_phone') return json(route, [
      { tracking_code: 'KS-TEST01', category: 'שלט בית עסק', business_name: 'קפה הים', address: 'שבי ציון 12', status: 'התקבלה', created_at: app.created_at },
      { tracking_code: 'KS-TEST02', category: 'שלט אלקטרוני', business_name: 'מרכז הים', address: 'הרצל 5', status: 'אושרה', created_at: app.created_at }])
    if (p === '/rest/v1/rpc/ks_save_site_request') return json(route, { code: 'KS-SITE01', token: 't' })
    if (p.startsWith('/storage/v1/object/')) return json(route, { Key: p.replace('/storage/v1/object/', ''), Id: 'f1' })
    const table = p.replace('/rest/v1/', '')
    if (table === 'quarters') return json(route, quarters)
    if (table === 'shimur_routes') return json(route, routes)
    if (table === 'shimur_route_sites') return json(route, sites)
    if (table === 'shimur_buildings') return json(route, buildings)
    if (table.startsWith('ks_')) {
      if (!schema) return json(route, { code: 'PGRST205', message: `Could not find the table 'public.${table}'` }, 404)
      if (req.method() === 'GET') {
        if (table === 'ks_categories') return json(route, [{ slug: 'business', name: 'שלט בית עסק', section: '2.2.3', landscape: 'port', summary: 'שלט עסק', default_validity_months: null, sort: 1 }])
        if (table === 'ks_rules') return json(route, [{ id: 'r1', category_slug: 'business', kind: 'question', section: '2.1.6', text: 'סף תחתון 2.5 מ\'', expect: true, on_fail: 'fail', sort: 0 }])
        if (table === 'ks_applications') return json(route, [app])
        if (table === 'ks_reports') return json(route, [{ id: 'p1', lat: 31.8, lng: 34.64, description: 'שלט מתפרק', status: 'חדש', created_at: app.created_at }])
        return json(route, [])
      }
      const body = req.postDataJSON?.() || {}
      if (req.method() === 'PATCH') return json(route, { ...app, ...body })
      return json(route, { id: 'n1', ...body, created_at: new Date().toISOString() }, 201)
    }
    return json(route, [])
  })
  if (staff) {
    await page.addInitScript(() => {
      const exp = Math.floor(Date.now() / 1000) + 3600
      localStorage.setItem('ktav-hair-auth', JSON.stringify({ access_token: 'x.eyJleHAiOjk5OTk5OTk5OTl9.x', token_type: 'bearer', expires_in: 3600, expires_at: exp, refresh_token: 'r', user: { id: 'u1', email: 'shtanat5@gmail.com', aud: 'authenticated', role: 'authenticated' } }))
    })
  }
}

let currentPage = null
const step = async (name, fn) => {
  try { await fn(); console.log('ok  ', name) } catch (e) { errors.push(`${name} :: ${e.message.split('\n').slice(0,3).join(' | ')}`); console.log('FAIL', name, e.message.split('\n')[0]); if (currentPage) await currentPage.screenshot({ path: `${OUT}/FAIL-${name.replace(/\W+/g,'_')}.png`, fullPage: true }).catch(()=>{}) }
}

import { execSync } from 'node:child_process'
execSync(`node tests/make-fixtures.mjs ${OUT}/fixtures`)
const FIX = `${OUT}/fixtures`
const browser = await chromium.launch()
for (const vp of [{ name: 'desktop', width: 1366, height: 900 }, { name: 'mobile', width: 390, height: 844 }]) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, locale: 'he-IL' })
  const page = await ctx.newPage()
  currentPage = page
  await setup(page)
  const noHScroll = async (label) => {
    const w = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth])
    if (w[0] > w[1] + 1) throw new Error(`${label}: גלילה אופקית ${w[0]} > ${w[1]}`)
  }
  const nav = async (label) => {
    if (vp.name === 'mobile') { await page.getByRole('button', { name: 'תפריט' }).click() }
    await page.locator('.nav-links').getByRole('link', { name: label, exact: true }).click()
  }

  await step(`${vp.name} home`, async () => {
    await page.goto(BASE + '/')
    await page.getByRole('heading', { name: /עיר אפורה/ }).waitFor()
    await page.screenshot({ path: `${OUT}/${vp.name}-home.png`, fullPage: true })
    await noHScroll('home')
    await page.getByRole('link', { name: 'כתב העיר, לדף הבית' }).click()
    if (vp.name === 'mobile') await page.getByRole('button', { name: 'תפריט' }).click()
    await page.getByRole('button', { name: 'מערכת' }).click()
    await page.getByRole('menuitem', { name: /העתקת קישור/ }).click()
    await page.locator('.toast').waitFor()
    if (vp.name === 'mobile') await page.getByRole('button', { name: 'סגירה' }).click()
  })

  await step(`${vp.name} check wizard`, async () => {
    await nav('בדיקת התאמה')
    await page.getByLabel('כתובת באשדוד').fill('שבי ציון 12')
    await page.getByRole('button', { name: 'איתור' }).click()
    await page.getByRole('button', { name: 'המשך לבחירת סוג השלט' }).click()
    await page.getByRole('button', { name: /שלט בית עסק/ }).click()
    const yes = page.locator('.rules .yesno').locator('button', { hasText: /^כן$/ })
    const n = await yes.count()
    if (n < 5) throw new Error('מעט מדי שאלות: ' + n)
    for (let i = 0; i < n; i++) await yes.nth(i).click()
    await page.locator('.rules .yesno').first().getByRole('button', { name: 'לא', exact: true }).click()
    await page.getByRole('button', { name: 'לתוצאה' }).click()
    await page.getByRole('heading', { name: /במתכונת הזאת השלט אינו תואם/ }).waitFor()
    await page.getByRole('button', { name: 'שינוי תשובות' }).click()
    await page.locator('.rules .yesno').first().getByRole('button', { name: 'כן', exact: true }).click()
    await page.getByRole('button', { name: 'לתוצאה' }).click()
    await page.screenshot({ path: `${OUT}/${vp.name}-check-result.png`, fullPage: true })
    await noHScroll('check result')
    await page.getByRole('button', { name: 'המשך להגשה' }).click()
    await page.getByLabel('טעינת מסמך בקשה').setInputFiles(`${FIX}/form.docx`)
    await page.locator('.docimp-status.ready').waitFor({ timeout: 30000 })
    await page.getByRole('button', { name: 'מלא', exact: true }).click()
    if (await page.getByLabel('טלפון נייד').inputValue() !== '050-1234567') throw new Error('"מלא" לא מילא את הטלפון מהמסמך')
    if (await page.getByLabel('כתובת השלט').inputValue() !== 'שבי ציון 12, אשדוד') throw new Error('"מלא" לא מילא את הכתובת')
    await page.getByLabel('שם המבקש').fill('דנה לוי')
    await page.getByLabel('שטח השלט (מ"ר)').fill('3.5')
    await Promise.all([page.waitForResponse((r) => r.url().includes('rpc/ks_submit_application')), page.getByRole('button', { name: 'שליחת הבקשה' }).click()])
    await page.getByText('KS-ABC123').first().waitFor()
    if (!requests.some((r) => r.includes('rpc/ks_submit_application'))) throw new Error('לא נשלחה בקשת הגשה')
    if (!requests.some((r) => r.startsWith('POST /storage/v1/object/ks-docs/incoming/'))) throw new Error('המסמך לא נשמר עם הבקשה')
    await page.getByRole('link', { name: 'מעקב אחר הבקשה' }).click()
    await page.getByText('KS-TEST01').first().waitFor()
  })

  await step(`${vp.name} construction`, async () => {
    await nav('אתרי בנייה')
    await page.getByLabel('שם הפרויקט').fill('מגדלי החוף')
    await page.getByLabel('מספר היתר בנייה').fill('2025-0412')
    await page.getByLabel('שם היזם').fill('אפיק נדל"ן')
    await page.getByLabel('העלאת הדמיית ההיתר').setInputFiles({ name: 'render.png', mimeType: 'image/png', buffer: Buffer.from(PNG, 'base64') })
    await page.locator('.ps-render-box img').waitFor()
    if (await page.getByLabel('אורך הגדר הכולל (מ\')').count()) throw new Error('טבלת הגדר מוצגת לפני שסומן שיש גדר')
    await page.locator('label.switch').click()
    await page.getByLabel('אורך הגדר הכולל (מ\')').fill('120')
    await page.getByLabel('תוכן חלק היזם').fill('הדמיות הפרויקט')
    await page.getByLabel('מספר כניסות לאתר').fill('2')
    await page.locator('.fence-table').getByText('60', { exact: true }).first().waitFor()
    const marks = page.getByRole('button', { name: 'לסמן' })
    const m = await marks.count()
    for (let i = 0; i < m; i++) await page.getByRole('button', { name: 'לסמן' }).first().click()
    await page.locator('.strip-text', { hasText: 'מסמכים: 7/7' }).waitFor()
    await page.getByRole('button', { name: 'שמירת הבקשה' }).click()
    await page.locator('.saved-list').getByText('מגדלי החוף').waitFor()
    await page.getByRole('button', { name: 'בקשה חדשה' }).click()
    if (await page.getByLabel('שם הפרויקט').inputValue() !== '') throw new Error('בקשה חדשה לא איפסה את השלט')
    await page.locator('.saved-list').getByRole('button', { name: 'פתיחה' }).first().click()
    if (await page.getByLabel('שם הפרויקט').inputValue() !== 'מגדלי החוף') throw new Error('הבקשה השמורה לא נפתחה')
    if (await page.getByLabel('תוכן חלק היזם').inputValue() !== 'הדמיות הפרויקט') throw new Error('נתוני הגדר לא נשמרו עם הבקשה')
    if (!(await page.locator('.ps-render-box img').count())) throw new Error('ההדמיה לא נשמרה עם הבקשה')
    await page.screenshot({ path: `${OUT}/${vp.name}-construction.png`, fullPage: true })
    await noHScroll('construction')
    await page.locator('.saved-list').getByRole('button', { name: 'מחיקה' }).first().click()
    await page.getByRole('link', { name: 'בדיקת התאמה והגשה' }).click()
    await page.getByRole('heading', { name: 'שלט אתר וגדר מדברת' }).waitFor()
  })

  await step(`${vp.name} guide`, async () => {
    await nav('הנחיות')
    const cards = page.locator('.choice-grid a.entry')
    const c = await cards.count()
    if (c !== 7) throw new Error('צפויים 7 סוגי שלטים, נמצאו ' + c)
    if (await page.locator('.choice-grid .sd-thumb svg').count() !== 7) throw new Error('חסרים תרשימים בכרטיסי ההנחיות')
    for (let i = 0; i < c; i++) {
      await page.locator('.choice-grid a.entry').nth(i).click()
      await page.getByRole('heading', { name: 'תנאים שנבדקים' }).waitFor()
      if (await page.locator('.sd-figure svg[role=img]').count() !== 1) throw new Error('חסר תרשים חזית לסוג שלט ' + i)
      if (await page.locator('.sd-legend li').count() < 3) throw new Error('מקרא התרשים חסר בסוג שלט ' + i)
      await page.goBack()
    }
    await page.locator('.choice-grid a.entry').nth(1).click()
    await page.locator('.sd-legend li').nth(1).hover()
    await page.locator('.sd[data-hl="2"]').waitFor()
    await page.goBack()
    await page.locator('.choice-grid a.entry').nth(5).click()
    await page.getByRole('link', { name: 'בדיקת התאמה לסוג זה' }).click()
    await page.getByLabel('כתובת באשדוד').waitFor()
    await noHScroll('guide')
  })

  await step(`${vp.name} routes`, async () => {
    await nav('מסלולים')
    await page.locator('.route-entry').first().hover()
    await page.locator('.map-note', { hasText: 'תחנות' }).waitFor({ state: 'attached' }).catch(() => {})
    await page.getByRole('link', { name: /חוף הים/ }).click()
    await page.getByRole('button', { name: 'התחנה הבאה' }).click()
    await page.getByText('המרינה').first().waitFor()
    await page.getByRole('button', { name: 'התחנה הקודמת' }).click()
    await page.screenshot({ path: `${OUT}/${vp.name}-route.png`, fullPage: true })
    await noHScroll('route')
  })

  await step(`${vp.name} fees`, async () => {
    await nav('אגרות')
    await page.getByLabel('סוג השלט').selectOption('electronic')
    await page.getByLabel('שטח השלט (מ"ר)').fill('10')
    await page.getByRole('heading', { name: 'התעריף טרם הוזן' }).waitFor()
  })

  await step(`${vp.name} report`, async () => {
    await nav('דיווח')
    await page.getByLabel('כתובת (לא חובה)').fill('שבי ציון 12')
    await page.getByRole('button', { name: 'איתור' }).click()
    await page.locator('.pin-status', { hasText: 'המיקום נדקר במפה' }).waitFor()
    await page.getByRole('button', { name: 'המיקום שלי' }).waitFor()
    await ctx.grantPermissions(['geolocation']); await ctx.setGeolocation({ latitude: 31.8005, longitude: 34.6505 })
    await page.getByLabel('כתובת (לא חובה)').fill('')
    await page.getByRole('button', { name: 'המיקום שלי' }).click()
    await page.waitForFunction(() => document.querySelector('input[placeholder="מתמלאת לבד אחרי דקירה"]')?.value.includes('הרצל 5'))
    await page.getByLabel('מה ראיתם').fill('שלט מתפרק מעל המדרכה')
    if (await page.locator('.pguide li.is-done').count() < 2) throw new Error('ההסבר בדף לא מסמן את הצעדים שנעשו')
    await page.getByRole('button', { name: 'שליחת הדיווח' }).click()
    await page.getByText(/קליטת דיווחים תופעל|הדיווח התקבל/).waitFor()
    if (!requests.some((r) => r.startsWith('POST /rest/v1/ks_reports'))) throw new Error('לא נשלח דיווח')
  })

  await step(`${vp.name} track + staff login`, async () => {
    await nav('מעקב בקשה')
    await page.getByLabel('קוד מעקב או טלפון נייד').fill('ks-test01')
    await page.getByRole('button', { name: 'בדיקה' }).click()
    await page.getByText('KS-TEST01').first().waitFor()
    await page.getByLabel('קוד מעקב או טלפון נייד').fill('050-1234567')
    await page.getByRole('button', { name: 'בדיקה' }).click()
    await page.getByRole('listitem').filter({ hasText: 'KS-TEST02' }).click()
    await page.locator('.panel.sail', { hasText: 'KS-TEST01' }).waitFor()
    if (!requests.some((r) => r.includes('rpc/ks_track_by_phone'))) throw new Error('לא בוצע חיפוש לפי טלפון')
    await nav('צוות העירייה')
    await page.getByLabel('דוא"ל').fill('shtanat5@gmail.com')
    await page.getByRole('button', { name: 'שליחת קישור כניסה' }).click()
    await page.getByLabel('קוד מהמייל').waitFor()
    await page.getByRole('button', { name: 'דוא"ל אחר' }).click()
    await noHScroll('staff login')
  })
  await ctx.close()
}

// לוח הצוות עם סשן מזויף וטבלאות קיימות
{
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 }, locale: 'he-IL' })
  const page = await ctx.newPage()
  currentPage = page
  await setup(page, { staff: true, schema: true })
  await step('staff dashboard', async () => {
    await page.goto(BASE + '/staff')
    await page.getByRole('heading', { name: 'לוח הצוות' }).waitFor()
    await page.getByText('KS-TEST01').first().click()
    await page.getByLabel('סטטוס').selectOption('בבדיקת אדריכלית העיר')
    await page.getByLabel('החלטה').selectOption('הוחזר לתיקון')
    await page.getByRole('button', { name: 'רישום ההחלטה' }).click()
    await page.getByText('החלטה כזו מחייבת הפניה לסעיף').waitFor()
    await page.getByLabel(/סעיפים/).fill('2.2.3 ו')
    await Promise.all([page.waitForResponse((r) => r.url().includes('/ks_reviews') && r.request().method() === 'POST'), page.getByRole('button', { name: 'רישום ההחלטה' }).click()])
    if (!requests.some((r) => r.startsWith('POST /rest/v1/ks_reviews'))) throw new Error('לא נשמרה החלטה')
    await Promise.all([page.waitForResponse((r) => r.url().includes('/ks_applications') && r.request().method() === 'PATCH'), page.getByLabel('תוקף רישיון').fill('2027-12-31')])
    if (!requests.some((r) => r.startsWith('PATCH /rest/v1/ks_applications'))) throw new Error('לא עודכנה בקשה')
    await page.screenshot({ path: `${OUT}/staff-apps.png`, fullPage: true })
    await page.locator('.steps').getByRole('tab', { name: 'קליטה ידנית' }).click()
    await page.getByLabel('טעינת מסמך בקשה').setInputFiles(`${FIX}/form.png`)
    await page.locator('.docimp-status.ready').waitFor({ timeout: 60000 })
    await page.getByRole('button', { name: 'מלא', exact: true }).click()
    if (await page.getByLabel('שם המבקש').inputValue() !== 'דנה לוי') throw new Error('זיהוי התמונה לא מילא את שם המבקש')
    if (await page.getByLabel('דוא"ל').inputValue() !== 'dana@example.com') throw new Error('זיהוי התמונה לא מילא את הדוא"ל')
    const before = requests.filter((r) => r.includes('rpc/ks_submit_application')).length
    await Promise.all([page.waitForResponse((r) => r.url().includes('rpc/ks_submit_application')), page.getByRole('button', { name: 'שמירת הבקשה' }).click()])
    if (requests.filter((r) => r.includes('rpc/ks_submit_application')).length <= before) throw new Error('הקליטה הידנית לא נשמרה')
    await page.locator('.rules', { hasText: 'KS-ABC123' }).waitFor()
    for (const t of ['דיווחים', 'סקר שילוט קיים', 'תעריפים', 'תוקף והגדרות']) {
      await page.locator('.steps').getByRole('tab', { name: t }).click()
      await page.waitForTimeout(150)
    }
    await page.locator('.steps').getByRole('tab', { name: 'תעריפים' }).click()
    await page.getByLabel('סכום (ש"ח)').fill('120')
    await Promise.all([page.waitForResponse((r) => r.url().includes('/ks_fee_rates') && r.request().method() === 'POST'), page.getByRole('button', { name: 'שמירת התעריף' }).click()])
    if (!requests.some((r) => r.startsWith('POST /rest/v1/ks_fee_rates'))) throw new Error('לא נשמר תעריף')
    await page.locator('.steps').getByRole('tab', { name: 'תוקף והגדרות' }).click()
    await page.screenshot({ path: `${OUT}/staff-settings.png`, fullPage: true })
    await page.getByRole('button', { name: 'יציאה' }).click()
  })
  await ctx.close()
}

// כל דף נפתח ישירות מהכתובת (כניסה מקישור, לא דרך הניווט)
{
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 }, locale: 'he-IL' })
  const page = await ctx.newPage()
  currentPage = page
  await setup(page)
  for (const path of ['/', '/check', '/construction', '/guide', '/guide/business', '/routes', '/routes/route-8', '/fees', '/report', '/track', '/staff']) {
    await step(`direct ${path}`, async () => {
      const before = errors.length
      await page.goto(BASE + path)
      await page.locator('main h1').first().waitFor()
      if (errors.length > before) throw new Error('שגיאה בטעינה ישירה')
    })
  }
  await ctx.close()
}

// בלי לרענן: השרת נופל בטעינה הראשונה, והמסלולים מגיעים לבד בניסיון החוזר
{
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 }, locale: 'he-IL' })
  const page = await ctx.newPage()
  currentPage = page
  let downUntil = 0, fails = 0
  await setup(page)
  await page.route(`${SB}/rest/v1/shimur_routes**`, async (route) => {
    if (Date.now() < downUntil) { fails++; return route.abort('connectionreset') }
    return route.fallback()
  })
  await step('auto retry without refresh', async () => {
    downUntil = Date.now() + 20000
    await page.goto(BASE + '/routes')
    await page.getByText('המסלולים לא נטענו כרגע').waitFor({ timeout: 25000 })
    await page.getByRole('link', { name: /חוף הים/ }).waitFor({ timeout: 45000 })
    if (!fails) throw new Error('התקלה המדומה לא הופעלה')
  })
  await ctx.close()
}

// כניסה מקישור שהודבק: הקישור מהמייל, והכתובת שנפתחה ב-localhost
for (const [label, link, viaVerify] of [
  ['rescue: expired email link', 'https://cbhexpybdggwzyakgagd.supabase.co/auth/v1/verify?token=oldhash&type=magiclink&redirect_to=http://localhost:3000', null],
  ['rescue: email link', 'https://cbhexpybdggwzyakgagd.supabase.co/auth/v1/verify?token=goodhash&type=magiclink&redirect_to=http://localhost:3000', true],
  ['rescue: localhost address', 'http://localhost:3000/#access_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1MSIsImV4cCI6OTk5OTk5OTk5OSwiZW1haWwiOiJzaHRhbmF0NUBnbWFpbC5jb20iLCJyb2xlIjoiYXV0aGVudGljYXRlZCIsImF1ZCI6ImF1dGhlbnRpY2F0ZWQifQ.c2lnbmF0dXJl&expires_at=9999999999&expires_in=3600&refresh_token=r3&token_type=bearer&type=magiclink', false],
]) {
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 }, locale: 'he-IL' })
  const page = await ctx.newPage()
  currentPage = page
  await setup(page, { schema: true, isStaff: true })
  await step(label, async () => {
    await page.goto(BASE + '/staff')
    await page.getByRole('heading', { name: 'כניסת צוות' }).waitFor()
    await page.getByLabel('הקישור מהמייל או הכתובת שנפתחה').fill(link)
    await page.getByRole('button', { name: 'כניסה עם הקישור' }).click()
    if (viaVerify === null) { await page.getByText('תוקף הקישור פג').waitFor(); return }
    await page.getByRole('heading', { name: 'לוח הצוות' }).waitFor()
    if (viaVerify && !requests.some((r) => r.startsWith('POST /auth/v1/verify'))) throw new Error('לא נשלח אימות לקישור')
  })
  await ctx.close()
}

// התקנה: בדיקת שגיאות התקנה של Chrome
{
  const ctx = await browser.newContext()
  const page = await ctx.newPage()
  await setup(page)
  await step('installability', async () => {
    await page.goto(BASE + '/')
    await page.waitForTimeout(1500)
    const cdp = await ctx.newCDPSession(page)
    const { installabilityErrors } = await cdp.send('Page.getInstallabilityErrors')
    if (installabilityErrors.length) throw new Error(JSON.stringify(installabilityErrors))
  })
  await ctx.close()
}

await browser.close()
console.log('\nerrors:', errors.length)
for (const e of errors) console.log(' -', e)
process.exit(errors.length ? 1 : 0)
