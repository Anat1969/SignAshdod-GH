import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import CityMap from '../components/CityMap'
import { useData } from '../lib/data'
import { useStrip } from '../components/Shell'
import { zoneAt } from '../lib/geo'
import { land } from '../lib/landscapes'
import { Loading } from '../components/bits'
import Skyline from '../components/Skyline'

const entries = [
  { to: '/check', n: '01', who: 'בעל עסק', title: 'מה מותר לתלות כאן?', text: 'כתובת, סוג שלט וכמה שאלות. התשובה מפנה לסעיף במדיניות, ובסופה בקשה שלמה.', color: 'var(--port-500)' },
  { to: '/construction', n: '02', who: 'יזם וקבלן', title: 'שלט אתר וגדר מדברת', text: 'הפורמט האחיד, חלוקת הגדר 50/50 ורשימת המסמכים לפני ההגשה.', color: 'var(--dune-500)' },
  { to: '/routes', n: '03', who: 'תושב', title: 'לקרוא את העיר', text: 'מסלולים בעיר, ובכל תחנה: הסיפור של המקום והכלל שחל בו.', color: 'var(--nahal-500)' },
]

export default function Home() {
  const d = useData()
  const [zone, setZone] = useState(null)
  const [pt, setPt] = useState(null)
  useStrip(zone ? zone.name : 'כתב העיר',
    zone ? (zone.note || 'אזור אופי') : 'השילוט הוא כתב היד של העיר. לחצו על המפה כדי לקרוא מה מותר בכל אזור.',
    zone ? land(zone.landscape).c500 : 'var(--port-500)')
  if (d.loading) return <Loading />
  return (
    <div className="page page-wide">
      <section className="hero">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} style={{ display: 'grid', alignContent: 'start', gap: 'var(--space-5)' }}>
          <span className="eyebrow">תוכנית אב לשילוט · אשדוד</span>
          <h1>עיר אפורה,<br />שלט אחד בצבע.</h1>
          <p className="lead">כלי אחד לשלושה קוראים: העירייה שמאשרת, בעל העסק שמבקש, והתושב שמבין מה הוא רואה ברחוב. כל כלל מקושר לסעיף במדיניות.</p>
          <div className="scales">
            <div><b>עיר</b><span className="muted">המפה ואזורי האופי: מה מותר ואיפה.</span></div>
            <div><b>מסלול</b><span className="muted">הסיפור והרצף: למה זה מותר כאן ולא שם.</span></div>
            <div><b>חזית</b><span className="muted">השלט עצמו: מידה, חומר, אור.</span></div>
          </div>
          <div className="row">
            <Link to="/check" className="btn btn-primary">בדיקת התאמה לשלט</Link>
            <Link to="/guide" className="btn">כל ההנחיות</Link>
          </div>
        </motion.div>
        <CityMap zones={d.zones} selectedZoneId={zone?.id} marker={pt} height={560}
          onMapClick={(p) => { setPt(p); setZone(zoneAt(p, d.zones)) }} interactiveHint="לחיצה על המפה מציגה את אזור האופי" />
      </section>

      <Skyline />

      <section className="grid-3 over-skyline">
        {entries.map((e, i) => (
          <div key={e.to} className="rise" style={{ animationDelay: `${0.5 + i * 0.1}s` }}>
            <Link to={e.to} className={`entry lift ${i === 0 ? 'sail' : ''}`} style={{ '--entry-color': e.color }}>
              <span className="num">{e.n} · {e.who}</span>
              <h3>{e.title}</h3>
              <p>{e.text}</p>
              <span className="go">כניסה</span>
            </Link>
          </div>
        ))}
      </section>

      <hr className="threshold" />

      <section className="grid-2">
        <div>
          <span className="eyebrow">שתי מפות, גשר אחד</span>
          <h2 style={{ margin: 'var(--space-3) 0 var(--space-4)' }}>הכלל חל לפי אזור. ההבנה באה מהמסלול.</h2>
          <p className="essay">המפה הרגולטורית קובעת מה מותר: אזורי אופי לפי רובעים, חוף, נחל ומרכזי תעסוקה. המפה הסיפורית מסבירה למה: מסלולים שעוברים במקומות שהעיר בחרה לשמור. בעל עסק ברובע א' מבין דרך המסלול למה אין שם שלט אלקטרוני, ותושב מבין דרכו את העיר.</p>
        </div>
        <div className="panel panel-sand">
          <div className="grid-2">
            <div><div className="figure">{d.categories.length}</div><div className="figure-label">סוגי שלטים במדיניות</div></div>
            <div><div className="figure">{d.rules.length}</div><div className="figure-label">כללים, כל אחד עם סעיף</div></div>
            <div><div className="figure">{d.zones.length}</div><div className="figure-label">אזורי אופי על המפה</div></div>
            <div><div className="figure">{d.routes.length}</div><div className="figure-label">מסלולים בעיר</div></div>
          </div>
        </div>
      </section>
    </div>
  )
}
