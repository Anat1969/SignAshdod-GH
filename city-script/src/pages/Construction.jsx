import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useData, rulesFor } from '../lib/data'
import { useStrip } from '../components/Shell'
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

export default function Construction() {
  const d = useData()
  const [length, setLength] = useState('')
  const [entrances, setEntrances] = useState('1')
  const [sign, setSign] = useState({ project: 'שם הפרויקט', permit: '', developer: '', architect: '', contractor: '', engineer: '', manager: '', supervisor: '', company: '' })
  const [done, setDone] = useState({})
  const L = Math.max(0, Number(length) || 0)
  const half = Math.round((L / 2) * 10) / 10
  const ent = Math.max(1, Math.min(12, Number(entrances) || 1))
  const rate = rateFor(d.fees, 'construction')
  const adFee = computeFee(rate, half * 2) // שטח חלק היזם: אורך x גובה 2 מ'
  const doneCount = CHECKLIST.filter(([k]) => done[k]).length
  const rules = useMemo(() => rulesFor(d.rules, 'construction'), [d.rules])
  useStrip('יזם וקבלן · אתר בנייה',
    L ? `גדר של ${L} מ': ${half} מ' לעירייה, ${half} מ' ליזם. ${ent} שלטי אתר, אחד לכל כניסה. מסמכים: ${doneCount}/${CHECKLIST.length}.`
      : 'שלט אתר 2x4 מ\' בכל כניסה, וגדר מדברת בגובה 2 מ\' בחלוקה 50/50.',
    'var(--dune-500)')
  if (d.loading) return <Loading />

  return (
    <div className="page">
      <div className="page-head">
        <span className="eyebrow">שילוט באתרי בנייה · סעיף 2.2.7 · לפרויקטים בהיתר בנייה בלבד</span>
        <h1>שלט אתר וגדר מדברת</h1>
        <p className="lead">הפורמט אחיד בכל העיר. משנים רק את פרטי הפרויקט, היועצים וההדמיה. כל השאר נשאר קבוע.</p>
      </div>

      <section className="grid-2">
        <div style={{ display: 'grid', gap: 'var(--space-4)', alignContent: 'start' }}>
          <h2>שלט האתר</h2>
          <p className="muted">2x4 מ', מדבקה על פנל קשיח, בכל כניסה לאתר, במפלס הקרקע. מלאו את הפרטים כדי לראות את השלט בפורמט.</p>
          <div className="grid-2">
            <label className="field">שם הפרויקט<input value={sign.project} onChange={(e) => setSign({ ...sign, project: e.target.value })} /></label>
            <label className="field">מספר היתר בנייה<input value={sign.permit} onChange={(e) => setSign({ ...sign, permit: e.target.value })} /></label>
            {SIGN_FIELDS.map(([k, l]) => <label key={k} className="field">{l}<input value={sign[k]} onChange={(e) => setSign({ ...sign, [k]: e.target.value })} /></label>)}
          </div>
        </div>
        <div style={{ display: 'grid', gap: 'var(--space-3)', alignContent: 'start' }}>
          <div className="project-sign lift" aria-label="תצוגת שלט האתר בפורמט האחיד">
            <div className="ps-data">
              <div className="ps-top"><span className="ps-logo">לוגו</span><span className="ps-permit">מס' היתר בנייה: {sign.permit || '..........'}</span></div>
              <div className="ps-title">{sign.project || 'שם הפרויקט'}</div>
              <div className="ps-rows">{SIGN_FIELDS.map(([k, l]) => <div key={k}><span>{l}:</span><span>{sign[k]}</span></div>)}</div>
            </div>
            <div className="ps-render">
              <div className="ps-render-box">הדמיית ההיתר</div>
              <div className="ps-foot">שם החברה, ח.פ. וכתובת הנכס</div>
            </div>
          </div>
          <p className="caption">תצוגה סכמטית לפי טופס הבקשה. קובץ הפורמט הרשמי מתקבל מאדריכלות העיר.</p>
        </div>
      </section>

      <hr className="threshold" />

      <section className="grid-2">
        <div style={{ display: 'grid', gap: 'var(--space-4)', alignContent: 'start' }}>
          <h2>הגדר המדברת</h2>
          <p className="muted">גובה 2 מ', לאורך החזית הראשית, פנל קשיח. 50% תכנים עירוניים בתיאום עם דוברות העירייה, ו-50% תוכן יזמי לפרויקט בלבד. שלט האתר משולב בגדר בכל כניסה.</p>
          <div className="grid-2">
            <label className="field">אורך הגדר הכולל (מ')<input inputMode="decimal" value={length} onChange={(e) => setLength(e.target.value.replace(/[^\d.]/g, ''))} placeholder="לדוגמה: 120" /></label>
            <label className="field">מספר כניסות לאתר<input inputMode="numeric" value={entrances} onChange={(e) => setEntrances(e.target.value.replace(/\D/g, ''))} /></label>
          </div>
        </div>
        <div className="panel panel-sand" style={{ display: 'grid', gap: 'var(--space-4)' }}>
          <div className="table-wrap">
            <table>
              <thead><tr><th></th><th>נדרש</th><th>מטרים</th><th>שטח (מ"ר)</th></tr></thead>
              <tbody>
                <tr><td>חלק היזם</td><td className="mono">50%</td><td className="mono">{half || '—'}</td><td className="mono">{L ? half * 2 : '—'}</td></tr>
                <tr><td>חלק העירייה</td><td className="mono">50%</td><td className="mono">{half || '—'}</td><td className="mono">{L ? half * 2 : '—'}</td></tr>
                <tr><td><b>סה"כ</b></td><td className="mono">100%</td><td className="mono">{L || '—'}</td><td className="mono">{L ? L * 2 : '—'}</td></tr>
              </tbody>
            </table>
          </div>
          <div className="fence-bar" aria-hidden="true">
            <div style={{ flex: 1, background: 'var(--sea-300)', color: '#13222C' }}>עירייה</div>
            <div style={{ flex: 1, background: 'var(--dune-300)', color: '#13222C' }}>יזם</div>
          </div>
          <p className="caption">שלטי אתר נדרשים: {ent}, אחד בכל כניסה.</p>
          <p className="caption">{rate ? `אגרה משוערת לחלק הפרסומי: ${adFee?.toLocaleString('he-IL')} ש"ח (${Number(rate.amount_ils).toLocaleString('he-IL')} ש"ח ${UNIT_LABEL[rate.unit]}, ${SOURCE_LABEL[rate.source]}).` : 'חלקה הפרסומי של הגדר מחויב באגרת שילוט לפי חוק העזר. ' + (d.settings.fees_status?.text || '')}</p>
        </div>
      </section>

      <hr className="threshold" />

      <section className="grid-2">
        <div>
          <h2 style={{ marginBottom: 'var(--space-4)' }}>מסמכים להגשה</h2>
          <ul className="rules">
            {CHECKLIST.map(([k, t, s]) => (
              <li key={k}>
                <Section s={s} />
                <span>{t}</span>
                <button className={`btn btn-sm ${done[k] ? 'selected' : ''}`} onClick={() => setDone((x) => ({ ...x, [k]: !x[k] }))} aria-pressed={!!done[k]}>{done[k] ? 'מוכן' : 'לסמן'}</button>
              </li>
            ))}
          </ul>
        </div>
        <div style={{ display: 'grid', gap: 'var(--space-4)', alignContent: 'start' }}>
          <h2>מסלול האישור</h2>
          <ol className="rules" style={{ listStyle: 'none' }}>
            {['הגשת טופס הבקשה עם הדמיה, מיקום ופריסה', 'תיאום וקבלת אישור אדריכלית העיר', 'העברת הבקשה לוועדת השילוט', 'חתימת פיקוח עירוני ותאריך'].map((t, i) => (
              <li key={t}><span className="section-ref">{i + 1}</span><span>{t}</span><Tag status="info">שלב</Tag></li>
            ))}
          </ol>
          <div className="row no-print">
            <Link to="/check?cat=construction&step=2" className="btn btn-primary">בדיקת התאמה והגשה</Link>
            <button className="btn btn-quiet" onClick={() => window.print()}>הדפסת הדף</button>
          </div>
          <details>
            <summary className="muted" style={{ cursor: 'pointer' }}>הכללים המלאים ({rules.length})</summary>
            <ul className="rules" style={{ marginTop: 'var(--space-3)' }}>{rules.map((r) => <li key={r.id}><Section s={r.section} /><span>{r.text}</span><Tag status="info">{r.kind === 'question' ? 'תנאי' : 'דרישה'}</Tag></li>)}</ul>
          </details>
        </div>
      </section>
    </div>
  )
}
