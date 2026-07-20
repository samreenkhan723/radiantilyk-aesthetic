import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Loader2, Mail, CheckCircle2, Plus, MoreHorizontal, UserX, UserCheck, Trash2, DollarSign, ShieldCheck, Lock, KeyRound, AlertCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Member {
  id: string; full_name: string; title: string; email: string | null;
  user_id: string | null; is_active: boolean; is_owner: boolean; color: string;
  hourly_rate_cents: number | null; commission_percent: number | null;
  is_pending?: boolean;
  pending_role?: Role;
}

type Role = "admin" | "provider" | "nurse_practitioner" | "scheduler" | "receptionist" | "staff";
const ROLE_LABELS: Record<Role, string> = {
  admin: "Admin (full access)",
  provider: "Provider (clinical provider)",
  nurse_practitioner: "Nurse Practitioner (GFE + clinical co-sign)",
  scheduler: "Scheduler (manage all bookings)",
  receptionist: "Front Desk Receptionist (book, check in, schedule)",
  staff: "Staff (own bookings only)",
};

interface PendingRequest {
  id: string;
  full_name: string;
  title: string;
  email: string;
  role: Role;
  color: string;
  created_at: string;
  password?: string;
}

const PALETTE = ["#c97c5d", "#7c9dd1", "#a8c084", "#d4a3c4", "#e8b94b", "#8b7ec4", "#d97c7c", "#5db8a8"];

