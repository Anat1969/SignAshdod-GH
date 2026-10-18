import { distanceMeters } from './geo'

export const RESULT = {
  pass: { label: 'תואם', cls: 'tag-pass' },
  review: { label: 'דורש בדיקה', cls: 'tag-review' },
  fail: { label: 'לא תואם', cls: 'tag-fail' },
  info: { label: 'דרישה', cls: 'tag-info' },
  open: { label: 'טרם נענה', cls: 'tag-neutral' },
  must: { label: 'חובה', cls: 'tag-must' },
  step: { label: 'שלב', cls: 'tag-step' },
}

// מבנים לשימור בטווח של 40 מ' מהנקודה (shimur_buildings).
export function nearbyPreservation(point, buildings, radius = 40) {
  if (!point) return []
  return (buildings || [])
    .filter((b) => b.lat && b.lng)
    .map((b) => ({ ...b, d: distanceMeters(point, [b.lng, b.lat]) }))
    .filter((b) => b.d <= radius)
    .sort((a, b) => a.d - b.d)
}

function zoneCheck(rule, zone, nearby) {
  if (!zone) return { status: 'review', why: 'המיקום לא אותר על המפה. הבדיקה תיעשה ידנית.' }
  switch (rule.zone_key) {
    case 'electronic':
      return zone.electronic_allowed
        ? { status: 'pass', why: `באזור "${zone.name}" מותר שילוט אלקטרוני, בכפוף לשאר התנאים.` }
        : { status: 'fail', why: `באזור "${zone.name}" אין שילוט אלקטרוני. ${zone.note || ''}` }
    case 'not_coast':
      return zone.coast || zone.view_protected
        ? { status: 'fail', why: `"${zone.name}" הוא אזור חוף או מבט פתוח.` }
        : { status: 'pass', why: 'המיקום אינו ברצועת החוף או באזור מבט מוגן.' }
    case 'not_preservation':
      return nearby.length
        ? { status: 'review', why: `בקרבת מקום: ${nearby.map((b) => b.name).slice(0, 2).join(', ')}. יש לוודא שהשלט אינו על מבנה לשימור.` }
        : { status: 'pass', why: 'לא אותר מבנה לשימור ברשימה העירונית בטווח 40 מ\'.' }
    case 'totem':
      return zone.totem_allowed
        ? { status: 'pass', why: `באזור "${zone.name}" אפשר לבקש טוטם.` }
        : { status: 'review', why: `באזור "${zone.name}" טוטם אינו מתאפשר. כרזה על חזית: בהתאם לשאר התנאים.` }
    default:
      return { status: 'review', why: 'בדיקה ידנית.' }
  }
}

// הערכת הבקשה: כל כלל מקבל תוצאה וסעיף מקור. התוצאה הכוללת היא החמורה מביניהן.
export function evaluate(rules, answers, zone, nearby = []) {
  const items = rules.map((r) => {
    if (r.kind === 'info') return { rule: r, status: 'info' }
    if (r.kind === 'zone') return { rule: r, ...zoneCheck(r, zone, nearby) }
    const a = answers[r.id]
    if (a === undefined) return { rule: r, status: 'open' }
    if (a === 'unknown') return { rule: r, status: 'review', why: 'לא ידוע למבקש. ייבדק בוועדה.' }
    const ok = (a === 'yes') === (r.expect !== false)
    return { rule: r, status: ok ? 'pass' : (r.on_fail || 'fail') }
  })
  const graded = items.filter((i) => i.status !== 'info')
  const overall = graded.some((i) => i.status === 'fail') ? 'fail'
    : graded.some((i) => i.status === 'open') ? 'open'
    : graded.some((i) => i.status === 'review') ? 'review' : 'pass'
  return { items, overall, counts: {
    pass: graded.filter((i) => i.status === 'pass').length,
    review: graded.filter((i) => i.status === 'review').length,
    fail: graded.filter((i) => i.status === 'fail').length,
    open: graded.filter((i) => i.status === 'open').length,
  } }
}

export const OVERALL_TEXT = {
  pass: 'הרעיון תואם את הכללים. אפשר להגיש בקשה.',
  review: 'הרעיון אפשרי, אבל חלק מהתנאים ייבדקו בוועדה.',
  fail: 'במתכונת הזאת השלט אינו תואם את המדיניות. כדאי לשנות לפני הגשה.',
  open: 'נותרו שאלות פתוחות.',
}

// תעריף בתוקף לסוג שלט בתאריך נתון
export function rateFor(fees, slug, date = new Date()) {
  const d = date.toISOString().slice(0, 10)
  return (fees || []).filter((f) => (f.category_slug === slug || !f.category_slug) && f.valid_from <= d)
    .sort((a, b) => (a.category_slug ? 0 : 1) - (b.category_slug ? 0 : 1) || (a.valid_from < b.valid_from ? 1 : -1))[0] || null
}

export const UNIT_LABEL = { sqm_year: 'למ"ר לשנה', sign_year: 'לשלט לשנה', one_time: 'חד-פעמי' }
export const SOURCE_LABEL = { bylaw_1997: 'חוק העזר, התשנ"ח-1997', amendment_2026: 'תיקון 2026', other: 'אחר' }

export function computeFee(rate, area, months = 12) {
  if (!rate) return null
  const a = Math.max(0, Number(area) || 0)
  if (rate.unit === 'sqm_year') return Math.round(rate.amount_ils * a * (months / 12) * 100) / 100
  if (rate.unit === 'sign_year') return Math.round(rate.amount_ils * (months / 12) * 100) / 100
  return Number(rate.amount_ils)
}
