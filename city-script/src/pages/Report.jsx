import { useState } from 'react'
import CityMap from '../components/CityMap'
import { useData } from '../lib/data'
import { useStrip, useToast } from '../components/Shell'
import { supabase } from '../lib/supabase'
import { geocode } from '../lib/geo'
import { Loading } from '../components/bits'

export default function Report() {
  const d = useData()
  const toast = useToast()
  const [point, setPoint] = useState(null)
  const [address, setAddress] = useState('')
  const [desc, setDesc] = useState('')
  const [contact, setContact] = useState('')
  const [state, setState] = useState('idle')
  const [err, setErr] = useState('')
  useStrip('דיווח תושב', state === 'sent' ? 'הדיווח הועבר לפיקוח העירוני. תודה.' : point ? 'תארו בקצרה מה ראיתם.' : 'סמנו על המפה שלט שנראה לא תקין, מסוכן או מסתיר.', 'var(--estuary-500)')
  if (d.loading) return <Loading />
  const find = async () => { setErr(''); try { const r = await geocode(address); if (r[0]) setPoint([r[0].lng, r[0].lat]); else setErr('הכתובת לא נמצאה. סמנו על המפה.') } catch (e) { setErr(e.message) } }
  const send = async (e) => {
    e.preventDefault()
    setState('sending'); setErr('')
    const { error } = await supabase.from('ks_reports').insert({ lat: point[1], lng: point[0], address, description: desc.trim(), contact: contact.trim() || null })
    if (error) { setState('idle'); setErr(d.schemaReady ? 'השליחה נכשלה. נסו שוב.' : 'קליטת דיווחים תופעל לאחר הקמת מסד הנתונים. בינתיים אפשר לפנות למוקד 106.'); return }
    setState('sent'); toast('הדיווח נשלח')
  }
  return (
    <div className="page">
      <div className="page-head">
        <span className="eyebrow">תושב · דיווח על מפגע שילוט</span>
        <h1>ראיתם שלט שלא במקום?</h1>
        <p className="lead">שלט שמסתיר תמרור, חוסם מעבר, מתפרק או פוגע. הדיווח מגיע לתור של הפיקוח העירוני.</p>
      </div>
      <div className="split">
        <form className="sticky panel" onSubmit={send} style={{ display: 'grid', gap: 'var(--space-4)' }}>
          {state === 'sent' ? (
            <><h3>הדיווח התקבל</h3><button type="button" className="btn" onClick={() => { setState('idle'); setDesc(''); setPoint(null) }}>דיווח נוסף</button></>
          ) : (
            <>
              <div className="row">
                <label className="field" style={{ flex: '1 1 200px' }}>כתובת (לא חובה)<input value={address} onChange={(e) => setAddress(e.target.value)} /></label>
                <button type="button" className="btn" onClick={find} disabled={!address.trim()}>איתור</button>
              </div>
              <label className="field">מה ראיתם<textarea required minLength={3} maxLength={1000} value={desc} onChange={(e) => setDesc(e.target.value)} /></label>
              <label className="field">דרך לחזור אליכם (לא חובה)<input value={contact} onChange={(e) => setContact(e.target.value)} /></label>
              {err && <div className="notice notice-warn">{err}</div>}
              <div className="row"><button className="btn btn-primary" disabled={!point || desc.trim().length < 3 || state === 'sending'}>{state === 'sending' ? 'שולחת...' : 'שליחת הדיווח'}</button>{!point && <span className="caption">יש לסמן מיקום על המפה</span>}</div>
            </>
          )}
        </form>
        <CityMap zones={d.zones} showZones={false} marker={point} fitTo={point} height={520} onMapClick={(p) => state !== 'sent' && setPoint(p)} interactiveHint="לחיצה על המפה מסמנת את המיקום" />
      </div>
    </div>
  )
}
