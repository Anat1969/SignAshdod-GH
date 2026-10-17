import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import CityMap from '../components/CityMap'
import { supabase } from '../lib/supabase'
import { signInFromPastedLink } from '../lib/authRescue'
import DocImport from '../components/DocImport'
import { uploadDoc } from '../lib/uploadDoc'
import { useData } from '../lib/data'
import { useStrip, useToast } from '../components/Shell'
import PageGuide from '../components/PageGuide'
import { Tag, Section, Loading, SchemaNotice } from '../components/bits'
import { UNIT_LABEL, SOURCE_LABEL } from '../lib/check'

const STATUSES = ['התקבלה', 'בבדיקת אדריכלית העיר', 'בוועדת שילוט', 'בפיקוח', 'אושרה', 'הוחזרה לתיקון', 'נדחתה']
const STAGES = ['אדריכלית העיר', 'ועדת שילוט', 'פיקוח']
const DECISIONS = ['אושר', 'הוחזר לתיקון', 'נדחה', 'הערה']
const TABS = [['apps', 'בקשות'], ['intake', 'קליטה ידנית'], ['reports', 'דיווחים'], ['survey', 'סקר שילוט קיים'], ['fees', 'תעריפים'], ['settings', 'תוקף והגדרות']]
const statusTag = (s) => s === 'אושרה' ? 'pass' : s === 'נדחתה' ? 'fail' : s === 'הוחזרה לתיקון' ? 'review' : 'neutral'

function Login() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [code, setCode] = useState('')
  const [err, setErr] = useState('')
  const [pasted, setPasted] = useState('')
  const [rescueErr, setRescueErr] = useState('')
  const [busy, setBusy] = useState(false)
  const rescue = async (e) => {
    e.preventDefault(); setRescueErr(''); setBusy(true)
    const r = await signInFromPastedLink(pasted)
    setBusy(false)
    if (r.error) setRescueErr(r.error)
  }
  const send = async (e) => {
    e.preventDefault(); setErr('')
    const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false, emailRedirectTo: window.location.origin + '/staff' } })
    if (error) setErr(/not allowed|signups/i.test(error.message) ? 'כתובת הדוא"ל אינה רשומה כצוות.' : 'השליחה נכשלה: ' + error.message)
    else setSent(true)
  }
  const verify = async (e) => {
    e.preventDefault(); setErr('')
    const { error } = await supabase.auth.verifyOtp({ email, token: code.trim(), type: 'email' })
    if (error) setErr('הקוד אינו תקין או שפג תוקפו.')
  }
  return (
    <div className="page" style={{ maxWidth: 560 }}>
      <div className="page-head"><span className="eyebrow">צוות העירייה</span><h1>כניסת צוות</h1>
        <p className="lead">אדריכלות העיר, ועדת השילוט והפיקוח. הכניסה בקישור או בקוד שנשלח לדוא"ל.</p></div>
      <PageGuide steps={[['מזינים דוא"ל של צוות ושולחים', sent], ['לוחצים על הקישור במייל, או מדביקים אותו בשדה למטה', false], ['נכנסים ללוח הצוות: בקשות, דיווחים ותעריפים', false]]} />
      <form className="panel" onSubmit={sent ? verify : send} style={{ display: 'grid', gap: 'var(--space-4)' }}>
        <label className="field">דוא"ל<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} dir="ltr" disabled={sent} /></label>
        {sent && <><p className="muted">נשלח מייל. לחצו על הקישור שבו, או הזינו כאן את הקוד אם הופיע במייל.</p>
          <label className="field">קוד מהמייל<input value={code} onChange={(e) => setCode(e.target.value)} inputMode="numeric" dir="ltr" /></label></>}
        {err && <div className="notice notice-warn">{err}</div>}
        <div className="row">
          <button className="btn btn-primary" disabled={sent ? !code.trim() : !email.trim()}>{sent ? 'כניסה עם קוד' : 'שליחת קישור כניסה'}</button>
          {sent && <button type="button" className="btn btn-quiet" onClick={() => { setSent(false); setCode('') }}>דוא"ל אחר</button>}
        </div>
      </form>
      <form className="panel rescue" onSubmit={rescue}>
        <span className="eyebrow">הקישור מהמייל פתח דף שגיאה או localhost?</span>
        <p className="muted">העתיקו את הקישור מהכפתור במייל (לחיצה ימנית, "העתקת כתובת הקישור"), או את הכתובת המלאה של הדף שנפתח, והדביקו כאן.</p>
        <label className="field">הקישור מהמייל או הכתובת שנפתחה<input value={pasted} onChange={(e) => setPasted(e.target.value)} dir="ltr" placeholder="https://...  או  http://localhost:3000/#access_token=..." /></label>
        {rescueErr && <div className="notice notice-warn">{rescueErr}</div>}
        <div className="row"><button className="btn" disabled={!pasted.trim() || busy}>{busy ? 'נכנסים...' : 'כניסה עם הקישור'}</button></div>
      </form>
    </div>
  )
}

