import { useMemo, useState, useEffect } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate, Navigate } from "react-router-dom";
import { useAuth, clearDemoAuthSession } from "@/hooks/useAuth";
import { usePendingBookings } from "@/hooks/usePendingBookings";
import { useIdleLogout } from "@/hooks/useIdleLogout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { CommandPalette } from "@/components/CommandPalette";
import { KeyboardShortcutsHelp } from "@/components/staff/KeyboardShortcutsHelp";
import { StaffBottomNav } from "@/components/staff/StaffBottomNav";
import {
  Menu, Sun, Inbox, MessageSquare, Calendar as CalIcon, Clock, CreditCard,
  Stethoscope, ShieldCheck, ShieldAlert, Boxes, UserCircle2, Star, Users,
  BookOpen, Lock, History as HistoryIcon, Laptop, Building2, ChevronDown, ChevronRight, LogOut, Loader2
} from "lucide-react";
import rkaLogo from "@/assets/rka-logo.webp";

interface NavItem {
  to: string;
  label: string;
  icon: any;
  badge?: number;
  show?: boolean;
}

interface Group {
  key: string;
  label: string;
  icon: any;
  children: NavItem[];
  badge?: number;
  show?: boolean;
}

export default function StaffLayout() {
  const { user, loading, role, roles, isOwner, isAdmin, isNP, isStaff, isReceptionist, isScheduler } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  // Privileged roles requiring MFA (aal2)
  const isPrivileged = isOwner || isAdmin || isNP || role === "provider" || roles.includes("provider");
  const [mfaOk, setMfaOk] = useState(true);
  const [mfaChecked, setMfaChecked] = useState(false);

  const { showWarning, countdown, staySignedIn } = useIdleLogout(!!user);
  useEffect(() => { setOpen(false); }, [location.pathname]);

  useEffect(() => {
    if (!user) { setMfaChecked(true); return; }
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        if (error) { setMfaOk(true); return; }
        if (data.currentLevel !== "aal2" && data.nextLevel === "aal2") {
          setMfaOk(false);
        } else {
          setMfaOk(true);
        }
      } catch {
        setMfaOk(true);
      } finally {
        if (!cancelled) setMfaChecked(true);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  const pendingCount = usePendingBookings(!!user && (isAdmin || isScheduler || isReceptionist || isStaff));
  const [unreadSms, setUnreadSms] = useState(0);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { count } = await supabase
        .from("sms_messages")
        .select("id", { count: "exact", head: true })
        .eq("direction", "inbound")
        .is("read_by_staff_at", null);
      setUnreadSms(count ?? 0);
    };
    load();
    const ch = supabase
      .channel("staff_sms_unread_badge")
      .on("postgres_changes", { event: "*", schema: "public", table: "sms_messages" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  // Admin modules ONLY as requested by the user:
  // 1. Staff Management
  // 2. Audit Logs
  // 3. HIPAA Policies
  // 4. Device Inventory
  // 5. Vendor Management
  // 6. Breach Reports
  // 7. Compliance Dashboard
  const adminNavItems: NavItem[] = useMemo(() => [
    { to: "/staff/admin", label: "Compliance Dashboard", icon: ShieldCheck },
    { to: "/staff/team", label: "Staff Management", icon: Users },
    { to: "/staff/audit-report", label: "Audit Logs", icon: HistoryIcon },
    { to: "/staff/hipaa-policies", label: "HIPAA Policies", icon: BookOpen },
    { to: "/staff/vendors?tab=devices", label: "Device Inventory", icon: Laptop },
    { to: "/staff/vendors", label: "Vendor Management", icon: Building2 },
    { to: "/staff/breach-report", label: "Breach Reports", icon: ShieldAlert },
  ], []);

  // Standard staff navigation
  const staffGroups: Group[] = useMemo(() => {
    const canCheckout = isScheduler || isReceptionist || isStaff;
    const canClinical = isNP || isStaff;
    return [
      {
        key: "today",
        label: "Today",
        icon: Sun,
        show: true,
        badge: pendingCount + unreadSms,
        children: [
          { to: "/staff/today", label: "Today", icon: Sun },
          { to: "/staff/inbox", label: "Booking Requests", icon: Inbox, badge: pendingCount },
          { to: "/staff/messages", label: "Messages", icon: MessageSquare, badge: unreadSms },
        ],
      },
      {
        key: "schedule",
        label: "Schedule",
        icon: CalIcon,
        show: true,
        children: [
          { to: "/staff/calendar", label: "Calendar", icon: CalIcon },
          { to: "/staff/my-schedule", label: "My Schedule", icon: CalIcon },
          { to: "/staff/time-clock", label: "Time Clock", icon: Clock },
        ],
      },
      {
        key: "clients",
        label: "Clients",
        icon: UserCircle2,
        show: true,
        children: [
          { to: "/staff/clients", label: "All Clients", icon: UserCircle2 },
          { to: "/staff/feedback", label: "Feedback & Reviews", icon: Star },
        ],
      },
      {
        key: "checkout",
        label: "Checkout",
        icon: CreditCard,
        show: canCheckout,
        children: [
          { to: "/staff/checkout", label: "Walk-in Checkout", icon: CreditCard },
        ],
      },
      {
        key: "clinical",
        label: "Clinical",
        icon: Stethoscope,
        show: canClinical,
        children: [
          { to: "/staff/clinical", label: "Charts", icon: Stethoscope },
          { to: "/staff/clinical/cosign", label: "Cosign Queue", icon: ShieldCheck },
          { to: "/staff/clinical/safety", label: "Safety & Protocols", icon: ShieldAlert },
          { to: "/staff/compliance", label: "My Compliance", icon: ShieldCheck },
          { to: "/staff/inventory", label: "Inventory", icon: Boxes },
        ],
      },
    ];
  }, [isScheduler, isReceptionist, isStaff, isNP, pendingCount, unreadSms]);

  const activeGroupKey = useMemo(() => {
    for (const g of staffGroups) {
      if (g.children.some(c => location.pathname === c.to || location.pathname.startsWith(c.to + "/"))) {
        return g.key;
      }
    }
    return staffGroups[0]?.key;
  }, [staffGroups, location.pathname]);

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (activeGroupKey) {
      setOpenGroups(prev => ({ ...prev, [activeGroupKey]: true }));
    }
  }, [activeGroupKey]);

  const toggleGroup = (key: string) => {
    setOpenGroups(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (loading || (user && !mfaChecked)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) return <Navigate to="/staff/login" replace />;
  if (isPrivileged && !mfaOk) return <Navigate to="/staff/mfa" replace />;

  const isStaffMember = isAdmin || isScheduler || isReceptionist || isStaff || isNP;

  if (!isStaffMember) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center px-4">
        <div>
          <p className="text-sm">Your account doesn't have staff access yet.</p>
          <Button variant="link" onClick={async () => { clearDemoAuthSession(); await supabase.auth.signOut(); navigate("/staff/login"); }}>Sign out</Button>
        </div>
      </div>
    );
  }

  const footerLinkCls = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition ${
      isActive
        ? "bg-primary text-primary-foreground font-semibold"
        : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
    }`;

  const isSubActive = (targetUrl: string) => {
    const [targetPath, targetQuery] = targetUrl.split("?");
    if (location.pathname !== targetPath) return false;
    if (!targetQuery) {
      return !location.search || location.search === "" || location.search === "?";
    }
    const currentParams = new URLSearchParams(location.search);
    const targetParams = new URLSearchParams(targetQuery);
    for (const [key, val] of targetParams.entries()) {
      if (currentParams.get(key) !== val) return false;
    }
    return true;
  };

  const NavInner = (
    <>
      {isAdmin ? (
        <div className="space-y-1.5">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-3 mb-2">Admin Modules</div>
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            const active = isSubActive(item.to);
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={() =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition ${
                    active
                      ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                  }`
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      ) : (
        staffGroups.filter(g => g.show).map((g) => {
          const isOpen = !!openGroups[g.key];
          const GIcon = g.icon;
          const visibleChildren = g.children.filter(c => c.show !== false);
          if (visibleChildren.length === 0) return null;
          return (
            <div key={g.key} className="space-y-0.5">
              <button
                onClick={() => toggleGroup(g.key)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <GIcon className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-foreground transition" />
                  <span className="font-medium truncate">{g.label}</span>
                  {g.badge ? (
                    <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-primary/15 text-primary font-bold shrink-0">
                      {g.badge}
                    </span>
                  ) : null}
                </div>
                {isOpen ? <ChevronDown className="h-3.5 w-3.5 shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
              </button>

              {isOpen && (
                <div className="pl-6 space-y-0.5 border-l border-border/60 ml-4 my-1">
                  {visibleChildren.map((c) => {
                    const CIcon = c.icon;
                    const active = isSubActive(c.to);
                    return (
                      <NavLink
                        key={c.to}
                        to={c.to}
                        className={() =>
                          `flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition ${
                            active
                              ? "bg-primary text-primary-foreground font-semibold"
                              : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                          }`
                        }
                        onClick={() => setOpen(false)}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <CIcon className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{c.label}</span>
                        </div>
                        {c.badge ? (
                          <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-primary/15 text-primary font-bold shrink-0">
                            {c.badge}
                          </span>
                        ) : null}
                      </NavLink>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })
      )}

      <div className="pt-3 mt-4 border-t border-border space-y-0.5">
        <NavLink to="/staff/me" className={footerLinkCls} onClick={() => setOpen(false)}><UserCircle2 className="h-4 w-4" />My Profile</NavLink>
        <NavLink to="/staff/help" className={footerLinkCls} onClick={() => setOpen(false)}><BookOpen className="h-4 w-4" />Help / Handbook</NavLink>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Full-width Portal Header Bar */}
      <header className="w-full border-b border-border bg-card/80 backdrop-blur px-4 md:px-6 py-3 flex items-center justify-between z-30 shrink-0">
        {/* Left Corner: Portal Badge */}
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${isAdmin ? "bg-amber-500/10 text-amber-600 border border-amber-500/20" : "bg-primary/10 text-primary border border-primary/20"}`}>
            <ShieldCheck className="h-4 w-4" />
            {isAdmin ? "Admin Portal" : "Staff Portal"}
          </div>
          <span className="text-xs text-muted-foreground hidden md:inline">Radiantilyk Healthcare & HIPAA Compliance Platform</span>
        </div>

        {/* Right Corner: Company Name & Logo */}
        <Link to={isAdmin ? "/staff/admin" : "/staff/today"} className="flex items-center gap-3 hover:opacity-90 transition">
          <div className="text-right hidden sm:block">
            <div className="font-serif text-sm leading-tight font-medium">Radiantilyk Aesthetic</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{isAdmin ? "Admin Dashboard" : "Staff Hub"}</div>
          </div>
          <img src={rkaLogo} alt="Radiantilyk Aesthetic" className="h-9 w-9 rounded-full object-cover shadow-soft" />
        </Link>
      </header>

      {/* Main Container with Sidebar and Content */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Mobile / tablet drawer button header */}
        <div className="md:hidden border-b border-border p-3 flex items-center justify-between bg-card shrink-0">
          <div className="flex items-center gap-2">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon"><Menu className="h-5 w-5" /></Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-4 flex flex-col justify-between">
                <div>
                  <div className="font-serif text-lg font-bold mb-4">Navigation</div>
                  <nav className="space-y-1">{NavInner}</nav>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-xs"
                  onClick={async () => {
                    clearDemoAuthSession();
                    await supabase.auth.signOut();
                    navigate("/staff/login");
                  }}
                >
                  <LogOut className="h-3.5 w-3.5 mr-2" /> Sign out
                </Button>
              </SheetContent>
            </Sheet>
            <span className="font-serif text-sm font-semibold">{isAdmin ? "Admin Portal" : "Staff Portal"}</span>
          </div>
        </div>

        {/* Desktop Sidebar */}
        <aside className="hidden md:flex flex-col w-64 border-r border-border bg-card p-4 shrink-0 justify-between">
          <div className="space-y-4 overflow-y-auto pr-1">
            <nav className="space-y-1">{NavInner}</nav>
          </div>

          <div className="pt-3 border-t border-border">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-xs text-muted-foreground hover:text-foreground"
              onClick={async () => {
                clearDemoAuthSession();
                await supabase.auth.signOut();
                navigate("/staff/login");
              }}
            >
              <LogOut className="h-3.5 w-3.5 mr-2" /> Sign out
            </Button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-background">
          <Outlet />
        </main>
      </div>

      <StaffBottomNav
        canCheckout={isAdmin || isScheduler || isReceptionist || isStaff}
        canClinical={isAdmin || isNP || isStaff}
        pendingBadge={pendingCount + unreadSms}
      />

      <CommandPalette isAdmin={isAdmin} />
      <KeyboardShortcutsHelp />

      <AlertDialog open={showWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you still there?</AlertDialogTitle>
            <AlertDialogDescription>
              For patient privacy, you will be automatically signed out in {countdown} seconds due to inactivity.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={staySignedIn}>Stay Signed In</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
