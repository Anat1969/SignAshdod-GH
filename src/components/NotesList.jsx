import { Mail } from "lucide-react";

const noteTypeLabels = {
  general: { label: "הערה כללית", color: "bg-slate-100 text-slate-700" },
  missing_document: { label: "מסמך חסר", color: "bg-red-50 text-red-700" },
  correction_needed: { label: "נדרש תיקון", color: "bg-orange-50 text-orange-700" },
  approval: { label: "אישור", color: "bg-emerald-50 text-emerald-700" },
  rejection: { label: "דחייה", color: "bg-red-50 text-red-700" },
};

export default function NotesList({ notes }) {
  if (notes.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">אין הערות עדיין</p>
    );
  }

  return (
    <div className="space-y-3">
      {notes.map((note) => {
        const config = noteTypeLabels[note.note_type] || noteTypeLabels.general;
        return (
          <div key={note.id} className="p-3 rounded-lg border border-border bg-card">
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${config.color}`}>
                {config.label}
              </span>
              <div className="flex items-center gap-2">
                {note.sent_to_applicant && (
                  <span className="flex items-center gap-1 text-xs text-emerald-600">
                    <Mail className="w-3 h-3" />
                    נשלח
                  </span>
                )}
                <span className="text-xs text-muted-foreground">
                  {new Date(note.created_date).toLocaleDateString("he-IL")}
                </span>
              </div>
            </div>
            <p className="text-sm">{note.note_text}</p>
          </div>
        );
      })}
    </div>
  );
}