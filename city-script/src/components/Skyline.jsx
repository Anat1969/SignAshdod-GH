import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'

// חזית רחוב בשלוש שכבות עומק: עיר אפורה, ושלט אחד בצבע.
function rand(seed) {
  let s = seed
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646 }
}

function layer(seed, { count, minH, maxH, minW, maxW, base = 220 }) {
  const r = rand(seed)
  const out = []
  let x = -20
  while (x < 1220 && out.length < count) {
    const w = minW + r() * (maxW - minW)
    const h = minH + r() * (maxH - minH)
    out.push({ x, w, h, y: base - h, r: r() })
    x += w + 2 + r() * 10
  }
  return out
}

const FAR = layer(7, { count: 40, minH: 90, maxH: 190, minW: 26, maxW: 60 })
const MID = layer(19, { count: 30, minH: 60, maxH: 140, minW: 44, maxW: 96 })
const NEAR = layer(41, { count: 22, minH: 50, maxH: 110, minW: 70, maxW: 130 })
const HERO = NEAR.reduce((best, b) => (Math.abs(b.x + b.w / 2 - 760) < Math.abs(best.x + best.w / 2 - 760) ? b : best), NEAR[0])

function Windows({ b, cls }) {
  const cols = Math.max(2, Math.floor(b.w / 16))
  const rows = Math.max(1, Math.floor((b.h - 34) / 16))
  const cw = (b.w - 12) / cols
  return Array.from({ length: cols * rows }, (_, i) => (
    <rect key={i} className={cls} x={b.x + 6 + (i % cols) * cw + 2} y={b.y + 8 + Math.floor(i / cols) * 16} width={cw - 5} height={8} />
  ))
}

export default function Skyline() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const yFar = useTransform(scrollYProgress, [0, 1], [-10, 26])
  const yMid = useTransform(scrollYProgress, [0, 1], [-4, 14])
  return (
    <div className="skyline" ref={ref} aria-hidden="true">
      <motion.svg className="sk-layer sk-far" viewBox="0 0 1200 220" preserveAspectRatio="xMidYMax slice" style={{ y: yFar }}>
        {FAR.map((b, i) => <rect key={i} x={b.x} y={b.y} width={b.w} height={b.h} />)}
      </motion.svg>
      <motion.svg className="sk-layer sk-mid" viewBox="0 0 1200 220" preserveAspectRatio="xMidYMax slice" style={{ y: yMid }}>
        {MID.map((b, i) => <g key={i}><rect className="sk-body" x={b.x} y={b.y} width={b.w} height={b.h} /><Windows b={b} cls="sk-win-mid" /></g>)}
      </motion.svg>
      <svg className="sk-layer sk-near" viewBox="0 0 1200 220" preserveAspectRatio="xMidYMax slice">
        <defs>
          <linearGradient id="sk-near-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" className="sk-near-top" /><stop offset="1" className="sk-near-bottom" /></linearGradient>
          <filter id="sk-glow" x="-50%" y="-200%" width="200%" height="500%"><feGaussianBlur stdDeviation="6" /></filter>
        </defs>
        {NEAR.map((b, i) => (
          <g key={i}>
            <rect x={b.x} y={b.y} width={b.w} height={b.h} fill="url(#sk-near-g)" />
            <Windows b={b} cls="sk-win" />
            <rect className="sk-shop" x={b.x + 6} y={194} width={b.w - 12} height={26} />
            <rect className="sk-strip" x={b.x + 6} y={182} width={b.w - 12} height={8} />
          </g>
        ))}
        <g className="sk-sign">
          <rect x={HERO.x + 10} y={180} width={HERO.w - 20} height={12} filter="url(#sk-glow)" className="sk-sign-glow" />
          <rect x={HERO.x + 10} y={181} width={HERO.w - 20} height={10} className="sk-sign-face" />
        </g>
      </svg>
      <div className="sk-ground" />
    </div>
  )
}
