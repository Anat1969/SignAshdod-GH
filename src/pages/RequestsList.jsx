import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Search, Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";
import StatusBadge from "../components/StatusBadge";

export default function RequestsList() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [user, setUser] = useState(null);
  const [importing, setImporting] = useState(false);
  const importRef = useRef();

  useEffect(() => {
    const load = async () => {
      const me = await base44.auth.me();
      setUser(me);
      let data;
      if (me.role === "admin") {
        data = await base44.entities.SignageRequest.list("-created_date", 100);
      } else {
        data = await base44.entities.SignageRequest.filter(
          { created_by: me.email },
          "-created_date",
          100
        );
      }
      setRequests(data);
      setLoading(false);
    };
    load();
  }, []);

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImporting(true);
    toast.info("מעבד את הקובץ...");
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const extracted = await base44.integrations.Core.InvokeLLM({
      prompt: `קרא את המסמך המצורף בעיון ומלא את השדות הבאים לפי מה שמופיע בו. אם שדה לא מופיע, השאר null.

התאמת שדות לעברית:
- applicant_name = שם מבקש / שם מגיש
- applicant_phone = מספר נייד / טלפון
- applicant_email = אימייל / דוא"ל
- site_address = כתובת אתר / כתובת הנכס
- permit_nature = מהות ההיתר
- permit_number = מספר היתר
- project_name = שם הפרויקט
- developer_name = שם היזם
- architect_name = שם האדריכל
- contractor_name = שם קבלן הביצוע
- contractor_license = מספר רישיון קבלן
- engineer_name = שם המהנדס
- engineer_license = מספר רישיון מהנדס
- site_manager_name = שם מנהל העבודה
- safety_officer_name = שם אחראי הבטיחות
- company_name = שם החברה
- company_po_box = ת.ד. / מספר ח.פ.
- company_address = כתובת הנכס / כתובת החברה
- fence_total_length_meters = סה"כ אורך גדר במטרים
- fence_developer_percent = אחוז חלק היזם
- fence_municipality_percent = אחוז חלק העירייה
- request_type = אם מדובר בגדר מדברת החזר "talking_fence", אחרת "project_sign"

החזר JSON בלבד ללא הסבר.`,
      file_urls: [file_url],
      response_json_schema: {
        type: "object",
        properties: {
          request_type: { type: "string", enum: ["project_sign", "talking_fence"] },
          applicant_name: { type: "string" },
          applicant_phone: { type: "string" },
          applicant_email: { type: "string" },
          site_address: { type: "string" },
          permit_nature: { type: "string" },
          permit_number: { type: "string" },
          project_name: { type: "string" },
          developer_name: { type: "string" },
          architect_name: { type: "string" },
          contractor_name: { type: "string" },
          contractor_license: { type: "string" },
          engineer_name: { type: "string" },
          engineer_license: { type: "string" },
          site_manager_name: { type: "string" },
          safety_officer_name: { type: "string" },
          company_name: { type: "string" },
          company_po_box: { type: "string" },
          company_address: { type: "string" },
          fence_total_length_meters: { type: "number" },
          fence_developer_percent: { type: "number" },
          fence_municipality_percent: { type: "number" },
        }
      }
    });
    // Remove null values
    const clean = Object.fromEntries(Object.entries(extracted).filter(([, v]) => v !== null && v !== undefined));
    toast.success("הקובץ עובד! מעביר לטופס...");
    setImporting(false);
    navigate("/new-request", { state: { prefill: { ...clean, request_type: clean.request_type || "project_sign" } } });
  };

  const filtered = requests.filter((r) => {
    const matchSearch =
      !search ||
      r.applicant_name?.includes(search) ||
      r.site_address?.includes(search) ||
      r.project_name?.includes(search) ||
      r.permit_number?.includes(search);
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">כל הבקשות</h1>
        {user?.role === "admin" && (
          <>
            <input ref={importRef} type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg,.xlsx,.csv" onChange={handleImport} />
            <button
              onClick={() => importRef.current?.click()}
              disabled={importing}
              className="flex items-center gap-2 text-sm font-medium bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-60"
            >
              {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              ייבוא מקובץ
            </button>
          </>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="חיפוש לפי שם, כתובת, פרויקט..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="סטטוס" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">כל הסטטוסים</SelectItem>
            <SelectItem value="draft">טיוטה</SelectItem>
            <SelectItem value="submitted">הוגש</SelectItem>
            <SelectItem value="under_review">בבדיקה</SelectItem>
            <SelectItem value="needs_revision">דרוש תיקון</SelectItem>
            <SelectItem value="approved">אושר</SelectItem>
            <SelectItem value="rejected">נדחה</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="w-10 h-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">לא נמצאו בקשות</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((req) => (
            <Link key={req.id} to={`/request/${req.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">
                        {req.request_type === "project_sign" ? "שלט פרויקט" : "גדר מדברת"} - {req.site_address || "ללא כתובת"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {req.applicant_name} · היתר: {req.permit_number || "—"} · {new Date(req.created_date).toLocaleDateString("he-IL")}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={req.status} />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}