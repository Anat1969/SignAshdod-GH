import { useState } from 'react'
import { useData } from '../lib/data'
import { useStrip } from '../components/Shell'
import PageGuide from '../components/PageGuide'
import { Loading } from '../components/bits'
import { rateFor, computeFee, UNIT_LABEL, SOURCE_LABEL } from '../lib/check'

export default function Fees() {
  const d = useData()
  const [cat, setCat] = useState('business')
  const [area, setArea] = useState('')
  const [months, setMonths] = useState('12')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const rate = rateFor(d.fees, cat, new Date(date))
  const fee = computeFee(rate, area, Number(months) || 12)
  useStrip('אגרת שילוט', rate ? `${fee != null ? fee.toLocaleString('he-IL') + ' ש"ח' : ''} · ${SOURCE_LABEL[rate.source]}` : 'טבלת התעריפים טרם הוזנה. החישוב יופעל כשהצוות יזין את התעריף המחייב.', 'var(--port-500)')
  if (d.loading) return <Loading />
  return (
    <div className="page">
      <div className="page-head">
        <span className="eyebrow">אגרות</span>
        <h1>מחשבון אגרת שילוט</h1>
        <p className="lead">התעריף נקבע בחוק העזר ומתעדכן על ידי צוות העירייה. כל תעריף מוצג עם מקורו ותאריך תחילתו.</p>
      </div>
      <PageGuide steps={[['בוחרים סוג שלט', !!cat], ['מזינים את שטח השלט במ"ר', !!area], ['קוראים את האגרה המשוערת ואת מקור התעריף', !!area && !!rate]]} />
      <div className="grid-2">
        <div className="panel" style={{ display: 'grid', gap: 'var(--space-4)' }}>
          <label className="field">סוג השלט<select value={cat} onChange={(e) => setCat(e.target.value)}>{d.categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}</select></label>
          <div className="grid-2">
            <label className="field">שטח השלט (מ"ר)<input inputMode="decimal" value={area} onChange={(e) => setArea(e.target.value.replace(/[^\d.]/g, ''))} /></label>
            <label className="field">חודשי הצבה בשנת החיוב<input inputMode="numeric" value={months} onChange={(e) => setMonths(e.target.value.replace(/\D/g, '').slice(0, 2))} /></label>
          </div>
          <label className="field">לתאריך<input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label>
        </div>
        <div className="panel panel-sand sail" style={{ display: 'grid', gap: 'var(--space-3)', alignContent: 'start' }}>
          {rate ? (
            <>
              <div className="figure">{fee?.toLocaleString('he-IL')} ש"ח</div>
              <div className="figure-label">הערכה. החיוב בפועל נקבע באגף הגבייה.</div>
              <p className="caption">תעריף: {Number(rate.amount_ils).toLocaleString('he-IL')} ש"ח {UNIT_LABEL[rate.unit]} · מקור: {SOURCE_LABEL[rate.source]}{rate.source_ref ? ` (${rate.source_ref})` : ''} · בתוקף מ-{rate.valid_from}</p>
              {rate.notes && <p className="caption">{rate.notes}</p>}
            </>
          ) : (
            <>
              <h3>התעריף טרם הוזן</h3>
              <p className="muted">{d.settings.fees_status?.text}</p>
            </>
          )}
        </div>
      </div>
      <hr className="threshold" />
      <div className="grid-2">
        <div>
          <h3 style={{ marginBottom: 'var(--space-3)' }}>מה ידוע על התעריפים</h3>
          <ul className="rules">
            <li><span className="section-ref">עובדה</span><span>התעריפים קבועים בתוספת לחוק עזר לאשדוד (מודעות ושלטים), התשנ"ח-1997.</span><span /></li>
            <li><span className="section-ref">עובדה</span><span>בפברואר 2026 דווח על תיקון להעלאת התעריפים, שטעון אישור מוסדות העירייה ומשרד הפנים. לפי הדיווח, התעריפים לא עודכנו כ-15 שנה.</span><span /></li>
            <li><span className="section-ref">לא ידוע</span><span>אם התיקון כבר בתוקף. יש לאמת מול אגף הגבייה, מחלקת העסקים.</span><span /></li>
            <li><span className="section-ref">טופס הגדר</span><span>החלק הפרסומי של גדר מדברת מחויב באגרת שילוט.</span><span /></li>
          </ul>
        </div>
        <div>
          <h3 style={{ marginBottom: 'var(--space-3)' }}>תעריפים מוזנים</h3>
          {d.fees.length ? (
            <div className="table-wrap"><table>
              <thead><tr><th>סוג</th><th>תעריף</th><th>יחידה</th><th>מקור</th><th>מתאריך</th></tr></thead>
              <tbody>{d.fees.map((f) => <tr key={f.id}><td>{d.categories.find((c) => c.slug === f.category_slug)?.name || 'כללי'}</td><td className="mono">{Number(f.amount_ils).toLocaleString('he-IL')}</td><td>{UNIT_LABEL[f.unit]}</td><td>{SOURCE_LABEL[f.source]}</td><td className="mono">{f.valid_from}</td></tr>)}</tbody>
            </table></div>
          ) : <p className="muted">אין עדיין תעריפים בטבלה.</p>}
        </div>
      </div>
    </div>
  )
}
