import { Phone } from "lucide-react";

export default function SignPreview({ request }) {
  const r = request || {};

  return (
    <div dir="rtl" className="w-full overflow-x-auto">
      <div
        className="min-w-[560px] border-2 border-[#1a7b8a] font-heebo text-sm"
        style={{ fontFamily: "Heebo, Arial, sans-serif" }}
      >
        {/* Main Row */}
        <div className="flex" style={{ minHeight: "260px" }}>
          {/* Left: Logo area */}
          <div
            className="flex flex-col justify-between bg-white"
            style={{ width: "42%", borderLeft: "2px solid #1a7b8a" }}
          >
            {/* Logo box */}
            <div className="flex-1 flex items-center justify-center m-3 border-2 border-dashed border-gray-400">
              {r.sign_example_file ? (
                <img
                  src={r.sign_example_file}
                  alt="לוגו"
                  className="max-h-40 max-w-full object-contain"
                />
              ) : (
                <span className="text-gray-400 text-xs">לוגו</span>
              )}
            </div>

            {/* Company details */}
            <div className="px-3 pb-3 space-y-1.5">
              <div className="flex items-baseline gap-2 text-xs border-t border-gray-200 pt-2">
                <span className="text-gray-600 shrink-0">שם החברה:</span>
                <span className="flex-1 border-b border-dotted border-gray-400 min-h-[1rem] text-gray-800">
                  {r.company_name || ""}
                </span>
                <span className="text-gray-600 shrink-0">ח.פ.</span>
                <span className="w-20 border-b border-dotted border-gray-400 min-h-[1rem] text-gray-800">
                  {r.company_po_box || ""}
                </span>
              </div>
              <div className="flex items-baseline gap-2 text-xs">
                <span className="text-gray-600 shrink-0">כתובת הנכס:</span>
                <span className="flex-1 border-b border-dotted border-gray-400 min-h-[1rem] text-gray-800">
                  {r.company_address || ""}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Teal header + info rows */}
          <div className="flex flex-col flex-1">
            {/* Teal header */}
            <div className="bg-[#1a9faf] text-white px-4 py-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="text-xs mb-1">מס׳ היתר בנייה:</div>
                  <div className="border-b border-dotted border-white/60 min-h-[1rem] text-sm pb-1">
                    {r.permit_number || ""}
                  </div>
                </div>
                <div className="text-3xl font-black mr-4 mt-1">לוגו</div>
              </div>
              <div className="text-3xl font-black mt-2 leading-tight">
                {r.project_name || "שם הפרויקט"}
              </div>
            </div>

            {/* Info rows */}
            <div className="divide-y divide-[#1a9faf] border-t border-[#1a9faf] flex-1">
              <SignRow label="שם היזם:" value={r.developer_name} phone />
              <SignRow label="שם האדריכל:" value={r.architect_name} phone />
              <SignRow
                label={<><span>שם קבלן הביצוע:</span><br /><span>מס׳ רישיון:</span></>}
                value={
                  <>
                    <span className="block">{r.contractor_name || ""}</span>
                    <span className="block text-xs text-gray-500">{r.contractor_license || ""}</span>
                  </>
                }
                phone
              />
              <SignRow
                label={<><span>שם המהנדס:</span><br /><span>מס׳ רישיון:</span></>}
                value={
                  <>
                    <span className="block">{r.engineer_name || ""}</span>
                    <span className="block text-xs text-gray-500">{r.engineer_license || ""}</span>
                  </>
                }
                phone
              />
              <SignRow label="שם מנהל העבודה:" value={r.site_manager_name} phone />
              <SignRow label="שם אחראי הביקורת:" value={r.safety_officer_name} phone />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SignRow({ label, value, phone }) {
  return (
    <div
      className="flex items-stretch"
      style={{ borderRight: "2px solid #1a9faf" }}
    >
      <div className="flex-1 flex items-center px-3 py-2 text-xs text-gray-800 leading-tight">
        <div className="font-medium text-gray-700">{label}</div>
        {value && (
          <div className="mr-2 text-gray-900 flex-1">{value}</div>
        )}
      </div>
      {phone && (
        <div
          className="flex items-center justify-center px-3"
          style={{ borderRight: "1px solid #1a9faf", minWidth: "36px" }}
        >
          <Phone className="w-3.5 h-3.5 text-[#1a9faf]" />
        </div>
      )}
    </div>
  );
}