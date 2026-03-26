import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import FileUploadField from "./FileUploadField";

export default function TalkingFenceForm({ form, setForm }) {
  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="space-y-6" dir="rtl">
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
          <div className="space-y-1.5">
            <Label>כתובת אתר *</Label>
            <Input value={form.site_address || ""} onChange={(e) => update("site_address", e.target.value)} placeholder="רחוב, עיר" />
          </div>
          <div className="space-y-1.5">
            <Label>מהות ההיתר</Label>
            <Input value={form.permit_nature || ""} onChange={(e) => update("permit_nature", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>מספר היתר</Label>
            <Input value={form.permit_number || ""} onChange={(e) => update("permit_number", e.target.value)} />
          </div>
        </div>
      </section>

      {/* Fence Details */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-foreground border-b border-border pb-2">
          פרטי הגדר
        </h3>
        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-800 mb-2">
          <strong>הנחיות:</strong> היקף מלא של האתר · גובה 2 מ׳ · פנל קשיח · 50% עירייה, 50% פרסום יזם
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label>סה״כ אורך הגדר (מטרים)</Label>
            <Input
              type="number"
              value={form.fence_total_length_meters || ""}
              onChange={(e) => update("fence_total_length_meters", Number(e.target.value))}
              dir="ltr"
            />
          </div>
          <div className="space-y-1.5">
            <Label>אחוז חלק היזם (%)</Label>
            <Input
              type="number"
              value={form.fence_developer_percent ?? 50}
              onChange={(e) => update("fence_developer_percent", Number(e.target.value))}
              dir="ltr"
            />
          </div>
          <div className="space-y-1.5">
            <Label>אחוז חלק העירייה (%)</Label>
            <Input
              type="number"
              value={form.fence_municipality_percent ?? 50}
              onChange={(e) => update("fence_municipality_percent", Number(e.target.value))}
              dir="ltr"
            />
          </div>
        </div>
        {form.fence_total_length_meters > 0 && (
          <div className="p-3 rounded-lg bg-secondary text-sm">
            <p>חלק היזם: <strong>{((form.fence_total_length_meters * (form.fence_developer_percent || 50)) / 100).toFixed(1)} מ׳</strong></p>
            <p>חלק העירייה: <strong>{((form.fence_total_length_meters * (form.fence_municipality_percent || 50)) / 100).toFixed(1)} מ׳</strong></p>
          </div>
        )}
      </section>

      {/* Documents */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-foreground border-b border-border pb-2">
          מסמכים נדרשים
        </h3>
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
            label="תרשים עם מידות ומיקום כל חלק בהיקף הגדר"
            value={form.fence_diagram_file}
            onChange={(url) => update("fence_diagram_file", url)}
          />
          <FileUploadField
            label="הדמייה בתלת מימד של הגדר באתר"
            value={form.fence_3d_render_file}
            onChange={(url) => update("fence_3d_render_file", url)}
          />
        </div>
      </section>
    </div>
  );
}