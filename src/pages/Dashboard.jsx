import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { 
  FilePlus, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowLeft,
  FileText
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StatusBadge from "../components/StatusBadge";

export default function Dashboard() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const me = await base44.auth.me();
        setUser(me);
        let data;
        if (me.role === "admin") {
          data = await base44.entities.SignageRequest.list("-created_date", 50);
        } else {
          data = await base44.entities.SignageRequest.filter(
            { created_by: me.email },
            "-created_date",
            50
          );
        }
        setRequests(data);
      } catch (err) {
        console.error(err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const isAdmin = user?.role === "admin";

  const stats = {
    total: requests.length,
    submitted: requests.filter((r) => r.status === "submitted").length,
    under_review: requests.filter((r) => r.status === "under_review").length,
    needs_revision: requests.filter((r) => r.status === "needs_revision").length,
    approved: requests.filter((r) => r.status === "approved").length,
  };

  const recentRequests = requests.slice(0, 5);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <AlertTriangle className="w-10 h-10 text-orange-500" />
        <p className="text-muted-foreground">אירעה שגיאה בטעינת הנתונים</p>
        <Button variant="outline" onClick={() => window.location.reload()}>נסה שוב</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            שלום, {user?.full_name || "משתמש"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isAdmin
              ? "ברוכים הבאים למערכת ניהול בקשות שילוט"
              : "עקוב אחרי הבקשות שלך"}
          </p>
        </div>
        <Link to="/new-request">
          <Button className="gap-2 shadow-sm">
            <FilePlus className="w-4 h-4" />
            בקשה חדשה
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          icon={FileText}
          label="סה״כ בקשות"
          value={stats.total}
          color="text-primary"
          bg="bg-primary/10"
        />
        <StatCard
          icon={Clock}
          label="ממתינות לבדיקה"
          value={stats.submitted + stats.under_review}
          color="text-amber-600"
          bg="bg-amber-50"
        />
        <StatCard
          icon={AlertTriangle}
          label="דרוש תיקון"
          value={stats.needs_revision}
          color="text-orange-600"
          bg="bg-orange-50"
        />
        <StatCard
          icon={CheckCircle2}
          label="אושרו"
          value={stats.approved}
          color="text-emerald-600"
          bg="bg-emerald-50"
        />
      </div>

      {/* Recent Requests */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">בקשות אחרונות</h2>
          <Link
            to="/requests"
            className="text-sm text-primary hover:text-primary/80 flex items-center gap-1"
          >
            הצג הכל
            <ArrowLeft className="w-3 h-3" />
          </Link>
        </div>

        {recentRequests.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                <FileText className="w-7 h-7 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">אין בקשות עדיין</h3>
              <p className="text-sm text-muted-foreground mb-4">
                התחל בהגשת בקשה חדשה לשילוט באתר בנייה
              </p>
              <Link to="/new-request">
                <Button variant="outline" className="gap-2">
                  <FilePlus className="w-4 h-4" />
                  הגש בקשה
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {recentRequests.map((req) => (
              <Link key={req.id} to={`/request/${req.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer border-border">
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">
                          {req.request_type === "project_sign"
                            ? "שלט פרויקט"
                            : "גדר מדברת"}{" "}
                          - {req.site_address || "ללא כתובת"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {req.applicant_name} · {new Date(req.created_date).toLocaleDateString("he-IL")}
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
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, bg }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
            <Icon className={`w-5 h-5 ${color}`} />
          </div>
          <div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}