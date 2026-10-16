import { categories, rules, quarterZones, defaultQuarterZone, overlayZones, routeNotes } from './policy.mjs'
import { readFileSync, writeFileSync } from 'node:fs'
const q = (v) => v === null || v === undefined ? 'null' : typeof v === 'boolean' || typeof v === 'number' ? String(v) : `'${String(v).replace(/'/g, "''")}'`
const out = []
out.push('begin;')
out.push('delete from ks_rules;')
for (const c of categories) {
  out.push(`insert into ks_categories(slug,name,section,landscape,summary,default_validity_months,sort) values (${q(c.slug)},${q(c.name)},${q(c.section)},${q(c.landscape)},${q(c.summary)},${q(c.default_validity_months ?? null)},${c.sort}) on conflict (slug) do update set name=excluded.name, section=excluded.section, landscape=excluded.landscape, summary=excluded.summary, sort=excluded.sort;`)
}
for (const [slug, list] of Object.entries(rules)) {
  list.forEach((r, i) => out.push(`insert into ks_rules(category_slug,kind,section,text,expect,on_fail,zone_key,sort) values (${q(slug)},${q(r.kind)},${q(r.section)},${q(r.text)},${q(r.expect ?? null)},${q(r.onFail ?? null)},${q(r.key ?? null)},${i});`))
}
const quarters = JSON.parse(readFileSync(process.argv[2], 'utf8'))
for (const qu of quarters) {
  const z = { ...defaultQuarterZone, ...(quarterZones[qu.id] || {}) }
  out.push(`insert into ks_zones(id,name,landscape,electronic_allowed,totem_allowed,coast,view_protected,priority,schematic,note,polygon,source) values (${q('zq-' + qu.id)},${q(qu.name)},${q(z.landscape)},${q(!!z.electronic)},${q(!!z.totem)},${q(!!z.coast)},false,1,true,${q(z.note)},${q(JSON.stringify(qu.polygon))}::jsonb,${q('quarters:' + qu.id)}) on conflict (id) do nothing;`)
}
for (const z of overlayZones) {
  out.push(`insert into ks_zones(id,name,landscape,electronic_allowed,totem_allowed,coast,view_protected,priority,schematic,note,polygon,source) values (${q(z.id)},${q(z.name)},${q(z.landscape)},${q(!!z.electronic)},${q(!!z.totem)},${q(!!z.coast)},${q(!!z.view)},${z.priority},true,${q(z.note)},${q(JSON.stringify(z.polygon))}::jsonb,'schematic') on conflict (id) do nothing;`)
}
for (const [slug, r] of Object.entries(routeNotes)) {
  out.push(`insert into ks_route_notes(route_slug,landscape,note) values (${q(slug)},${q(r.landscape)},${q(r.note)}) on conflict (route_slug) do update set landscape=excluded.landscape, note=excluded.note;`)
}
out.push(`insert into ks_settings(key,value) values ('license_policy', ${q(JSON.stringify({ renewal: 'none', label: 'בתוקף עד שינוי בשלט או הסרתו', note: 'לפי הנחיית המנכ"ל: אין חידוש שנתי. הצוות יכול לקבוע תוקף לכל רישיון ולכל סוג שלט.' }))}::jsonb) on conflict (key) do nothing;`)
out.push(`insert into ks_settings(key,value) values ('fees_status', ${q(JSON.stringify({ text: 'התעריפים נקבעים לפי חוק עזר לאשדוד (מודעות ושלטים), התשנ"ח-1997, ובכפוף לתיקון שמקודם מפברואר 2026. עד להזנת הטבלה, לבירור: אגף הגבייה, מחלקת העסקים.' }))}::jsonb) on conflict (key) do nothing;`)
out.push('commit;')
writeFileSync('supabase/002_seed.sql', out.join('\n') + '\n')
console.log(out.length, 'statements')
