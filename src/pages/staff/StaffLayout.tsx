import { Link, NavLink, useNavigate, Outlet, Navigate, useLocation } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  Loader2, Calendar as CalIcon, Clock, Users, LogOut, FileText, UserCircle2, Menu, X,
  DollarSign, Inbox, BarChart3, History, Megaphone, Smartphone, Sun, BookOpen, CreditCard,
  ChevronDown, ChevronRight, Stethoscope, MessageSquare, Boxes, Package, Star, AlertTriangle,
  Settings, ShieldCheck, ShieldAlert, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
  const { user, loading, isAdmin, isScheduler, isReceptionist, isStaff, isNP, staffId } = useAuth();
  // Admin tab is restricted to Kiem Vukadinovic only (owner). Other admins do not see it.
  const KIEM_STAFF_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
  const isKiem = isAdmin && staffId === KIEM_STAFF_ID;
  const [open, setOpen] = useState(false);
  const [mfaChecked, setMfaChecked] = useState(false);
  const [mfaOk, setMfaOk] = useState(false);
  useIdleLogout(!!user);
  useEffect(() => { setOpen(false); }, [location.pathname]);
  useEffect(() => {
    if (!user) { setMfaChecked(false); return; }
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (cancelled) return;
      setMfaOk(data?.currentLevel === "aal2");
      setMfaChecked(true);
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

  // Build 6-group nav, role-gated. Receptionist=4, Provider=5, Admin=6.
  const groups: Group[] = useMemo(() => {
    const canCheckout = isAdmin || isScheduler || isReceptionist || isStaff;
    const canClinical = isAdmin || isNP || isStaff;
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
          { to: "/staff/treatment-plans", label: "Treatment Plans", icon: Package, show: isAdmin },
        ],
      },
      {
        key: "checkout",
        label: "Checkout",
        icon: CreditCard,
        show: canCheckout,
        children: [
          { to: "/staff/checkout", label: "Walk-in Checkout", icon: CreditCard },
          { to: "/staff/no-show-charges", label: "No Call / No Show", icon: AlertTriangle, show: isAdmin },
          { to: "/staff/terminal", label: "Terminal Readers", icon: Smartphone, show: isAdmin },
          { to: "/staff/pos-config", label: "POS Config", icon: Settings, show: isAdmin },
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
          { to: "/staff/clinical/adverse-events", label: "Adverse Events", icon: ShieldAlert },
          { to: "/staff/clinical/protocols", label: "Protocols", icon: FileText, show: isNP || isAdmin },
          { to: "/staff/compliance", label: "My Compliance", icon: ShieldCheck },
          { to: "/staff/inventory", label: "Inventory", icon: Boxes },
        ],
      },
      {
        key: "admin",
        label: "Admin",
        icon: Settings,
        show: isKiem,
        children: [
          { to: "/staff/team", label: "Team", icon: Users },
          { to: "/staff/payroll", label: "Payroll", icon: DollarSign },
          { to: "/staff/services", label: "Services & Pricing", icon: DollarSign },
          { to: "/staff/clinical-templates", label: "Clinical Templates", icon: FileText },
          { to: "/staff/device-presets", label: "Device Presets", icon: Zap },
          { to: "/staff/marketing-hub", label: "Marketing & Offers", icon: Megaphone },
          { to: "/staff/rewards", label: "Rewards & Loyalty", icon: Star },
          // Productivity is a provider-performance report, not a clinical tool — lives under analytics.
          { to: "/staff/productivity", label: "Productivity", icon: BarChart3 },
          { to: "/staff/reports", label: "Reports & Outcomes", icon: BarChart3 },
          { to: "/staff/finances", label: "Finances", icon: DollarSign },
          { to: "/staff/audit", label: "Activity Log", icon: History },
          { to: "/staff/compliance/admin", label: "Staff Compliance", icon: ShieldCheck },
          { to: "/staff/intake-status", label: "Intake Status", icon: FileText },
        ],
      },
    ];
  }, [isAdmin, isScheduler, isReceptionist, isStaff, isNP, isKiem, pendingCount, unreadSms]);

  // Track open group(s): auto-open the one containing the current route.
  const activeGroupKey = useMemo(() => {
    for (const g of groups) {
      if (g.children.some(c => location.pathname === c.to || location.pathname.startsWith(c.to + "/"))) {
        return g.key;
      }
    }
    return groups[0]?.key;
  }, [groups, location.pathname]);
  const [openGroup, setOpenGroup] = useState<string | null>(activeGroupKey ?? null);
  useEffect(() => { setOpenGroup(activeGroupKey ?? null); }, [activeGroupKey]);

  if (loading || (user && !mfaChecked)) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  }
  if (!user) return <Navigate to="/staff/login" replace />;
  if (!mfaOk) return <Navigate to="/staff/mfa" replace />;
  if (!isAdmin && !isScheduler && !isReceptionist && !isStaff && !isNP) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center px-4">
        <div>
          <p className="text-sm">Your account doesn't have staff access yet.</p>
          <Button variant="link" onClick={async () => { await supabase.auth.signOut(); navigate("/staff/login"); }}>Sign out</Button>
        </div>
      </div>
    );
  }

  const groupBtnCls = (active: boolean) =>
    `w-full flex items-center gap-2.5 px-3 py-3 lg:py-2.5 rounded-lg text-sm font-medium transition ${
      active ? "bg-primary/10 text-primary" : "text-foreground hover:bg-secondary/60"
    }`;
  const subLinkCls = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2.5 pl-9 pr-3 py-2.5 lg:py-2 rounded-lg text-[13px] transition ${
      isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
    }`;
  const footerLinkCls = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] transition ${
      isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
    }`;

  const Badge = ({ n }: { n: number }) =>
    n > 0 ? (
      <span className="ml-auto inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold">
        {n}
      </span>
    ) : null;

  const NavInner = (
    <>
      {groups.filter(g => g.show).map(g => {
        const isOpenGroup = openGroup === g.key;
        const isActiveGroup = activeGroupKey === g.key;
        const Icon = g.icon;
        return (
          <div key={g.key} className="space-y-1">
            <button
              type="button"
              onClick={() => setOpenGroup(isOpenGroup ? null : g.key)}
              className={groupBtnCls(isActiveGroup)}
              aria-expanded={isOpenGroup}
            >
              <Icon className="h-4 w-4" />
              <span className="flex-1 text-left">{g.label}</span>
              {!isOpenGroup && <Badge n={g.badge ?? 0} />}
              {isOpenGroup ? <ChevronDown className="h-4 w-4 opacity-60" /> : <ChevronRight className="h-4 w-4 opacity-60" />}
            </button>
            {isOpenGroup && (
              <div className="space-y-0.5 pb-1">
                {g.children.filter(c => c.show !== false).map(c => {
                  const ChildIcon = c.icon;
                  return (
                    <NavLink key={c.to} to={c.to} className={subLinkCls} end={c.to === "/staff/clinical"} onClick={() => setOpen(false)}>
                      <ChildIcon className="h-4 w-4 -ml-5" />
                      <span className="flex-1">{c.label}</span>
                      <Badge n={c.badge ?? 0} />
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
    <div className="min-h-screen bg-background lg:flex">
      {/* Mobile / tablet top bar */}
      <header className="lg:hidden sticky top-0 z-40 flex items-center justify-between px-4 py-3 border-b border-border bg-background/95 backdrop-blur">
        <Link to="/staff/today" className="flex items-center gap-2.5 leading-tight">
          <img src={rkaLogo} alt="Radiantilyk Aesthetic" className="h-9 w-9 rounded-full object-cover" />
          <div className="flex flex-col">
            <span className="font-serif text-lg">Radiantilyk Aesthetic</span>
            <span className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground">Staff</span>
          </div>
        </Link>
        <button onClick={() => setOpen(v => !v)} aria-label="Menu" className="p-3 -mr-2 rounded-md text-muted-foreground hover:text-foreground">
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </header>

      {/* Mobile / tablet drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/30" />
          <aside className="absolute right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-card border-l border-border flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-border flex items-center justify-between">
              <span className="text-sm font-medium">Menu</span>
              <button onClick={() => setOpen(false)} className="p-2 text-muted-foreground"><X className="h-5 w-5" /></button>
            </div>
            <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">{NavInner}</nav>
            <div className="p-3 border-t border-border space-y-2">
              <ClockInOutButton compact />
              <div className="px-3 py-2 text-xs text-muted-foreground truncate">{user.email}</div>
              <button
                onClick={async () => { await supabase.auth.signOut(); navigate("/staff/login"); }}
                className="w-full flex items-center gap-2 px-3 py-3 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/60"
              >
                <LogOut className="h-4 w-4" />Sign out
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Desktop sidebar (>=1024px) */}
      <aside className="hidden lg:flex w-60 border-r border-border bg-card/40 flex-col">
        <div className="p-5 border-b border-border">
          <Link to="/staff/today" className="flex items-center gap-3">
            <img src={rkaLogo} alt="Radiantilyk Aesthetic" className="h-11 w-11 rounded-full object-cover shadow-soft" />
            <div>
              <div className="font-serif text-lg leading-tight">Radiantilyk Aesthetic</div>
              <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Staff Portal</div>
            </div>
          </Link>
        </div>
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">{NavInner}</nav>
        <div className="p-3 border-t border-border space-y-2">
          <ClockInOutButton />
          <div className="px-3 py-2 text-xs text-muted-foreground truncate">{user.email}</div>
          <button
            onClick={async () => { await supabase.auth.signOut(); navigate("/staff/login"); }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/60"
          >
            <LogOut className="h-4 w-4" />Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto min-w-0 relative pb-[calc(4rem+env(safe-area-inset-bottom))] lg:pb-0">
        <Outlet />
        {/* Quick-book FAB removed — booking is reachable via ⌘B command palette,
            the Today header button, and the Dashboard CTA. */}
      </main>

      <StaffBottomNav
        canCheckout={isAdmin || isScheduler || isReceptionist || isStaff}
        canClinical={isAdmin || isNP || isStaff}
        pendingBadge={pendingCount + unreadSms}
      />

      <CommandPalette isAdmin={isAdmin} />
      <KeyboardShortcutsHelp />
    </div>
  );
}
