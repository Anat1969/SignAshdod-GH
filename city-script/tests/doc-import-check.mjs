import { chromium } from 'playwright'
const SB = 'https://cbhexpybdggwzyakgagd.supabase.co'
const b = await chromium.launch()
const ctx = await b.newContext({ viewport: { width: 1366, height: 900 } })
await ctx.addInitScript(() => localStorage.setItem('ktav-hair-auth', JSON.stringify({ access_token: 'x.eyJleHAiOjk5OTk5OTk5OTl9.x', token_type: 'bearer', expires_in: 3600, expires_at: 9999999999, refresh_token: 'r', user: { id: 'u1', email: 'a@b.c', aud: 'authenticated', role: 'authenticated' } })))
const p = await ctx.newPage()
p.on('pageerror', (e) => console.log('ERR', e.message))
await p.route(/openfreemap|unpkg/, (r) => r.abort())
await p.route(`${SB}/**`, (r) => {
  const u = new URL(r.request().url()).pathname
  if (u.includes('/rpc/is_staff')) return r.fulfill({ status: 200, contentType: 'application/json', body: 'true' })
  if (u.includes('/auth/v1/user')) return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'u1', email: 'a@b.c' }) })
  if (u.endsWith('/ks_categories')) return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ slug: 'business', name: 'שלט בית עסק', section: '2.2.3', landscape: 'port', sort: 1 }, { slug: 'electronic', name: 'שלט אלקטרוני', section: '2.2.6', landscape: 'port', sort: 2 }]) })
  return r.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
})
await p.goto('http://localhost:4173/staff?tab=intake')
await p.getByRole('heading', { name: 'קליטת בקשה שהגיעה ידנית' }).waitFor()
for (const f of ['form.txt', 'form.csv', 'form.docx', 'form.pdf', 'form-scanned.pdf', 'form.png']) {
  const t0 = Date.now()
  await p.getByLabel('טעינת מסמך בקשה').setInputFiles(`test-results/fixtures/${f}`)
  await p.locator('.docimp-status.ready, .docimp-status.error').waitFor({ timeout: 90000 })
  const st = await p.locator('.docimp-status').innerText()
  if (await p.getByRole('button', { name: 'מלא', exact: true }).isEnabled()) await p.getByRole('button', { name: 'מלא', exact: true }).click()
  const v = async (l) => (await p.getByLabel(l, { exact: true }).inputValue())
  console.log(f, `${Date.now() - t0}ms`, '|', st, '|', await v('שם המבקש'), '|', await v('שם העסק או הפרויקט'), '|', await v('כתובת השלט'), '|', await v('טלפון נייד'), '|', await v('דוא"ל'), '|', await v('שטח השלט (מ"ר)'), '|', (await p.locator('label.field:has-text("תיאור והערות") textarea').inputValue()).slice(0, 30))
  await p.getByRole('button', { name: 'ניקוי' }).click()
}
await b.close()
