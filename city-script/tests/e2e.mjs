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

const errors = []
const requests = []
const json = (route, body, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })

async function setup(page, { staff = false, schema = false } = {}) {
  page.on('pageerror', (e) => errors.push(`${page.url()} :: ${e.message}`))
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|net::|ERR_|tiles|style|AJAXError|openfreemap|unpkg|fonts/i.test(m.text())) errors.push(`${page.url()} :: console ${m.text()}`) })
  await page.route('https://nominatim.openstreetmap.org/**', (r) => json(r, [{ display_name: 'שבי ציון 12, רובע א, אשדוד, ישראל', lat: '31.808', lon: '34.645' }]))
  await page.route('https://tiles.openfreemap.org/**', (r) => r.abort())
  await page.route('https://unpkg.com/**', (r) => r.abort())
  await page.route(`${SB}/**`, async (route) => {
    const req = route.request()
    const url = new URL(req.url())
    const p = url.pathname
    requests.push(`${req.method()} ${p}${url.search}`)
    if (p.startsWith('/auth/v1/user')) return json(route, { id: 'u1', email: 'shtanat5@gmail.com', aud: 'authenticated', role: 'authenticated' })
    if (p.startsWith('/auth/v1/otp')) return json(route, {})
    if (p.startsWith('/auth/v1/logout')) return route.fulfill({ status: 204 })
    if (p === '/rest/v1/rpc/is_staff') return json(route, staff)
    if (p === '/rest/v1/rpc/ks_submit_application') return json(route, 'KS-ABC123')
    if (p === '/rest/v1/rpc/ks_track_application') return json(route, [{ ...app, category: 'שלט בית עסק', last_decision: null, updated_at: app.created_at }])
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
    await page.getByRole('button', { name: 'העתקת קישור' }).first().click({ trial: vp.name === 'mobile' }).catch(() => {})
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
    await page.getByLabel('שם המבקש').fill('דנה לוי')
    await page.getByLabel('שטח השלט (מ"ר)').fill('3.5')
    await Promise.all([page.waitForResponse((r) => r.url().includes('rpc/ks_submit_application')), page.getByRole('button', { name: 'שליחת הבקשה' }).click()])
    await page.getByText('KS-ABC123').first().waitFor()
    if (!requests.some((r) => r.includes('rpc/ks_submit_application'))) throw new Error('לא נשלחה בקשת הגשה')
    await page.getByRole('link', { name: 'מעקב אחר הבקשה' }).click()
    await page.getByText('KS-TEST01').first().waitFor()
  })

  await step(`${vp.name} construction`, async () => {
    await nav('אתרי בנייה')
    await page.getByLabel('שם הפרויקט').fill('מגדלי החוף')
    await page.getByLabel('אורך הגדר הכולל (מ\')').fill('120')
    await page.getByLabel('מספר כניסות לאתר').fill('2')
    await page.locator('.project-sign').getByText('מגדלי החוף').waitFor()
    const marks = page.getByRole('button', { name: 'לסמן' })
    const m = await marks.count()
    for (let i = 0; i < m; i++) await page.getByRole('button', { name: 'לסמן' }).first().click()
    await page.locator('.strip-text', { hasText: 'מסמכים: 7/7' }).waitFor()
    await page.screenshot({ path: `${OUT}/${vp.name}-construction.png`, fullPage: true })
    await noHScroll('construction')
    await page.getByRole('link', { name: 'בדיקת התאמה והגשה' }).click()
    await page.getByRole('heading', { name: 'שלט אתר וגדר מדברת' }).waitFor()
  })

  await step(`${vp.name} guide`, async () => {
    await nav('הנחיות')
    const cards = page.locator('.choice-grid a.entry')
    const c = await cards.count()
    if (c !== 7) throw new Error('צפויים 7 סוגי שלטים, נמצאו ' + c)
    for (let i = 0; i < c; i++) {
      await page.locator('.choice-grid a.entry').nth(i).click()
      await page.getByRole('heading', { name: 'תנאים שנבדקים' }).waitFor()
      await page.goBack()
    }
    await page.locator('.choice-grid a.entry').nth(5).click()
    await page.getByRole('link', { name: 'בדיקת התאמה לסוג זה' }).click()
    await page.getByLabel('כתובת באשדוד').waitFor()
    await noHScroll('guide')
  })

  await step(`${vp.name} routes`, async () => {
    await nav('מסלולים')
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
    await page.getByLabel('מה ראיתם').fill('שלט מתפרק מעל המדרכה')
    await page.getByRole('button', { name: 'שליחת הדיווח' }).click()
    await page.getByText(/קליטת דיווחים תופעל|הדיווח התקבל/).waitFor()
    if (!requests.some((r) => r.startsWith('POST /rest/v1/ks_reports'))) throw new Error('לא נשלח דיווח')
  })

  await step(`${vp.name} track + staff login`, async () => {
    await nav('מעקב בקשה')
    await page.getByLabel('קוד מעקב').fill('ks-test01')
    await page.getByRole('button', { name: 'בדיקה' }).click()
    await page.getByText('KS-TEST01').first().waitFor()
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