function Applications({ d }) {
  const toast = useToast()
  const [rows, setRows] = useState(null)
  const [filter, setFilter] = useState('פתוחות')
  const [sel, setSel] = useState(null)
  const [reviews, setReviews] = useState([])
  const [history, setHistory] = useState([])
  const [rv, setRv] = useState({ stage: STAGES[0], decision: 'הערה', sections: '', comment: '' })
  const load = useCallback(async () => {
    const { data } = await supabase.from('ks_applications').select('*').order('created_at', { ascending: false }).limit(300)
    setRows(data || [])
  }, [])
  useEffect(() => { load() }, [load])
  const open = async (r) => {
    setSel(r)
    const [a, b] = await Promise.all([
      supabase.from('ks_reviews').select('*').eq('application_id', r.id).order('created_at'),
      supabase.from('ks_license_history').select('*').eq('application_id', r.id).order('changed_at'),
    ])
    setReviews(a.data || []); setHistory(b.data || [])
  }
  const update = async (patch) => {
    const { data, error } = await supabase.from('ks_applications').update(patch).eq('id', sel.id).select().single()
    if (error) { toast('העדכון נכשל'); return }
    setSel(data); setRows((rs) => rs.map((x) => (x.id === data.id ? data : x))); toast('נשמר')
    const h = await supabase.from('ks_license_history').select('*').eq('application_id', sel.id).order('changed_at')
    setHistory(h.data || [])
  }
  const openDoc = async (path) => {
    const { data, error } = await supabase.storage.from('ks-docs').createSignedUrl(path, 300)
    if (error) { toast('לא ניתן לפתוח את המסמך'); return }
    window.open(data.signedUrl, '_blank', 'noopener')
  }
  const addReview = async (e) => {
    e.preventDefault()
    const sections = rv.sections.split(/[,،]/).map((s) => s.trim()).filter(Boolean)
    if ((rv.decision === 'הוחזר לתיקון' || rv.decision === 'נדחה') && !sections.length) { toast('החלטה כזו מחייבת הפניה לסעיף'); return }
    const { data, error } = await supabase.from('ks_reviews').insert({ application_id: sel.id, stage: rv.stage, decision: rv.decision, sections, comment: rv.comment || null, signed_by: d.session?.user?.email }).select().single()
    if (error) { toast('השמירה נכשלה'); return }
    setReviews((x) => [...x, data]); setRv({ ...rv, comment: '', sections: '' }); toast('ההחלטה נרשמה')
    const next = rv.decision === 'נדחה' ? 'נדחתה' : rv.decision === 'הוחזר לתיקון' ? 'הוחזרה לתיקון'
      : rv.decision === 'אושר' ? (rv.stage === 'אדריכלית העיר' ? 'בוועדת שילוט' : rv.stage === 'ועדת שילוט' ? 'בפיקוח' : 'אושרה') : null
    if (next && next !== sel.status) update({ status: next })
  }
  if (!rows) return <p className="muted">טוען בקשות...</p>
  const shown = rows.filter((r) => filter === 'הכול' ? true : filter === 'פתוחות' ? !['אושרה', 'נדחתה'].includes(r.status) : r.status === filter)
  const catName = (s) => d.categories.find((c) => c.slug === s)?.name || s
  return (
    <div className="split">
      <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
        <div className="row">{['פתוחות', 'הכול', ...STATUSES].map((s) => <button key={s} className={`btn btn-sm ${filter === s ? 'selected' : ''}`} onClick={() => setFilter(s)}>{s} ({s === 'הכול' ? rows.length : s === 'פתוחות' ? rows.filter((r) => !['אושרה', 'נדחתה'].includes(r.status)).length : rows.filter((r) => r.status === s).length})</button>)}</div>
        <div className="table-wrap"><table>
          <thead><tr><th>קוד</th><th>סוג</th><th>כתובת</th><th>בדיקה</th><th>סטטוס</th></tr></thead>
          <tbody>
            {shown.map((r) => <tr key={r.id} className="clickable" onClick={() => open(r)} style={sel?.id === r.id ? { outline: '2px solid var(--focus)' } : null}>
              <td className="mono">{r.tracking_code}</td><td>{catName(r.category_slug)}</td><td>{r.address || '—'}</td>
              <td><Tag status={r.check_result?.overall || 'open'} /></td><td><Tag status={statusTag(r.status)}>{r.status}</Tag></td></tr>)}
            {!shown.length && <tr><td colSpan={5} className="muted">אין בקשות בסינון הזה.</td></tr>}
          </tbody>
        </table></div>
      </div>
      <div className="sticky">
        {!sel ? <div className="panel panel-sand"><p className="muted">בחרו בקשה מהרשימה.</p></div> : (
          <div className="panel" style={{ display: 'grid', gap: 'var(--space-4)', maxHeight: 'calc(100vh - 140px)', overflow: 'auto' }}>
            <div className="row" style={{ justifyContent: 'space-between' }}><span className="mono">{sel.tracking_code}</span><Tag status={statusTag(sel.status)}>{sel.status}</Tag></div>
            <h3>{sel.business_name || sel.applicant_name}</h3>
            <p className="caption">{catName(sel.category_slug)} · {sel.address || 'ללא כתובת'} · {sel.applicant_name} · {sel.phone || ''} {sel.email || ''}{sel.sign_area_sqm ? ` · ${sel.sign_area_sqm} מ"ר` : ''}</p>
            {(sel.notes || sel.source !== 'online' || sel.documents?.length > 0) && (
              <div className="panel-sand" style={{ padding: 'var(--space-3)', display: 'grid', gap: 6 }}>
                <span className="caption">מקור: {({ online: 'הגשה באתר', manual: 'קליטה ידנית', document: 'נקלט ממסמך', site: 'בקשת שלט אתר' })[sel.source] || sel.source}</span>
                {sel.notes && <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{sel.notes}</p>}
                {(sel.documents || []).filter((x) => x?.path).map((x) => <button key={x.path} className="btn btn-sm" onClick={() => openDoc(x.path)}>פתיחת המסמך: {x.name}</button>)}
              </div>
            )}
            <div className="grid-2">
              <label className="field">סטטוס<select value={sel.status} onChange={(e) => update({ status: e.target.value })}>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select></label>
              <label className="field">תוקף רישיון
                <input type="date" value={sel.license_valid_until || ''} onChange={(e) => update({ license_valid_until: e.target.value || null })} />
              </label>
            </div>
            <div className="row"><span className="caption">{sel.license_valid_until ? `בתוקף עד ${sel.license_valid_until}` : 'בתוקף עד שינוי בשלט או הסרתו (אין חידוש שנתי)'}</span>
              {sel.license_valid_until && <button className="btn btn-sm btn-quiet" onClick={() => update({ license_valid_until: null })}>ללא תאריך תפוגה</button>}</div>
            <div>
              <h3 style={{ fontSize: 17, marginBottom: 8 }}>תוצאת הבדיקה של המבקש</h3>
              <ul className="rules">{(sel.check_result?.items || []).map((i, k) => <li key={k}><Section s={i.section} /><span>{i.text}{i.why && <><br /><span className="caption">{i.why}</span></>}</span><Tag status={i.status} /></li>)}</ul>
            </div>
            <form onSubmit={addReview} style={{ display: 'grid', gap: 'var(--space-3)' }}>
              <h3 style={{ fontSize: 17 }}>רישום החלטה</h3>
              <div className="grid-2">
                <label className="field">שלב<select value={rv.stage} onChange={(e) => setRv({ ...rv, stage: e.target.value })}>{STAGES.map((s) => <option key={s}>{s}</option>)}</select></label>
                <label className="field">החלטה<select value={rv.decision} onChange={(e) => setRv({ ...rv, decision: e.target.value })}>{DECISIONS.map((s) => <option key={s}>{s}</option>)}</select></label>
              </div>
              <label className="field">סעיפים (מופרדים בפסיק{['הוחזר לתיקון', 'נדחה'].includes(rv.decision) ? ', חובה' : ''})<input value={rv.sections} onChange={(e) => setRv({ ...rv, sections: e.target.value })} placeholder="2.2.3 ו, 2.1.6" /></label>
              <label className="field">הערה<textarea value={rv.comment} onChange={(e) => setRv({ ...rv, comment: e.target.value })} /></label>
              <div className="row"><button className="btn btn-primary">רישום ההחלטה</button></div>
            </form>
            {reviews.length > 0 && <div><h3 style={{ fontSize: 17, marginBottom: 8 }}>החלטות</h3>
              <ul className="rules">{reviews.map((r) => <li key={r.id}><span className="section-ref">{r.stage}</span><span>{r.decision}{r.sections?.length ? ` · סעיפים ${r.sections.join(', ')}` : ''}{r.comment ? `. ${r.comment}` : ''}<br /><span className="caption">{r.signed_by} · {new Date(r.created_at).toLocaleString('he-IL')}</span></span><span /></li>)}</ul></div>}
            {history.length > 0 && <div><h3 style={{ fontSize: 17, marginBottom: 8 }}>היסטוריה</h3>
              <ul className="rules">{history.map((h) => <li key={h.id}><span className="section-ref">{h.field === 'status' ? 'סטטוס' : 'תוקף'}</span><span>{h.old_value} ← {h.new_value}<br /><span className="caption">{h.changed_by} · {new Date(h.changed_at).toLocaleString('he-IL')}</span></span><span /></li>)}</ul></div>}
          </div>
        )}
      </div>
    </div>
  )
}

