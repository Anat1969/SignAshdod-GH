import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useData, rulesFor } from '../lib/data'
import { useStrip, useToast } from '../components/Shell'
import { supabase } from '../lib/supabase'
import { uploadDoc } from '../lib/uploadDoc'
import PageGuide from '../components/PageGuide'
import { Section, Tag, Loading } from '../components/bits'
import { rateFor, computeFee, UNIT_LABEL, SOURCE_LABEL } from '../lib/check'

const SIGN_FIELDS = [
  ['developer', 'שם היזם'], ['architect', 'שם האדריכל'], ['contractor', 'שם קבלן הביצוע ומס\' רישיון'],
  ['engineer', 'שם המהנדס ומס\' רישיון'], ['manager', 'שם מנהל העבודה'], ['supervisor', 'שם אחראי הביקורת'],
]

const CHECKLIST = [
  ['permit', 'היתר בנייה בתוקף', '2.2.7'],
  ['a4', 'דוגמת שלט A4 עם כל הפרטים, כולל מספר היתר והדמיה', 'טופס הבקשה'],
  ['a3', 'תכנית התארגנות A3: מיקום השלט ביחס לאתר, למגרשים ולכבישים הגובלים', 'טופס הבקשה'],
  ['fenceplan', 'בגדר מדברת: תרשים עם מידות ומיקום כל חלק, והדמיה בתלת־ממד', 'טופס הגדר'],
  ['engineer', 'אישור מהנדס על עמידות הגידור', '2.2.7 ג.1'],
  ['maint', 'התחייבות לתחזוקה ולתיקון ליקויים תוך 72 שעות', '2.2.7 ג.2'],
  ['third', 'כתב התחייבות נגד תביעות צד שלישי', '2.2.7 ג.3'],
]

const STORE = 'ktav-construction-v1'
const readStore = () => { try { return JSON.parse(localStorage.getItem(STORE) || '{}') } catch { return {} } }
const writeStore = (v) => { try { localStorage.setItem(STORE, JSON.stringify(v)); return true } catch { return false } }
const EMPTY_SIGN = { project: '', permit: '', developer: '', architect: '', contractor: '', engineer: '', manager: '', supervisor: '', company: '', render: '', phone: '' }

// הקטנת ההדמיה בדפדפן לפני השמירה, כדי שתיכנס לבקשה
function shrinkImage(file, max = 1400) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) { reject(new Error('type')); return }
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height))
      const cv = document.createElement('canvas')
      cv.width = Math.round(img.width * k); cv.height = Math.round(img.height * k)
      cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height)
      URL.revokeObjectURL(url)
      resolve(cv.toDataURL('image/jpeg', 0.84))
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('load')) }
    img.src = url
  })
}
const EMPTY_FENCE = { length: '', location: '', cityContent: 'תכנים עירוניים בתיאום דוברות העירייה', devContent: '' }

// שדה שנכתב ישירות על גבי השלט
const Ink = ({ value, onChange, label, placeholder, className = '' }) => (
  <input className={`ps-ink ${className}`} aria-label={label} placeholder={placeholder ?? label} value={value} onChange={(e) => onChange(e.target.value)} />
)

