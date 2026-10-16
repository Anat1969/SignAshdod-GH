import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase, isMissingTable } from './supabase'
import * as seed from '../seed/policy'

// מקור נתונים מרכזי אחד: טבלאות ks_ אם הוקמו, ואם לא, נתוני הבסיס מהמדיניות.
const DataContext = createContext(null)

function seedRules() {
  const out = []
  for (const [slug, list] of Object.entries(seed.rules)) {
    list.forEach((r, i) => out.push({
      id: `${slug}-${i}`, category_slug: slug, kind: r.kind, section: r.section, text: r.text,
      expect: r.expect ?? null, on_fail: r.onFail ?? null, zone_key: r.key ?? null, sort: i, active: true,
    }))
  }
  return out
}

function zonesFromQuarters(quarters) {
  const out = quarters.map((q) => {
    const z = { ...seed.defaultQuarterZone, ...(seed.quarterZones[q.id] || {}) }
    const ring = q.polygon || []
    const centroid = ring.length ? [ring.reduce((t, c) => t + c[0], 0) / ring.length, ring.reduce((t, c) => t + c[1], 0) / ring.length] : null
    return {
      id: `zq-${q.id}`, kind: 'quarter', center: Array.isArray(q.center) && q.center.length === 2 ? q.center : centroid, name: q.name, landscape: z.landscape, electronic_allowed: !!z.electronic, totem_allowed: !!z.totem,
      coast: !!z.coast, view_protected: false, priority: 1, schematic: true, note: z.note, polygon: q.polygon, source: `quarters:${q.id}`,
    }
  })
  for (const z of seed.overlayZones) {
    out.push({ id: z.id, kind: 'overlay', name: z.name, landscape: z.landscape, electronic_allowed: !!z.electronic, totem_allowed: !!z.totem,
      coast: !!z.coast, view_protected: !!z.view, priority: z.priority, schematic: true, note: z.note, polygon: z.polygon, source: 'schematic' })
  }
  return out
}

const seedSettings = {
  license_policy: { renewal: 'none', label: 'בתוקף עד שינוי בשלט או הסרתו', note: 'לפי הנחיית המנכ"ל: אין חידוש שנתי. הצוות יכול לקבוע תוקף לכל רישיון ולכל סוג שלט.' },
  fees_status: { text: 'התעריפים נקבעים לפי חוק עזר לאשדוד (מודעות ושלטים), התשנ"ח-1997, ובכפוף לתיקון שמקודם מפברואר 2026. עד להזנת הטבלה, לבירור: אגף הגבייה, מחלקת העסקים.' },
}

export function DataProvider({ children }) {
  const [state, setState] = useState({ loading: true })
  const [session, setSession] = useState(null)
  const [isStaff, setIsStaff] = useState(false)

  const load = useCallback(async () => {
    const [cats, rules, zones, notes, fees, settings, quarters, routes, sites, buildings] = await Promise.all([
      supabase.from('ks_categories').select('*').order('sort'),
      supabase.from('ks_rules').select('*').eq('active', true).order('sort'),
      supabase.from('ks_zones').select('*'),
      supabase.from('ks_route_notes').select('*'),
      supabase.from('ks_fee_rates').select('*').order('valid_from', { ascending: false }),
      supabase.from('ks_settings').select('*'),
      supabase.from('quarters').select('id,name,polygon,center'),
      supabase.from('shimur_routes').select('id,slug,title,description,theme').eq('is_public', true),
      supabase.from('shimur_route_sites').select('route_id,building_id,position,narrative_text').order('position'),
      supabase.from('shimur_buildings').select('id,name,address,neighborhood,lat,lng,protection_level,style,year_built,current_use,coords_approx'),
    ])
    const schemaReady = !cats.error && (cats.data || []).length > 0
    const quartersData = quarters.data || []
    const categories = schemaReady ? cats.data : seed.categories.map((c) => ({ ...c, default_validity_months: c.default_validity_months ?? null }))
    const ruleList = schemaReady && !rules.error ? rules.data : seedRules()
    const zoneList = schemaReady && !zones.error && (zones.data || []).length ? zones.data : zonesFromQuarters(quartersData)
    const routeNotes = Object.fromEntries((schemaReady && !notes.error && notes.data?.length ? notes.data : Object.entries(seed.routeNotes).map(([route_slug, v]) => ({ route_slug, ...v }))).map((n) => [n.route_slug, n]))
    const settingsMap = { ...seedSettings }
    if (!settings.error) for (const s of settings.data || []) settingsMap[s.key] = s.value
    const bById = Object.fromEntries((buildings.data || []).map((b) => [b.id, b]))
    const routeList = (routes.data || []).map((r) => ({
      ...r,
      stops: (sites.data || []).filter((s) => s.route_id === r.id).sort((a, b) => a.position - b.position)
        .map((s) => ({ ...s, building: bById[s.building_id] })).filter((s) => s.building && s.building.lat && s.building.lng),
      sign: routeNotes[r.slug] || null,
    })).sort((a, b) => (a.slug > b.slug ? 1 : -1))
    setState({
      loading: false,
      schemaReady,
      schemaMissing: isMissingTable(cats.error),
      categories, rules: ruleList, zones: zoneList,
      fees: !fees.error ? fees.data || [] : [],
      settings: settingsMap,
      routes: routeList,
      buildings: buildings.data || [],
      loadError: quarters.error && routes.error ? 'לא ניתן להתחבר כרגע לשרת הנתונים. מוצגים נתוני הבסיס.' : null,
    })
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) { setIsStaff(false); return }
    supabase.rpc('is_staff').then(({ data, error }) => setIsStaff(!error && data === true))
  }, [session])

  const value = useMemo(() => ({ ...state, reload: load, session, isStaff }), [state, load, session, isStaff])
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() { return useContext(DataContext) }

export const categoryBySlug = (cats, slug) => cats?.find((c) => c.slug === slug)
export const rulesFor = (rules, slug) => (rules || []).filter((r) => r.category_slug === slug).sort((a, b) => a.sort - b.sort)