const EMPTY_INTAKE = { category_slug: 'business', applicant_name: '', business_name: '', address: '', phone: '', email: '', sign_area_sqm: '', notes: '' }
function Intake({ d, onSaved }) {
  const toast = useToast()
  const [f, setF] = useState(EMPTY_INTAKE)
  const [file, setFile] = useState(null)
  const [filled, setFilled] = useState({})
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState([])
  const set = (k) => (e) => setF({ ...f, [k]: k === 'sign_area_sqm' ? e.target.value.replace(/[^\d.]/g, '') : e.target.value })
  const cls = (k) => (filled[k] ? 'just-filled' : '')
  const fill = (found, doc) => {
    const next = { ...f }; const mark = {}
    for (const k of Object.keys(EMPTY_INTAKE)) if (found[k]) { next[k] = k === 'sign_area_sqm' ? String(found[k]).replace(/[^\d.]/g, '') : found[k]; mark[k] = true }
    if (found.permit) { next.notes = [next.notes, `מספר היתר: ${found.permit}`].filter(Boolean).join('\n'); mark.notes = true }
    setF(next); setFile(doc); setFilled(mark); setTimeout(() => setFilled({}), 1700)
    toast(Object.keys(mark).length ? `מולאו ${Object.keys(mark).length} שדות. בדקו ושמרו.` : 'לא נמצאו שדות למילוי')
  }
  const save = async (e) => {
    e.preventDefault(); setBusy(true)
    const documents = file ? [await uploadDoc(file)].filter(Boolean) : []
    const { data, error } = await supabase.rpc('ks_submit_application', { p: { ...f, source: file ? 'document' : 'manual', documents } })
    setBusy(false)
    if (error) { toast('השמירה נכשלה: ' + error.message); return }
    setDone((x) => [{ code: data, name: f.business_name || f.applicant_name }, ...x])
    toast(`נשמר. קוד מעקב ${data}`)
    setF(EMPTY_INTAKE); setFile(null); onSaved?.()
  }
  return (
    <div className="split">
      <form className="panel" onSubmit={save} style={{ display: 'grid', gap: 'var(--space-4)' }}>
        <h3>קליטת בקשה שהגיעה ידנית</h3>
        <DocImport categories={d.categories} onFill={fill} title="טענו את טופס הבקשה, לחצו מלא, בדקו ושמרו" />
        <label className="field">סוג השלט<select className={cls('category_slug')} value={f.category_slug} onChange={set('category_slug')}>{d.categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}</select></label>
        <div className="grid-2">
          <label className="field">שם המבקש<input className={cls('applicant_name')} required value={f.applicant_name} onChange={set('applicant_name')} /></label>
          <label className="field">שם העסק או הפרויקט<input className={cls('business_name')} value={f.business_name} onChange={set('business_name')} /></label>
        </div>
        <label className="field">כתובת השלט<input className={cls('address')} value={f.address} onChange={set('address')} /></label>
        <div className="grid-2">
          <label className="field">טלפון נייד<input className={cls('phone')} inputMode="tel" value={f.phone} onChange={set('phone')} /></label>
          <label className="field">דוא"ל<input className={cls('email')} type="email" value={f.email} onChange={set('email')} /></label>
        </div>
        <label className="field">שטח השלט (מ"ר)<input className={cls('sign_area_sqm')} inputMode="decimal" value={f.sign_area_sqm} onChange={set('sign_area_sqm')} /></label>
        <label className="field">תיאור והערות<textarea className={cls('notes')} value={f.notes} onChange={set('notes')} /></label>
        {file && <p className="caption">המסמך "{file.name}" יישמר עם הבקשה.</p>}
        <div className="row"><button className="btn btn-primary" disabled={busy || !f.applicant_name.trim()}>{busy ? 'שומרת...' : 'שמירת הבקשה'}</button>
          <button type="button" className="btn btn-quiet" onClick={() => { setF(EMPTY_INTAKE); setFile(null) }}>ניקוי</button></div>
      </form>
      <div className="sticky panel panel-sand" style={{ display: 'grid', gap: 'var(--space-3)', alignContent: 'start' }}>
        <span className="eyebrow">נקלטו עכשיו</span>
        {!done.length ? <p className="muted">בקשות שנשמרות כאן מופיעות ברשימה, ומיד גם בלשונית הבקשות עם קוד מעקב.</p>
          : <ul className="rules">{done.map((x) => <li key={x.code}><span className="section-ref">{x.code}</span><span>{x.name}</span><Tag status="pass">נשמר</Tag></li>)}</ul>}
      </div>
    </div>
  )
}

function Reports({ d }) {
  const toast = useToast()
  const [rows, setRows] = useState(null)
  const [active, setActive] = useState(null)
  useEffect(() => { supabase.from('ks_reports').select('*').order('created_at', { ascending: false }).then(({ data }) => setRows(data || [])) }, [])
  const setStatus = async (id, status) => {
    const { error } = await supabase.from('ks_reports').update({ status }).eq('id', id)
    if (error) return toast('העדכון נכשל')
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, status } : r))); toast('עודכן')
  }
  if (!rows) return <p className="muted">טוען דיווחים...</p>
  return (
    <div className="split">
      <div className="table-wrap"><table>
        <thead><tr><th>תאריך</th><th>תיאור</th><th>סטטוס</th></tr></thead>
        <tbody>{rows.map((r) => <tr key={r.id} className="clickable" onClick={() => setActive(r.id)}>
          <td className="mono">{new Date(r.created_at).toLocaleDateString('he-IL')}</td>
          <td>{r.description}{r.address && <><br /><span className="caption">{r.address}</span></>}{r.contact && <><br /><span className="caption">קשר: {r.contact}</span></>}</td>
          <td><select value={r.status} onClick={(e) => e.stopPropagation()} onChange={(e) => setStatus(r.id, e.target.value)}>{['חדש', 'בטיפול', 'טופל', 'לא רלוונטי'].map((s) => <option key={s}>{s}</option>)}</select></td></tr>)}
          {!rows.length && <tr><td colSpan={3} className="muted">אין דיווחים.</td></tr>}</tbody>
      </table></div>
      <div className="sticky"><CityMap zones={d.zones} showZones={false} height={520} activePointId={active} onPointClick={setActive}
        points={rows.map((r) => ({ id: r.id, lng: r.lng, lat: r.lat, landscape: r.status === 'חדש' ? 'port' : 'estuary', label: '' }))} /></div>
    </div>
  )
}