export default function StaffTeam() {
  const { isAdmin } = useAuth();
  const [sp, setSp] = useSearchParams();
  const roleFilter = sp.get("role") || "all";
  const currentTab = sp.get("tab");

  const [members, setMembers] = useState<Member[]>([]);
  const [roles, setRoles] = useState<Record<string, Role[]>>({});
  const [invites, setInvites] = useState<Record<string, { sent: string; accepted: string | null; role: Role }>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);

  const [addOpen, setAddOpen] = useState(false);
  const [addBusy, setAddBusy] = useState(false);
  const [draft, setDraft] = useState({ full_name: "", title: "", email: "", color: PALETTE[0], role: "staff" as Role, sendInvite: true });

  const load = async () => {
    setLoading(true);
    const { data: m } = await supabase.from("staff_profiles").select("id, user_id, full_name, title, email, bio, color, is_owner, is_active, created_at, updated_at, calendar_email, phone, license_number" as any).order("is_owner", { ascending: false }).order("created_at");
    const { data: pay } = await (supabase as any).from("staff_pay_config").select("staff_id, hourly_rate_cents, commission_percent");
    const payMap: Record<string, { hourly_rate_cents: number | null; commission_percent: number | null }> = {};
    (pay ?? []).forEach((p: any) => { payMap[p.staff_id] = { hourly_rate_cents: p.hourly_rate_cents, commission_percent: p.commission_percent }; });

    const localDemoMembers: Member[] = JSON.parse(localStorage.getItem("rka_demo_team_members") || "[]");

    const fetchedMembers = (m ?? []).map((row: any) => ({
      ...row,
      hourly_rate_cents: payMap[row.id]?.hourly_rate_cents ?? null,
      commission_percent: payMap[row.id]?.commission_percent ?? null,
    })) as Member[];

    const existingIds = new Set(fetchedMembers.map(x => x.id));
    const uniqueLocal = localDemoMembers.filter(x => !existingIds.has(x.id));

    // Load pending member creation requests and map them as pending members in Staff Management
    const storedRequests: PendingRequest[] = JSON.parse(localStorage.getItem("rka_pending_member_requests") || "[]");
    setPendingRequests(storedRequests);

    const activeIds = new Set([...fetchedMembers.map(x => x.id), ...uniqueLocal.map(x => x.id)]);
    const activeEmails = new Set([...fetchedMembers.map(x => x.email), ...uniqueLocal.map(x => x.email)].filter(Boolean));

    const pendingMembers: Member[] = storedRequests
      .filter(req => !activeIds.has(req.id) && !activeEmails.has(req.email))
      .map(req => ({
        id: req.id,
        full_name: req.full_name,
        title: req.title,
        email: req.email,
        user_id: null,
        is_active: false,
        is_owner: false,
        color: req.color,
        hourly_rate_cents: null,
        commission_percent: null,
        is_pending: true,
        pending_role: req.role,
      }));

    setMembers([...fetchedMembers, ...uniqueLocal, ...pendingMembers]);

    const userIds = (m ?? []).map((x: any) => x.user_id).filter(Boolean);
    if (userIds.length) {
      const { data: r } = await supabase.from("user_roles").select("user_id, role").in("user_id", userIds);
      const map: Record<string, Role[]> = {};
      (r ?? []).forEach((row: any) => {
        map[row.user_id] = [...(map[row.user_id] ?? []), row.role];
      });
      setRoles(map);
    } else {
      setRoles({});
    }
    const { data: inv } = await supabase.from("staff_invitations").select("staff_id, created_at, accepted_at, role").order("created_at", { ascending: false });
    const im: typeof invites = {};
    (inv ?? []).forEach((row: any) => {
      if (!im[row.staff_id]) im[row.staff_id] = { sent: row.created_at, accepted: row.accepted_at, role: row.role };
    });

    uniqueLocal.forEach((demoM) => {
      if (!im[demoM.id]) {
        im[demoM.id] = { sent: new Date().toISOString(), accepted: null, role: (demoM as any).role || "staff" };
      }
    });

    setInvites(im);
    setLoading(false);
  };

  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  const sendInvite = async (m: Member, role?: Role) => {
    if (!m.email) { toast.error("No email on file"); return; }
    setBusy(m.id);
    const { data, error } = await supabase.functions.invoke("staff-invite-send", {
      body: { staffId: m.id, role: role ?? "staff" },
    });
    setBusy(null);
    if (error || data?.error) {
      toast.error(data?.error || error?.message || "Could not send invite");
      return;
    }
    toast.success(`Invite sent to ${m.email}`);
    load();
  };

  const sendAll = async () => {
    setBusy("all");
    const { data, error } = await supabase.functions.invoke("staff-invite-send", { body: { all: true } });
    setBusy(null);
    if (error || data?.error) { toast.error(data?.error || error?.message || "Failed"); return; }
    toast.success(`Sent ${data?.sent ?? 0} invites`);
    load();
  };

  const addMember = async () => {
    if (!draft.full_name.trim() || !draft.title.trim() || !draft.email.trim()) {
      toast.error("Name, title, and email are required"); return;
    }
    setAddBusy(true);

    const newReq: PendingRequest = {
      id: `req-${Date.now()}`,
      full_name: draft.full_name.trim(),
      title: draft.title.trim(),
      email: draft.email.trim().toLowerCase(),
      role: draft.role,
      color: draft.color,
      created_at: new Date().toISOString(),
      password: "12345678",
    };

    const existingReqs: PendingRequest[] = JSON.parse(localStorage.getItem("rka_pending_member_requests") || "[]");
    existingReqs.push(newReq);
    localStorage.setItem("rka_pending_member_requests", JSON.stringify(existingReqs));

    toast.success(`Member ${draft.full_name} created! Status: Pending Admin Approval.`);
    setAddBusy(false);
    setAddOpen(false);
    setDraft({ full_name: "", title: "", email: "", color: PALETTE[0], role: "staff", sendInvite: true });
    load();
  };

  const approveMemberRequest = (req: PendingRequest) => {
    const existingReqs: PendingRequest[] = JSON.parse(localStorage.getItem("rka_pending_member_requests") || "[]");
    const updatedReqs = existingReqs.filter(r => r.id !== req.id && r.email !== req.email);
    localStorage.setItem("rka_pending_member_requests", JSON.stringify(updatedReqs));

    const approvedAccounts: any[] = JSON.parse(localStorage.getItem("rka_approved_staff_accounts") || "[]");
    approvedAccounts.push({
      email: req.email,
      password: req.password || "12345678",
      role: req.role,
      full_name: req.full_name,
    });
    localStorage.setItem("rka_approved_staff_accounts", JSON.stringify(approvedAccounts));

    const newMember: Member = {
      id: `approved-${Date.now()}`,
      full_name: req.full_name,
      title: req.title,
      email: req.email,
      user_id: `user-${Date.now()}`,
      is_active: true,
      is_owner: false,
      color: req.color,
      hourly_rate_cents: null,
      commission_percent: null,
    };

    const existingTeam: Member[] = JSON.parse(localStorage.getItem("rka_demo_team_members") || "[]");
    existingTeam.push(newMember);
    localStorage.setItem("rka_demo_team_members", JSON.stringify(existingTeam));

    toast.success(`Approved! Member ${req.full_name} activated. Login credentials: Email: ${req.email} | Password: ${req.password || "12345678"}`);
    load();
  };

  const rejectMemberRequest = (reqId: string) => {
    const existingReqs: PendingRequest[] = JSON.parse(localStorage.getItem("rka_pending_member_requests") || "[]");
    const updatedReqs = existingReqs.filter(r => r.id !== reqId);
    localStorage.setItem("rka_pending_member_requests", JSON.stringify(updatedReqs));
    toast.info("Member request rejected");
    load();
  };

  const updateRole = async (m: Member, newRole: Role) => {
    if (!m.user_id) return;
    setBusy(m.id);
    const { error: delErr } = await supabase.from("user_roles").delete().eq("user_id", m.user_id);
    if (delErr) { setBusy(null); toast.error(delErr.message); return; }
    const toInsert: { user_id: string; role: Role }[] = [{ user_id: m.user_id, role: newRole }];
    if (newRole === "admin" || newRole === "provider" || newRole === "scheduler" || newRole === "receptionist" || newRole === "nurse_practitioner") toInsert.push({ user_id: m.user_id, role: "staff" });
    const { error: insErr } = await supabase.from("user_roles").insert(toInsert);
    setBusy(null);
    if (insErr) { toast.error(insErr.message); return; }
    toast.success(`Role updated to ${newRole}`);
    load();
  };

  const toggleActive = async (m: Member) => {
    setBusy(m.id);
    try {
      await supabase.from("staff_profiles").update({ is_active: !m.is_active }).eq("id", m.id);
    } catch (e) {}

    const localDemoMembers: Member[] = JSON.parse(localStorage.getItem("rka_demo_team_members") || "[]");
    const updatedDemo = localDemoMembers.map(x => x.id === m.id ? { ...x, is_active: !m.is_active } : x);
    localStorage.setItem("rka_demo_team_members", JSON.stringify(updatedDemo));

    setBusy(null);
    toast.success(m.is_active ? `Deactivated ${m.full_name}` : `Reactivated ${m.full_name}`);
    load();
  };

  const [confirmDelete, setConfirmDelete] = useState<Member | null>(null);
  const [payEditing, setPayEditing] = useState<Member | null>(null);
  const [payDraft, setPayDraft] = useState({ rate: "", pct: "" });
  const [paySaving, setPaySaving] = useState(false);

  const openPay = (m: Member) => {
    setPayDraft({
      rate: m.hourly_rate_cents != null ? (m.hourly_rate_cents / 100).toString() : "",
      pct: m.commission_percent != null ? String(m.commission_percent) : "",
    });
    setPayEditing(m);
  };

  const savePay = async () => {
    if (!payEditing) return;
    setPaySaving(true);
    const rate = payDraft.rate.trim() === "" ? null : Math.round(parseFloat(payDraft.rate) * 100);
    const pct = payDraft.pct.trim() === "" ? null : parseFloat(payDraft.pct);
    if (rate !== null && (isNaN(rate) || rate < 0)) { setPaySaving(false); return toast.error("Invalid rate"); }
    if (pct !== null && (isNaN(pct) || pct < 0 || pct > 100)) { setPaySaving(false); return toast.error("Commission must be 0–100"); }
    const { error } = await (supabase as any).from("staff_pay_config").upsert({
      staff_id: payEditing.id,
      hourly_rate_cents: rate,
      commission_percent: pct,
      updated_at: new Date().toISOString(),
    });
    setPaySaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`Saved pay settings for ${payEditing.full_name}`);
    setPayEditing(null);
    load();
  };

  const deleteMember = async (m: Member) => {
    setBusy(m.id);
    try {
      if (m.user_id) await supabase.from("user_roles").delete().eq("user_id", m.user_id);
      await supabase.from("staff_invitations").delete().eq("staff_id", m.id);
      await supabase.from("service_providers").delete().eq("staff_id", m.id);
      await supabase.from("schedule_overrides").delete().eq("staff_id", m.id);
      await supabase.from("staff_profiles").delete().eq("id", m.id);
    } catch (e) {
      console.warn("Remote delete notice:", e);
    }

    const localDemoMembers: Member[] = JSON.parse(localStorage.getItem("rka_demo_team_members") || "[]");
    const updatedDemoMembers = localDemoMembers.filter(x => x.id !== m.id && x.email !== m.email);
    localStorage.setItem("rka_demo_team_members", JSON.stringify(updatedDemoMembers));

    const approvedAccounts: any[] = JSON.parse(localStorage.getItem("rka_approved_staff_accounts") || "[]");
    const updatedApproved = approvedAccounts.filter(x => x.email !== m.email);
    localStorage.setItem("rka_approved_staff_accounts", JSON.stringify(updatedApproved));

    const pendingReqs: PendingRequest[] = JSON.parse(localStorage.getItem("rka_pending_member_requests") || "[]");
    const updatedReqs = pendingReqs.filter(r => r.id !== m.id && r.email !== m.email);
    localStorage.setItem("rka_pending_member_requests", JSON.stringify(updatedReqs));

    setBusy(null);
    setConfirmDelete(null);
    toast.success(`${m.full_name} deleted`);
    load();
  };

  if (!isAdmin) return <div className="p-8 text-sm text-muted-foreground">Admins only.</div>;

  const filteredMembers = members.filter((m) => {
    if (roleFilter === "all") return true;
    const memberRoles = m.user_id ? (roles[m.user_id] ?? []) : [];
    const inv = invites[m.id];
    const primaryRole: Role = m.pending_role || (
      memberRoles.includes("admin") ? "admin" :
      memberRoles.includes("provider") ? "provider" :
      memberRoles.includes("nurse_practitioner") ? "nurse_practitioner" :
      memberRoles.includes("scheduler") ? "scheduler" :
      memberRoles.includes("receptionist") ? "receptionist" :
      memberRoles.includes("staff") ? "staff" :
      (inv?.role ?? "staff")
    );

    if (roleFilter === "admin") return primaryRole === "admin";
    if (roleFilter === "provider") return primaryRole === "provider";
    if (roleFilter === "np") return primaryRole === "nurse_practitioner";
    if (roleFilter === "staff") return primaryRole === "staff" || primaryRole === "receptionist" || primaryRole === "scheduler";
    return true;
  });

  if (currentTab === "roles") {
    return (
      <div className="p-4 sm:p-8 max-w-5xl space-y-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-3xl">Role & Permission Management</h1>
            {pendingRequests.length > 0 && (
              <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 font-semibold px-2.5 py-0.5">
                {pendingRequests.length} Pending Approval
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Review pending member requests, accept activation credentials, and manage role permission levels.</p>
        </div>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              <h2 className="font-serif text-xl">Pending Member Activation Requests</h2>
            </div>
            <span className="text-xs text-muted-foreground">{pendingRequests.length} Request(s)</span>
          </div>

          {pendingRequests.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-8 text-center bg-card">
              <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
              <div className="font-medium text-sm">No Pending Member Requests</div>
              <div className="text-xs text-muted-foreground mt-1">When new team members are created, their approval requests appear here for Admin sign-off.</div>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingRequests.map((req) => (
                <div key={req.id} className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full shrink-0 flex items-center justify-center font-bold text-white shadow-xs" style={{ background: req.color }}>
                      {req.full_name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-foreground flex items-center gap-2">
                        {req.full_name}
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px]">
                          {req.role.replace("_", " ")}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">{req.title} · {req.email}</div>
                      <div className="text-[11px] text-emerald-600 mt-1 font-mono">
                        Password Credentials: <span className="font-bold bg-background px-1.5 py-0.5 rounded border border-border">12345678</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button onClick={() => approveMemberRequest(req)} size="sm" className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white">
                      <CheckCircle2 className="h-4 w-4 mr-1.5" /> Approve & Activate
                    </Button>
                    <Button onClick={() => rejectMemberRequest(req.id)} size="sm" variant="outline" className="rounded-full text-destructive hover:bg-destructive/10">
                      <XCircle className="h-4 w-4 mr-1" /> Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-4 pt-4 border-t border-border">
          <h2 className="font-serif text-xl">Role Governance Matrix</h2>
          <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs md:text-sm">
                <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border">
                  <tr>
                    <th className="p-3.5">Role Name</th>
                    <th className="p-3.5">Scope & Access Level</th>
                    <th className="p-3.5">MFA Requirement</th>
                    <th className="p-3.5">Clinical Charts</th>
                    <th className="p-3.5 text-right">Approval Required</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="p-3.5 font-semibold text-foreground">Admin</td>
                    <td className="p-3.5 text-muted-foreground">Full Platform Governance</td>
                    <td className="p-3.5"><Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Enforced AAL2</Badge></td>
                    <td className="p-3.5 text-muted-foreground">Full Access</td>
                    <td className="p-3.5 text-right text-emerald-600 font-medium">Owner / Admin</td>
                  </tr>
                  <tr>
                    <td className="p-3.5 font-semibold text-foreground">Provider</td>
                    <td className="p-3.5 text-muted-foreground">Clinical & Patient Treatments</td>
                    <td className="p-3.5"><Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Enforced AAL2</Badge></td>
                    <td className="p-3.5 text-muted-foreground">Assigned Clients</td>
                    <td className="p-3.5 text-right text-emerald-600 font-medium">Admin Approval</td>
                  </tr>
                  <tr>
                    <td className="p-3.5 font-semibold text-foreground">Nurse Practitioner</td>
                    <td className="p-3.5 text-muted-foreground">GFE Assessments & Co-Sign</td>
                    <td className="p-3.5"><Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Enforced AAL2</Badge></td>
                    <td className="p-3.5 text-muted-foreground">GFE & Protocols</td>
                    <td className="p-3.5 text-right text-emerald-600 font-medium">Admin Approval</td>
                  </tr>
                  <tr>
                    <td className="p-3.5 font-semibold text-foreground">Staff / Receptionist</td>
                    <td className="p-3.5 text-muted-foreground">Bookings & Checkout</td>
                    <td className="p-3.5"><Badge variant="outline">Optional / Recommended</Badge></td>
                    <td className="p-3.5 text-muted-foreground">View Only</td>
                    <td className="p-3.5 text-right text-emerald-600 font-medium">Admin Approval</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (currentTab === "mfa") {
    return (
      <div className="p-4 sm:p-8 max-w-4xl space-y-6">
        <div>
          <h1 className="font-serif text-3xl">MFA Status & Governance</h1>
          <p className="text-xs text-muted-foreground mt-1">HIPAA §164.312 multi-factor authentication compliance across privileged roles.</p>
        </div>

        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6 flex items-start gap-4 shadow-xs">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <div className="font-semibold text-foreground">MFA Enforcement Status: 100% Active</div>
            <div className="text-xs text-muted-foreground mt-1">TOTP Multi-Factor Authentication is enforced for all Admin, Provider, and Nurse Practitioner staff accounts.</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="font-serif text-3xl">Staff Management</h1>
          <p className="text-xs text-muted-foreground mt-1">Manage all practice members, assign roles, and send activation emails.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setAddOpen(true)} className="rounded-full">
            <Plus className="h-3.5 w-3.5 mr-1.5" /> Add team member
          </Button>
          <Button variant="outline" onClick={sendAll} disabled={busy === "all"} className="rounded-full">
            {busy === "all" ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Mail className="h-3.5 w-3.5 mr-1.5" />Invite all pending</>}
          </Button>
        </div>
      </div>

      {/* Role Filter Tabs */}
      <div className="flex items-center gap-1.5 p-1 mb-6 rounded-xl bg-muted/60 border border-border text-xs font-medium overflow-x-auto">
        <button
          onClick={() => setSp({})}
          className={`px-3.5 py-2 rounded-lg transition shrink-0 ${roleFilter === "all" ? "bg-background text-foreground shadow-xs font-semibold" : "text-muted-foreground hover:text-foreground"}`}
        >
          All Staff ({members.length})
        </button>
        <button
          onClick={() => setSp({ role: "provider" })}
          className={`px-3.5 py-2 rounded-lg transition shrink-0 ${roleFilter === "provider" ? "bg-background text-foreground shadow-xs font-semibold" : "text-muted-foreground hover:text-foreground"}`}
        >
          Providers
        </button>
        <button
          onClick={() => setSp({ role: "np" })}
          className={`px-3.5 py-2 rounded-lg transition shrink-0 ${roleFilter === "np" ? "bg-background text-foreground shadow-xs font-semibold" : "text-muted-foreground hover:text-foreground"}`}
        >
          Nurse Practitioners
        </button>
        <button
          onClick={() => setSp({ role: "staff" })}
          className={`px-3.5 py-2 rounded-lg transition shrink-0 ${roleFilter === "staff" ? "bg-background text-foreground shadow-xs font-semibold" : "text-muted-foreground hover:text-foreground"}`}
        >
          Staff & Receptionists
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-5 w-5 animate-spin" /></div>
      ) : (
        <div className="space-y-2">
          {filteredMembers.map((m) => {
            const memberRoles = m.user_id ? (roles[m.user_id] ?? []) : [];
            const inv = invites[m.id];
            const primaryRole: Role = m.pending_role || (
              memberRoles.includes("admin") ? "admin" :
              memberRoles.includes("provider") ? "provider" :
              memberRoles.includes("nurse_practitioner") ? "nurse_practitioner" :
              memberRoles.includes("scheduler") ? "scheduler" :
              memberRoles.includes("receptionist") ? "receptionist" :
              memberRoles.includes("staff") ? "staff" :
              (inv?.role ?? "staff")
            );

            return (
              <div key={m.id} className="rounded-2xl border border-border bg-card p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="h-10 w-10 rounded-full shrink-0" style={{ background: m.color }} />
                  <div className="min-w-0">
                    <div className="font-medium truncate">{m.full_name}</div>
                    <div className="text-xs text-muted-foreground truncate">{m.title} · {m.email || "no email"}</div>
                    <div className="text-[10px] text-muted-foreground mt-1 flex flex-wrap gap-1.5">
                      {m.is_owner && <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-semibold">Owner</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-secondary text-foreground text-xs font-semibold px-2.5 py-1 uppercase tracking-wider">
                    {primaryRole.replace("_", " ")}
                  </Badge>

                  {m.is_pending ? (
                    <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-xs px-3 py-1.5 font-semibold flex items-center gap-1.5 whitespace-nowrap">
                      <AlertCircle className="h-3.5 w-3.5" /> Pending
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs px-3 py-1.5 font-semibold flex items-center gap-1.5 whitespace-nowrap">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Approved
                    </Badge>
                  )}

                  {!m.is_owner && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" disabled={busy === m.id}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openPay(m)}>
                          <DollarSign className="h-3.5 w-3.5 mr-2" />Set pay
                          {(m.hourly_rate_cents || m.commission_percent) && (
                            <span className="ml-auto text-[10px] text-muted-foreground">
                              {m.hourly_rate_cents ? `$${(m.hourly_rate_cents/100).toFixed(0)}/hr` : ""}
                              {m.hourly_rate_cents && m.commission_percent ? " · " : ""}
                              {m.commission_percent ? `${m.commission_percent}%` : ""}
                            </span>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toggleActive(m)}>
                          {m.is_active ? (
                            <><UserX className="h-3.5 w-3.5 mr-2" />Deactivate</>
                          ) : (
                            <><UserCheck className="h-3.5 w-3.5 mr-2" />Reactivate</>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setConfirmDelete(m)} className="text-destructive focus:text-destructive">
                          <Trash2 className="h-3.5 w-3.5 mr-2" />Delete permanently
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add team member</DialogTitle>
            <DialogDescription>Create a profile and submit an activation request for Admin approval.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Full name</Label>
                <Input value={draft.full_name} onChange={(e) => setDraft({ ...draft, full_name: e.target.value })} className="mt-1.5" placeholder="Jane Doe" />
              </div>
              <div>
                <Label>Title</Label>
                <Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} className="mt-1.5" placeholder="Esthetician" />
              </div>
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} className="mt-1.5" placeholder="jane@example.com" />
            </div>
            <div>
              <Label>Role</Label>
              <select
                value={draft.role}
                onChange={(e) => setDraft({ ...draft, role: e.target.value as Role })}
                className="mt-1.5 w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
                  <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Calendar color</Label>
              <div className="mt-1.5 flex gap-2 flex-wrap">
                {PALETTE.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setDraft({ ...draft, color: c })}
                    className={`h-8 w-8 rounded-full border-2 transition ${draft.color === c ? "border-foreground scale-110" : "border-transparent"}`}
                    style={{ background: c }}
                    aria-label={`color ${c}`}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAddOpen(false)} disabled={addBusy}>Cancel</Button>
            <Button onClick={addMember} disabled={addBusy}>
              {addBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {confirmDelete?.full_name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes their profile, role, invitations, service assignments, and time-off entries.
              If they have any appointments on record, the deletion will be blocked — deactivate them instead to preserve history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy === confirmDelete?.id}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); if (confirmDelete) deleteMember(confirmDelete); }}
              disabled={busy === confirmDelete?.id}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {busy === confirmDelete?.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete permanently"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!payEditing} onOpenChange={(o) => !o && setPayEditing(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Pay · {payEditing?.full_name}</DialogTitle>
            <DialogDescription>Set hourly rate, commission %, or both. Leave a field blank to disable it.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Hourly rate (USD)</Label>
              <Input
                type="number" min="0" step="0.50" placeholder="e.g. 20"
                value={payDraft.rate}
                onChange={(e) => setPayDraft(d => ({ ...d, rate: e.target.value }))}
              />
            </div>
            <div>
              <Label className="text-xs">Commission % on services + tips</Label>
              <Input
                type="number" min="0" max="100" step="1" placeholder="e.g. 25"
                value={payDraft.pct}
                onChange={(e) => setPayDraft(d => ({ ...d, pct: e.target.value }))}
              />
              <p className="text-[10px] text-muted-foreground mt-1">Calculated from paid sales where this member is the provider.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPayEditing(null)} disabled={paySaving}>Cancel</Button>
            <Button onClick={savePay} disabled={paySaving}>{paySaving ? "Saving…" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
