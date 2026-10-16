import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { ASHDOD_CENTER, isQuarter } from '../lib/geo'
import { land, LANDSCAPES } from '../lib/landscapes'

// מפת בסיס אפורה (OpenFreeMap Positron). רק השכבות שבשימוש מקבלות צבע.
const STYLE = 'https://tiles.openfreemap.org/styles/positron'
let rtlRequested = false
function ensureRtl() {
  if (rtlRequested) return
  rtlRequested = true
  try {
    if (maplibregl.getRTLTextPluginStatus && maplibregl.getRTLTextPluginStatus() !== 'unavailable') return
    maplibregl.setRTLTextPlugin('https://unpkg.com/@mapbox/mapbox-gl-rtl-text@0.3.0/dist/mapbox-gl-rtl-text.js', true)
  } catch { /* תוסף RTL כבר נטען */ }
}

const toFC = (features) => ({ type: 'FeatureCollection', features })

export default function CityMap({
  zones = [], showZones = true, selectedZoneId = null,
  line = null, lineLandscape = 'port', lines = null, onLineClick,
  points = [], activePointId = null, onPointClick,
  marker = null, onMapClick, height = 460, fitTo = null, legend = true, note = null, interactiveHint = null,
}) {
  const ref = useRef(null)
  const mapRef = useRef(null)
  const markerRef = useRef(null)
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)
  const handlers = useRef({})
  handlers.current = { onMapClick, onPointClick, onLineClick }

  useEffect(() => {
    ensureRtl()
    let map
    try {
      map = new maplibregl.Map({
        container: ref.current, style: STYLE, center: ASHDOD_CENTER, zoom: 12.4,
        attributionControl: { compact: true }, cooperativeGestures: false,
      })
    } catch {
      setFailed(true)
      return
    }
    mapRef.current = map
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-left')
    map.on('error', (e) => { if (e?.error?.status === 0 || /style/i.test(e?.error?.message || '')) setFailed(true) })
    map.on('load', () => {
      map.addSource('zones', { type: 'geojson', data: toFC([]) })
      map.addLayer({ id: 'zones-fill', type: 'fill', source: 'zones', paint: { 'fill-color': ['get', 'c300'], 'fill-opacity': ['case', ['get', 'selected'], 0.55, 0.28] } })
      map.addLayer({ id: 'zones-line', type: 'line', source: 'zones', paint: { 'line-color': ['get', 'c700'], 'line-width': ['case', ['get', 'selected'], 2.2, 0.8], 'line-dasharray': [2, 1.5] } })
      map.addSource('quarters', { type: 'geojson', data: toFC([]) })
      map.addLayer({ id: 'quarters-halo', type: 'circle', source: 'quarters', paint: { 'circle-radius': ['case', ['get', 'selected'], 34, 26], 'circle-color': ['get', 'c300'], 'circle-opacity': ['case', ['get', 'selected'], 0.55, 0.28], 'circle-blur': 0.6 } })
      map.addLayer({ id: 'quarters-dot', type: 'circle', source: 'quarters', paint: { 'circle-radius': ['case', ['get', 'selected'], 6, 4], 'circle-color': ['get', 'c700'], 'circle-stroke-color': '#F4F5F6', 'circle-stroke-width': 1.5 } })
      map.addLayer({ id: 'quarters-label', type: 'symbol', source: 'quarters', layout: { 'text-field': ['get', 'name'], 'text-size': 12, 'text-offset': [0, 1.3], 'text-anchor': 'top', 'text-font': ['Noto Sans Regular'] }, paint: { 'text-color': ['get', 'c700'], 'text-halo-color': '#F4F5F6', 'text-halo-width': 1.5 } })
      map.addSource('route', { type: 'geojson', data: toFC([]) })
      map.addLayer({ id: 'route-casing', type: 'line', source: 'route', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#F4F5F6', 'line-width': ['case', ['get', 'active'], 9, 6], 'line-opacity': 0.9 } })
      map.addLayer({ id: 'route-line', type: 'line', source: 'route', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': ['get', 'c'], 'line-width': ['case', ['get', 'active'], 5.5, 3.5], 'line-opacity': ['case', ['get', 'dim'], 0.35, 0.95] } })
      map.on('click', 'route-line', (e) => {
        const id = e.features?.[0]?.properties?.id
        if (id && handlers.current.onLineClick) handlers.current.onLineClick(id)
      })
      map.on('mouseenter', 'route-line', () => { if (handlers.current.onLineClick) map.getCanvas().style.cursor = 'pointer' })
      map.on('mouseleave', 'route-line', () => { map.getCanvas().style.cursor = '' })
      map.addSource('points', { type: 'geojson', data: toFC([]) })
      map.addLayer({ id: 'points-halo', type: 'circle', source: 'points', paint: { 'circle-radius': ['case', ['get', 'active'], 14, 9], 'circle-color': '#F4F5F6', 'circle-stroke-color': ['get', 'c'], 'circle-stroke-width': 2 } })
      map.addLayer({ id: 'points-label', type: 'symbol', source: 'points', layout: { 'text-field': ['get', 'n'], 'text-size': 11, 'text-font': ['Noto Sans Regular'], 'text-allow-overlap': true }, paint: { 'text-color': '#13222C' } })
      map.on('click', 'points-halo', (e) => {
        const id = e.features?.[0]?.properties?.id
        if (id && handlers.current.onPointClick) handlers.current.onPointClick(id)
      })
      map.on('mouseenter', 'points-halo', () => { map.getCanvas().style.cursor = 'pointer' })
      map.on('mouseleave', 'points-halo', () => { map.getCanvas().style.cursor = '' })
      setReady(true)
    })
    map.on('click', (e) => {
      const hit = map.getLayer('points-halo') && map.queryRenderedFeatures(e.point, { layers: ['points-halo'] }).length
      if (!hit && handlers.current.onMapClick) handlers.current.onMapClick([e.lngLat.lng, e.lngLat.lat])
    })
    return () => { map.remove(); mapRef.current = null }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!ready || !map) return
    const shaped = showZones ? zones.filter((z) => !isQuarter(z) && z.polygon).map((z) => {
      const L = land(z.landscape)
      return { type: 'Feature', properties: { id: z.id, c300: L.c300, c700: L.c700, selected: z.id === selectedZoneId }, geometry: { type: 'Polygon', coordinates: [z.polygon] } }
    }) : []
    const quarters = showZones ? zones.filter(isQuarter).map((z) => {
      const L = land(z.landscape)
      return { type: 'Feature', properties: { id: z.id, name: z.name, c300: L.c300, c700: L.c700, selected: z.id === selectedZoneId }, geometry: { type: 'Point', coordinates: z.center } }
    }) : []
    map.getSource('zones')?.setData(toFC(shaped))
    map.getSource('quarters')?.setData(toFC(quarters))
  }, [ready, zones, showZones, selectedZoneId])

  useEffect(() => {
    const map = mapRef.current
    if (!ready || !map) return
    const anyActive = (lines || []).some((l) => l.active)
    const feats = lines
      ? lines.filter((l) => l.coords.length > 1).map((l) => ({ type: 'Feature', properties: { id: l.id, c: land(l.landscape).c500, active: !!l.active, dim: anyActive && !l.active }, geometry: { type: 'LineString', coordinates: l.coords } }))
      : line && line.length > 1 ? [{ type: 'Feature', properties: { id: 'route', c: land(lineLandscape).c500, active: true, dim: false }, geometry: { type: 'LineString', coordinates: line } }] : []
    map.getSource('route')?.setData(toFC(feats))
  }, [ready, line, lineLandscape, lines])

  useEffect(() => {
    const map = mapRef.current
    if (!ready || !map) return
    map.getSource('points')?.setData(toFC(points.map((p) => ({
      type: 'Feature', properties: { id: p.id, n: p.label ?? '', c: land(p.landscape).c700, active: p.id === activePointId },
      geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
    }))))
  }, [ready, points, activePointId])

  useEffect(() => {
    const map = mapRef.current
    if (!ready || !map) return
    if (!marker) { markerRef.current?.remove(); markerRef.current = null; return }
    if (!markerRef.current) {
      const el = document.createElement('div')
      el.style.cssText = 'width:22px;height:22px;background:#E8552A;border:3px solid #F4F5F6;box-shadow:0 0 0 1px #13222C;'
      el.setAttribute('aria-label', 'המיקום שנבחר')
      markerRef.current = new maplibregl.Marker({ element: el }).setLngLat(marker).addTo(map)
    } else markerRef.current.setLngLat(marker)
  }, [ready, marker])

  useEffect(() => {
    const map = mapRef.current
    if (!ready || !map || !fitTo) return
    if (fitTo.length === 2 && typeof fitTo[0] === 'number') { map.flyTo({ center: fitTo, zoom: 16, duration: 900 }); return }
    const b = new maplibregl.LngLatBounds()
    fitTo.forEach((c) => b.extend(c))
    if (!b.isEmpty()) map.fitBounds(b, { padding: 60, duration: 900, maxZoom: 16 })
  }, [ready, JSON.stringify(fitTo)]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="map-wrap" style={{ height }}>
      <div ref={ref} className="map" style={{ height: '100%' }} role="region" aria-label="מפת אשדוד" />
      {failed && <div className="map-note">המפה לא נטענה. אפשר להמשיך גם בלי המפה.</div>}
      {!failed && (note || interactiveHint) && <div className="map-note">{note || interactiveHint}</div>}
      {legend && showZones && (
        <div className="map-legend" aria-label="מקרא">
          {Object.entries(LANDSCAPES).map(([k, L]) => (
            <div key={k}><span className="sw" style={{ background: L.c300, border: `1px solid ${L.c700}` }} />{L.meaning}</div>
          ))}
          <div className="caption">נקודה = מרכז הרובע. מיקום מקבל את אופי הרובע הקרוב. חוף ונחל לפי גבול.</div>
        </div>
      )}
    </div>
  )
}
