import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import FileUploadField from "./FileUploadField";

export default function ProjectSignForm({ form, setForm }) {
  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="space-y-6">
      {/* Applicant Details */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-foreground border-b border-border pb-2">
          פרטי מבקש
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>שם מבקש *</Label>
            <Input value={form.applicant_name || ""} onChange={(e) => update("applicant_name", e.target.value)} placeholder="שם מלא" />
          </div>
          <div className="space-y-1.5">
            <Label>מספר נייד *</Label>
            <Input value={form.applicant_phone || ""} onChange={(e) => update("applicant_phone", e.target.value)} placeholder="050-0000000" dir="ltr" />
          </div>
          <div className="space-y-1.5">
            <Label>אימייל *</Label>
            <Input type="email" value={form.applicant_email || ""} onChange={(e) => update("applicant_email", e.target.value)} placeholder="email@example.com" dir="ltr" />
          </div>
        </div>
      </section>

      {/* Site Details */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-foreground border-b border-border pb-2">
          פרטי אתר ופרויקט
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>כתובת אתר *</Label>
            <Input value={form.site_address || ""} onChange={(e) => update("site_address", e.target.value)} placeholder="רחוב, עיר" />
          </div>
          <div className="space-y-1.5">
            <Label>מהות ההיתר</Label>
            <Input value={form.permit_nature || ""} onChange={(e) => update("permit_nature", e.target.value)} placeholder="סוג ההיתר" />
          </div>
          <div className="space-y-1.5">
            <Label>מספר היתר</Label>
            <Input value={form.permit_number || ""} onChange={(e) => update("permit_number", e.target.value)} placeholder="מס׳ היתר" />
          </div>
          <div className="space-y-1.5">
            <Label>שם הפרויקט</Label>
            <Input value={form.project_name || ""} onChange={(e) => update("project_name", e.target.value)} placeholder="שם הפרויקט" />
          </div>
        </div>
      </section>

      {/* Project Participants */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-foreground border-b border-border pb-2">
          פרטי השלט
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>שם היזם</Label>
            <Input value={form.developer_name || ""} onChange={(e) => update("developer_name", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>שם האדריכל</Label>
            <Input value={form.architect_name || ""} onChange={(e) => update("architect_name", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>שם קבלן הביצוע</Label>
            <Input value={form.contractor_name || ""} onChange={(e) => update("contractor_name", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>מספר רישיון קבלן</Label>
            <Input value={form.contractor_license || ""} onChange={(e) => update("contractor_license", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>שם המהנדס</Label>
            <Input value={form.engineer_name || ""} onChange={(e) => update("engineer_name", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>מספר רישיון מהנדס</Label>
            <Input value={form.engineer_license || ""} onChange={(e) => update("engineer_license", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>שם מנהל העבודה</Label>
            <Input value={form.site_manager_name || ""} onChange={(e) => update("site_manager_name", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>שם אחראי הבטיחות</Label>
            <Input value={form.safety_officer_name || ""} onChange={(e) => update("safety_officer_name", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>שם החברה</Label>
            <Input value={form.company_name || ""} onChange={(e) => update("company_name", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>ת.ד.</Label>
            <Input value={form.company_po_box || ""} onChange={(e) => update("company_po_box", e.target.value)} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>כתובת הנכס</Label>
            <Input value={form.company_address || ""} onChange={(e) => update("company_address", e.target.value)} />
          </div>
        </div>
      </section>

      {/* Documents */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-foreground border-b border-border pb-2">
          מסמכים נדרשים
        </h3>
        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-800 mb-2">
          <strong>הנחיות:</strong> גודל 2×4 מ׳ · מדבקה על פנל קשיח · מיקום בכל כניסה לאתר · מפלס הקרקע · פורמט אחיד
        </div>
        <div className="grid grid-cols-1 gap-4">
          <FileUploadField
            label="דוגמא של השלט A4 (בו מצוינים הפרטים)"
            value={form.sign_example_file}
            onChange={(url) => update("sign_example_file", url)}
          />
          <FileUploadField
            label="תכנית התארגנות A3 (מיקום השלט ביחס לאתר)"
            value={form.organization_plan_file}
            onChange={(url) => update("organization_plan_file", url)}
          />
          <FileUploadField
            label="הדמיית היתר"
            value={form.permit_visualization_file}
            onChange={(url) => update("permit_visualization_file", url)}
          />
        </div>
      </section>
    </div>
  );
}