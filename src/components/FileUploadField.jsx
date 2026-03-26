import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Upload, CheckCircle2, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function FileUploadField({ label, value, onChange, accept }) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    onChange(file_url);
    setUploading(false);
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">{label}</label>
      {value ? (
        <div className="flex items-center gap-2 p-3 rounded-lg border border-emerald-200 bg-emerald-50">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="text-sm text-emerald-700 truncate flex-1">הקובץ הועלה בהצלחה</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            onClick={() => onChange("")}
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      ) : (
        <label className="flex items-center gap-3 p-4 rounded-lg border-2 border-dashed border-border hover:border-primary/40 cursor-pointer transition-colors bg-muted/30">
          {uploading ? (
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
          ) : (
            <Upload className="w-5 h-5 text-muted-foreground" />
          )}
          <span className="text-sm text-muted-foreground">
            {uploading ? "מעלה..." : "לחץ להעלאת קובץ"}
          </span>
          <input
            type="file"
            className="hidden"
            accept={accept || "image/*,.pdf"}
            onChange={handleUpload}
            disabled={uploading}
          />
        </label>
      )}
    </div>
  );
}