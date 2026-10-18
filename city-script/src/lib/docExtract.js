// קריאת מסמך בקשה מכל סוג, ומילוי השדות המתאימים.
// PDF (טקסט, וסריקה דרך זיהוי תווים), Word (docx), Excel (xlsx), CSV, טקסט, HTML, מייל (eml), ותמונות.
// הכול רץ בדפדפן. שום קובץ לא נשלח החוצה לצורך הקריאה.

const ext = (name) => (name.split('.').pop() || '').toLowerCase()

export const ACCEPT = '.pdf,.docx,.xlsx,.csv,.txt,.html,.htm,.eml,.json,.png,.jpg,.jpeg,.webp,.gif,.bmp,.tif,.tiff,image/*,application/pdf'

let ocrWorker = null
async function ocr(source, onStatus) {
  const { createWorker } = await import('tesseract.js')
  if (!ocrWorker) {
    onStatus?.('טוען זיהוי תווים בעברית...')
    ocrWorker = await createWorker(['heb', 'eng'], 1, {
      workerPath: '/ocr/worker.min.js', corePath: '/ocr/', langPath: '/ocr/lang', gzip: true,
    })
  }
  onStatus?.('מזהה טקסט בסריקה...')
  const { data } = await ocrWorker.recognize(source)
  return data.text || ''
}

async function pdfText(file, onStatus) {
  const pdfjs = await import('pdfjs-dist')
  const workerUrl = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl
  const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise
  let text = ''
  const pages = Math.min(doc.numPages, 6)
  for (let i = 1; i <= pages; i++) {
    const page = await doc.getPage(i)
    const tc = await page.getTextContent()
    // שורות לפי מיקום אנכי, כדי ש"תווית: ערך" יישארו באותה שורה
    const rows = new Map()
    for (const it of tc.items) {
      const y = Math.round(it.transform[5] / 3)
      rows.set(y, [...(rows.get(y) || []), it])
    }
    text += [...rows.entries()].sort((a, b) => b[0] - a[0])
      .map(([, items]) => items.sort((a, b) => b.transform[4] - a.transform[4]).map((x) => x.str).join(' ')).join('\n') + '\n'
  }
  if (text.replace(/\s/g, '').length > 40) return { text, how: 'PDF' }
  // אין שכבת טקסט: סריקה. מציירים את העמודים וקוראים בזיהוי תווים.
  let scanned = ''
  for (let i = 1; i <= Math.min(doc.numPages, 3); i++) {
    const page = await doc.getPage(i)
    const vp = page.getViewport({ scale: 3 })
    const canvas = document.createElement('canvas')
    canvas.width = vp.width; canvas.height = vp.height
    await page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise
    scanned += (await ocr(canvas, onStatus)) + '\n'
  }
  return { text: scanned, how: 'PDF סרוק' }
}

async function docxText(file) {
  const mammoth = await import('mammoth/mammoth.browser.js')
  const { value } = await (mammoth.default || mammoth).extractRawText({ arrayBuffer: await file.arrayBuffer() })
  return { text: value, how: 'Word' }
}

async function xlsxText(file) {
  const { default: readXlsx } = await import('read-excel-file')
  const rows = await readXlsx(file)
  return { text: rows.map((r) => r.filter((c) => c !== null && c !== '').join(': ')).join('\n'), how: 'Excel' }
}

export async function extractText(file, onStatus) {
  const e = ext(file.name)
  if (e === 'pdf' || file.type === 'application/pdf') return pdfText(file, onStatus)
  if (e === 'docx') return docxText(file)
  if (e === 'xlsx') return xlsxText(file)
  if (file.type.startsWith('image/') || ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'tif', 'tiff'].includes(e)) return { text: await ocr(file, onStatus), how: 'תמונה' }
  if (e === 'doc' || e === 'xls') throw new Error('קבצי Word או Excel ישנים (doc, xls) אינם נתמכים. שמרו בשם כ-docx או xlsx, או כ-PDF.')
  let text = await file.text()
  if (e === 'html' || e === 'htm' || /<html|<body/i.test(text)) text = new DOMParser().parseFromString(text, 'text/html').body.innerText
  if (e === 'csv') text = text.split(/\r?\n/).map((l) => csvCells(l).filter(Boolean).join(': ')).join('\n')
  if (e === 'json') { try { text = Object.entries(JSON.parse(text)).map(([k, v]) => `${k}: ${v}`).join('\n') } catch { /* טקסט רגיל */ } }
  return { text, how: e.toUpperCase() || 'טקסט' }
}

// תאי שורת CSV, כולל ערכים במירכאות שיש בהם פסיק
function csvCells(line) {
  const out = []; let cur = ''; let q = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') { if (q && line[i + 1] === '"') { cur += '"'; i++ } else q = !q }
    else if (!q && (ch === ',' || ch === ';' || ch === '\t')) { out.push(cur.trim()); cur = '' }
    else cur += ch
  }
  out.push(cur.trim())
  return out
}

