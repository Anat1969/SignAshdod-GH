import { cn } from "@/lib/utils";

const statusConfig = {
  draft: { label: "טיוטה", className: "bg-muted text-muted-foreground" },
  submitted: { label: "הוגש", className: "bg-blue-50 text-blue-700 border-blue-200" },
  under_review: { label: "בבדיקה", className: "bg-amber-50 text-amber-700 border-amber-200" },
  needs_revision: { label: "דרוש תיקון", className: "bg-orange-50 text-orange-700 border-orange-200" },
  approved: { label: "אושר", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  rejected: { label: "נדחה", className: "bg-red-50 text-red-700 border-red-200" },
};

export default function StatusBadge({ status }) {
  const config = statusConfig[status] || statusConfig.draft;
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border",
        config.className
      )}
    >
      {config.label}
    </span>
  );
}