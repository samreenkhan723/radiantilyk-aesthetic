import { Link, NavLink, useNavigate, Outlet, Navigate, useLocation } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useAuth, clearDemoAuthSession } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  Loader2, Calendar as CalIcon, Clock, Users, LogOut, FileText, UserCircle2, Menu, X,
  DollarSign, Inbox, BarChart3, History, Megaphone, Smartphone, Sun, BookOpen, CreditCard,
  ChevronDown, ChevronRight, Stethoscope, MessageSquare, Boxes, Package, Star, AlertTriangle,
  Settings, ShieldCheck, ShieldAlert, Zap, LayoutDashboard, Shield, Lock, KeyRound,
  FileCheck, FileCode, Laptop, Building2, Eye, HardDrive, Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { CommandPalette } from "@/components/CommandPalette";
import { KeyboardShortcutsHelp } from "@/components/staff/KeyboardShortcutsHelp";
import { usePendingBookings } from "@/hooks/usePendingBookings";
import { ClockInOutButton } from "@/components/staff/ClockInOutButton";
import { useIdleLogout } from "@/hooks/useIdleLogout";
import { StaffBottomNav } from "@/components/staff/StaffBottomNav";
import rkaLogo from "@/assets/rka-logo.webp";

type SubLink = { to: string; label: string; icon: any; show?: boolean; badge?: number };
type Group = { key: string; label: string; icon: any; show: boolean; badge?: number; children: SubLink[] };

export default function StaffLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading, isAdmin, isScheduler, isReceptionist, isStaff, isNP, isPrivileged, staffId } = useAuth();
  const [open, setOpen] = useState(false);
  const [mfaChecked, setMfaChecked] = useState(false);
  const [mfaOk, setMfaOk] = useState(false);
<<<<<<< HEAD
  const { showWarning, countdown, staySignedIn } = useIdleLogout(!!user);
=======

  useIdleLogout(!!user);
