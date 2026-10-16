import { Routes, Route, Link } from 'react-router-dom'
import Shell, { useStrip } from './components/Shell'
import Home from './pages/Home'
import Check from './pages/Check'
import Construction from './pages/Construction'
import { GuideIndex, GuideCategory } from './pages/Guide'
import { RoutesIndex, RouteDetail } from './pages/Routes'
import Fees from './pages/Fees'
import Report from './pages/Report'
import Track from './pages/Track'
import Staff from './pages/Staff'

function NotFound() {
  useStrip('404', 'הדף לא נמצא.', 'var(--ink-muted)')
  return <div className="page"><h1>הדף לא נמצא</h1><p className="lead"><Link to="/">חזרה לדף הבית</Link></p></div>
}

export default function App() {
  return (
    <Shell>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/check" element={<Check />} />
        <Route path="/construction" element={<Construction />} />
        <Route path="/guide" element={<GuideIndex />} />
        <Route path="/guide/:slug" element={<GuideCategory />} />
        <Route path="/routes" element={<RoutesIndex />} />
        <Route path="/routes/:slug" element={<RouteDetail />} />
        <Route path="/fees" element={<Fees />} />
        <Route path="/report" element={<Report />} />
        <Route path="/track" element={<Track />} />
        <Route path="/staff" element={<Staff />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Shell>
  )
}