function Survey({ d }) {
  const toast = useToast()
  const [rows, setRows] = useState([])
  const [pt, setPt] = useState(null)
  const [f, setF] = useState({ category_slug: 'business', legal_status: 'לא ידוע', address: '', note: '' })
  useEffect(() => { supabase.from('ks_survey_signs').select('*').order('created_at', { ascending: false }).then(({ data }) => setRows(data || [])) }, [])
  const add = async (e) => {
    e.preventDefault()
    const { data, error } = await supabase.from('ks_survey_signs').insert({ ...f, lat: pt[1], lng: pt[0], surveyed_by: d.session?.user?.email }).select().single()
    if (error) return toast('השמירה נכשלה')
    setRows((r) => [data, ...r]); setPt(null); setF({ ...f, address: '', note: '' }); toast('השלט נוסף לסקר')
  }
  const counts = useMemo(() => Object.fromEntries(['ברישיון', 'ללא רישיון', 'חורג מהרישיון', 'לא ידוע'].map((s) => [s, rows.filter((r) => r.legal_status === s).length])), [rows])
  return (
    <div className="split">
      <form className="sticky panel" onSubmit={add} style={{ display: 'grid', gap: 'var(--space-3)' }}>
        <p className="muted">סקר השילוט הקיים הוא שכבת הבסיס של תוכנית האב. סמנו שלט על המפה ותעדו אותו.</p>
        <div className="grid-2">{Object.entries(counts).map(([k, v]) => <div key={k}><div className="figure" style={{ fontSize: 32 }}>{v}</div><div className="figure-label">{k}</div></div>)}</div>
        <label className="field">סוג<select value={f.category_slug} onChange={(e) => setF({ ...f, category_slug: e.target.value })}>{d.categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}</select></label>
        <label className="field">מצב חוקי<select value={f.legal_status} onChange={(e) => setF({ ...f, legal_status: e.target.value })}>{['ברישיון', 'ללא רישיון', 'חורג מהרישיון', 'לא ידוע'].map((s) => <option key={s}>{s}</option>)}</select></label>
        <label className="field">כתובת<input value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} /></label>
        <label className="field">הערה<input value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} /></label>
        <div className="row"><button className="btn btn-primary" disabled={!pt}>הוספה לסקר</button>{!pt && <span className="caption">סמנו מיקום על המפה</span>}</div>
      </form>
      <CityMap zones={d.zones} height={600} marker={pt} onMapClick={setPt}
        points={rows.map((r) => ({ id: r.id, lng: r.lng, lat: r.lat, landscape: r.legal_status === 'ברישיון' ? 'nahal' : r.legal_status === 'לא ידוע' ? 'sea' : 'port', label: '' }))} />
    </div>
  )
}

