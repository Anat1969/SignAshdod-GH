import { CheckCircle2, XCircle, ExternalLink } from "lucide-react";

const documents = {
  project_sign: [
    { key: "sign_example_file", label: "דוגמא של השלט A4" },
    { key: "organization_plan_file", label: "תכנית התארגנות A3" },
    { key: "permit_visualization_file", label: "הדמיית היתר" },
  ],
  talking_fence: [
    { key: "sign_example_file", label: "דוגמא של השלט A4" },
    { key: "organization_plan_file", label: "תכנית התארגנות A3" },
    { key: "fence_diagram_file", label: "תרשים מידות גדר" },
    { key: "fence_3d_render_file", label: "הדמיית תלת מימד גדר" },
  ],
};

export default function DocumentChecklist({ request }) {
  const docList = documents[request.request_type] || [];

  return (
    <div className="space-y-2">
      {docList.map((doc) => {
        const hasDoc = !!request[doc.key];
        return (
          <div
            key={doc.key}
            className="flex items-center justify-between p-3 rounded-lg border border-border bg-card"
          >
            <div className="flex items-center gap-2">
              {hasDoc ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              ) : (
                <XCircle className="w-4 h-4 text-red-400" />
              )}
              <span className="text-sm font-medium">{doc.label}</span>
            </div>
            {hasDoc && (
              <a
                href={request[doc.key]}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        );
      })}
    </div>
  );
}