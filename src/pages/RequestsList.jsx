import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Search } from "lucide-react";
import StatusBadge from "../components/StatusBadge";

export default function RequestsList() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [user, setUser] = useState(null);

  useEffect(() => {
    const load = async () => {
      const me = await base44.auth.me();
      setUser(me);
      let data;
      if (me.role === "admin") {
        data = await base44.entities.SignageRequest.list("-created_date", 100);
      } else {
        data = await base44.entities.SignageRequest.filter(
          { created_by: me.email },
          "-created_date",
          100
        );
      }
      setRequests(data);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = requests.filter((r) => {
    const matchSearch =
      !search ||
      r.applicant_name?.includes(search) ||
      r.site_address?.includes(search) ||
      r.project_name?.includes(search) ||
      r.permit_number?.includes(search);
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">כל הבקשות</h1>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="חיפוש לפי שם, כתובת, פרויקט..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="סטטוס" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">כל הסטטוסים</SelectItem>
            <SelectItem value="draft">טיוטה</SelectItem>
            <SelectItem value="submitted">הוגש</SelectItem>
            <SelectItem value="under_review">בבדיקה</SelectItem>
            <SelectItem value="needs_revision">דרוש תיקון</SelectItem>
            <SelectItem value="approved">אושר</SelectItem>
            <SelectItem value="rejected">נדחה</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="w-10 h-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">לא נמצאו בקשות</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((req) => (
            <Link key={req.id} to={`/request/${req.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">
                        {req.request_type === "project_sign" ? "שלט פרויקט" : "גדר מדברת"} - {req.site_address || "ללא כתובת"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {req.applicant_name} · היתר: {req.permit_number || "—"} · {new Date(req.created_date).toLocaleDateString("he-IL")}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={req.status} />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}