import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useStrip } from '../components/Shell'
import PageGuide from '../components/PageGuide'
import { Tag } from '../components/bits'

const statusTag = (s) => s === 'אושרה' ? 'pass' : s === 'נדחתה' ? 'fail' : s === 'הוחזרה לתיקון' ? 'review' : 'neutral'

export default function Track() {
  const [params, setParams] = useSearchParams()
  const [code, setCode] = useState(params.get('code') || '')
  const [row, setRow] = useState(null)
  const [msg, setMsg] = useState('')
  useStrip('מעקב בקשה', row ? `${row.tracking_code}: ${row.status}` : 'הזינו את קוד המעקב שקיבלתם בעת ההגשה.', 'var(--sea-500)')
  const look = async (c = code) => {
    setMsg(''); setRow(null)
    if (!c.trim()) return
    const { data, error } = await supabase.rpc('ks_track_application', { p_code: c })
    if (error) { setMsg('המעקב יופעל לאחר הקמת מסד הנתונים.'); return }
    if (!data?.length) { setMsg('לא נמצאה בקשה עם הקוד הזה.'); return }
    setRow(data[0])
  }
  useEffect(() => { if (params.get('code')) look(params.get('code')) }, []) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="page">
      <div className="page-head">
        <span className="eyebrow">מבקש · מעקב</span>
        <h1>איפה הבקשה שלי?</h1>
      </div>
      <PageGuide steps={[['מקלידים את קוד המעקב שקיבלתם בהגשה (KS-...)', !!code.trim()], ['לוחצים "בדיקה"', !!row || !!msg], ['רואים את הסטטוס ואת ההחלטה האחרונה', !!row]]} />
      <form className="row" onSubmit={(e) => { e.preventDefault(); setParams({ code }); look() }} style={{ maxWidth: 520 }}>
        <label className="field" style={{ flex: '1 1 220px' }}>קוד מעקב<input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="KS-XXXXXX" dir="ltr" /></label>
        <button className="btn btn-primary" disabled={!code.trim()}>בדיקה</button>
      </form>
      {msg && <p className="muted" style={{ marginTop: 'var(--space-4)' }}>{msg}</p>}
      {row && (
        <div className="panel sail lift" style={{ marginTop: 'var(--space-6)', display: 'grid', gap: 'var(--space-3)', maxWidth: 720 }}>
          <div className="row" style={{ justifyContent: 'space-between' }}><span className="mono">{row.tracking_code}</span><Tag status={statusTag(row.status)}>{row.status}</Tag></div>
          <h3>{row.category}</h3>
          <p className="muted">{row.address}</p>
          {row.last_decision && <p>החלטה אחרונה ({row.last_stage}): {row.last_decision}{row.last_comment ? `. ${row.last_comment}` : ''}</p>}
          <p className="caption">הוגשה {new Date(row.created_at).toLocaleDateString('he-IL')} · עודכנה {new Date(row.updated_at).toLocaleDateString('he-IL')} · תוקף: {row.license_valid_until ? `עד ${new Date(row.license_valid_until).toLocaleDateString('he-IL')}` : 'עד שינוי בשלט או הסרתו'}</p>
        </div>
      )}
    </div>
  )
}
