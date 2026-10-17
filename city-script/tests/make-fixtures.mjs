// מייצר בקשות לדוגמה בכמה פורמטים, כדי לבדוק את "מלא" על קבצים אמיתיים.
import { chromium } from 'playwright'
import { mkdirSync, writeFileSync } from 'node:fs'
import { execSync } from 'node:child_process'
const OUT = process.argv[2] || 'test-results/fixtures'
mkdirSync(OUT, { recursive: true })
const F = [
  ['שם המבקש', 'דנה לוי'], ['שם העסק', 'קפה הים'], ['כתובת העסק', 'שבי ציון 12, אשדוד'],
  ['טלפון נייד', '050-1234567'], ['דוא"ל', 'dana@example.com'], ['שטח השלט', '3.5 מ"ר'], ['תיאור השלט', 'שלט בית עסק באותיות בודדות מעל הכניסה'],
]
const html = `<!doctype html><html lang="he" dir="rtl"><meta charset="utf-8"><body style="font-family:DejaVu Sans, sans-serif;font-size:26px;padding:40px;width:900px;background:#fff">
<h1 style="font-size:34px">בקשה לרישיון שילוט</h1>${F.map(([k, v]) => `<p>${k}: ${v}</p>`).join('')}</body></html>`
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1000, height: 760 } })
await p.setContent(html)
await p.screenshot({ path: `${OUT}/form.png` })
await p.pdf({ path: `${OUT}/form.pdf`, format: 'A4' })
// PDF סרוק: אותה בקשה כתמונה בלבד, בלי שכבת טקסט
const png = (await p.screenshot()).toString('base64')
await p.setContent(`<html><body style="margin:0"><img src="data:image/png;base64,${png}" style="width:100%"></body></html>`)
await p.pdf({ path: `${OUT}/form-scanned.pdf`, format: 'A4' })
await b.close()
writeFileSync(`${OUT}/form.txt`, F.map(([k, v]) => `${k}: ${v}`).join('\n'))
writeFileSync(`${OUT}/form.csv`, F.map(([k, v]) => `"${k}","${v}"`).join('\n'))
// docx מינימלי
const dir = `${OUT}/docx`
mkdirSync(`${dir}/_rels`, { recursive: true }); mkdirSync(`${dir}/word`, { recursive: true })
writeFileSync(`${dir}/[Content_Types].xml`, '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>')
writeFileSync(`${dir}/_rels/.rels`, '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>')
const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')
writeFileSync(`${dir}/word/document.xml`, `<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${F.map(([k, v]) => `<w:p><w:r><w:t xml:space="preserve">${esc(k)}: ${esc(v)}</w:t></w:r></w:p>`).join('')}</w:body></w:document>`)
execSync(`cd ${dir} && rm -f ../form.docx && zip -qr ../form.docx '[Content_Types].xml' _rels word`)
console.log('fixtures ready in', OUT)
