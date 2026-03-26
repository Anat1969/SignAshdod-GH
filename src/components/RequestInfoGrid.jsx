export default function RequestInfoGrid({ request }) {
  const fields = [
    { label: "שם מבקש", value: request.applicant_name },
    { label: "מספר נייד", value: request.applicant_phone },
    { label: "אימייל", value: request.applicant_email },
    { label: "כתובת אתר", value: request.site_address },
    { label: "מהות ההיתר", value: request.permit_nature },
    { label: "מספר היתר", value: request.permit_number },
    { label: "שם הפרויקט", value: request.project_name },
    { label: "שם היזם", value: request.developer_name },
    { label: "שם האדריכל", value: request.architect_name },
    { label: "שם קבלן ביצוע", value: request.contractor_name },
    { label: "רישיון קבלן", value: request.contractor_license },
    { label: "שם מהנדס", value: request.engineer_name },
    { label: "רישיון מהנדס", value: request.engineer_license },
    { label: "מנהל עבודה", value: request.site_manager_name },
    { label: "אחראי בטיחות", value: request.safety_officer_name },
    { label: "שם חברה", value: request.company_name },
    { label: "ת.ד.", value: request.company_po_box },
    { label: "כתובת הנכס", value: request.company_address },
  ];

  // Add fence-specific fields
  if (request.request_type === "talking_fence") {
    fields.push(
      { label: "אורך הגדר (מ')", value: request.fence_total_length_meters },
      { label: "חלק היזם (%)", value: request.fence_developer_percent },
      { label: "חלק העירייה (%)", value: request.fence_municipality_percent }
    );
  }

  const filledFields = fields.filter((f) => f.value);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {filledFields.map((field) => (
        <div key={field.label} className="p-3 rounded-lg bg-muted/50">
          <p className="text-xs text-muted-foreground mb-0.5">{field.label}</p>
          <p className="text-sm font-medium">{field.value}</p>
        </div>
      ))}
    </div>
  );
}