function FeesAdmin({ d }) {
  const toast = useToast()
  const blank = { category_slug: '', unit: 'sqm_year', amount_ils: '', valid_from: new Date().toISOString().slice(0, 10), source: 'bylaw_1997', source_ref: '', notes: '' }
  const [f, setF] = useState(blank)
  const save = async (e) => {
    e.preventDefault()
    const row = { ...f, category_slug: f.category_slug || null, amount_ils: Number(f.amount_ils), updated_by: d.session?.user?.email }
    const { error } = await supabase.from('ks_fee_rates').insert(row)
    if (error) return toast('השמירה נכשלה')
    toast('התעריף נשמר'); setF(blank); d.reload()
  }
  const remove = async (id) => { const { error } = await supabase.from('ks_fee_rates').delete().eq('id', id); if (error) return toast('המחיקה נכשלה'); toast('נמחק'); d.reload() }
  return (
    <div className="grid-2">
      <form className="panel" onSubmit={save} style={{ display: 'grid', gap: 'var(--space-3)' }}>
        <h3>תעריף חדש</h3>
        <p className="caption">מקור התעריף: התוספת לחוק העזר או התיקון המאושר. תעריף חדש אינו מוחק את הקודם; החישוב בוחר את התעריף שבתוקף בתאריך.</p>
        <label className="field">סוג שלט<select value={f.category_slug} onChange={(e) => setF({ ...f, category_slug: e.target.value })}><option value="">כל הסוגים</option>{d.categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}</select></label>
        <div className="grid-2">
          <label className="field">סכום (ש"ח)<input required inputMode="decimal" value={f.amount_ils} onChange={(e) => setF({ ...f, amount_ils: e.target.value.replace(/[^\d.]/g, '') })} /></label>
          <label className="field">יחידה<select value={f.unit} onChange={(e) => setF({ ...f, unit: e.target.value })}>{Object.entries(UNIT_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
          <label className="field">בתוקף מ-<input type="date" required value={f.valid_from} onChange={(e) => setF({ ...f, valid_from: e.target.value })} /></label>
          <label className="field">מקור<select value={f.source} onChange={(e) => setF({ ...f, source: e.target.value })}>{Object.entries(SOURCE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
        </div>
        <label className="field">הפניה (פרט בתוספת, פרוטוקול)<input value={f.source_ref} onChange={(e) => setF({ ...f, source_ref: e.target.value })} /></label>
        <label className="field">הערות<input value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></label>
        <div className="row"><button className="btn btn-primary" disabled={!f.amount_ils}>שמירת התעריף</button></div>
      </form>
      <div>
        <div className="table-wrap"><table>
          <thead><tr><th>סוג</th><th>סכום</th><th>יחידה</th><th>מקור</th><th>מתאריך</th><th></th></tr></thead>
          <tbody>{d.fees.map((x) => <tr key={x.id}><td>{d.categories.find((c) => c.slug === x.category_slug)?.name || 'כל הסוגים'}</td><td className="mono">{Number(x.amount_ils).toLocaleString('he-IL')}</td><td>{UNIT_LABEL[x.unit]}</td><td>{SOURCE_LABEL[x.source]}{x.source_ref ? ` · ${x.source_ref}` : ''}</td><td className="mono">{x.valid_from}</td><td><button className="btn btn-sm btn-quiet" onClick={() => remove(x.id)}>מחיקה</button></td></tr>)}
            {!d.fees.length && <tr><td colSpan={6} className="muted">הטבלה ריקה.</td></tr>}</tbody>
        </table></div>
      </div>
    </div>
  )
}

function Settings({ d }) {
  const toast = useToast()
  const setMonths = async (slug, v) => {
    const { error } = await supabase.from('ks_categories').update({ default_validity_months: v === '' ? null : Number(v), updated_at: new Date().toISOString() }).eq('slug', slug)
    if (error) return toast('השמירה נכשלה'); toast('נשמר'); d.reload()
  }
  return (
    <div className="grid-2">
      <div>
        <h3 style={{ marginBottom: 'var(--space-3)' }}>תוקף ברירת מחדל לפי סוג שלט</h3>
        <p className="muted">ברירת המחדל: אין חידוש שנתי, והרישיון בתוקף עד שינוי בשלט או הסרתו. ריק = ללא תפוגה. שלט אלקטרוני: 12 חודשים לפי סעיף 2.2.6 ג.</p>
        <div className="table-wrap"><table>
          <thead><tr><th>סוג שלט</th><th>סעיף</th><th>חודשים</th></tr></thead>
          <tbody>{d.categories.map((c) => <tr key={c.slug}><td>{c.name}</td><td className="mono">{c.section}</td>
            <td><input style={{ width: 90 }} inputMode="numeric" defaultValue={c.default_validity_months ?? ''} onBlur={(e) => { const v = e.target.value.replace(/\D/g, ''); if (String(c.default_validity_months ?? '') !== v) setMonths(c.slug, v) }} placeholder="ללא" /></td></tr>)}</tbody>
        </table></div>
      </div>
      <div className="panel panel-sand" style={{ display: 'grid', gap: 'var(--space-3)', alignContent: 'start' }}>
        <h3>מדיניות הרישוי</h3>
        <p>{d.settings.license_policy?.note}</p>
        <p className="caption">הכללים, האזורים והערות המסלולים נשמרים בטבלאות ks_rules, ks_zones ו-ks_route_notes, וניתנים לעדכון בלי שינוי קוד.</p>
      </div>
    </div>
  )
}

export default function Staff() {
  const d = useData()
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') || 'apps'
  useStrip('צוות העירייה', !d.session ? 'כניסה לצוות אדריכלות העיר, ועדת השילוט והפיקוח.' : d.isStaff ? `מחוברת: ${d.session.user.email}` : 'המשתמש אינו רשום כצוות.', 'var(--sea-500)')
  if (d.loading) return <Loading />
  if (!d.session) return <Login />
  if (!d.isStaff) return <div className="page"><div className="notice notice-warn">החשבון {d.session.user.email} אינו רשום כצוות. פנו לאדריכלות העיר.</div><button className="btn" style={{ marginTop: 16 }} onClick={() => supabase.auth.signOut()}>יציאה</button></div>
  return (
    <div className="page page-wide">
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 'var(--space-5)' }}>
        <h1 style={{ fontSize: 34 }}>לוח הצוות</h1>
        <button className="btn btn-quiet" onClick={() => supabase.auth.signOut()}>יציאה</button>
      </div>
      <div className="steps" role="tablist">{TABS.map(([k, l]) => <button key={k} className={tab === k ? 'current' : ''} onClick={() => setParams({ tab: k })} role="tab" aria-selected={tab === k}>{l}</button>)}</div>
      {!d.schemaReady ? <SchemaNotice /> : (
        <>
          {tab === 'apps' && <Applications d={d} />}
          {tab === 'intake' && <Intake d={d} />}
          {tab === 'reports' && <Reports d={d} />}
          {tab === 'survey' && <Survey d={d} />}
          {tab === 'fees' && <FeesAdmin d={d} />}
          {tab === 'settings' && <Settings d={d} />}
        </>
      )}
    </div>
  )
}
