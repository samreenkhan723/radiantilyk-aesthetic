import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Loader2, Mail, CheckCircle2, Plus, MoreHorizontal, UserX, UserCheck, Trash2, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Member {
  id: string; full_name: string; title: string; email: string | null;
  user_id: string | null; is_active: boolean; is_owner: boolean; color: string;
  hourly_rate_cents: number | null; commission_percent: number | null;
}

type Role = "admin" | "scheduler" | "receptionist" | "nurse_practitioner" | "staff";
const ROLE_LABELS: Record<Role, string> = {
  admin: "Admin (full access)",
  scheduler: "Scheduler (manage all bookings)",
  receptionist: "Front Desk Receptionist (book, check in, schedule)",
  nurse_practitioner: "Nurse Practitioner (GFE + clinical co-sign)",
  staff: "Staff (own bookings only)",
};

const PALETTE = ["#c97c5d", "#7c9dd1", "#a8c084", "#d4a3c4", "#e8b94b", "#8b7ec4", "#d97c7c", "#5db8a8"];

export default function StaffTeam() {
  const { isAdmin } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [roles, setRoles] = useState<Record<string, Role[]>>({});
  const [invites, setInvites] = useState<Record<string, { sent: string; accepted: string | null; role: Role }>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [addBusy, setAddBusy] = useState(false);
  const [draft, setDraft] = useState({ full_name: "", title: "", email: "", color: PALETTE[0], role: "staff" as Role, sendInvite: true });

  const load = async () => {
    setLoading(true);
    const { data: m } = await supabase.from("staff_profiles").select("id, user_id, full_name, title, email, bio, color, is_owner, is_active, created_at, updated_at, calendar_email, phone, license_number" as any).order("is_owner", { ascending: false }).order("created_at");
    const { data: pay } = await (supabase as any).from("staff_pay_config").select("staff_id, hourly_rate_cents, commission_percent");
    const payMap: Record<string, { hourly_rate_cents: number | null; commission_percent: number | null }> = {};
    (pay ?? []).forEach((p: any) => { payMap[p.staff_id] = { hourly_rate_cents: p.hourly_rate_cents, commission_percent: p.commission_percent }; });
    setMembers((m ?? []).map((row: any) => ({
      ...row,
      hourly_rate_cents: payMap[row.id]?.hourly_rate_cents ?? null,
      commission_percent: payMap[row.id]?.commission_percent ?? null,
    })) as Member[]);
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
    const { data: created, error } = await supabase.from("staff_profiles").insert({
      full_name: draft.full_name.trim(),
      title: draft.title.trim(),
      email: draft.email.trim().toLowerCase(),
      color: draft.color,
      is_active: true,
      is_owner: false,
    }).select().single();
    if (error || !created) {
      setAddBusy(false);
      toast.error(error?.message ?? "Could not add team member"); return;
    }
    if (draft.sendInvite) {
      const { error: invErr } = await supabase.functions.invoke("staff-invite-send", {
        body: { staffId: created.id, role: draft.role },
      });
      if (invErr) toast.error(`Member added, but invite failed: ${invErr.message}`);
      else toast.success(`Added ${draft.full_name} and sent activation invite`);
    } else {
      toast.success(`Added ${draft.full_name}`);
    }
    setAddBusy(false);
    setAddOpen(false);
    setDraft({ full_name: "", title: "", email: "", color: PALETTE[0], role: "staff", sendInvite: true });
    load();
  };

  const updateRole = async (m: Member, newRole: Role) => {
    if (!m.user_id) return;
    setBusy(m.id);
    // Wipe existing roles, insert new (+ staff for admin/scheduler)
    const { error: delErr } = await supabase.from("user_roles").delete().eq("user_id", m.user_id);
    if (delErr) { setBusy(null); toast.error(delErr.message); return; }
    const toInsert: { user_id: string; role: Role }[] = [{ user_id: m.user_id, role: newRole }];
    if (newRole === "admin" || newRole === "scheduler" || newRole === "receptionist" || newRole === "nurse_practitioner") toInsert.push({ user_id: m.user_id, role: "staff" });
    const { error: insErr } = await supabase.from("user_roles").insert(toInsert);
    setBusy(null);
    if (insErr) { toast.error(insErr.message); return; }
    toast.success(`Role updated to ${newRole}`);
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
      updated_by: (await supabase.auth.getUser()).data.user?.id ?? null,
    }, { onConflict: "staff_id" });
    setPaySaving(false);
    if (error) return toast.error(error.message);
    toast.success("Pay updated");
    setPayEditing(null);
    load();
  };

  const toggleActive = async (m: Member) => {
    setBusy(m.id);
    const { error } = await supabase.from("staff_profiles").update({ is_active: !m.is_active }).eq("id", m.id);
    setBusy(null);
    if (error) { toast.error(error.message); return; }
    toast.success(m.is_active ? `${m.full_name} deactivated` : `${m.full_name} reactivated`);
    load();
  };

  const deleteMember = async (m: Member) => {
    setBusy(m.id);
    const { count, error: cErr } = await supabase
      .from("appointments").select("id", { count: "exact", head: true }).eq("staff_id", m.id);
    if (cErr) { setBusy(null); toast.error(cErr.message); return; }
    if ((count ?? 0) > 0) {
      setBusy(null);
      setConfirmDelete(null);
      toast.error(`${m.full_name} has ${count} appointment(s) on record. Deactivate instead to preserve history.`);
      return;
    }
    if (m.user_id) await supabase.from("user_roles").delete().eq("user_id", m.user_id);
    await supabase.from("staff_invitations").delete().eq("staff_id", m.id);
    await supabase.from("service_providers").delete().eq("staff_id", m.id);
    await supabase.from("schedule_overrides").delete().eq("staff_id", m.id);
    const { error } = await supabase.from("staff_profiles").delete().eq("id", m.id);
    setBusy(null);
    setConfirmDelete(null);
    if (error) { toast.error(error.message); return; }
    toast.success(`${m.full_name} deleted`);
    load();
  };

  if (!isAdmin) return <div className="p-8 text-sm text-muted-foreground">Admins only.</div>;

  return (
    <div className="p-4 sm:p-8 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="font-serif text-3xl">Team</h1>
          <p className="text-xs text-muted-foreground mt-1">Add members, assign roles, and send activation emails.</p>
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

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-5 w-5 animate-spin" /></div>
      ) : (
        <div className="space-y-2">
          {members.map((m) => {
            const memberRoles = m.user_id ? (roles[m.user_id] ?? []) : [];
            const inv = invites[m.id];
            const primaryRole: Role =
              memberRoles.includes("admin") ? "admin" :
              memberRoles.includes("scheduler") ? "scheduler" :
              memberRoles.includes("receptionist") ? "receptionist" :
              memberRoles.includes("nurse_practitioner") ? "nurse_practitioner" :
              memberRoles.includes("staff") ? "staff" :
              (inv?.role ?? "staff");

            return (
              <div key={m.id} className="rounded-2xl border border-border bg-card p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="h-10 w-10 rounded-full shrink-0" style={{ background: m.color }} />
                  <div className="min-w-0">
                    <div className="font-medium truncate">{m.full_name}</div>
                    <div className="text-xs text-muted-foreground truncate">{m.title} · {m.email || "no email"}</div>
                    <div className="text-[10px] text-muted-foreground mt-1 flex flex-wrap gap-1.5">
                      {m.is_owner && <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary">Owner</span>}
                      {!m.user_id && inv && <span className="px-1.5 py-0.5 rounded bg-secondary">Invited as {inv.role}</span>}
                      {!m.user_id && !inv && <span className="px-1.5 py-0.5 rounded bg-secondary">Not yet invited</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={primaryRole}
                    disabled={!m.user_id || busy === m.id || m.is_owner}
                    onChange={(e) => updateRole(m, e.target.value as Role)}
                    className="h-9 rounded-md border border-input bg-background px-2 text-xs"
                    title={m.is_owner ? "Owner role can't be changed here" : !m.user_id ? "Member must activate first" : "Change role"}
                  >
                    <option value="staff">Staff</option>
                    <option value="receptionist">Front Desk Receptionist</option>
                    <option value="nurse_practitioner">Nurse Practitioner</option>
                    <option value="scheduler">Scheduler</option>
                    <option value="admin">Admin</option>
                  </select>

                  {m.user_id ? (
                    <span className="inline-flex items-center text-xs text-success-soft-foreground whitespace-nowrap"><CheckCircle2 className="h-3.5 w-3.5 mr-1" />Activated</span>
                  ) : inv ? (
                    <div className="text-right">
                      <div className="text-[10px] text-muted-foreground">Sent {format(new Date(inv.sent), "MMM d")}</div>
                      <Button onClick={() => sendInvite(m, primaryRole)} disabled={busy === m.id} size="sm" variant="outline" className="rounded-full mt-1 text-xs">
                        {busy === m.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Resend"}
                      </Button>
                    </div>
                  ) : (
                    <Button onClick={() => sendInvite(m, primaryRole)} disabled={busy === m.id || !m.email} size="sm" className="rounded-full">
                      {busy === m.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Mail className="h-3 w-3 mr-1" />Send invite</>}
                    </Button>
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
            <DialogDescription>Create a profile and (optionally) send them an activation email to sign in.</DialogDescription>
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
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={draft.sendInvite}
                onChange={(e) => setDraft({ ...draft, sendInvite: e.target.checked })}
              />
              Send activation email now
            </label>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAddOpen(false)} disabled={addBusy}>Cancel</Button>
            <Button onClick={addMember} disabled={addBusy}>
              {addBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add member"}
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
