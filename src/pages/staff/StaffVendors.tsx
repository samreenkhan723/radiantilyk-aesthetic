import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, Pencil } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";

type Vendor = {
  id: string;
  name: string;
  category: string | null;
  touches_phi: boolean;
  baa_required: boolean;
  baa_status: string;
  baa_signed_at: string | null;
  baa_renewal_at: string | null;
  contact_name: string | null;
  contact_email: string | null;
  notes: string | null;
};

const STATUSES = ["none", "requested", "signed", "declined", "expired", "not_applicable"] as const;

const STATUS_STYLE: Record<string, string> = {
  none: "bg-muted text-muted-foreground",
  requested: "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200",
  signed: "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-200",
  declined: "bg-red-100 text-red-900 dark:bg-red-900/40 dark:text-red-200",
  expired: "bg-red-100 text-red-900 dark:bg-red-900/40 dark:text-red-200",
  not_applicable: "bg-muted text-muted-foreground",
};

const empty = (): Partial<Vendor> => ({
  name: "", category: "", touches_phi: true, baa_required: true, baa_status: "none",
  contact_name: "", contact_email: "", notes: "", baa_signed_at: null, baa_renewal_at: null,
});

export default function StaffVendors() {
  usePageMeta({ title: "Vendors & BAAs" });
  const [rows, setRows] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<Vendor>>(empty());
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase.from("vendors" as any).select("*").order("name");
    if (error) toast({ title: "Load failed", description: error.message, variant: "destructive" });
    setRows(((data as any) ?? []) as Vendor[]);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function openNew() { setForm(empty()); setOpen(true); }
  function openEdit(v: Vendor) { setForm(v); setOpen(true); }

  async function save() {
    if (!form.name?.trim()) { toast({ title: "Name required", variant: "destructive" }); return; }
    setSaving(true);
    const payload: any = {
      name: form.name!.trim(),
      category: form.category || null,
      touches_phi: !!form.touches_phi,
      baa_required: !!form.baa_required,
      baa_status: form.baa_status || "none",
      baa_signed_at: form.baa_signed_at || null,
      baa_renewal_at: form.baa_renewal_at || null,
      contact_name: form.contact_name || null,
      contact_email: form.contact_email || null,
      notes: form.notes || null,
    };
    const q = form.id
      ? supabase.from("vendors" as any).update(payload).eq("id", form.id)
      : supabase.from("vendors" as any).insert(payload);
    const { error } = await q;
    setSaving(false);
    if (error) { toast({ title: "Save failed", description: error.message, variant: "destructive" }); return; }
    setOpen(false);
    load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this vendor?")) return;
    const { error } = await supabase.from("vendors" as any).delete().eq("id", id);
    if (error) { toast({ title: "Delete failed", description: error.message, variant: "destructive" }); return; }
    load();
  }

  const renewalSoon = (d: string | null) => {
    if (!d) return false;
    const days = (new Date(d).getTime() - Date.now()) / 86400000;
    return days >= 0 && days <= 30;
  };
  const overdue = (d: string | null) => d && new Date(d) < new Date();

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl">Vendors & BAAs</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Every vendor that touches PHI must have a signed Business Associate Agreement (45 CFR §164.504(e)).
          </p>
        </div>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-1" /> Add vendor</Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">
          No vendors yet — add your first one.
        </div>
      ) : (
        <div className="rounded-2xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="p-3">Vendor</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">PHI</th>
                  <th className="p-3">BAA</th>
                  <th className="p-3">Signed</th>
                  <th className="p-3">Renewal</th>
                  <th className="p-3">Contact</th>
                  <th className="p-3 w-24"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((v) => (
                  <tr key={v.id} className="border-t hover:bg-muted/30">
                    <td className="p-3 font-medium">{v.name}</td>
                    <td className="p-3 text-muted-foreground">{v.category || "—"}</td>
                    <td className="p-3">{v.touches_phi ? "Yes" : "No"}</td>
                    <td className="p-3">
                      <Badge className={STATUS_STYLE[v.baa_status] || "bg-muted"} variant="outline">
                        {v.baa_status.replace("_", " ")}
                      </Badge>
                      {!v.baa_required && <div className="text-xs text-muted-foreground mt-1">not required</div>}
                    </td>
                    <td className="p-3 text-muted-foreground">{v.baa_signed_at || "—"}</td>
                    <td className="p-3">
                      {v.baa_renewal_at ? (
                        <span className={overdue(v.baa_renewal_at) ? "text-red-600 font-medium" :
                          renewalSoon(v.baa_renewal_at) ? "text-amber-600 font-medium" : "text-muted-foreground"}>
                          {v.baa_renewal_at}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="p-3 text-xs text-muted-foreground">
                      {v.contact_name || "—"}
                      {v.contact_email && <div>{v.contact_email}</div>}
                    </td>
                    <td className="p-3 text-right whitespace-nowrap">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(v)}><Pencil className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => remove(v.id)}><Trash2 className="h-4 w-4" /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{form.id ? "Edit vendor" : "New vendor"}</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label>Name *</Label>
              <Input value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label>Category</Label>
              <Input value={form.category ?? ""} onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="e.g. Transactional email" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={!!form.touches_phi} onCheckedChange={(v) => setForm({ ...form, touches_phi: !!v })} />
                Touches PHI
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={!!form.baa_required} onCheckedChange={(v) => setForm({ ...form, baa_required: !!v })} />
                BAA required
              </label>
            </div>
            <div>
              <Label>BAA status</Label>
              <Select value={form.baa_status} onValueChange={(v) => setForm({ ...form, baa_status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Signed date</Label>
                <Input type="date" value={form.baa_signed_at ?? ""} onChange={(e) => setForm({ ...form, baa_signed_at: e.target.value || null })} />
              </div>
              <div>
                <Label>Renewal date</Label>
                <Input type="date" value={form.baa_renewal_at ?? ""} onChange={(e) => setForm({ ...form, baa_renewal_at: e.target.value || null })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Contact name</Label>
                <Input value={form.contact_name ?? ""} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} />
              </div>
              <div>
                <Label>Contact email</Label>
                <Input type="email" value={form.contact_email ?? ""} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea rows={3} value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
