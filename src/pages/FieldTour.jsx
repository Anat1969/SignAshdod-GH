import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Camera, Loader2, MapPin, Search, ArrowRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import StatusBadge from '../components/StatusBadge';
import { VERDICTS, FIELD_TYPE, shrink, kb, locate, mapUrl, formatFieldNote, parseFieldNote, verdictOf } from '@/lib/field';
import { geocodeAll, distance, fmtDistance } from '@/lib/geo';
import TourMap from '../components/TourMap';
import DaySummary from '../components/DaySummary';

// A sign should stand at sites that were approved; those come first, then the ones still in review.
const ORDER = { approved: 0, under_review: 1, submitted: 2, needs_revision: 3, rejected: 4 };
const TONE = {
  ok: 'border-emerald-600 bg-emerald-600 text-white',
  warn: 'border-orange-500 bg-orange-500 text-white',
  bad: 'border-red-600 bg-red-600 text-white',
};

const siteOf = (r) => r.site_address || r.project_name || 'בקשה ללא כתובת';

/** Field tour: on the phone, at the site. Pick the request, photograph the sign, decide, save on the request. */
export default function FieldTour() {
  const [me, setMe] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [picked, setPicked] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [loc, setLoc] = useState(undefined); // undefined: not asked yet, null: not available
  const [verdict, setVerdict] = useState('');
  const [remark, setRemark] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState([]);
  const [approvedBroken, setApprovedBroken] = useState(false);
  const [coords, setCoords] = useState({}); // address -> { lat, lng }
  const [here, setHere] = useState(null); // where the inspector stands
  const [today, setToday] = useState([]); // field checks saved today, newest first
  const camera = useRef(null);

  // where I am, once, for the map and the distance order
  useEffect(() => {
    locate().then((l) => l && setHere(l));
  }, []);

  // each site's address on the map, cached on the device
  useEffect(() => {
    if (!requests.length) return;
    const ctl = new AbortController();
    geocodeAll(requests.map((r) => r.site_address), (a, c) => setCoords((m) => ({ ...m, [a]: c })), { signal: ctl.signal });
    return () => ctl.abort();
  }, [requests]);

  useEffect(() => {
    (async () => {
      try {
        const user = await base44.auth.me();
        setMe(user);
        if (user.role !== 'admin') return;
        const all = await base44.entities.SignageRequest.list('-created_date', 200);
        setRequests(all.filter((r) => r.status && r.status !== 'draft'));
        const checks = await base44.entities.RequestNote.filter({ note_type: FIELD_TYPE }, '-created_date', 200);
        const day = new Date().toDateString();
        setToday(checks.filter((n) => new Date(n.created_date).toDateString() === day));
      } catch (e) {
        console.error(e);
        setError('לא ניתן לטעון את הבקשות כרגע. בדקו חיבור לרשת ונסו שוב.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const away = (r) => (here && coords[r.site_address] ? distance(here, coords[r.site_address]) : null);
  const byDistance = !!here && Object.keys(coords).length > 0;
  const list = useMemo(() => {
    const words = q.trim().split(/\s+/).filter(Boolean);
    return requests
      .filter((r) => {
        const hay = [r.site_address, r.project_name, r.permit_number, r.developer_name, r.contractor_name].join(' ');
        return words.every((w) => hay.includes(w));
      })
      .sort((a, b) => {
        if (byDistance) {
          const da = away(a) ?? Infinity;
          const db = away(b) ?? Infinity;
          if (da !== db) return da - db;
        }
        return (ORDER[a.status] ?? 9) - (ORDER[b.status] ?? 9);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requests, q, coords, here]);

  // the latest check of each site today colours its pin
  const checkedToday = useMemo(() => {
    const m = new Map();
    for (const n of today) if (!m.has(n.request_id)) m.set(n.request_id, parseFieldNote(n.note_text).verdict);
    return m;
  }, [today]);
  const pins = list
    .filter((r) => coords[r.site_address])
    .map((r) => {
      const v = checkedToday.get(r.id);
      return { id: r.id, ...coords[r.site_address], label: siteOf(r), verdict: v, tone: v ? verdictOf(v)?.tone : 'none' };
    });

  const takePhoto = async (f) => {
    if (!f || !f.type.startsWith('image/')) return;
    const small = await shrink(f);
    setPhoto({ file: small, url: URL.createObjectURL(small), before: f.size });
    if (loc === undefined || loc === null) setLoc(await locate());
  };

  const reset = () => {
    if (photo) URL.revokeObjectURL(photo.url);
    setPicked(null);
    setPhoto(null);
    setVerdict('');
    setRemark('');
    setApprovedBroken(false);
  };

  const save = async () => {
    if (!picked || !verdict) return;
    setSaving(true);
    setError('');
    try {
      const photoUrl = photo ? (await base44.integrations.Core.UploadFile({ file: photo.file })).file_url : '';
      const note = await base44.entities.RequestNote.create({
        request_id: picked.id,
        note_type: FIELD_TYPE,
        note_text: formatFieldNote({ verdict, remark, photoUrl, loc }),
      });
      setSaved((s) => [{ id: picked.id, site: siteOf(picked), verdict }, ...s]);
      setToday((t) => [note, ...t]);
      reset();
    } catch (e) {
      console.error(e);
      setError(`הבדיקה לא נשמרה: ${e.message || 'שגיאה'}. התמונה וההכרעה נשארו כאן, אפשר לנסות שוב.`);
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="py-16 text-center text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
        טוען את הבקשות לסיור
      </div>
    );

  if (me && me.role !== 'admin')
    return (
      <div className="max-w-md mx-auto py-12 space-y-3 text-center" dir="rtl">
        <h1 className="text-xl font-bold">סיור שטח מיועד לצוות העירייה</h1>
        <p className="text-muted-foreground">הפקחים מצלמים כאן את השלטים באתרים. את הבקשות שלך אפשר לראות ב"כל הבקשות".</p>
        <Link to="/requests" className="underline">
          לבקשות שלי
        </Link>
      </div>
    );

  return (
    <div className="field-tour max-w-xl mx-auto space-y-5" dir="rtl">
      <header className="space-y-1">
        <p className="text-xs font-semibold text-muted-foreground tracking-wide">סיור שטח</p>
        <h1 className="text-2xl font-bold">
          <mark className="bg-yellow-200 px-1">מצלמים את השלט</mark>, והבדיקה נרשמת בבקשה.
        </h1>
        <p className="text-sm text-muted-foreground">התמונה, המיקום והשעה נשמרים בבקשה עצמה. הבדיקה פנימית לעירייה ואינה נשלחת למבקש.</p>
      </header>

      {saved.length > 0 && (
        <section className="field-saved border border-emerald-200 bg-emerald-50 p-3 text-sm" aria-live="polite">
          <p className="font-bold text-emerald-800">נשמרו בסיור הזה: {saved.length}</p>
          <ol className="mt-1 space-y-0.5 list-decimal pr-5">
            {saved.map((s, i) => (
              <li key={i}>
                <Link to={`/request/${s.id}`} className="underline">
                  {s.site}
                </Link>{' '}
                · {s.verdict}
              </li>
            ))}
          </ol>
        </section>
      )}

      {!picked && <DaySummary checks={today} requests={requests} />}

      {error && <p className="field-error border border-red-200 bg-red-50 text-red-800 p-3 text-sm">{error}</p>}

      {!picked ? (
        <section className="space-y-3">
          <h2 className="font-bold">
            <span className="text-muted-foreground font-mono ml-2">01</span>
            איזה אתר?
          </h2>
          <label className="flex items-center gap-2 border border-border bg-card px-3">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input
              className="field-search w-full py-3 bg-transparent outline-none"
              placeholder="רחוב, פרויקט, מספר היתר או יזם"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </label>
          <TourMap pins={pins} me={here} onPick={(id) => setPicked(requests.find((r) => r.id === id) || null)} />
          <p className="field-legend text-xs text-muted-foreground flex flex-wrap gap-x-3 gap-y-1">
            <span><i className="inline-block w-2.5 h-2.5 rounded-full align-middle ml-1" style={{ background: '#64748b' }} />טרם נבדק היום</span>
            <span><i className="inline-block w-2.5 h-2.5 rounded-full align-middle ml-1" style={{ background: '#059669' }} />תואם</span>
            <span><i className="inline-block w-2.5 h-2.5 rounded-full align-middle ml-1" style={{ background: '#ea580c' }} />שונה</span>
            <span><i className="inline-block w-2.5 h-2.5 rounded-full align-middle ml-1" style={{ background: '#dc2626' }} />לא הותקן או מפגע</span>
            <span><i className="inline-block w-2.5 h-2.5 rounded-full align-middle ml-1" style={{ background: '#2563eb' }} />אני</span>
          </p>
          <p className="field-order text-xs font-semibold">
            {list.length} אתרים · מסודר לפי:{' '}
            {byDistance ? 'מרחק ממך, הקרוב ראשון' : 'סטטוס, הבקשות שאושרו ראשונות (המיקום שלך עוד לא נקלט)'}
          </p>
          {list.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              {requests.length ? 'אין אתר שמתאים לחיפוש. נסו מילה אחרת מהכתובת.' : 'אין עדיין בקשות שהוגשו, ולכן אין אתרים לסיור.'}
            </p>
          ) : (
            <ul className="space-y-2">
              {list.slice(0, 40).map((r) => (
                <li key={r.id}>
                  <button
                    className="field-site w-full text-right border border-transparent bg-card shadow-sm hover:shadow-md hover:-translate-y-px active:translate-y-0 transition p-3 flex items-center justify-between gap-3"
                    onClick={() => setPicked(r)}
                  >
                    <span className="min-w-0">
                      <span className="block font-bold truncate">{siteOf(r)}</span>
                      <span className="block text-xs text-muted-foreground truncate">
                        {[r.project_name !== siteOf(r) && r.project_name, r.permit_number && `היתר ${r.permit_number}`, r.request_type === 'talking_fence' ? 'גדר מדברת' : 'שלט פרויקט']
                          .filter(Boolean)
                          .join(' · ')}
                      </span>
                    </span>
                    <span className="flex flex-col items-end gap-1 shrink-0">
                      <StatusBadge status={r.status} />
                      {away(r) != null && <span className="field-dist text-[11px] text-muted-foreground">{fmtDistance(away(r))}</span>}
                      {checkedToday.has(r.id) && <span className="text-[11px] font-semibold">נבדק היום</span>}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : (
        <section className="space-y-4">
          <button className="text-sm underline flex items-center gap-1" onClick={reset}>
            <ArrowRight className="w-3 h-3" />
            אתר אחר
          </button>
          <div>
            <h2 className="text-xl font-bold">{siteOf(picked)}</h2>
            <p className="text-sm text-muted-foreground">
              {[picked.project_name, picked.permit_number && `היתר ${picked.permit_number}`].filter(Boolean).join(' · ')}
            </p>
          </div>

          {/* the approved sign next to what stands at the site: one look decides */}
          <div className="grid grid-cols-2 gap-3">
            <figure className="space-y-1">
              <figcaption className="text-xs font-semibold text-muted-foreground">
                <span className="font-mono ml-1">02</span> מה אושר
              </figcaption>
              {picked.sign_example_file && !approvedBroken ? (
                <img src={picked.sign_example_file} alt="השלט שאושר" className="w-full aspect-[3/4] object-contain bg-muted border border-border" onError={() => setApprovedBroken(true)} />
              ) : (
                <div className="w-full aspect-[3/4] bg-muted border border-border flex items-center justify-center p-3 text-center text-xs text-muted-foreground">
                  {picked.sign_example_file ? (
                    <a href={picked.sign_example_file} target="_blank" rel="noopener noreferrer" className="underline">
                      קובץ השלט המאושר
                    </a>
                  ) : (
                    'לא צורפה דוגמת שלט לבקשה'
                  )}
                </div>
              )}
            </figure>
            <figure className="space-y-1">
              <figcaption className="text-xs font-semibold text-muted-foreground">
                <span className="font-mono ml-1">03</span> מה עומד באתר
              </figcaption>
              <button className="field-shoot w-full aspect-[3/4] bg-slate-900 text-white flex flex-col items-center justify-center gap-2 shadow-md hover:shadow-lg active:translate-y-px transition overflow-hidden" onClick={() => camera.current?.click()}>
                {photo ? (
                  <img src={photo.url} alt="השלט שצולם באתר" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <Camera className="w-8 h-8" />
                    <span className="font-bold">צילום השלט</span>
                  </>
                )}
              </button>
            </figure>
          </div>
          {photo && (
            <p className="text-xs text-muted-foreground">
              {photo.file.size < photo.before ? `הוקטנה בטלפון: ${kb(photo.before)} ל-${kb(photo.file.size)}.` : `${kb(photo.file.size)}, נשלחת כמו שהיא.`} לחיצה על התמונה מצלמת מחדש.
            </p>
          )}
          <p className="field-loc text-xs text-muted-foreground flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {loc === undefined ? 'המיקום נקלט עם הצילום' : loc ? <a className="underline" href={mapUrl(loc)} target="_blank" rel="noopener noreferrer">המיקום נקלט, דיוק {loc.acc} מ'</a> : 'המיקום לא נקלט (לא אושר בטלפון). הבדיקה תישמר בלעדיו.'}
          </p>

          <div className="space-y-2">
            <h3 className="font-bold">
              <span className="text-muted-foreground font-mono ml-2">04</span>
              מה ההכרעה?
            </h3>
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="הכרעת בדיקת השטח">
              {VERDICTS.map((v) => (
                <button
                  key={v.key}
                  role="radio"
                  aria-checked={verdict === v.label}
                  className={`field-verdict-btn min-h-16 p-2 border text-right shadow-sm hover:-translate-y-px active:translate-y-0 transition ${verdict === v.label ? TONE[v.tone] : 'border-transparent bg-card'}`}
                  onClick={() => setVerdict(v.label)}
                >
                  <span className="block font-bold">{v.label}</span>
                  <span className={`block text-xs ${verdict === v.label ? 'opacity-90' : 'text-muted-foreground'}`}>{v.hint}</span>
                </button>
              ))}
            </div>
          </div>

          <textarea
            className="w-full border border-border bg-card p-3 text-sm"
            rows={2}
            placeholder="הערה קצרה (לא חובה): מה ראיתי, מה צריך לתקן"
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
          />

          <button
            className="field-save w-full min-h-14 bg-primary text-primary-foreground font-bold text-lg shadow-md hover:shadow-lg active:translate-y-px transition disabled:opacity-50 flex items-center justify-center gap-2"
            onClick={save}
            disabled={!verdict || saving}
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? 'שומר בבקשה...' : verdict ? 'שמירה בבקשה' : 'בוחרים הכרעה כדי לשמור'}
          </button>
        </section>
      )}
      <input ref={camera} type="file" accept="image/*" capture="environment" hidden onChange={(e) => takePhoto(e.target.files?.[0])} />
    </div>
  );
}
