import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import CityMap from '../components/CityMap'
import { useData } from '../lib/data'
import { useStrip } from '../components/Shell'
import { Loading, Tag } from '../components/bits'
import { land } from '../lib/landscapes'
import { zoneAt } from '../lib/geo'

export function RoutesIndex() {
  const d = useData()
  useStrip('מסלולים', 'המפה הסיפורית: בכל מסלול, הסיפור של המקום והכלל שחל בו.', 'var(--nahal-500)')
  const all = useMemo(() => (d.routes || []).flatMap((r) => r.stops.map((s) => [s.building.lng, s.building.lat])), [d.routes])
  if (d.loading) return <Loading />
  return (
    <div className="page page-wide">
      <div className="page-head">
        <span className="eyebrow">תושב · לקרוא את העיר</span>
        <h1>המסלול מסביר את הכלל</h1>
        <p className="lead">המסלולים נבנו מרשימת המבנים והאתרים לשימור של העיר. לכל מסלול נוסף רובד של שילוט: מה מותר לאורכו ולמה.</p>
      </div>
      <div className="split">
        <div className="choice-grid" style={{ gridTemplateColumns: 'minmax(0,1fr)' }}>
          {d.routes.map((r) => (
            <Link key={r.slug} to={`/routes/${r.slug}`} className="entry" style={{ '--entry-color': land(r.sign?.landscape).c500, minHeight: 0 }}>
              <span className="num">{r.theme} · {r.stops.length} תחנות</span>
              <h3>{r.title}</h3>
              {r.sign && <p>{r.sign.note}</p>}
            </Link>
          ))}
          {!d.routes.length && <p className="muted">המסלולים לא נטענו כרגע.</p>}
        </div>
        <div className="sticky"><CityMap zones={d.zones} fitTo={all.length ? all : null} height={640}
          points={(d.routes || []).flatMap((r) => r.stops.map((s) => ({ id: `${r.slug}:${s.building.id}`, lng: s.building.lng, lat: s.building.lat, landscape: r.sign?.landscape, label: '' })))} /></div>
      </div>
    </div>
  )
}

export function RouteDetail() {
  const { slug } = useParams()
  const d = useData()
  const r = (d.routes || []).find((x) => x.slug === slug)
  const [active, setActive] = useState(0)
  const stop = r?.stops[active]
  const zone = stop ? zoneAt([stop.building.lng, stop.building.lat], d.zones || []) : null
  useStrip(r ? r.title : 'מסלול', r ? (r.sign?.note || r.description || '') : 'המסלול לא נמצא.', r ? land(r.sign?.landscape).c500 : 'var(--nahal-500)')
  if (d.loading) return <Loading />
  if (!r) return <div className="page"><p>המסלול לא נמצא. <Link to="/routes">לכל המסלולים</Link></p></div>
  const line = r.stops.map((s) => [s.building.lng, s.building.lat])
  return (
    <div className="page page-wide">
      <div className="page-head">
        <Link to="/routes" className="eyebrow" style={{ textDecoration: 'none' }}>המסלולים · {r.theme}</Link>
        <h1>{r.title}</h1>
        {r.description && <p className="lead">{r.description}</p>}
      </div>
      <div className="split">
        <div>
          {r.stops.map((s, i) => (
            <div key={s.building.id} className={`route-stop ${i === active ? 'active' : ''}`} onClick={() => setActive(i)} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && setActive(i)}>
              <span className="idx">{i + 1}</span>
              <div>
                <strong style={{ fontWeight: 500 }}>{s.building.name}</strong>
                {i === active && (
                  <div style={{ marginTop: 6, display: 'grid', gap: 8 }}>
                    <p className="essay" style={{ margin: 0 }}>{s.narrative_text}</p>
                    <div className="row">
                      {s.building.protection_level && <Tag status="review">שימור דרגה {s.building.protection_level}</Tag>}
                      {zone && <Tag status="neutral">{zone.name}</Tag>}
                    </div>
                    <p className="caption">כאן: {s.building.protection_level ? 'מבנה לשימור. אין שילוט אלקטרוני על המבנה (2.2.6 יא). ' : ''}{zone?.note}</p>
                    {s.building.coords_approx && <p className="caption">מיקום משוער.</p>}
                  </div>
                )}
              </div>
            </div>
          ))}
          <div className="row" style={{ marginTop: 'var(--space-4)' }}>
            <button className="btn" disabled={active === 0} onClick={() => setActive((a) => a - 1)}>התחנה הקודמת</button>
            <button className="btn btn-primary" disabled={active >= r.stops.length - 1} onClick={() => setActive((a) => a + 1)}>התחנה הבאה</button>
          </div>
        </div>
        <div className="sticky">
          <CityMap zones={d.zones} line={line} lineLandscape={r.sign?.landscape} height={620}
            points={r.stops.map((s, i) => ({ id: String(i), lng: s.building.lng, lat: s.building.lat, landscape: r.sign?.landscape, label: String(i + 1) }))}
            activePointId={String(active)} onPointClick={(id) => setActive(Number(id))}
            fitTo={stop ? [stop.building.lng, stop.building.lat] : line} />
        </div>
      </div>
    </div>
  )
}
