import { useState } from 'react';
import { Copy, MessageCircle } from 'lucide-react';
import { VERDICTS, verdictOf, parseFieldNote } from '@/lib/field';

const TONE_TEXT = { ok: 'text-emerald-700', warn: 'text-orange-700', bad: 'text-red-700' };

// 05X-XXXXXXX -> 9725XXXXXXXX for a WhatsApp link; anything else is left out.
const waPhone = (p = '') => {
  const d = p.replace(/\D/g, '');
  if (/^05\d{8}$/.test(d)) return `972${d.slice(1)}`;
  if (/^9725\d{8}$/.test(d)) return d;
  return '';
};

export function messageFor(req, check) {
  const lines = [
    `שלום${req.developer_name ? ` ${req.developer_name}` : ''},`,
    `בבדיקת שטח של עיריית אשדוד ב-${check.at || new Date().toLocaleDateString('he-IL')} באתר ${req.site_address || req.project_name}${req.permit_number ? ` (היתר ${req.permit_number})` : ''}:`,
    `${check.verdict}.`,
    check.remark ? check.remark : null,
    check.photoUrl ? `צילום מהאתר: ${check.photoUrl}` : null,
    'נבקש לתקן בהתאם לשלט המאושר בתוך 7 ימים, ולעדכן אותנו בתשובה להודעה זו.',
    'מחלקת שילוט, עיריית אשדוד',
  ];
  return lines.filter(Boolean).join('\n');
}

/** Today's tour at a glance: how many sites, how they came out, and a ready message for every site that needs a fix. */
export default function DaySummary({ checks, requests }) {
  const [copied, setCopied] = useState('');
  if (!checks.length) return null;
  const byId = new Map(requests.map((r) => [r.id, r]));
  // the latest check of each site today decides
  const latest = new Map();
  for (const n of checks) if (!latest.has(n.request_id)) latest.set(n.request_id, n);
  const rows = [...latest.values()].map((n) => ({ note: n, f: parseFieldNote(n.note_text), req: byId.get(n.request_id) })).filter((r) => r.req);
  const count = (key) => rows.filter((r) => verdictOf(r.f.verdict)?.key === key).length;
  const fix = rows.filter((r) => verdictOf(r.f.verdict)?.key !== 'match');
  const ok = count('match');

  const copy = async (id, text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied(''), 1800);
    } catch {
      /* clipboard blocked: WhatsApp still works */
    }
  };

  return (
    <section className="day-summary border border-border bg-card shadow-sm p-4 space-y-3" aria-label="סיכום הסיור של היום">
      <p className="text-xs font-semibold text-muted-foreground">סיכום הסיור של היום</p>
      <p className="font-bold text-lg">
        {rows.length === 1 ? 'אתר אחד נבדק היום.' : `${rows.length} אתרים נבדקו היום.`}{' '}
        {fix.length ? (
          <mark className="bg-yellow-200 px-1">{fix.length === 1 ? 'אחד דורש פנייה ליזם' : `${fix.length} דורשים פנייה ליזם`}</mark>
        ) : (
          <mark className="bg-yellow-200 px-1">כולם תואמים לאישור</mark>
        )}
      </p>
      <p className="text-sm text-muted-foreground">
        {ok} מתוך {rows.length} תואמים לאישור ({Math.round((ok / rows.length) * 100)}%): {ok === rows.length ? 'אין מה לתקן היום.' : 'כל אתר אחר מקבל הודעה מוכנה למטה.'} נספרת ההכרעה האחרונה של כל אתר.
      </p>
      <div className="grid grid-cols-4 gap-1 text-center">
        {VERDICTS.map((v) => (
          <div key={v.key} className="bg-muted/60 p-2">
            <b className={`block text-xl ${TONE_TEXT[v.tone]}`}>{count(v.key)}</b>
            <span className="block text-[11px] leading-tight">{v.label}</span>
          </div>
        ))}
      </div>
      {fix.length > 0 && (
        <ol className="space-y-2">
          {fix.map(({ note, f, req }) => {
            const text = messageFor(req, f);
            const phone = waPhone(req.applicant_phone);
            return (
              <li key={note.id} className="day-fix border-t border-border pt-2">
                <p className="text-sm">
                  <b>{req.site_address || req.project_name}</b> · <span className={TONE_TEXT[verdictOf(f.verdict)?.tone]}>{f.verdict}</span>
                </p>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {phone ? (
                    <a className="day-wa flex items-center justify-center gap-1 min-h-10 bg-emerald-600 text-white text-sm font-semibold shadow-sm hover:shadow-md" href={`https://wa.me/${phone}?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener noreferrer">
                      <MessageCircle className="w-4 h-4" />
                      וואטסאפ למבקש
                    </a>
                  ) : (
                    <span className="flex items-center justify-center min-h-10 bg-muted text-xs text-muted-foreground text-center px-1">אין טלפון נייד בבקשה</span>
                  )}
                  <button className="day-copy flex items-center justify-center gap-1 min-h-10 bg-muted text-sm font-semibold shadow-sm hover:shadow-md" onClick={() => copy(note.id, text)}>
                    <Copy className="w-4 h-4" />
                    {copied === note.id ? 'הועתק' : 'העתקת ההודעה'}
                  </button>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