>>>>>>> cb345dceafa23ebc8ef813f1aec444fbe233a0c3
  useEffect(() => { setOpen(false); }, [location.pathname]);

  useEffect(() => {
    if (!user) { setMfaChecked(false); return; }
    let cancelled = false;
    (async () => {
      if (localStorage.getItem("rka_demo_session")) {
        setMfaOk(true);
        setMfaChecked(true);
        return;
      }
      try {
        const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        if (cancelled) return;
        setMfaOk(data?.currentLevel === "aal2");
      } catch (e) {
        if (cancelled) return;
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

  // Enterprise Healthcare & HIPAA Compliance navigation structure for Admin
  // Single "Staff Management" module under User & Role Management
  const adminGroups: Group[] = useMemo(() => [
    {
      key: "admin-users",
      label: "User & Role Management",
      icon: Users,
      show: true,
      children: [
        { to: "/staff/team", label: "Staff Management", icon: Users },
        { to: "/staff/clients", label: "Patients", icon: UserCircle2 },
        { to: "/staff/team?tab=roles", label: "Role & Permissions", icon: Lock },
        { to: "/staff/team?tab=mfa", label: "MFA Status", icon: KeyRound },
      ],
    },
    {
      key: "admin-intake",
      label: "Patient Intake",
      icon: FileText,
      show: true,
      children: [
        { to: "/staff/intake-status", label: "Intake Completion Status", icon: FileText },
        { to: "/staff/intake-status?tab=npp", label: "Notice of Privacy Practices (NPP)", icon: BookOpen },
        { to: "/staff/intake-status?tab=marketing", label: "Marketing Consents", icon: FileCheck },
      ],
    },
    {
      key: "admin-clinical-templates",
      label: "Clinical Templates",
      icon: FileCode,
      show: true,
      children: [
        { to: "/staff/clinical-templates?tab=treatment", label: "Treatment Templates", icon: Stethoscope },
        { to: "/staff/clinical-templates?tab=consents", label: "Consent Templates", icon: FileCheck },
        { to: "/staff/clinical-templates?tab=doc", label: "Documentation Templates", icon: FileText },
      ],
    },
    {
      key: "admin-audit-logs",
      label: "Audit Logs",
      icon: History,
      show: true,
      children: [
        { to: "/staff/audit-report", label: "PHI Access Logs", icon: Eye },
        { to: "/staff/audit", label: "Login & System Activity", icon: History },
        { to: "/staff/audit-report?filter=clinical", label: "Clinical & Consent Logs", icon: FileCheck },
        { to: "/staff/audit-report?tab=export", label: "Export & Filters", icon: HardDrive },
      ],
    },
    {
      key: "admin-hipaa-policies",
      label: "HIPAA Policies",
      icon: BookOpen,
      show: true,
      children: [
        { to: "/staff/hipaa-policies?tab=privacy", label: "Privacy Policy", icon: Lock },
        { to: "/staff/hipaa-policies?tab=security", label: "Security Policy", icon: ShieldCheck },
        { to: "/staff/hipaa-policies?tab=risk", label: "Risk Analysis", icon: ShieldAlert },
        { to: "/staff/hipaa-policies?tab=disaster", label: "Disaster Recovery", icon: HardDrive },
        { to: "/staff/hipaa-policies?tab=incident", label: "Incident Response", icon: AlertTriangle },
        { to: "/staff/hipaa-policies?tab=history", label: "Version History", icon: History },
      ],
    },
    {
      key: "admin-staff-compliance",
      label: "Staff Compliance",
      icon: Shield,
      show: true,
      children: [
        { to: "/staff/compliance/admin", label: "HIPAA Training & Signatures", icon: ShieldCheck },
        { to: "/staff/compliance/admin?tab=certs", label: "Compliance Certificates", icon: FileCheck },
      ],
    },
    {
      key: "admin-device-inventory",
      label: "Device Inventory",
      icon: Laptop,
      show: true,
      children: [
        { to: "/staff/vendors?tab=devices", label: "Clinic Devices & Users", icon: Laptop },
        { to: "/staff/vendors?tab=encryption", label: "Encryption & Serial Records", icon: Lock },
      ],
    },
    {
      key: "admin-vendor-management",
      label: "Vendor Management",
      icon: Building2,
      show: true,
      children: [
        { to: "/staff/vendors", label: "BAA Status & Registry", icon: Building2 },
        { to: "/staff/vendors?filter=cloud", label: "Supabase, Google, Stripe & GHL", icon: HardDrive },
      ],
    },
    {
      key: "admin-breach-reports",
      label: "Incident & Breach Reports",
      icon: ShieldAlert,
      show: true,
      children: [
        { to: "/staff/breach-report", label: "Open Cases & Timelines", icon: ShieldAlert },
        { to: "/staff/breach-report?tab=cmia", label: "Notification Deadlines (CMIA 15-Day)", icon: Clock },
      ],
    },
    {
      key: "admin-reports",
      label: "Reports",
      icon: BarChart3,
      show: true,
      children: [
        { to: "/staff/reports?tab=compliance", label: "Compliance & Audit Reports", icon: BarChart3 },
        { to: "/staff/reports?tab=staff", label: "Staff & Patient Reports", icon: Users },
        { to: "/staff/reports?tab=export", label: "Export Reports", icon: HardDrive },
      ],
    },
    {
      key: "admin-settings",
      label: "Settings",
      icon: Settings,
      show: true,
      children: [
        { to: "/staff/pos-config", label: "General & Security Settings", icon: Settings },
        { to: "/staff/pos-config?tab=auth", label: "Authentication & System Config", icon: Lock },
      ],
    },
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

  const groups = isAdmin ? adminGroups : staffGroups;

  // Track open group(s): auto-open the one containing the current route.
  const activeGroupKey = useMemo(() => {
    for (const g of groups) {
      if (g.children.some(c => location.pathname === c.to || location.pathname.startsWith(c.to + "/"))) {
        return g.key;
      }
    }
    return groups[0]?.key;
  }, [groups, location.pathname]);

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
      {/* Single, direct Dashboard item for Admin (NO DROPDOWN) */}
      {isAdmin && (
        <NavLink
          to="/staff/admin"
          end
          onClick={() => setOpen(false)}
          className={({ isActive }) =>
            `flex items-center gap-2.5 px-3 py-2.5 mb-3 rounded-xl text-xs font-semibold transition border ${
              isActive
                ? "bg-primary text-primary-foreground border-primary shadow-xs"
                : "bg-card text-foreground border-border hover:bg-secondary/60"
            }`
          }
        >
          <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />
          <span>Dashboard</span>
        </NavLink>
      )}

      {groups.filter(g => g.show).map((g) => {
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
      })}

      <div className="pt-3 mt-2 border-t border-border space-y-0.5">
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
        <div className="lg:hidden sticky top-0 z-40 flex items-center justify-between px-4 py-2 border-b border-border bg-background/95 backdrop-blur w-full">
          <span className="text-xs font-medium text-muted-foreground">{isAdmin ? "Admin Navigation" : "Staff Navigation"}</span>
          <button onClick={() => setOpen(v => !v)} aria-label="Menu" className="p-2 text-muted-foreground hover:text-foreground">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile / tablet drawer */}
        {open && (
          <div className="lg:hidden fixed inset-0 z-50" onClick={() => setOpen(false)}>
            <div className="absolute inset-0 bg-black/30" />
            <aside className="absolute right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-card border-l border-border flex flex-col" onClick={(e) => e.stopPropagation()}>
              <div className="p-4 border-b border-border flex items-center justify-between">
                <span className="text-sm font-medium">{isAdmin ? "Admin Menu" : "Staff Menu"}</span>
                <button onClick={() => setOpen(false)} className="p-2 text-muted-foreground"><X className="h-5 w-5" /></button>
              </div>
              <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">{NavInner}</nav>
              <div className="p-3 border-t border-border space-y-2">
                <ClockInOutButton compact />
                <div className="px-3 py-2 text-xs text-muted-foreground truncate">{user.email}</div>
                <button
                  onClick={async () => { clearDemoAuthSession(); await supabase.auth.signOut(); navigate("/staff/login"); }}
                  className="w-full flex items-center gap-2 px-3 py-3 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                >
                  <LogOut className="h-4 w-4" />Sign out
                </button>
              </div>
            </aside>
          </div>
        )}

        {/* Desktop sidebar (>=1024px) */}
        <aside className="hidden lg:flex w-64 border-r border-border bg-card/40 flex-col shrink-0">
          <div className="p-5 border-b border-border">
            <Link to={isAdmin ? "/staff/admin" : "/staff/today"} className="flex items-center gap-3">
              <img src={rkaLogo} alt="Radiantilyk Aesthetic" className="h-11 w-11 rounded-full object-cover shadow-soft" />
              <div>
                <div className="font-serif text-lg leading-tight">Radiantilyk Aesthetic</div>
                <div className={`text-[10px] uppercase tracking-[0.3em] font-semibold mt-0.5 ${isAdmin ? "text-amber-600 font-bold" : "text-muted-foreground"}`}>
                  {isAdmin ? "Admin Portal" : "Staff Portal"}
                </div>
              </div>
            </Link>
          </div>
          <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">{NavInner}</nav>
          <div className="p-3 border-t border-border space-y-2">
            <ClockInOutButton />
            <div className="px-3 py-2 text-xs text-muted-foreground truncate">{user.email}</div>
            <button
              onClick={async () => { clearDemoAuthSession(); await supabase.auth.signOut(); navigate("/staff/login"); }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/60"
            >
              <LogOut className="h-4 w-4" />Sign out
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto min-w-0 relative pb-[calc(4rem+env(safe-area-inset-bottom))] lg:pb-0">
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
