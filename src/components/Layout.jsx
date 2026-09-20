import { Outlet, Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import {
  LayoutDashboard,
  FilePlus,
  List,
  Menu,
  X,
  LogOut,
  Building2
} from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { path: "/", label: "לוח בקרה", icon: LayoutDashboard },
  { path: "/new-request", label: "בקשה חדשה", icon: FilePlus },
  { path: "/requests", label: "כל הבקשות", icon: List },
];

export default function Layout() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  const isAdmin = user?.role === "admin";

  return (
    <div dir="rtl" className="min-h-screen bg-background font-heebo">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                <Building2 className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-foreground leading-tight">עיריית אשדוד</h1>
                <p className="text-xs text-muted-foreground">ניהול בקשות שילוט</p>
              </div>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                      ${isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                      }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-3">
              {user && (
                <div className="hidden sm:flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-xs font-semibold text-primary">
                      {user.full_name?.charAt(0) || user.email?.charAt(0)}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium">{user.full_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {isAdmin ? "צוות עירייה" : "מבקש"}
                    </p>
                  </div>
                </div>
              )}
              {user && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="hidden sm:flex"
                  title="התנתקות"
                  onClick={() => logout()}
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-card pb-3 px-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all mt-1
                    ${isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-secondary"
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
            {user && (
              <button
                onClick={() => { setMobileMenuOpen(false); logout(); }}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:bg-secondary transition-all mt-1"
              >
                <LogOut className="w-4 h-4" />
                התנתקות
              </button>
            )}
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Outlet />
      </main>
    </div>
  );
}