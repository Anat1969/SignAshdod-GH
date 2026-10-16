import { Link, useParams } from 'react-router-dom'
import { useData, rulesFor, categoryBySlug } from '../lib/data'
import { useStrip } from '../components/Shell'
import { Section, Tag, Loading } from '../components/bits'
import { land } from '../lib/landscapes'

const GENERAL = [
  ['1.1.2', 'בשלט אין פגיעה בתקנת הציבור וברגשותיו.'],
  ['1.1.3', 'השלט אינו מכשול להולכי רגל ולכלי רכב ואינו מסתיר שלטים ותמרורים.'],
  ['1.2', 'הליך הרישוי: בקשה מקוונת, אישור הוועדה העירונית, תשלום אגרה והתקנה במיקום המאושר. שינוי בשלט מחייב רישיון חדש.'],
  ['1.4', 'בעל הרישיון מתחזק את השלט במצב נאה, נקי ובטיחותי. שלט שאינו מתוחזק יפורק, ועל חשבון בעליו אם לא פירק בעצמו.'],
  ['מבוא 3', 'בכל סתירה בין המדיניות לחוק העזר לאשדוד (מודעות ושלטים), התשנ"ח-1997, גוברות הוראות חוק העזר.'],
]

export function GuideIndex() {
  const d = useData()
  useStrip('הנחיות', 'שבעה סוגי שלטים. כל כלל מקושר לסעיף במדיניות להצבת שילוט (דצמבר 2024).', 'var(--sea-500)')
  if (d.loading) return <Loading />
  return (
    <div className="page">
      <div className="page-head">
        <span className="eyebrow">ספריית ההנחיות</span>
        <h1>מה הכלל, ומאיפה הוא בא</h1>
        <p className="lead">מטרות המדיניות: לשמור על צביון העיר, למנוע זיהום חזותי, לקבוע כללים שווים לכולם ולהבטיח שהשלט אינו מפגע בטיחותי.</p>
      </div>
      <div className="choice-grid">
        {d.categories.map((c) => (
          <Link key={c.slug} to={`/guide/${c.slug}`} className="entry" style={{ '--entry-color': land(c.landscape).c500, minHeight: 180 }}>
            <span className="num">סעיף {c.section}</span>
            <h3>{c.name}</h3>
            <p>{c.summary}</p>
            <span className="go">{rulesFor(d.rules, c.slug).length} כללים</span>
          </Link>
        ))}
      </div>
      <hr className="threshold" />
      <h2 style={{ marginBottom: 'var(--space-4)' }}>תנאים כלליים לכל שלט</h2>
      <ul className="rules">{GENERAL.map(([s, t]) => <li key={s}><Section s={s} /><span>{t}</span><Tag status="info" /></li>)}</ul>
      <p className="caption" style={{ marginTop: 'var(--space-4)' }}>לשאלות ובירורים לפי המדיניות: אגף נכסים, עיריית אשדוד.</p>
    </div>
  )
}

export function GuideCategory() {
  const { slug } = useParams()
  const d = useData()
  const c = categoryBySlug(d.categories, slug)
  const rules = rulesFor(d.rules, slug)
  useStrip(c ? `סעיף ${c.section}` : 'הנחיות', c ? c.summary : 'סוג שלט לא נמצא.', c ? land(c.landscape).c500 : 'var(--sea-500)')
  if (d.loading) return <Loading />
  if (!c) return <div className="page"><p>סוג השלט לא נמצא. <Link to="/guide">לכל ההנחיות</Link></p></div>
  const conditions = rules.filter((r) => r.kind !== 'info')
  const reqs = rules.filter((r) => r.kind === 'info')
  return (
    <div className="page">
      <div className="page-head">
        <Link to="/guide" className="eyebrow" style={{ textDecoration: 'none' }}>ההנחיות</Link>
        <h1>{c.name}</h1>
        <p className="lead">{c.summary}</p>
        <p className="muted">תוקף רישיון: {c.default_validity_months ? `${c.default_validity_months} חודשים (ברירת מחדל לסוג שלט זה, ניתן לעריכה).` : `${d.settings.license_policy?.label}. אין חידוש שנתי.`}</p>
      </div>
      <div className="grid-2">
        <div>
          <h3 style={{ marginBottom: 'var(--space-3)' }}>תנאים שנבדקים</h3>
          <ul className="rules">{conditions.map((r) => <li key={r.id}><Section s={r.section} /><span>{r.text}</span><Tag status={r.kind === 'zone' ? 'neutral' : r.on_fail === 'review' ? 'review' : 'fail'}>{r.kind === 'zone' ? 'לפי המפה' : r.on_fail === 'review' ? 'נבדק בוועדה' : 'חובה'}</Tag></li>)}</ul>
        </div>
        <div>
          <h3 style={{ marginBottom: 'var(--space-3)' }}>דרישות, מידות ומסמכים</h3>
          <ul className="rules">{reqs.map((r) => <li key={r.id}><Section s={r.section} /><span>{r.text}</span><Tag status="info" /></li>)}</ul>
        </div>
      </div>
      <div className="row" style={{ marginTop: 'var(--space-6)' }}>
        <Link to={slug === 'construction' ? '/construction' : `/check?cat=${slug}&step=0`} className="btn btn-primary">בדיקת התאמה לסוג זה</Link>
      </div>
    </div>
  )
}
