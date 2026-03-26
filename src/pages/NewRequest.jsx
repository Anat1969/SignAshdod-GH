import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send, Save, Loader2, Signpost, Fence, FileDown } from "lucide-react";
import { toast } from "sonner";
import ProjectSignForm from "../components/ProjectSignForm";
import TalkingFenceForm from "../components/TalkingFenceForm";
import SignPreview from "../components/SignPreview";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

export default function NewRequest() {
  const navigate = useNavigate();
  const [requestType, setRequestType] = useState("project_sign");
  const [form, setForm] = useState({ fence_developer_percent: 50, fence_municipality_percent: 50 });
  const [submitting, setSubmitting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const previewRef = useRef();

  const validate = () => {
    if (!form.applicant_name?.trim()) { toast.error("נא למלא שם מבקש"); return false; }
    if (!form.applicant_phone?.trim()) { toast.error("נא למלא מספר נייד"); return false; }
    if (!form.applicant_email?.trim()) { toast.error("נא למלא אימייל"); return false; }
    if (!form.site_address?.trim()) { toast.error("נא למלא כתובת אתר"); return false; }
    return true;
  };

  const handleSubmit = async (asDraft = false) => {
    if (!asDraft && !validate()) return;
    setSubmitting(true);
    const data = {
      ...form,
      request_type: requestType,
      status: asDraft ? "draft" : "submitted",
    };
    const created = await base44.entities.SignageRequest.create(data);
    toast.success(asDraft ? "הטיוטה נשמרה" : "הבקשה הוגשה בהצלחה!");
    navigate(`/request/${created.id}`);
    setSubmitting(false);
  };

  const exportToPdf = async () => {
    if (!previewRef.current) return;
    setExporting(true);
    const canvas = await html2canvas(previewRef.current, { scale: 3, useCORS: true });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const imgH = (canvas.height * pageW) / canvas.width;
    const yOffset = (pageH - imgH) / 2;
    pdf.addImage(imgData, "PNG", 0, yOffset > 0 ? yOffset : 0, pageW, imgH);
    pdf.save("שלט-פרויקט.pdf");
    setExporting(false);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">בקשה חדשה לשילוט באתר בנייה</h1>
        <p className="text-muted-foreground mt-1">מלא את הפרטים הנדרשים וצרף את המסמכים</p>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">סוג הבקשה</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={requestType} onValueChange={(v) => { setRequestType(v); setForm({ fence_developer_percent: 50, fence_municipality_percent: 50 }); }}>
            <TabsList className="grid grid-cols-2 w-full mb-6">
              <TabsTrigger value="project_sign" className="gap-2">
                <Signpost className="w-4 h-4" />
                שלט פרויקט
              </TabsTrigger>
              <TabsTrigger value="talking_fence" className="gap-2">
                <Fence className="w-4 h-4" />
                גדר מדברת
              </TabsTrigger>
            </TabsList>

            <TabsContent value="project_sign">
              <ProjectSignForm form={form} setForm={setForm} />
              <div className="mt-8">
                <div className="flex items-center justify-between mb-3 border-b border-border pb-2">
                  <h3 className="text-base font-semibold text-foreground">תצוגה מקדימה של השלט</h3>
                  <button
                    onClick={exportToPdf}
                    disabled={exporting}
                    className="flex items-center gap-2 text-sm font-medium text-[#1a9faf] hover:text-[#1a7b8a] transition-colors"
                  >
                    {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
                    ייצוא PDF
                  </button>
                </div>
                <div ref={previewRef}>
                  <SignPreview request={form} onChange={setForm} />
                </div>
              </div>
            </TabsContent>
            <TabsContent value="talking_fence">
              <TalkingFenceForm form={form} setForm={setForm} />
            </TabsContent>
          </Tabs>

          <div className="flex flex-col sm:flex-row gap-3 mt-8 pt-6 border-t border-border">
            <Button
              onClick={() => handleSubmit(false)}
              disabled={submitting}
              className="gap-2 flex-1"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              הגש בקשה
            </Button>
            <Button
              variant="outline"
              onClick={() => handleSubmit(true)}
              disabled={submitting}
              className="gap-2"
            >
              <Save className="w-4 h-4" />
              שמור כטיוטה
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}