import { Link } from "react-router-dom";
import {
  Users, DollarSign, BarChart3, History, ShieldCheck, FileText,
  Megaphone, Star, Settings, Boxes, CreditCard, Zap, MessageSquareText, Sparkles,
  Building2, ShieldAlert, BookOpen,
} from "lucide-react";

type Card = { to: string; label: string; desc: string; icon: any };

const CARDS: Card[] = [
  { to: "/staff/team", label: "Team", desc: "Invite staff, manage roles & permissions", icon: Users },
  { to: "/staff/payroll", label: "Payroll", desc: "Run payouts and commission summaries", icon: DollarSign },
  { to: "/staff/services", label: "Services & Pricing", desc: "Catalog, pricing, providers, durations", icon: DollarSign },
  { to: "/staff/clinical-templates", label: "Clinical Templates", desc: "Consents, pre-op, post-op, quick phrases", icon: FileText },
  { to: "/staff/device-presets", label: "Device Presets", desc: "Laser/energy device defaults", icon: Zap },
  { to: "/staff/marketing-hub", label: "Marketing & Offers", desc: "Campaigns, perks, newsletter", icon: Megaphone },
  { to: "/staff/rewards", label: "Rewards & Loyalty", desc: "Points program & redemptions", icon: Star },
  { to: "/staff/productivity", label: "Productivity", desc: "Provider performance reports", icon: BarChart3 },
  { to: "/staff/reports", label: "Reports & Outcomes", desc: "Revenue, services, outcomes", icon: BarChart3 },
  { to: "/staff/finances", label: "Finances", desc: "Sales, refunds, payouts", icon: DollarSign },
  { to: "/staff/audit", label: "Activity Log", desc: "Audit trail of admin actions", icon: History },
  { to: "/staff/audit-report", label: "Audit Report & Export", desc: "PHI access, consent & clinical events by date range", icon: ShieldCheck },
  { to: "/staff/compliance/admin", label: "Staff Compliance", desc: "Protocol signatures & credential tracking", icon: ShieldCheck },
  { to: "/staff/vendors", label: "Vendors & BAAs", desc: "PHI vendor registry & BAA renewal tracking", icon: Building2 },
  { to: "/staff/hipaa-policies", label: "HIPAA Policies & Procedures", desc: "Review, edit, approve & download policy templates", icon: BookOpen },
  { to: "/staff/breach-report", label: "Breach Reports", desc: "File & review possible HIPAA incidents", icon: ShieldAlert },
  { to: "/staff/intake-status", label: "Intake Status", desc: "Pre-visit assessment completion", icon: FileText },
  { to: "/staff/sms-snippets", label: "SMS Snippets", desc: "Reusable text-reply library for staff", icon: MessageSquareText },
  { to: "/staff/tox-followup", label: "Tox Day-7 Follow-up", desc: "Neurotoxin results check-in tracking", icon: Sparkles },
  { to: "/staff/inventory", label: "Inventory", desc: "Products, lots, expirations", icon: Boxes },
  { to: "/staff/terminal", label: "Terminal Readers", desc: "Stripe terminal devices", icon: CreditCard },
  { to: "/staff/pos-config", label: "POS Config", desc: "Checkout settings", icon: Settings },
];

export default function StaffAdminHub() {
  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8">
      <h1 className="font-serif text-3xl mb-2">Admin</h1>
      <p className="text-sm text-muted-foreground mb-6">Everything that runs the practice in one place.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {CARDS.map((c) => {
          const Icon = c.icon;
          return (
            <Link
              key={c.to}
              to={c.to}
              className="rounded-2xl border border-border bg-card p-5 hover:bg-accent transition group"
            >
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="font-medium">{c.label}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{c.desc}</div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
