import { useEffect, useState, createContext, useContext, useCallback } from 'react'
import { NavLink, Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'

const DEV_CHAT = 'https://claude.ai/code/session_01KhbwxVb8Xt7ssV48NyNngF'
const RESEARCH = 'https://claude.ai/project/1767b4d0-9ab9-4d31-a2a4-05814819da6e'

const StripCtx = createContext({ set: () => {} })
export const useStrip = (label, text, color) => {
  const { set } = useContext(StripCtx)
  useEffect(() => { set({ label, text, color }) }, [label, text, color, set])
}

const ToastCtx = createContext(() => {})
export const useToast = () => useContext(ToastCtx)

const links = [
  ['/check', 'בדיקת התאמה'],
  ['/construction', 'אתרי בנייה'],
  ['/guide', 'הנחיות'],
  ['/routes', 'מסלולים'],
  ['/fees', 'אגרות'],
  ['/report', 'דיווח'],
  ['/track', 'מעקב בקשה'],
  ['/staff', 'צוות העירייה'],
]

export default function Shell({ children }) {
  const [open, setOpen] = useState(false)
  const [strip, setStripState] = useState({ label: 'כתב העיר', text: '', color: 'var(--port-500)' })
  const [toast, setToast] = useState(null)
  const [installEvt, setInstallEvt] = useState(null)
  const loc = useLocation()

  const set = useCallback((s) => setStripState((prev) => (prev.label === s.label && prev.text === s.text && prev.color === s.color ? prev : s)), [])
  const show = useCallback((msg) => { setToast(msg); setTimeout(() => setToast(null), 2400) }, [])

  useEffect(() => { setOpen(false); window.scrollTo({ top: 0 }) }, [loc.pathname])
  useEffect(() => {
    const h = (e) => { e.preventDefault(); setInstallEvt(e) }
    window.addEventListener('beforeinstallprompt', h)
    window.addEventListener('appinstalled', () => setInstallEvt(null))
    return () => window.removeEventListener('beforeinstallprompt', h)
  }, [])

  const copyLink = async () => {
    try { await navigator.clipboard.writeText(window.location.href); show('הקישור הועתק') }
    catch { show('לא ניתן להעתיק. הכתובת: ' + window.location.href) }
  }
  const install = async () => {
    if (!installEvt) return
    installEvt.prompt()
    await installEvt.userChoice.catch(() => null)
    setInstallEvt(null)
  }

  return (
    <StripCtx.Provider value={{ set }}>
      <ToastCtx.Provider value={show}>
        <header className={`topnav ${open ? 'open' : ''}`}>
          <div className="topnav-inner">
            <Link to="/" className="brand" aria-label="כתב העיר, לדף הבית">
              <img src="/favicon.svg" alt="" width="28" height="28" />
              <span><span className="brand-name">כתב העיר</span><span className="brand-sub">שילוט עירוני אשדוד</span></span>
            </Link>
            <button className="btn btn-sm menu-toggle" onClick={() => setOpen((o) => !o)} aria-expanded={open}>{open ? 'סגירה' : 'תפריט'}</button>
            <nav className="nav-links" aria-label="ניווט ראשי">
              {links.map(([to, label]) => <NavLink key={to} to={to}>{label}</NavLink>)}
            </nav>
            <div className="nav-actions">
              <button className="btn btn-sm" onClick={copyLink}>העתקת קישור</button>
              <a className="btn btn-sm btn-quiet" href={DEV_CHAT} target="_blank" rel="noreferrer">שיחת הפיתוח</a>
              <a className="btn btn-sm btn-quiet" href={RESEARCH} target="_blank" rel="noreferrer">פרויקט המחקר</a>
              {installEvt && <button className="btn btn-sm btn-primary" onClick={install}>התקנת האפליקציה</button>}
            </div>
          </div>
        </header>
        <div className="strip" style={{ '--strip-color': strip.color || 'var(--port-500)' }} role="status" aria-live="polite">
          <div className="strip-inner">
            <span className="strip-label">{strip.label}</span>
            <motion.span key={strip.label} className="strip-text" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
              {strip.text}
            </motion.span>
          </div>
        </div>
        <main>
          <motion.div key={loc.pathname} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }}>
            {children}
          </motion.div>
        </main>
        <footer className="footer">
          <div className="footer-inner">
            <span>מבוסס על מדיניות להצבת שילוט, עיריית אשדוד, אדריכלות העיר, דצמבר 2024. בכל סתירה גובר חוק עזר לאשדוד (מודעות ושלטים), התשנ"ח-1997.</span>
            <span>מפה: © OpenStreetMap, OpenFreeMap. גבולות האזורים משוערים.</span>
          </div>
        </footer>
        {toast && <div className="toast" role="status">{toast}</div>}
      </ToastCtx.Provider>
    </StripCtx.Provider>
  )
}
