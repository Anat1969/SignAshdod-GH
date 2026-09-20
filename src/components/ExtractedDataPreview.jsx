import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { AlertCircle } from "lucide-react";

export default function ExtractedDataPreview({ form, onChange }) {
  if (!form || Object.keys(form).length === 0) return null;

  const update = (field, value) => onChange && onChange({ ...form, [field]: value });

  const fieldGroups = {
    "פרטי מבקש": [
      "applicant_name",
      "applicant_phone",
      "applicant_email"
    ],
    "פרטי אתר": [
      "site_address",
      "permit_nature",
      "permit_number",
      "project_name"
    ],
    "פרטי מטעמים": [
      "developer_name",
      "architect_name",
      "contractor_name",
      "contractor_license",
      "engineer_name",
      "engineer_license",
      "site_manager_name",
      "safety_officer_name"
    ],
    "פרטי החברה": [
      "company_name",
      "company_po_box",
      "company_address"
    ],
    "פרטי גדר": [
      "fence_total_length_meters",
      "fence_developer_percent",
      "fence_municipality_percent"
    ]
  };

  const labels = {
    applicant_name: "שם מבקש",
    applicant_phone: "מספר נייד",
    applicant_email: "אימייל",
    site_address: "כתובת אתר",
    permit_nature: "מהות ההיתר",
    permit_number: "מספר היתר",
    project_name: "שם הפרויקט",
    developer_name: "שם היזם",
    architect_name: "שם האדריכל",
    contractor_name: "שם קבלן הביצוע",
    contractor_license: "מספר רישיון קבלן",
    engineer_name: "שם המהנדס",
    engineer_license: "מספר רישיון מהנדס",
    site_manager_name: "שם מנהל העבודה",
    safety_officer_name: "שם אחראי הבטיחות",
    company_name: "שם החברה",
    company_po_box: "ת.ד./מספר ח.פ.",
    company_address: "כתובת החברה",
    fence_total_length_meters: "סה״כ אורך גדר (מטרים)",
    fence_developer_percent: "אחוז חלק היזם",
    fence_municipality_percent: "אחוז חלק העירייה"
  };

  return (
    <div className="space-y-6 border-t border-border pt-6 mt-6" dir="rtl">
      <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 border border-blue-200">
        <AlertCircle className="w-4 h-4 text-blue-700 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-blue-900">נתונים שחולצו מהקובץ</p>
          <p className="text-xs text-blue-800 mt-1">סקור ותקן את השדות לפי הצורך לפני הגשת הבקשה</p>
        </div>
      </div>

      {Object.entries(fieldGroups).map(([groupName, fields]) => {
        const hasData = fields.some(f => form[f]);
        if (!hasData) return null;

        return (
          <section key={groupName} className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">
              {groupName}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {fields.map((field) => {
                const value = form[field];
                if (!value && value !== 0) return null;

                return (
                  <div key={field} className="space-y-1.5">
                    <Label className="text-xs">{labels[field] || field}</Label>
                    {field.includes("percent") || field === "fence_total_length_meters" ? (
                      <Input
                        type="number"
                        value={value}
                        onChange={(e) => update(field, e.target.value === "" ? null : Number(e.target.value))}
                        dir="ltr"
                        className="text-sm"
                      />
                    ) : (
                      <Input
                        value={value}
                        onChange={(e) => update(field, e.target.value)}
                        className="text-sm bg-blue-50 border-blue-200"
                        dir={field.includes("phone") || field.includes("email") ? "ltr" : "rtl"}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}