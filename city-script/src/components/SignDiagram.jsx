import { useId } from 'react'
import { land } from '../lib/landscapes'
import { Section } from './bits'

// חזית סכמטית לכל סוג שלט: מה מותר, איפה ובאיזו מידה. לא בקנה מידה; המספרים הם מהמדיניות.
// 1 מ' ≈ 30 יחידות. קו הקרקע ב-y=260.
const G = 260

function Block({ x, y, w, h, d = 14, id, cls = '' }) {
  const k = d * 0.6
  return (
    <g className={cls}>
      <polygon className="sd-shadow" points={`${x + w},${G} ${x + w + d * 2.2},${G + 10} ${x + d * 2.2},${G + 10} ${x},${G}`} />
      <polygon className="sd-roof" points={`${x},${y} ${x + d},${y - k} ${x + w + d},${y - k} ${x + w},${y}`} />
      <polygon className="sd-side" points={`${x + w},${y} ${x + w + d},${y - k} ${x + w + d},${y + h - k} ${x + w},${y + h}`} />
      <rect x={x} y={y} width={w} height={h} fill={`url(#${id}-wall)`} className="sd-edge" />
    </g>
  )
}

const Windows = ({ x, y, cols, rows, w = 18, h = 20, gx = 14, gy = 14 }) => (
  <g>{Array.from({ length: rows * cols }, (_, i) => (
    <rect key={i} className="sd-glass" x={x + (i % cols) * (w + gx)} y={y + Math.floor(i / cols) * (h + gy)} width={w} height={h} />
  ))}</g>
)

function DimV({ x, y1, y2, label, side = 'left' }) {
  const tx = side === 'left' ? x - 6 : x + 6
  return (
    <g className="sd-dim">
      <line x1={x} y1={y1} x2={x} y2={y2} />
      <line x1={x - 5} y1={y1} x2={x + 5} y2={y1} />
      <line x1={x - 5} y1={y2} x2={x + 5} y2={y2} />
      <text x={tx} y={(y1 + y2) / 2 + 4} textAnchor={side === 'left' ? 'start' : 'end'}>{label}</text>
    </g>
  )
}

function DimH({ y, x1, x2, label }) {
  return (
    <g className="sd-dim">
      <line x1={x1} y1={y} x2={x2} y2={y} />
      <line x1={x1} y1={y - 5} x2={x1} y2={y + 5} />
      <line x1={x2} y1={y - 5} x2={x2} y2={y + 5} />
      <text x={(x1 + x2) / 2} y={y - 7} textAnchor="middle">{label}</text>
    </g>
  )
}

const Mark = ({ n, x, y, i = 0 }) => (
  <g className="sd-mark sd-in" style={{ animationDelay: `${0.5 + i * 0.12}s` }}>
    <circle cx={x} cy={y} r="9" />
    <text x={x} y={y + 4} textAnchor="middle">{n}</text>
  </g>
)

// הבלטת השלט עצמו: נכנס אחרי הבניין
const Sign = ({ children, i = 0 }) => (
  <g className="sd-in sd-drop" style={{ animationDelay: `${0.2 + i * 0.1}s` }}>{children}</g>
)

