import { MapPin } from 'lucide-react';
import { parseFieldNote, mapUrl, verdictOf } from '@/lib/field';

const TONE = {
  ok: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  warn: 'bg-orange-50 text-orange-800 border-orange-200',
  bad: 'bg-red-50 text-red-800 border-red-200',
};

/** A field check on the request page: the verdict first, the photo from the site, where and when it was taken. */
export default function FieldCheckNote({ note }) {
  const f = parseFieldNote(note.note_text);
  const tone = TONE[verdictOf(f.verdict)?.tone] || TONE.warn;
  return (
    <div className="field-note border border-border bg-card p-3" dir="rtl">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-semibold text-muted-foreground">בדיקת שטח</span>
        <span className="text-xs text-muted-foreground">{f.at || new Date(note.created_date).toLocaleDateString('he-IL')}</span>
      </div>
      <p className={`field-verdict inline-block border px-2 py-1 text-sm font-bold ${tone}`}>{f.verdict || 'ללא הכרעה'}</p>
      {f.remark && <p className="text-sm mt-2">{f.remark}</p>}
      {f.photoUrl && (
        <a href={f.photoUrl} target="_blank" rel="noopener noreferrer" className="block mt-2" title="פתיחת התמונה בגודל מלא">
          <img src={f.photoUrl} alt="השלט באתר, מבדיקת השטח" className="w-full max-h-72 object-contain bg-muted" loading="lazy" />
        </a>
      )}
      <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
        <MapPin className="w-3 h-3" />
        {f.loc ? (
          <a className="underline" href={mapUrl(f.loc)} target="_blank" rel="noopener noreferrer">
            במפה, דיוק {f.loc.acc} מ'
          </a>
        ) : (
          'המיקום לא נקלט בטלפון'
        )}
        <span className="mx-1">·</span>
        {note.created_by}
      </p>
    </div>
  );
}
