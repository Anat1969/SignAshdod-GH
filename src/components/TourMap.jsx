import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';

// Pin colours carry meaning: checked today by verdict, not checked yet in grey, the inspector in blue.
export const PIN = { ok: '#059669', warn: '#ea580c', bad: '#dc2626', none: '#64748b', me: '#2563eb' };

/** The tour map: one pin per site, coloured by today's check. Wheel zoom, drag, and the +/- buttons of Leaflet. */
export default function TourMap({ pins, me, onPick }) {
  const box = useRef(null);
  const map = useRef(null);
  const layer = useRef(null);
  const L = useRef(null);
  const fitted = useRef(0); // how many points the view was last fitted to
  const moved = useRef(false); // once the inspector pans or zooms, the map stops refitting

  useEffect(() => {
    let live = true;
    import('leaflet').then((mod) => {
      if (!live || !box.current || map.current) return;
      L.current = mod.default || mod;
      map.current = L.current.map(box.current, { zoomControl: true, scrollWheelZoom: true }).setView([31.8014, 34.6435], 13);
      L.current
        .tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' })
        .addTo(map.current);
      map.current.attributionControl.setPrefix(false);
      map.current.on('dragstart zoomstart', (e) => {
        if (e.hard !== false && map.current._fitting !== true) moved.current = true;
      });
      layer.current = L.current.layerGroup().addTo(map.current);
      draw();
    });
    return () => {
      live = false;
      map.current?.remove();
      map.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const draw = () => {
    if (!map.current || !layer.current) return;
    const Lf = L.current;
    layer.current.clearLayers();
    const pts = [];
    for (const p of pins) {
      // a pin placed by the street only (not the house) has a dashed edge, and says so
      const m = Lf.circleMarker([p.lat, p.lng], { radius: 9, color: '#fff', weight: 2, dashArray: p.approx ? '3 3' : undefined, fillColor: PIN[p.tone] || PIN.none, fillOpacity: 0.95 });
      m.bindTooltip(`${p.label}${p.verdict ? ` · ${p.verdict}` : ''}${p.approx ? ' · מיקום לפי הרחוב' : ''}`, { direction: 'top' });
      m.on('click', () => onPick(p.id));
      m.addTo(layer.current);
      pts.push([p.lat, p.lng]);
    }
    if (me) {
      Lf.circleMarker([me.lat, me.lng], { radius: 7, color: '#fff', weight: 3, fillColor: PIN.me, fillOpacity: 1 }).bindTooltip('אני כאן').addTo(layer.current);
      pts.push([me.lat, me.lng]);
    }
    // refit while pins keep arriving, until the inspector moves the map
    if (pts.length > fitted.current && !moved.current) {
      map.current._fitting = true;
      map.current.fitBounds(pts, { padding: [28, 28], maxZoom: 16, animate: false });
      map.current._fitting = false;
      fitted.current = pts.length;
    }
  };

  useEffect(draw); // pins arrive one by one while addresses are looked up

  return <div ref={box} className="tour-map w-full h-64 sm:h-80 border border-border bg-muted" role="region" aria-label="מפת האתרים לסיור" />;
}