export default function Construction() {
  const d = useData()
  const toast = useToast()
  const [sign, setSign] = useState(EMPTY_SIGN)
  const [entrances, setEntrances] = useState('1')
  const [hasFence, setHasFence] = useState(false)
  const [fence, setFence] = useState(EMPTY_FENCE)
  const [done, setDone] = useState({})
  const [saved, setSaved] = useState(readStore)
  const [savedAt, setSavedAt] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const L = hasFence ? Math.max(0, Number(fence.length) || 0) : 0
  const half = Math.round((L / 2) * 10) / 10
  const ent = Math.max(1, Math.min(12, Number(entrances) || 1))
  const rate = rateFor(d.fees, 'construction')
  const adFee = computeFee(rate, half * 2) // שטח חלק היזם: אורך x גובה 2 מ'
  const doneCount = CHECKLIST.filter(([k]) => done[k]).length
  const rules = useMemo(() => rulesFor(d.rules, 'construction'), [d.rules])
  const name = sign.project.trim()
  const setS = (k) => (v) => { setSign((x) => ({ ...x, [k]: v })); setSavedAt(null) }
  const setF = (k) => (v) => { setFence((x) => ({ ...x, [k]: v })); setSavedAt(null) }
  useEffect(() => { const h = (e) => { if (e.key === STORE) setSaved(readStore()) }; window.addEventListener('storage', h); return () => window.removeEventListener('storage', h) }, [])
  useStrip('יזם וקבלן · אתר בנייה',
    `${name || 'פרויקט חדש'}: ${ent} שלטי אתר${hasFence && L ? `, גדר של ${L} מ' (${half} מ' לעירייה, ${half} מ' ליזם)` : hasFence ? ', עם גדר מדברת' : ''}. מסמכים: ${doneCount}/${CHECKLIST.length}.${savedAt ? ' נשמר.' : ''}`,
    'var(--dune-500)')

  const takeRender = async (file) => {
    if (!file) return
    try { setS('render')(await shrinkImage(file)); toast('ההדמיה נטענה לשלט') }
    catch { toast('אפשר לטעון רק קובץ תמונה (JPG, PNG)') }
  }
  const [server, setServer] = useState(null) // { code, token }
  const [saving, setSaving] = useState(false)
  const save = async () => {
    if (!name) { toast('יש לכתוב שם פרויקט על השלט לפני השמירה'); return }
    setSaving(true)
    const at = new Date().toISOString()
    const prev = readStore()[name] || {}
    // שמירה בשרת: ההדמיה עולה כקובץ לדלי הפרטי, הבקשה נשמרת עם קוד מעקב ואסימון עריכה
    let srv = server || prev.server || null
    let documents = prev.documents || []
    try {
      if (sign.render && sign.render !== prev.sign?.render) {
        const blob = await (await fetch(sign.render)).blob()
        const up = await uploadDoc(new File([blob], `${name}-render.jpg`, { type: 'image/jpeg' }))
        if (up?.path) documents = [up]
      }
      const { render, ...signData } = sign
      const { data, error } = await supabase.rpc('ks_save_site_request', { p: {
        tracking_code: srv?.code || '', edit_token: srv?.token || '', project_name: name, developer: sign.developer, phone: sign.phone,
        address: hasFence ? fence.location : '', documents,
        details: { sign: signData, entrances, has_fence: hasFence, fence: hasFence ? fence : null, documents_ready: done, has_render: !!render },
      } })
      if (!error && data?.code) srv = data
    } catch { /* נשמר מקומית, ננסה שוב בשמירה הבאה */ }
    const next = { ...readStore(), [name]: { sign, entrances, hasFence, fence: hasFence ? fence : null, done, savedAt: at, server: srv, documents } }
    if (!writeStore(next)) { delete next[name].sign.render; writeStore(next) }
    setSaved(readStore()); setSavedAt(at); setServer(srv); setSaving(false)
    toast(srv ? `הבקשה "${name}" נשמרה. קוד מעקב ${srv.code}` : `הבקשה "${name}" נשמרה בדפדפן. השרת לא זמין כרגע.`)
  }
  const load = (k) => {
    const r = readStore()[k]; if (!r) return
    setSign({ ...EMPTY_SIGN, ...r.sign }); setEntrances(r.entrances || '1'); setHasFence(!!r.hasFence)
    setFence({ ...EMPTY_FENCE, ...(r.fence || {}) }); setDone(r.done || {}); setSavedAt(r.savedAt); setServer(r.server || null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const remove = (k) => { const r = readStore(); delete r[k]; writeStore(r); setSaved(r); if (k === name) setSavedAt(null) }
  const startNew = () => { setSign(EMPTY_SIGN); setEntrances('1'); setHasFence(false); setFence(EMPTY_FENCE); setDone({}); setSavedAt(null); setServer(null) }
  if (d.loading) return <Loading />
  const savedList = Object.entries(saved).sort((a, b) => (b[1].savedAt > a[1].savedAt ? 1 : -1))

  return (
    <div className="page">
      <div className="page-head">
        <span className="eyebrow">שילוט באתרי בנייה · סעיף 2.2.7 · לפרויקטים בהיתר בנייה בלבד</span>
        <h1>שלט אתר וגדר מדברת</h1>
        <p className="lead">כותבים ישירות על השלט. הפורמט אחיד בכל העיר: משתנים רק פרטי הפרויקט, היועצים וההדמיה. הבקשה נשמרת לפי שם הפרויקט, יחד עם הגדר אם יש.</p>
      </div>
      <PageGuide steps={[['כותבים על השלט את שם הפרויקט, מספר ההיתר והיועצים', !!(name && sign.permit)], ['טוענים את הדמיית ההיתר לתוך השלט', !!sign.render], ['אם יש גדר מדברת: מדליקים את המתג וממלאים את הטבלה', !hasFence || !!fence.length], ['מסמנים את המסמכים שמוכנים', doneCount === CHECKLIST.length], ['שומרים את הבקשה לפי שם הפרויקט', !!savedAt]]} />

      <section className="ps-stage">
        <div className="project-sign ps-editable" aria-label="שלט האתר בפורמט האחיד. כל שדה ניתן לכתיבה.">
          <div className="ps-data">
            <div className="ps-top">
              <span className="ps-logo">לוגו</span>
              <span className="ps-permit">מס' היתר בנייה: <Ink value={sign.permit} onChange={setS('permit')} label="מספר היתר בנייה" placeholder=".........." className="ps-ink-permit" /></span>
            </div>
            <Ink value={sign.project} onChange={setS('project')} label="שם הפרויקט" className="ps-title" />
            <div className="ps-rows">{SIGN_FIELDS.map(([k, l]) => <div key={k}><span>{l}:</span><Ink value={sign[k]} onChange={setS(k)} label={l} placeholder="" /></div>)}</div>
          </div>
          <div className="ps-render">
            <label className={`ps-render-box ${sign.render ? 'has-img' : ''} ${dragOver ? 'is-over' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }} onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); takeRender(e.dataTransfer.files?.[0]) }}>
              <input type="file" accept="image/*" aria-label="העלאת הדמיית ההיתר" onChange={(e) => { takeRender(e.target.files?.[0]); e.target.value = '' }} />
              {sign.render
                ? <img src={sign.render} alt="הדמיית ההיתר" />
                : <span className="ps-render-hint"><b>הדמיית ההיתר</b><small>לחיצה או גרירה של קובץ תמונה</small></span>}
            </label>
            {sign.render && <button type="button" className="ps-render-clear" onClick={() => setS('render')('')}>הסרת ההדמיה</button>}
            <div className="ps-foot"><Ink value={sign.company} onChange={setS('company')} label="שם החברה, ח.פ. וכתובת הנכס" /></div>
          </div>
        </div>
        <div className="ps-side">
          <span className="eyebrow">שלט האתר · 2x4 מ'</span>
          <p className="muted">מדבקה על פנל קשיח, בכל כניסה לאתר, במפלס הקרקע. לוחצים על כל שורה בשלט וכותבים.</p>
          <label className="field">טלפון נייד של היזם<input inputMode="tel" dir="ltr" value={sign.phone} onChange={(e) => setS('phone')(e.target.value)} placeholder="050-0000000" /></label>
          <label className="field">מספר כניסות לאתר<input inputMode="numeric" value={entrances} onChange={(e) => { setEntrances(e.target.value.replace(/\D/g, '')); setSavedAt(null) }} /></label>
          <p className="caption">שלטי אתר נדרשים: {ent}, אחד בכל כניסה. קובץ הפורמט הרשמי מתקבל מאדריכלות העיר.</p>
        </div>
      </section>

      <hr className="threshold" />

      <section className="fence-block">
        <div className="fence-head">
          <div>
            <h2>הגדר המדברת</h2>
            <p className="muted">גובה 2 מ', לאורך החזית הראשית, פנל קשיח. חצי תכנים עירוניים וחצי תוכן היזם לפרויקט בלבד.</p>
          </div>
          <label className="switch">
            <input type="checkbox" checked={hasFence} onChange={(e) => { setHasFence(e.target.checked); setSavedAt(null) }} />
            <span className="switch-track" aria-hidden="true" /><span>לפרויקט יש גדר מדברת</span>
          </label>
        </div>
        {hasFence && (
          <div className="fence-sheet rise">
            <div className="fence-bar fence-bar-lg" aria-hidden="true">
              <div style={{ flex: 1, background: 'var(--sea-300)', color: '#13222C' }}>עירייה{half ? ` · ${half} מ'` : ''}</div>
              <div style={{ flex: 1, background: 'var(--dune-300)', color: '#13222C' }}>יזם{half ? ` · ${half} מ'` : ''}</div>
            </div>
            <div className="fence-inputs">
              <label className="field">אורך הגדר הכולל (מ')<input inputMode="decimal" value={fence.length} onChange={(e) => setF('length')(e.target.value.replace(/[^\d.]/g, ''))} placeholder="לדוגמה: 120" /></label>
              <label className="field">מיקום הגדר (רחוב וחזית)<input value={fence.location} onChange={(e) => setF('location')(e.target.value)} placeholder="לדוגמה: חזית רחוב הרצל" /></label>
            </div>
            <div className="table-wrap">
              <table className="fence-table">
                <thead><tr><th>חלק</th><th>תוכן</th><th>מטרים</th><th>שטח (מ"ר)</th></tr></thead>
                <tbody>
                  <tr><td>העירייה · 50%</td><td><input className="cell-input" aria-label="תוכן חלק העירייה" value={fence.cityContent} onChange={(e) => setF('cityContent')(e.target.value)} /></td><td className="mono">{half || '—'}</td><td className="mono">{L ? half * 2 : '—'}</td></tr>
                  <tr><td>היזם · 50%</td><td><input className="cell-input" aria-label="תוכן חלק היזם" placeholder="תוכן לפרויקט בלבד" value={fence.devContent} onChange={(e) => setF('devContent')(e.target.value)} /></td><td className="mono">{half || '—'}</td><td className="mono">{L ? half * 2 : '—'}</td></tr>
                  <tr className="total"><td>סה"כ · 100%</td><td className="muted">גובה 2 מ'</td><td className="mono">{L || '—'}</td><td className="mono">{L ? L * 2 : '—'}</td></tr>
                </tbody>
              </table>
            </div>
            <p className="caption">{rate ? `אגרה משוערת לחלק הפרסומי: ${adFee?.toLocaleString('he-IL')} ש"ח (${Number(rate.amount_ils).toLocaleString('he-IL')} ש"ח ${UNIT_LABEL[rate.unit]}, ${SOURCE_LABEL[rate.source]}).` : 'חלקה הפרסומי של הגדר מחויב באגרת שילוט לפי חוק העזר. ' + (d.settings.fees_status?.text || '')}</p>
          </div>
        )}
      </section>

      <section className="save-bar">
        <div>
          <strong>{name ? `הבקשה: ${name}` : 'הבקשה עדיין ללא שם'}</strong>
          <span className="caption">{savedAt ? `נשמרה ${new Date(savedAt).toLocaleString('he-IL')}` : 'לא נשמרה'} · שלט אתר{hasFence ? ' וגדר מדברת' : ''} · מסמכים {doneCount}/{CHECKLIST.length}</span>
          <span className="caption save-note">{server ? `שמורה בשרת העירייה. קוד מעקב: ${server.code}. אפשר לעקוב גם לפי הטלפון.` : 'השמירה נשמרת בשרת העירייה ובדפדפן הזה.'}</span>
        </div>
        <div className="row">
          <button className="btn" onClick={startNew}>בקשה חדשה</button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'שומרת...' : 'שמירת הבקשה'}</button>
        </div>
      </section>
      {savedList.length > 0 && (
        <section className="saved-list">
          <span className="eyebrow">בקשות שמורות</span>
          <ul className="rules">
            {savedList.map(([k, r]) => (
              <li key={k}>
                <span className="section-ref">{new Date(r.savedAt).toLocaleDateString('he-IL')}</span>
                <span><b style={{ fontWeight: 500 }}>{k}</b><span className="muted"> · {r.hasFence ? `שלט וגדר${r.fence?.length ? ` ${r.fence.length} מ'` : ''}` : 'שלט אתר'}</span></span>
                <span className="row"><button className="btn btn-sm" onClick={() => load(k)}>פתיחה</button><button className="btn btn-sm btn-quiet" onClick={() => remove(k)}>מחיקה</button></span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <hr className="threshold" />

      <section className="grid-2">
        <div>
          <h2 style={{ marginBottom: 'var(--space-4)' }}>מסמכים להגשה</h2>
          <ul className="rules">
            {CHECKLIST.map(([k, t, s]) => (
              <li key={k}>
                <Section s={s} />
                <span>{t}</span>
                <button className={`btn btn-sm chk ${done[k] ? 'selected' : ''}`} onClick={() => setDone((x) => ({ ...x, [k]: !x[k] }))} aria-pressed={!!done[k]}>{done[k] ? 'מוכן' : 'לסמן'}</button>
              </li>
            ))}
          </ul>
        </div>
        <div style={{ display: 'grid', gap: 'var(--space-4)', alignContent: 'start' }}>
          <h2>מסלול האישור</h2>
          <ol className="rules" style={{ listStyle: 'none' }}>
            {['הגשת טופס הבקשה עם הדמיה, מיקום ופריסה', 'תיאום וקבלת אישור אדריכלית העיר', 'העברת הבקשה לוועדת השילוט', 'חתימת פיקוח עירוני ותאריך'].map((t, i) => (
              <li key={t}><span className="section-ref">{i + 1}</span><span>{t}</span><Tag status="step">שלב {i + 1}</Tag></li>
            ))}
          </ol>
          <div className="row no-print">
            <Link to="/check?cat=construction&step=2" className="btn btn-primary">בדיקת התאמה והגשה</Link>
            <button className="btn btn-quiet" onClick={() => window.print()}>הדפסת הדף</button>
          </div>
          <details>
            <summary className="muted" style={{ cursor: 'pointer' }}>הכללים המלאים ({rules.length})</summary>
            <ul className="rules" style={{ marginTop: 'var(--space-3)' }}>{rules.map((r) => <li key={r.id}><Section s={r.section} /><span>{r.text}</span><Tag status={r.kind === 'question' ? 'must' : 'info'}>{r.kind === 'question' ? 'תנאי' : 'דרישה'}</Tag></li>)}</ul>
          </details>
        </div>
      </section>
    </div>
  )
}