const D = {
  'house-number': {
    notes: [
      ['2.2.1 ב', 'לוחית אלומיניום 25x20 ס"מ, בעובי 2 מ"מ.'],
      ['2.2.1 ג-ד', 'פילם כחול מחזיר אור. גופן נרקיס בלוק, בגובה 7 ס"מ.'],
      ['2.2.1 א', 'מואר, בגובה 3 מ\' ממפלס הכניסה, בכל חזית הפונה לרחוב או למרחב ציבורי.'],
    ],
    draw: (id) => (<>
      <Block id={id} x={150} y={70} w={230} h={190} />
      <Windows x={168} y={88} cols={5} rows={2} w={26} h={24} gx={16} gy={16} />
      <rect className="sd-door" x={175} y={196} width={40} height={64} />
      <rect className="sd-canopy" x={165} y={190} width={60} height={6} />
      <Sign>
        <rect x={232} y={158} width={40} height={30} rx="2" fill="#1F5FA8" filter={`url(#${id}-glow)`} />
        <text x={252} y={176} textAnchor="middle" className="sd-plate-num">12</text>
        <text x={252} y={184} textAnchor="middle" className="sd-plate-st">הים</text>
      </Sign>
      <DimV x={128} y1={G} y2={173} label={'3.0 מ\''} />
      <line className="sd-lead" x1={134} y1={173} x2={232} y2={173} />
      <Mark n={1} x={290} y={160} i={0} />
      <Mark n={2} x={290} y={186} i={1} />
      <Mark n={3} x={110} y={150} i={2} />
    </>),
  },
  business: {
    notes: [
      ['2.1.5', 'רצועת שילוט אחידה לכל העסקים בחזית הראשית.'],
      ['2.2.3 ב, ו', 'אותיות בודדות, בגבולות הפתח המקורי של העסק. לא קופסה מוארת.'],
      ['2.2.3 ז', 'הלוגו בולט עד 10 ס"מ מעל גובה האותיות.'],
      ['2.1.6', 'הסף התחתון בגובה 2.5 מ\' לפחות.'],
      ['2.2.3 י', 'מדבקות בחלון הראווה: עד 30% משטחו.'],
    ],
    draw: (id, c) => (<>
      <Block id={id} x={60} y={60} w={370} h={200} />
      <Windows x={78} y={76} cols={8} rows={2} w={26} h={26} gx={18} gy={14} />
      <rect className="sd-strip" x={66} y={158} width={358} height={27} />
      {[0, 1, 2].map((k) => <rect key={k} className="sd-glass" x={74 + k * 120} y={195} width={104} height={65} />)}
      <Sign>
        <text x={126} y={178} textAnchor="middle" className="sd-letters sd-muted-letters">ספרים</text>
        <text x={366} y={178} textAnchor="middle" className="sd-letters sd-muted-letters">מאפייה</text>
        <text x={240} y={179} textAnchor="middle" className="sd-letters" style={{ fill: c.c700 }}>קפה הים</text>
        <rect x={281} y={160} width={11} height={22} rx="2" style={{ fill: c.c500 }} />
      </Sign>
      <Sign i={1}>
        <pattern id={`${id}-hatch`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="6" style={{ stroke: c.c500 }} strokeWidth="2" />
        </pattern>
        <rect x={196} y={228} width={58} height={32} fill={`url(#${id}-hatch)`} opacity="0.75" />
      </Sign>
      <DimV x={40} y1={G} y2={185} label={'2.5 מ\''} />
      <line className="sd-lead" x1={46} y1={185} x2={66} y2={185} />
      <Mark n={1} x={412} y={150} i={0} />
      <Mark n={2} x={240} y={148} i={1} />
      <Mark n={3} x={304} y={154} i={2} />
      <Mark n={4} x={22} y={250} i={3} />
      <Mark n={5} x={268} y={236} i={4} />
    </>),
  },
  awning: {
    notes: [
      ['2.2.4 א', 'שם בית העסק בלבד, בלי פרסום של חברות אחרות.'],
      ['2.2.4 ג.1', 'בסוכך או מרקיזה: אותיות בודדות בחלק התחתון, בשדה עד 0.30 מ\', מקביל לחזית.'],
      ['2.2.4 ב', 'גוון השלט לפי גווני הלוגו.'],
      ['2.2.4 ג.2', 'בסגירה עונתית: באמצע החזית, בחלקה העליון, ולא מעבר לתקרת הסגירה.'],
    ],
    draw: (id, c) => (<>
      <Block id={id} x={100} y={80} w={300} h={180} />
      <Windows x={120} y={96} cols={6} rows={2} w={28} h={24} gx={18} gy={14} />
      <rect className="sd-glass" x={160} y={200} width={180} height={60} />
      <Sign>
        <polygon className="sd-awning" points="152,170 348,170 366,198 134,198" />
        {Array.from({ length: 9 }, (_, k) => <line key={k} className="sd-awning-stripe" x1={160 + k * 22} y1={170} x2={152 + k * 24} y2={198} />)}
        <rect x={134} y={198} width={232} height={16} style={{ fill: c.c100, stroke: c.c700 }} strokeWidth="1" />
        <text x={250} y={211} textAnchor="middle" className="sd-small-letters" style={{ fill: c.c700 }}>קפה הים</text>
      </Sign>
      <DimV x={384} y1={198} y2={214} label={'עד 0.30 מ\''} side="right" />
      <Mark n={1} x={196} y={206} i={0} />
      <Mark n={2} x={250} y={230} i={1} />
      <Mark n={3} x={340} y={160} i={2} />
    </>),
  },
  'project-name': {
    notes: [
      ['2.2.2 ג', 'רק על מבני ציבור, תעסוקה ומסחר.'],
      ['2.2.2 ג.1, ג.5', 'שלט אחד לחזית, בקומה העליונה, באותיות בודדות.'],
      ['2.2.2 א', 'שם הקבלן, היזם או בעלי המבנה אסור על החזית ועל הגג.'],
      ['2.2.2 ב', 'שם יזם או קבלן מותר רק בתוך המבואה הראשית, עד 1.2 מ"ר.'],
    ],
    draw: (id, c) => (<>
      <Block id={id} x={40} y={150} w={120} h={110} />
      <Windows x={54} y={164} cols={3} rows={2} w={22} h={22} gx={14} gy={14} />
      <text x={100} y={240} textAnchor="middle" className="sd-forbidden">שם היזם</text>
      <line className="sd-strike" x1={68} y1={236} x2={132} y2={236} />
      <Block id={id} x={220} y={36} w={190} h={224} d={18} />
      {Array.from({ length: 8 }, (_, k) => <line key={k} className="sd-mullion" x1={232 + k * 24} y1={76} x2={232 + k * 24} y2={226} />)}
      {Array.from({ length: 6 }, (_, k) => <line key={k} className="sd-mullion" x1={226} y1={86 + k * 24} x2={404} y2={86 + k * 24} />)}
      <rect className="sd-door" x={292} y={226} width={46} height={34} />
      <Sign>
        <text x={315} y={63} textAnchor="middle" className="sd-letters" style={{ fill: c.c700 }}>מרכז הים</text>
      </Sign>
      <Mark n={1} x={430} y={150} i={0} />
      <Mark n={2} x={200} y={56} i={1} />
      <Mark n={3} x={150} y={222} i={2} />
      <Mark n={4} x={352} y={244} i={3} />
    </>),
  },
  billboard: {
    notes: [
      ['2.2.5 א.2', 'על חזית אטומה בלבד, בלי להסתיר אלמנטים אדריכליים ובלי לחרוג מגבולות החזית.'],
      ['2.2.5 א.2', 'כרזה אחת לחזית. אסורים מסר פוליטי ופגיעה במבטים הפנורמיים.'],
      ['2.2.5 א.2', 'טוטם: רק באזור מיוחד (מרכזי מסחר, פארק ההייטק).'],
      ['2.2.5 א.1', 'באישור ועדת השילוט, עם הדמיה בתלת־ממד של השלט על המבנה.'],
    ],
    draw: (id, c) => (<>
      <Block id={id} x={170} y={50} w={240} h={210} />
      <Windows x={300} y={66} cols={3} rows={5} w={22} h={24} gx={12} gy={14} />
      <Sign>
        <defs>
          <linearGradient id={`${id}-banner`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={c.c300} /><stop offset="1" stopColor={c.c500} />
          </linearGradient>
        </defs>
        <rect x={184} y={70} width={96} height={170} fill={`url(#${id}-banner)`} filter={`url(#${id}-glow)`} />
        <text x={232} y={160} textAnchor="middle" className="sd-banner-text">כרזה</text>
      </Sign>
      <Sign i={1}>
        <rect x={86} y={150} width={26} height={110} style={{ fill: c.c700 }} />
        <rect x={90} y={156} width={18} height={60} style={{ fill: c.c300 }} />
        <text x={99} y={274} textAnchor="middle" className="sd-caption">טוטם</text>
      </Sign>
      <Mark n={1} x={184} y={60} i={0} />
      <Mark n={2} x={292} y={150} i={1} />
      <Mark n={3} x={130} y={160} i={2} />
      <Mark n={4} x={232} y={110} i={3} />
    </>),
  },
  electronic: {
    notes: [
      ['2.2.6 ד.1', 'בחזית פעילה של מגרש הפונה לעורק תחבורה ראשי.'],
      ['2.2.6 ד.2', 'לפחות 50 מ\' ממבנה מגורים.'],
      ['2.2.6 ד.2, יא', 'רק בסביבה מסחרית. לא לאורך החוף, לא באתרי מבט ולא על מבנה לשימור.'],
      ['2.2.6 ז', 'לא מול עיני נהג בקו עצירה ולא בקו אחד עם פנסי רמזור.'],
      ['2.2.6 ג', 'היתר לשנה.'],
    ],
    draw: (id, c) => (<>
      <g className="sd-faded"><Block id={id} x={24} y={150} w={72} h={110} d={10} />
        <Windows x={34} y={162} cols={2} rows={3} w={18} h={18} gx={14} gy={12} /></g>
      <Block id={id} x={190} y={70} w={230} h={190} />
      <Windows x={206} y={86} cols={6} rows={2} w={22} h={22} gx={14} gy={14} />
      <rect className="sd-glass" x={200} y={214} width={210} height={46} />
      <Sign>
        <defs>
          <linearGradient id={`${id}-screen`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={c.c300} /><stop offset="1" stopColor={c.c700} />
          </linearGradient>
        </defs>
        <rect x={250} y={150} width={110} height={52} rx="2" fill={`url(#${id}-screen)`} filter={`url(#${id}-glow)`} />
        <rect x={250} y={150} width={110} height={52} rx="2" className="sd-screen-frame" />
      </Sign>
      <DimH y={128} x1={110} x2={190} label={'50 מ\' לפחות'} />
      <line className="sd-lane" x1={0} y1={284} x2={480} y2={284} />
      <text x={470} y={278} textAnchor="start" className="sd-caption">עורק תחבורה ראשי</text>
      <Mark n={1} x={180} y={276} i={0} />
      <Mark n={2} x={150} y={146} i={1} />
      <Mark n={3} x={440} y={150} i={2} />
      <Mark n={4} x={376} y={176} i={3} />
      <Mark n={5} x={234} y={176} i={4} />
    </>),
  },
  construction: {
    notes: [
      ['2.2.7 א.2', 'גדר מדברת בגובה 2 מ\', לאורך החזית הראשית, על פנל קשיח.'],
      ['2.2.7 א.2', 'חצי מהגדר תכנים עירוניים בתיאום עם הדוברות, וחצי תוכן היזם לפרויקט בלבד.'],
      ['2.2.7 א.1', 'שלט אתר 2x4 מ\' בכל כניסה, במפלס הקרקע, עם מספר היתר והדמיה.'],
      ['2.2.7 ב.2', 'פורמט אחיד: צורה, צבע, גופן וקומפוזיציה. משתנים רק פרטי הפרויקט.'],
    ],
    draw: (id, c) => (<>
      <g className="sd-frame">
        <line x1={330} y1={24} x2={330} y2={200} />
        <line x1={200} y1={30} x2={450} y2={30} />
        <line x1={330} y1={24} x2={410} y2={30} />
        <line x1={420} y1={30} x2={420} y2={92} />
        {Array.from({ length: 5 }, (_, k) => <line key={`h${k}`} x1={150} y1={96 + k * 26} x2={310} y2={96 + k * 26} />)}
        {Array.from({ length: 5 }, (_, k) => <line key={`v${k}`} x1={150 + k * 40} y1={96} x2={150 + k * 40} y2={200} />)}
      </g>
      <Sign>
        <rect x={40} y={200} width={200} height={60} style={{ fill: 'var(--sea-300)' }} />
        <text x={140} y={236} textAnchor="middle" className="sd-fence-text">עירייה 50%</text>
        <rect x={240} y={200} width={200} height={60} style={{ fill: c.c300 }} />
        <text x={300} y={236} textAnchor="middle" className="sd-fence-text">יזם 50%</text>
      </Sign>
      <Sign i={1}>
        <rect x={350} y={204} width={84} height={44} className="sd-site-sign" />
        <rect x={392} y={204} width={42} height={44} fill="#1F8A99" />
        <text x={413} y={230} textAnchor="middle" className="sd-plate-st">היתר</text>
        <rect x={354} y={208} width={34} height={36} className="sd-render" />
      </Sign>
      <DimV x={452} y1={G} y2={200} label={'2 מ\''} side="right" />
      <DimH y={190} x1={350} x2={434} label={'2x4 מ\''} />
      <Mark n={1} x={60} y={188} i={0} />
      <Mark n={2} x={240} y={188} i={1} />
      <Mark n={3} x={392} y={268} i={2} />
      <Mark n={4} x={340} y={252} i={3} />
    </>),
  },
}

export default function SignDiagram({ slug, landscape, compact = false, title }) {
  const raw = useId().replace(/[^a-zA-Z0-9]/g, '')
  const id = `sd${raw}`
  const spec = D[slug]
  if (!spec) return null
  const c = land(landscape)
  const svg = (
    <svg viewBox="0 0 480 300" className={`sd ${compact ? 'sd-compact' : ''}`} role="img" aria-label={title ? `חזית סכמטית: ${title}` : 'חזית סכמטית'} direction="rtl">
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: 'var(--sd-sky1)' }} /><stop offset="1" style={{ stopColor: 'var(--sd-sky2)' }} />
        </linearGradient>
        <linearGradient id={`${id}-wall`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" style={{ stopColor: 'var(--sd-w1)' }} /><stop offset="1" style={{ stopColor: 'var(--sd-w2)' }} />
        </linearGradient>
        <linearGradient id={`${id}-ground`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: 'var(--sd-ground)' }} /><stop offset="1" style={{ stopColor: 'var(--sd-sky2)' }} />
        </linearGradient>
        <filter id={`${id}-glow`} x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor={c.c500} floodOpacity="0.45" />
        </filter>
      </defs>
      <rect x="0" y="0" width="480" height={G} fill={`url(#${id}-sky)`} />
      <rect x="0" y={G} width="480" height={300 - G} fill={`url(#${id}-ground)`} />
      <line className="sd-groundline" x1="0" y1={G} x2="480" y2={G} />
      {spec.draw(id, c)}
    </svg>
  )
  if (compact) return <div className="sd-thumb">{svg}</div>
  return (
    <figure className="sd-figure">
      <div className="sd-canvas" style={{ '--sd-accent': c.c500 }}>{svg}</div>
      <figcaption>
        <span className="eyebrow">איך זה נראה על החזית</span>
        <ol className="sd-legend">
          {spec.notes.map(([s, t], i) => (
            <li key={i}><span className="sd-legend-n">{i + 1}</span><span><Section s={s} /> {t}</span></li>
          ))}
        </ol>
        <p className="caption">חזית סכמטית, לא בקנה מידה. המידות לפי המדיניות.</p>
      </figcaption>
    </figure>
  )
}
