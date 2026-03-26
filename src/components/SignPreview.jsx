import { Phone, Upload, X } from "lucide-react";
import { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";

export default function SignPreview({ request, onChange }) {
  const r = request || {};
  const editable = !!onChange;

  const update = (field, value) => onChange && onChange({ ...r, [field]: value });

  return (
    <div dir="rtl" className="w-full overflow-x-auto">
      <div
        className="min-w-[560px] border-2 border-[#1a7b8a] font-heebo text-sm"
        style={{ fontFamily: "Heebo, Arial, sans-serif" }}
      >
        <div className="flex" style={{ minHeight: "280px" }}>
          {/* Left: Logo + company info */}
          <div className="flex flex-col justify-between bg-white" style={{ width: "42%", borderLeft: "2px solid #1a7b8a" }}>
            {/* Logo / תמונת הדמייה */}
            <ImageField
              value={r.permit_visualization_file}
              onChange={editable ? (url) => update("permit_visualization_file", url) : null}
              label="הדמיית היתר"
            />

            {/* Company details */}
            <div className="px-3 pb-3 space-y-1.5">
              <div className="flex items-baseline gap-2 text-xs border-t border-gray-200 pt-2">
                <span className="text-gray-600 shrink-0">שם החברה:</span>
                <EditableField value={r.company_name} onChange={editable ? (v) => update("company_name", v) : null} className="flex-1" />
                <span className="text-gray-600 shrink-0">ח.פ.</span>
                <EditableField value={r.company_po_box} onChange={editable ? (v) => update("company_po_box", v) : null} className="w-20" />
              </div>
              <div className="flex items-baseline gap-2 text-xs">
                <span className="text-gray-600 shrink-0">כתובת הנכס:</span>
                <EditableField value={r.company_address} onChange={editable ? (v) => update("company_address", v) : null} className="flex-1" />
              </div>
            </div>
          </div>

          {/* Right: Teal header + rows */}
          <div className="flex flex-col flex-1">
            {/* Teal header */}
            <div className="bg-[#1a9faf] text-white px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="text-xs mb-1">מס׳ היתר בנייה:</div>
                  <EditableField
                    value={r.permit_number}
                    onChange={editable ? (v) => update("permit_number", v) : null}
                    dark
                    placeholder="מס׳ היתר"
                  />
                </div>
                {/* City logo placeholder */}
                <div className="text-xs text-white/70 border border-white/40 rounded px-2 py-1 text-center leading-tight">
                  סמל<br/>עיריית<br/>אשדוד
                </div>
              </div>
              <div className="mt-2">
                <EditableField
                  value={r.project_name}
                  onChange={editable ? (v) => update("project_name", v) : null}
                  dark
                  placeholder="שם הפרויקט"
                  className="text-2xl font-black"
                />
              </div>
            </div>

            {/* Info rows */}
            <div className="divide-y divide-[#1a9faf] border-t border-[#1a9faf] flex-1">
              <SignRow label="שם היזם:" value={r.developer_name} onChange={editable ? (v) => update("developer_name", v) : null} phone />
              <SignRow label="שם האדריכל:" value={r.architect_name} onChange={editable ? (v) => update("architect_name", v) : null} phone />
              <SignRow
                label={<><span>שם קבלן הביצוע:</span><br /><span>מס׳ רישיון:</span></>}
                value={r.contractor_name}
                onChange={editable ? (v) => update("contractor_name", v) : null}
                subValue={r.contractor_license}
                onSubChange={editable ? (v) => update("contractor_license", v) : null}
                phone
              />
              <SignRow
                label={<><span>שם המהנדס:</span><br /><span>מס׳ רישיון:</span></>}
                value={r.engineer_name}
                onChange={editable ? (v) => update("engineer_name", v) : null}
                subValue={r.engineer_license}
                onSubChange={editable ? (v) => update("engineer_license", v) : null}
                phone
              />
              <SignRow label="שם מנהל העבודה:" value={r.site_manager_name} onChange={editable ? (v) => update("site_manager_name", v) : null} phone />
              <SignRow label="שם אחראי הבטיחות:" value={r.safety_officer_name} onChange={editable ? (v) => update("safety_officer_name", v) : null} phone />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EditableField({ value, onChange, dark, placeholder, className = "" }) {
  if (!onChange) {
    return (
      <span className={`border-b border-dotted ${dark ? "border-white/60 text-white" : "border-gray-400 text-gray-900"} min-h-[1rem] inline-block ${className}`}>
        {value || ""}
      </span>
    );
  }
  return (
    <input
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder || ""}
      className={`border-b ${dark ? "border-white/60 bg-transparent text-white placeholder-white/50" : "border-dotted border-gray-400 bg-transparent text-gray-900 placeholder-gray-300"} outline-none min-h-[1rem] w-full ${className}`}
    />
  );
}

function ImageField({ value, onChange, label }) {
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef();

  const uploadFile = async (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    onChange(file_url);
    setUploading(false);
  };

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (file) await uploadFile(file);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) await uploadFile(file);
  };

  const handlePaste = async (e) => {
    const item = Array.from(e.clipboardData.items).find(i => i.type.startsWith('image/'));
    if (item) await uploadFile(item.getAsFile());
  };

  return (
    <div
      className={`flex-1 flex items-center justify-center m-3 border-2 border-dashed relative min-h-[120px] cursor-pointer transition-colors ${dragging ? 'border-[#1a9faf] bg-[#1a9faf]/5' : 'border-gray-300'}`}
      onDrop={handleDrop}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onPaste={handlePaste}
      tabIndex={0}
    >
      {value ? (
        <>
          <img src={value} alt="הדמיית היתר" className="max-h-40 max-w-full object-contain" />
          {onChange && (
            <button
              onClick={() => onChange("")}
              className="absolute top-1 left-1 bg-white rounded-full p-0.5 shadow hover:bg-red-50"
            >
              <X className="w-3 h-3 text-red-500" />
            </button>
          )}
        </>
      ) : (
        <div className="text-center">
          <span className="text-gray-400 text-xs block">{label}</span>
          {onChange && (
            <>
              <button
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
                className="mt-1 flex items-center gap-1 text-xs text-[#1a9faf] hover:underline mx-auto"
              >
                <Upload className="w-3 h-3" />
                {uploading ? "מעלה..." : "העלה תמונה"}
              </button>
              <p className="text-[10px] text-gray-400 mt-1">או גרור / הדבק (Ctrl+V)</p>
              <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
            </>
          )}
        </div>
      )}
    </div>
  );
}

function SignRow({ label, value, onChange, subValue, onSubChange, phone }) {
  return (
    <div className="flex items-stretch" style={{ borderRight: "2px solid #1a9faf" }}>
      <div className="flex-1 flex items-center px-3 py-2 text-xs text-gray-800 leading-tight gap-2">
        <div className="font-medium text-gray-700 shrink-0">{label}</div>
        <div className="flex-1">
          <EditableField value={value} onChange={onChange} placeholder="—" />
          {(subValue !== undefined || onSubChange) && (
            <EditableField value={subValue} onChange={onSubChange} placeholder="מס׳ רישיון" className="text-xs text-gray-500 mt-0.5" />
          )}
        </div>
      </div>
      {phone && (
        <div className="flex items-center justify-center px-3" style={{ borderRight: "1px solid #1a9faf", minWidth: "36px" }}>
          <Phone className="w-3.5 h-3.5 text-[#1a9faf]" />
        </div>
      )}
    </div>
  );
}