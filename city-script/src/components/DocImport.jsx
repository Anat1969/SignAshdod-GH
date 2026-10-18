import { useState } from 'react'
import { ACCEPT, extractText, parseFields, FIELD_LABEL } from '../lib/docExtract'

// טעינת מסמך בקשה (כל סוג), הצגת מה שזוהה, וכפתור "מלא" שמכניס לשדות.
export default function DocImport({ onFill, categories = [], title = 'יש לכם בקשה כתובה? טענו אותה כאן' }) {
  const [file, setFile] = useState(null)
  const [state, setState] = useState('idle') // idle | reading | ready | error
  const [status, setStatus] = useState('')
  const [found, setFound] = useState({})
  const [text, setText] = useState('')
  const [over, setOver] = useState(false)

  const take = async (f) => {
    if (!f) return
    setFile(f); setState('reading'); setStatus('קורא את הקובץ...'); setFound({}); setText('')
    try {
      const { text: t, how } = await extractText(f, setStatus)
      const fields = parseFields(t)
      setText(t); setFound(fields); setState('ready')
      setStatus(Object.keys(fields).length ? `נקרא כ-${how}. נמצאו ${Object.keys(fields).length} שדות.` : `נקרא כ-${how}, אבל לא זוהו שדות. אפשר להעתיק מהטקסט למטה.`)
    } catch (e) {
      setState('error'); setStatus(e.message || 'לא ניתן לקרוא את הקובץ.')
    }
  }
  const catName = (slug) => categories.find((c) => c.slug === slug)?.name || slug
  const keys = Object.keys(found)

  return (
    <section className={`docimp ${over ? 'is-over' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setOver(true) }} onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); take(e.dataTransfer.files?.[0]) }}>
      <div className="docimp-head">
        <div>
          <span className="eyebrow">{title}</span>
          <p className="caption">PDF, Word, Excel, CSV, טקסט, מייל או צילום של טופס. הקריאה נעשית בדפדפן.</p>
        </div>
        <label className="btn">
          {file ? 'קובץ אחר' : 'בחירת קובץ'}
          <input type="file" accept={ACCEPT} aria-label="טעינת מסמך בקשה" onChange={(e) => { take(e.target.files?.[0]); e.target.value = '' }} hidden />
        </label>
      </div>
      {file && (
        <div className="docimp-body">
          <div className="docimp-file"><b>{file.name}</b><span className="caption">{Math.max(1, Math.round(file.size / 1024))} KB</span></div>
          <p className={`docimp-status ${state}`} role="status">{state === 'reading' && <span className="spin" aria-hidden="true" />}{status}</p>
          {keys.length > 0 && (
            <dl className="docimp-found">
              {keys.map((k) => <div key={k}><dt>{FIELD_LABEL[k] || k}</dt><dd>{k === 'category_slug' ? catName(found[k]) : found[k]}</dd></div>)}
            </dl>
          )}
          <div className="row">
            <button type="button" className="btn btn-primary" disabled={state !== 'ready'} onClick={() => onFill(found, file, text)}>מלא</button>
            {text && <details className="docimp-text"><summary className="muted">הטקסט שנקרא מהקובץ</summary><pre dir="auto">{text.slice(0, 4000)}</pre></details>}
          </div>
        </div>
      )}
    </section>
  )
}