// ---------- פענוח השדות מהטקסט ----------
const LABELS = {
  applicant_name: ['שם המבקש', 'שם מבקש', 'שם מגיש הבקשה', 'שם הפונה', 'שם מלא', 'שם בעל העסק', 'מגיש הבקשה', 'שם ומשפחה', 'המבקשת', 'המבקש', 'applicant', 'name'],
  business_name: ['שם העסק', 'שם בית העסק', 'שם החברה', 'שם הפרויקט', 'שם המסחרי', 'business'],
  address: ['כתובת העסק', 'כתובת הנכס', 'כתובת השלט', 'מיקום השלט', 'כתובת', 'רחוב', 'address'],
  phone: ['טלפון נייד', 'נייד', 'טלפון', 'טל', 'phone', 'mobile'],
  email: ['דואר אלקטרוני', 'דוא"ל', 'דוא״ל', 'מייל', 'email', 'e-mail'],
  sign_area_sqm: ['שטח השלט', 'שטח', 'גודל השלט', 'area'],
  notes: ['תיאור השלט', 'תיאור', 'הערות', 'פירוט', 'notes', 'description'],
}
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\"״]/g, '\\$&')

function byLabel(lines, labels) {
  for (const label of labels) {
    const re = new RegExp(`(?:^|\\s|\\|)${esc(label)}\\s*[:：\\-–|]\\s*(.+)$`, 'i')
    for (const l of lines) {
      const m = l.match(re)
      if (m && m[1].trim().length > 1) return m[1].trim().replace(/\s{2,}/g, ' ').slice(0, 160)
    }
    // תווית בשורה אחת והערך בשורה הבאה
    const i = lines.findIndex((l) => l.replace(/[:：\s]+$/, '').trim() === label)
    if (i >= 0 && lines[i + 1] && lines[i + 1].trim().length > 1) return lines[i + 1].trim().slice(0, 160)
  }
  return ''
}

const CAT_HINTS = [
  ['electronic', /אלקטרונ|לד\b|LED|מסך|דיגיטל/i],
  ['awning', /סוכך|מרקיז|סגירה עונתית/],
  ['billboard', /חוצות|כרזה|כרזת|טוטם|בילבורד/],
  ['construction', /אתר בני|גדר מדברת|היתר בני/],
  ['house-number', /מספר בית|שם רחוב|שילוט התמצאות/],
  ['project-name', /שם פרויקט|שם הפרויקט על|על גג הבניין/],
  ['business', /שלט עסק|בית עסק|שילוט עסק|שלט/],
]

export function parseFields(raw) {
  const text = (raw || '').replace(/[\u200e\u200f]/g, '').replace(/[ \t]+/g, ' ').replace(/ ([,.:;])/g, '$1')
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  const f = {}
  for (const [k, labels] of Object.entries(LABELS)) { const v = byLabel(lines, labels); if (v) f[k] = v }
  // ערכים מזוהים גם בלי תווית
  const email = text.match(/[\w.+-]+@[\w-]+\.[\w.-]+/)
  if (email) f.email = email[0]
  const phones = [...text.matchAll(/(?:\+?972[-\s]?|0)(?:5\d|[2-489]|7\d)[-\s]?\d{3}[-\s]?\d{4}/g)].map((m) => m[0])
  const mobile = phones.find((p) => /^(?:\+?972[-\s]?|0)5/.test(p))
  if (mobile || phones[0]) f.phone = (mobile || phones[0]).replace(/\s/g, '')
  else if (f.phone) f.phone = (f.phone.match(/[\d+\-\s]{9,}/) || [''])[0].replace(/\s/g, '') || undefined
  if (f.sign_area_sqm) {
    const n = f.sign_area_sqm.match(/(\d+(?:[.,]\d+)?)/)
    f.sign_area_sqm = n ? n[1].replace(',', '.') : undefined
  }
  if (!f.sign_area_sqm) {
    const dims = text.match(/(\d+(?:[.,]\d+)?)\s*[x×X*]\s*(\d+(?:[.,]\d+)?)\s*(מ['׳"]?|מטר)/)
    if (dims) f.sign_area_sqm = String(Math.round(parseFloat(dims[1].replace(',', '.')) * parseFloat(dims[2].replace(',', '.')) * 100) / 100)
  }
  const permit = text.match(/(?:מס['׳]?\s*היתר(?:\s*בני[יה]ה)?|היתר\s*מס['׳]?)\s*[:\-]?\s*([\w\-/]+)/)
  if (permit) f.permit = permit[1]
  for (const [slug, re] of CAT_HINTS) if (re.test(text)) { f.category_slug = slug; break }
  for (const k of Object.keys(f)) if (!f[k]) delete f[k]
  return f
}

export const FIELD_LABEL = {
  applicant_name: 'שם המבקש', business_name: 'שם העסק או הפרויקט', address: 'כתובת', phone: 'טלפון', email: 'דוא"ל',
  sign_area_sqm: 'שטח השלט (מ"ר)', notes: 'תיאור והערות', permit: 'מספר היתר', category_slug: 'סוג שלט',
}
