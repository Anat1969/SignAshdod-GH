import { useMemo, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import CityMap from '../components/CityMap'
import { useData, rulesFor, categoryBySlug } from '../lib/data'
import { useStrip, useToast } from '../components/Shell'
import PageGuide from '../components/PageGuide'
import { geocode, zoneAt } from '../lib/geo'
import { evaluate, nearbyPreservation, OVERALL_TEXT, rateFor, computeFee, UNIT_LABEL, SOURCE_LABEL } from '../lib/check'
import { land } from '../lib/landscapes'
import { Tag, Section, Loading, SchemaNotice } from '../components/bits'
import { supabase } from '../lib/supabase'

const STEPS = ['מיקום', 'סוג שלט', 'שאלות', 'תוצאה', 'הגשה']

export default function Check() {
  const d = useData()
  const toast = useToast()
  const [params, setParams] = useSearchParams()
  const step = Math.min(4, Math.max(0, Number(params.get('step') || 0)))
  const cat = params.get('cat') || ''
  const setStep = (s) => { const p = new URLSearchParams(params); p.set('step', String(s)); setParams(p) }
  const setCat = (c) => { const p = new URLSearchParams(params); p.set('cat', c); p.set('step', '2'); setParams(p); setAnswers({}) }

  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [geoError, setGeoError] = useState('')
  const [point, setPoint] = useState(null)
  const [address, setAddress] = useState('')
  const [answers, setAnswers] = useState({})
  const [form, setForm] = useState({ applicant_name: '', phone: '', email: '', business_name: '', sign_area_sqm: '' })
  const [sending, setSending] = useState(false)
  const [code, setCode] = useState('')
  const [sendError, setSendError] = useState('')

  const zone = useMemo(() => (point ? zoneAt(point, d.zones || []) : null), [point, d.zones])
  const nearby = useMemo(() => nearbyPreservation(point, d.buildings), [point, d.buildings])
  const category = categoryBySlug(d.categories, cat)
  const rules = useMemo(() => rulesFor(d.rules, cat), [d.rules, cat])
  const result = useMemo(() => evaluate(rules, answers, zone, nearby), [rules, answers, zone, nearby])
  const questions = rules.filter((r) => r.kind === 'question')
  const answered = questions.filter((q) => answers[q.id] !== undefined).length
  const rate = rateFor(d.fees, cat)
  const fee = computeFee(rate, form.sign_area_sqm)

  const stripText = step === 0 ? (zone ? `${zone.name}: ${zone.note || ''}` : 'הקלידו כתובת או לחצו על המפה.')
    : step === 1 ? (zone ? `אזור: ${zone.name}. בחרו את סוג השלט.` : 'בחרו את סוג השלט.')
    : step === 2 ? `${category?.name || ''}: נענו ${answered} מתוך ${questions.length} שאלות.`
    : step === 3 ? OVERALL_TEXT[result.overall]
    : code ? `הבקשה נקלטה. קוד מעקב: ${code}` : 'פרטי הקשר ושליחה לצוות אדריכלות העיר.'
  const stripColor = step === 3 ? ({ pass: 'var(--nahal-500)', review: 'var(--dune-500)', fail: 'var(--port-500)', open: 'var(--sea-500)' })[result.overall]
    : zone ? land(zone.landscape).c500 : 'var(--port-500)'
  useStrip(`שלב ${step + 1} מתוך 5 · ${STEPS[step]}`, stripText, stripColor)

  if (d.loading) return <Loading />

  const search = async (e) => {
    e?.preventDefault()
    setGeoError(''); setSearching(true)
    try {
      const r = await geocode(query)
      setResults(r)
      if (!r.length) setGeoError('לא נמצאה כתובת. נסו ניסוח אחר, או לחצו על המיקום במפה.')
      if (r.length === 1) choose(r[0])
    } catch (err) { setGeoError(err.message) }
    setSearching(false)
  }
  const choose = (r) => { setPoint([r.lng, r.lat]); setAddress(r.label); setResults([]) }

  const submit = async (e) => {
    e.preventDefault()
    setSendError(''); setSending(true)
    const check_result = { overall: result.overall, items: result.items.filter((i) => i.status !== 'info').map((i) => ({ section: i.rule.section, text: i.rule.text, status: i.status, why: i.why || null })) }
    const payload = { ...form, address, lat: point?.[1] ?? '', lng: point?.[0] ?? '', zone_id: zone?.id || null, category_slug: cat,
      answers: Object.fromEntries(questions.map((q) => [q.section + ' | ' + q.text, answers[q.id] ?? null])), check_result }
    const { data, error } = await supabase.rpc('ks_submit_application', { p: payload })
    setSending(false)
    if (error) { setSendError(d.schemaReady ? 'השליחה נכשלה: ' + error.message : 'שמירת בקשות תופעל לאחר הקמת מסד הנתונים. אפשר להדפיס את הסיכום ולהגיש אותו.'); return }
    setCode(data)
    toast('הבקשה נקלטה')
  }

  return (
    <div className="page">
      <div className="page-head">
        <span className="eyebrow">בעל עסק · בדיקת התאמה ראשונית</span>
        <h1>מה מותר לתלות כאן?</h1>
        <p className="lead">הבדיקה אינה אישור. היא מראה מראש מה תואם, מה ייבדק בוועדה ומה כדאי לשנות, עם הפניה לסעיף.</p>
      </div>
      <PageGuide steps={[['מסמנים את מקום השלט: כתובת או לחיצה על המפה', !!point], ['בוחרים את סוג השלט', !!cat], ['עונים על השאלות: כן, לא או לא יודע', step >= 3], ['קוראים את התוצאה לפי סעיף', step >= 4], ['מגישים בקשה ומקבלים קוד מעקב', !!code]]}
        note="התוצאה אינה אישור. היא מראה מה תואם, מה ייבדק בוועדה ומה כדאי לשנות." />

      <div className="steps no-print" role="tablist">
        {STEPS.map((s, i) => (
          <button key={s} className={i === step ? 'current' : ''} disabled={(i >= 1 && !point && i > step) || (i >= 2 && !cat)} onClick={() => setStep(i)} role="tab" aria-selected={i === step}>
            {i + 1}. {s}
          </button>
        ))}
      </div>

      {step === 0 && (
        <div className="split">
          <div className="sticky" style={{ display: 'grid', gap: 'var(--space-4)' }}>
            <form onSubmit={search} className="row">
              <label className="field" style={{ flex: '1 1 240px' }}>כתובת באשדוד
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="לדוגמה: שבי ציון 12" />
              </label>
              <button className="btn btn-primary" disabled={searching || !query.trim()}>{searching ? 'מחפשת...' : 'איתור'}</button>
            </form>
            {geoError && <p className="caption">{geoError}</p>}
            {results.length > 1 && (
              <div className="choice-grid">{results.map((r) => <button key={r.label + r.lat} className="choice" onClick={() => choose(r)}>{r.label}</button>)}</div>
            )}
            {point ? (
              <div className="panel" style={{ borderInlineStart: `6px solid ${land(zone?.landscape).c500}` }}>
                <div className="caption">המיקום שנבחר</div>
                <h3>{address || 'נקודה על המפה'}</h3>
                <p className="muted" style={{ marginTop: 8 }}>{zone ? <><b>{zone.name}</b>. {zone.note}</> : 'המיקום מחוץ לאזורים הממופים. הבדיקה תושלם ידנית.'}</p>
                {nearby.length > 0 && <p className="caption">מבנה לשימור בקרבת מקום: {nearby.map((b) => b.name).slice(0, 3).join(', ')}</p>}
                <div className="row" style={{ marginTop: 'var(--space-3)' }}>
                  <button className="btn btn-primary" onClick={() => setStep(1)}>המשך לבחירת סוג השלט</button>
                </div>
              </div>
            ) : <p className="muted">אפשר גם ללחוץ ישירות על המפה.</p>}
          </div>
          <CityMap zones={d.zones} selectedZoneId={zone?.id} marker={point} fitTo={point} height={520}
            onMapClick={(p) => { setPoint(p); setAddress('') }} />
        </div>
      )}

      {step === 1 && (
        <div className="choice-grid">
          {d.categories.map((c) => (
            <button key={c.slug} className={`choice ${c.slug === cat ? 'selected' : ''}`} onClick={() => setCat(c.slug)} style={{ borderTop: `4px solid ${land(c.landscape).c500}` }}>
              <Section s={c.section} />
              <strong style={{ fontWeight: 500, fontSize: 18 }}>{c.name}</strong>
              <small>{c.summary}</small>
            </button>
          ))}
        </div>
      )}

      {step === 2 && category && (
        <div style={{ display: 'grid', gap: 'var(--space-5)' }}>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <h2>{category.name}</h2>
            <Link to={`/guide/${category.slug}`} className="btn btn-quiet">כל ההנחיות לסוג זה</Link>
          </div>
          <ul className="rules">
            {questions.map((q) => (
              <li key={q.id}>
                <Section s={q.section} />
                <span>{q.text}</span>
                <span className="yesno">
                  {[['yes', 'כן'], ['no', 'לא'], ['unknown', 'לא יודע']].map(([v, l]) => (
                    <button key={v} className={`btn btn-sm yn yn-${v} ${answers[q.id] === v ? 'selected' : ''}`} onClick={() => setAnswers((a) => ({ ...a, [q.id]: v }))} aria-pressed={answers[q.id] === v}>{l}</button>
                  ))}
                </span>
              </li>
            ))}
            {rules.filter((r) => r.kind === 'zone').map((r) => {
              const it = result.items.find((i) => i.rule.id === r.id)
              return <li key={r.id}><Section s={r.section} /><span>{r.text}<br /><span className="caption">{it?.why}</span></span><Tag status={it?.status} /></li>
            })}
          </ul>
          <div className="row">
            <button className="btn btn-primary" onClick={() => setStep(3)} disabled={answered < questions.length}>לתוצאה</button>
            {answered < questions.length && <span className="caption">נותרו {questions.length - answered} שאלות</span>}
          </div>
        </div>
      )}

      {step === 3 && category && (
        <div style={{ display: 'grid', gap: 'var(--space-6)' }}>
          <div className="panel sail lift" style={{ borderInlineStart: `6px solid ${stripColor}` }}>
            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div className="caption">{category.name} · {address || 'נקודה על המפה'}{zone ? ` · ${zone.name}` : ''}</div>
                <h2 style={{ marginTop: 6 }}>{OVERALL_TEXT[result.overall]}</h2>
              </div>
              <div className="row">
                <Tag status="pass">{result.counts.pass} תואמים</Tag>
                <Tag status="review">{result.counts.review} לבדיקה</Tag>
                <Tag status="fail">{result.counts.fail} לא תואמים</Tag>
              </div>
            </div>
          </div>
          <div>
            <h3 style={{ marginBottom: 'var(--space-3)' }}>תוצאה לפי סעיף</h3>
            <ul className="rules">
              {result.items.filter((i) => i.status !== 'info').map((i) => (
                <li key={i.rule.id}><Section s={i.rule.section} /><span>{i.rule.text}{i.why && <><br /><span className="caption">{i.why}</span></>}</span><Tag status={i.status} /></li>
              ))}
            </ul>
          </div>
          <div>
            <h3 style={{ marginBottom: 'var(--space-3)' }}>דרישות ומסמכים</h3>
            <ul className="rules">
              {result.items.filter((i) => i.status === 'info').map((i) => (
                <li key={i.rule.id}><Section s={i.rule.section} /><span>{i.rule.text}</span><Tag status="info" /></li>
              ))}
            </ul>
          </div>
          <div className="row no-print">
            <button className="btn btn-primary" onClick={() => setStep(4)}>המשך להגשה</button>
            <button className="btn" onClick={() => setStep(2)}>שינוי תשובות</button>
            <button className="btn btn-quiet" onClick={() => window.print()}>הדפסת הסיכום</button>
          </div>
        </div>
      )}

      {step === 4 && category && (
        <div className="grid-2">
          {code ? (
            <div className="panel sail lift">
              <div className="caption">קוד מעקב</div>
              <div className="figure" style={{ margin: '8px 0 16px' }}>{code}</div>
              <p>הבקשה הועברה לצוות אדריכלות העיר. אפשר לבדוק את מצבה בכל עת.</p>
              <Link className="btn btn-primary" to={`/track?code=${code}`}>מעקב אחר הבקשה</Link>
            </div>
          ) : (
            <form className="panel" onSubmit={submit} style={{ display: 'grid', gap: 'var(--space-4)' }}>
              {!d.schemaReady && <SchemaNotice />}
              <label className="field">שם המבקש<input required value={form.applicant_name} onChange={(e) => setForm({ ...form, applicant_name: e.target.value })} /></label>
              <label className="field">שם העסק או הפרויקט<input value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} /></label>
              <div className="grid-2">
                <label className="field">טלפון<input inputMode="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
                <label className="field">דוא"ל<input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
              </div>
              <label className="field">שטח השלט (מ"ר)<input inputMode="decimal" value={form.sign_area_sqm} onChange={(e) => setForm({ ...form, sign_area_sqm: e.target.value.replace(/[^\d.]/g, '') })} /></label>
              {sendError && <div className="notice notice-warn">{sendError}</div>}
              <div className="row"><button className="btn btn-primary" disabled={sending || !form.applicant_name.trim()}>{sending ? 'שולחת...' : 'שליחת הבקשה'}</button></div>
              <p className="caption">הבקשה הרשמית מוגשת בפורטל העירייה. כאן נשמר תיק מוכן ומלא לצוות.</p>
            </form>
          )}
          <div className="panel panel-sand" style={{ display: 'grid', gap: 'var(--space-3)', alignContent: 'start' }}>
            <h3>אגרה ותוקף</h3>
            {rate ? (
              <>
                <div className="figure">{fee != null ? `${fee.toLocaleString('he-IL')} ש"ח` : '—'}</div>
                <p className="caption">{Number(rate.amount_ils).toLocaleString('he-IL')} ש"ח {UNIT_LABEL[rate.unit]} · מקור: {SOURCE_LABEL[rate.source]} · בתוקף מ-{rate.valid_from}. הערכה בלבד.</p>
              </>
            ) : <p className="muted">{d.settings.fees_status?.text}</p>}
            <p className="muted">תוקף הרישיון: {category.default_validity_months ? `${category.default_validity_months} חודשים לסוג שלט זה (${category.section}).` : d.settings.license_policy?.label + '. אין חידוש שנתי.'}</p>
          </div>
        </div>
      )}
    </div>
  )
}
