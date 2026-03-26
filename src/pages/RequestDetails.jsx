import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  ArrowRight,
  Send,
  Loader2,
  MessageSquarePlus,
  CheckCircle2,
  Mail,
  Trash2,
  AlertTriangle
} from "lucide-react";
import StatusBadge from "../components/StatusBadge";
import DocumentChecklist from "../components/DocumentChecklist";
import RequestInfoGrid from "../components/RequestInfoGrid";
import NotesList from "../components/NotesList";

export default function RequestDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  // Note form
  const [noteText, setNoteText] = useState("");
  const [noteType, setNoteType] = useState("general");
  const [addingNote, setAddingNote] = useState(false);

  // Status actions
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  useEffect(() => {
    const load = async () => {
      const me = await base44.auth.me();
      setUser(me);
      const reqs = await base44.entities.SignageRequest.filter({ id });
      if (reqs.length > 0) setRequest(reqs[0]);
      const allNotes = await base44.entities.RequestNote.filter(
        { request_id: id },
        "-created_date",
        50
      );
      setNotes(allNotes);
      setLoading(false);
    };
    load();
  }, [id]);

  const isAdmin = user?.role === "admin";

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    setAddingNote(true);
    const note = await base44.entities.RequestNote.create({
      request_id: id,
      note_text: noteText,
      note_type: noteType,
    });
    setNotes([note, ...notes]);
    setNoteText("");
    toast.success("ההערה נוספה");
    setAddingNote(false);
  };

  const handleStatusChange = async (newStatus) => {
    setUpdatingStatus(true);
    await base44.entities.SignageRequest.update(id, { status: newStatus });
    setRequest({ ...request, status: newStatus });
    toast.success("הסטטוס עודכן");
    setUpdatingStatus(false);
  };

  const handleSendNotesToApplicant = async () => {
    setSendingEmail(true);
    const unsentNotes = notes.filter((n) => !n.sent_to_applicant);
    if (unsentNotes.length === 0) {
      toast.info("אין הערות חדשות לשליחה");
      setSendingEmail(false);
      return;
    }

    const notesHtml = unsentNotes
      .map((n) => {
        const typeLabel = {
          general: "הערה כללית",
          missing_document: "מסמך חסר",
          correction_needed: "נדרש תיקון",
          approval: "אישור",
          rejection: "דחייה",
        }[n.note_type] || "הערה";
        return `<li><strong>${typeLabel}:</strong> ${n.note_text}</li>`;
      })
      .join("");

    await base44.integrations.Core.SendEmail({
      to: request.applicant_email,
      subject: `הערות לבקשת שילוט - ${request.site_address}`,
      body: `
        <div dir="rtl" style="font-family: Arial, sans-serif;">
          <h2>הערות לבקשת שילוט</h2>
          <p>שלום ${request.applicant_name},</p>
          <p>נמצאו הערות לבקשת השילוט שלך בכתובת: <strong>${request.site_address}</strong></p>
          <ul>${notesHtml}</ul>
          <p>נא לטפל בהערות ולעדכן את הבקשה.</p>
          <p>בברכה,<br/>אגף אדריכל העיר, עיריית אשדוד</p>
        </div>
      `,
    });

    // Mark notes as sent
    for (const n of unsentNotes) {
      await base44.entities.RequestNote.update(n.id, { sent_to_applicant: true });
    }
    setNotes(
      notes.map((n) =>
        unsentNotes.find((un) => un.id === n.id)
          ? { ...n, sent_to_applicant: true }
          : n
      )
    );

    if (request.status === "submitted" || request.status === "under_review") {
      await base44.entities.SignageRequest.update(id, { status: "needs_revision" });
      setRequest({ ...request, status: "needs_revision" });
    }

    toast.success("ההערות נשלחו למבקש בהצלחה");
    setSendingEmail(false);
  };

  const handleApprove = async () => {
    setUpdatingStatus(true);
    await base44.entities.SignageRequest.update(id, {
      status: "approved",
      approval_date: new Date().toISOString().split("T")[0],
    });

    // Send email to Merav Biton to schedule signage committee
    await base44.integrations.Core.SendEmail({
      to: "meravb@ashdod.muni.il",
      subject: `זימון ועדת שילוט - ${request.site_address}`,
      body: `
        <div dir="rtl" style="font-family: Arial, sans-serif;">
          <h2>בקשת שילוט אושרה - נדרש זימון ועדת שילוט</h2>
          <p>שלום מירב,</p>
          <p>בקשת שילוט אושרה ויש לזמן ועדת שילוט:</p>
          <ul>
            <li><strong>סוג בקשה:</strong> ${request.request_type === "project_sign" ? "שלט פרויקט" : "גדר מדברת"}</li>
            <li><strong>מבקש:</strong> ${request.applicant_name}</li>
            <li><strong>כתובת:</strong> ${request.site_address}</li>
            <li><strong>מספר היתר:</strong> ${request.permit_number || "—"}</li>
          </ul>
          <p>בברכה,<br/>מערכת ניהול שילוט</p>
        </div>
      `,
    });

    // Also notify the applicant
    await base44.integrations.Core.SendEmail({
      to: request.applicant_email,
      subject: `בקשת שילוט אושרה - ${request.site_address}`,
      body: `
        <div dir="rtl" style="font-family: Arial, sans-serif;">
          <h2>בקשת השילוט שלך אושרה!</h2>
          <p>שלום ${request.applicant_name},</p>
          <p>אנו שמחים להודיע כי בקשת השילוט שלך בכתובת <strong>${request.site_address}</strong> אושרה.</p>
          <p>הבקשה הועברה לוועדת שילוט.</p>
          <p>בברכה,<br/>אגף אדריכל העיר, עיריית אשדוד</p>
        </div>
      `,
    });

    setRequest({ ...request, status: "approved" });
    toast.success("הבקשה אושרה ונשלח מייל לזימון ועדת שילוט");
    setUpdatingStatus(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">הבקשה לא נמצאה</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/requests")}>
          חזרה לרשימת הבקשות
        </Button>
      </div>
    );
  }

  const hasPermit = !!request.permit_number?.trim();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/requests")}>
            <ArrowRight className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">
              {request.request_type === "project_sign" ? "שלט פרויקט" : "גדר מדברת"} - {request.site_address}
            </h1>
            <p className="text-sm text-muted-foreground">
              הוגש: {new Date(request.created_date).toLocaleDateString("he-IL")} · {request.applicant_name}
            </p>
          </div>
        </div>
        <StatusBadge status={request.status} />
      </div>

      {/* Permit Check */}
      <Card className={hasPermit ? "border-emerald-200 bg-emerald-50/50" : "border-orange-200 bg-orange-50/50"}>
        <CardContent className="flex items-center gap-3 p-4">
          {hasPermit ? (
            <>
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-emerald-800">יש היתר בנייה</p>
                <p className="text-xs text-emerald-700">מספר היתר: {request.permit_number}</p>
              </div>
            </>
          ) : (
            <>
              <AlertTriangle className="w-5 h-5 text-orange-600 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-orange-800">מספר היתר לא צוין</p>
                <p className="text-xs text-orange-700">יש לוודא קיום היתר בנייה לפני אישור הבקשה</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">פרטי הבקשה</CardTitle>
            </CardHeader>
            <CardContent>
              <RequestInfoGrid request={request} />
            </CardContent>
          </Card>

          {/* Documents */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">מסמכים</CardTitle>
            </CardHeader>
            <CardContent>
              <DocumentChecklist request={request} />
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">הערות</CardTitle>
              {isAdmin && notes.some((n) => !n.sent_to_applicant) && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={handleSendNotesToApplicant}
                  disabled={sendingEmail}
                >
                  {sendingEmail ? <Loader2 className="w-3 h-3 animate-spin" /> : <Mail className="w-3 h-3" />}
                  שלח הערות למבקש
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {isAdmin && (
                <div className="space-y-3 p-4 rounded-lg bg-muted/50 border border-border">
                  <div className="flex gap-3">
                    <Select value={noteType} onValueChange={setNoteType}>
                      <SelectTrigger className="w-44">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">הערה כללית</SelectItem>
                        <SelectItem value="missing_document">מסמך חסר</SelectItem>
                        <SelectItem value="correction_needed">נדרש תיקון</SelectItem>
                        <SelectItem value="approval">אישור</SelectItem>
                        <SelectItem value="rejection">דחייה</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Textarea
                    placeholder="כתוב הערה..."
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    rows={3}
                  />
                  <Button
                    size="sm"
                    className="gap-2"
                    onClick={handleAddNote}
                    disabled={addingNote || !noteText.trim()}
                  >
                    {addingNote ? <Loader2 className="w-3 h-3 animate-spin" /> : <MessageSquarePlus className="w-3 h-3" />}
                    הוסף הערה
                  </Button>
                </div>
              )}
              <NotesList notes={notes} />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Actions */}
        <div className="space-y-6">
          {isAdmin && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">פעולות</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {request.status !== "approved" && (
                  <Button
                    className="w-full gap-2"
                    onClick={handleApprove}
                    disabled={updatingStatus}
                  >
                    {updatingStatus ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    אשר בקשה
                  </Button>
                )}

                {request.status === "submitted" && (
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => handleStatusChange("under_review")}
                    disabled={updatingStatus}
                  >
                    העבר לבדיקה
                  </Button>
                )}

                {request.status !== "rejected" && request.status !== "approved" && (
                  <Button
                    variant="destructive"
                    className="w-full gap-2"
                    onClick={() => handleStatusChange("rejected")}
                    disabled={updatingStatus}
                  >
                    <Trash2 className="w-4 h-4" />
                    דחה בקשה
                  </Button>
                )}

                <Separator />

                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={handleSendNotesToApplicant}
                  disabled={sendingEmail}
                >
                  {sendingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                  שלח הערות במייל
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Approvals Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">אישורים</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <ApprovalItem label="אדריכל העיר" approved={request.city_architect_approved} />
              <ApprovalItem label="ועדת שילוט" approved={request.signage_committee_approved} />
              <ApprovalItem label="פיקוח עירוני" approved={request.municipal_supervision_approved} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ApprovalItem({ label, approved }) {
  return (
    <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
      <span className="text-sm">{label}</span>
      {approved ? (
        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
      ) : (
        <div className="w-4 h-4 rounded-full border-2 border-border" />
      )}
    </div>
  );
}