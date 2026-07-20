import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
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
import { Loader2, Plus, Trash2, Pencil, Building2, Laptop, ShieldCheck, Lock } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

// ─── Vendor (BAA) types ────────────────────────────────────────────────────
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

const emptyVendor = (): Partial<Vendor> => ({
  name: "", category: "", touches_phi: true, baa_required: true, baa_status: "none",
  contact_name: "", contact_email: "", notes: "", baa_signed_at: null, baa_renewal_at: null,
});

// ─── Device Inventory types ────────────────────────────────────────────────
type Device = {
  id: string;
  device_name: string;
  manufacturer: string;
  model: string | null;
  serial_number: string | null;
  assigned_to: string | null;
  location: string | null;
  device_type: string;
  encryption_status: string;
  os_version: string | null;
  purchase_date: string | null;
  warranty_expiry: string | null;
  notes: string | null;
};

const DEVICE_TYPES = ["Workstation", "Laptop", "Tablet", "Smartphone", "Server", "Printer", "Network Device", "Other"] as const;
const ENCRYPTION_STATUSES = ["Encrypted", "Unencrypted", "Pending", "Not Applicable"] as const;

const MANUFACTURERS = [
  "Apple", "Dell", "HP", "Lenovo", "Samsung", "Microsoft", "ASUS", "Acer",
  "LG", "Toshiba", "Panasonic", "Razer", "Google", "Huawei", "Sony", "Other"
] as const;

const ENCRYPT_STYLE: Record<string, string> = {
  Encrypted: "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-200",
  Unencrypted: "bg-red-100 text-red-900 dark:bg-red-900/40 dark:text-red-200",
  Pending: "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200",
  "Not Applicable": "bg-muted text-muted-foreground",
};

const emptyDevice = (): Partial<Device> => ({
  device_name: "", manufacturer: "Apple", model: "", serial_number: "",
  assigned_to: "", location: "", device_type: "Workstation",
  encryption_status: "Encrypted", os_version: "", purchase_date: null,
  warranty_expiry: null, notes: "",
});

// ═══════════════════════════════════════════════════════════════════════════
export default function StaffVendors() {
  usePageMeta({ title: "Vendors & Device Inventory" });
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") === "devices" ? "devices" : "vendors";

  function switchTab(tab: string) {
    setSearchParams(tab === "devices" ? { tab: "devices" } : {});
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6">
      <div className="border-b border-border pb-5">
        <h1 className="font-serif text-3xl">Vendors & Device Inventory</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage BAA-covered vendors and the clinic's IT hardware asset registry.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={switchTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="vendors" className="gap-2">
            <Building2 className="h-4 w-4" /> Vendor Management
          </TabsTrigger>
          <TabsTrigger value="devices" className="gap-2">
            <Laptop className="h-4 w-4" /> Device Inventory
          </TabsTrigger>
        </TabsList>

        <TabsContent value="vendors">
          <VendorTab />
        </TabsContent>
        <TabsContent value="devices">
          <DeviceTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Vendor (BAA) Tab ──────────────────────────────────────────────────────
function VendorTab() {
  const [rows, setRows] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<Vendor>>(emptyVendor());
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    let remoteVendors: Vendor[] = [];
    try {
      const { data, error } = await supabase.from("vendors" as any).select("*").order("name");
      if (!error && data) remoteVendors = (data as any) as Vendor[];
    } catch (e) {}

    const localDemoVendors: Vendor[] = JSON.parse(localStorage.getItem("rka_demo_vendors") || "[]");
    const remoteIds = new Set(remoteVendors.map(x => x.id));
    const uniqueLocal = localDemoVendors.filter(x => !remoteIds.has(x.id));
    setRows([...remoteVendors, ...uniqueLocal]);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openNew() { setForm(emptyVendor()); setOpen(true); }
  function openEdit(v: Vendor) { setForm(v); setOpen(true); }

  async function save() {
    if (!form.name?.trim()) {
      toast({ title: "Name required", variant: "destructive" });
      return;
    }
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

    if (form.id) {
      try { await supabase.from("vendors" as any).update(payload).eq("id", form.id); } catch (e) {}
      const local: Vendor[] = JSON.parse(localStorage.getItem("rka_demo_vendors") || "[]");
      localStorage.setItem("rka_demo_vendors", JSON.stringify(local.map(v => v.id === form.id ? { ...v, ...payload } : v)));
    } else {
      try { await supabase.from("vendors" as any).insert(payload); } catch (e) {}
      const local: Vendor[] = JSON.parse(localStorage.getItem("rka_demo_vendors") || "[]");
      local.push({ id: `vendor-${Date.now()}`, ...payload });
      localStorage.setItem("rka_demo_vendors", JSON.stringify(local));
    }

    setSaving(false);
    setOpen(false);
    toast({ title: "Vendor saved successfully" });
    load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this vendor?")) return;
    try { await supabase.from("vendors" as any).delete().eq("id", id); } catch (e) {}
    const local: Vendor[] = JSON.parse(localStorage.getItem("rka_demo_vendors") || "[]");
    localStorage.setItem("rka_demo_vendors", JSON.stringify(local.filter(v => v.id !== id)));
    toast({ title: "Vendor deleted" });
    load();
  }

  const renewalSoon = (d: string | null) => {
    if (!d) return false;
    const days = (new Date(d).getTime() - Date.now()) / 86400000;
    return days >= 0 && days <= 30;
  };
  const overdue = (d: string | null) => d && new Date(d) < new Date();

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Every vendor that touches PHI must have a signed Business Associate Agreement (45 CFR §164.504(e)).
        </p>
        <Button onClick={openNew} className="rounded-full"><Plus className="h-4 w-4 mr-1.5" /> Add vendor</Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground bg-card">
          No vendors yet — add your first one.
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border">
                <tr>
                  <th className="p-3.5">Vendor Name</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Touches PHI</th>
                  <th className="p-3.5">BAA Status</th>
                  <th className="p-3.5">Signed Date</th>
                  <th className="p-3.5">Renewal Date</th>
                  <th className="p-3.5">Contact</th>
                  <th className="p-3.5 text-right w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((v) => (
                  <tr key={v.id} className="hover:bg-muted/30 transition">
                    <td className="p-3.5 font-medium text-foreground">{v.name}</td>
                    <td className="p-3.5 text-muted-foreground">{v.category || "—"}</td>
                    <td className="p-3.5">
                      {v.touches_phi ? (
                        <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px]">Yes (PHI)</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px]">No</Badge>
                      )}
                    </td>
                    <td className="p-3.5">
                      <Badge className={STATUS_STYLE[v.baa_status] || "bg-muted"} variant="outline">
                        {v.baa_status.replace("_", " ")}
                      </Badge>
                      {!v.baa_required && <div className="text-[10px] text-muted-foreground mt-0.5">not required</div>}
                    </td>
                    <td className="p-3.5 text-muted-foreground">{v.baa_signed_at || "—"}</td>
                    <td className="p-3.5">
                      {v.baa_renewal_at ? (
                        <span className={overdue(v.baa_renewal_at) ? "text-red-600 font-medium" :
                          renewalSoon(v.baa_renewal_at) ? "text-amber-600 font-medium" : "text-muted-foreground"}>
                          {v.baa_renewal_at}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="p-3.5 text-xs text-muted-foreground">
                      {v.contact_name || "—"}
                      {v.contact_email && <div className="text-[11px]">{v.contact_email}</div>}
                    </td>
                    <td className="p-3.5 text-right whitespace-nowrap">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(v)} className="h-8 w-8 rounded-full"><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => remove(v.id)} className="h-8 w-8 rounded-full text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
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
          <DialogHeader><DialogTitle>{form.id ? "Edit Vendor" : "Add New Vendor"}</DialogTitle></DialogHeader>
          <div className="grid gap-3.5 py-2">
            <div>
              <Label>Vendor Name *</Label>
              <Input value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Acuity Scheduling, Mailchimp" className="mt-1" />
            </div>
            <div>
              <Label>Category</Label>
              <Input value={form.category ?? ""} onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="e.g. Scheduling, Email Marketing" className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox checked={!!form.touches_phi} onCheckedChange={(v) => setForm({ ...form, touches_phi: !!v })} />
                Touches PHI
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox checked={!!form.baa_required} onCheckedChange={(v) => setForm({ ...form, baa_required: !!v })} />
                BAA Required
              </label>
            </div>
            <div>
              <Label>BAA Status</Label>
              <Select value={form.baa_status} onValueChange={(v) => setForm({ ...form, baa_status: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Signed Date</Label>
                <Input type="date" value={form.baa_signed_at ?? ""} onChange={(e) => setForm({ ...form, baa_signed_at: e.target.value || null })} className="mt-1" />
              </div>
              <div>
                <Label>Renewal Date</Label>
                <Input type="date" value={form.baa_renewal_at ?? ""} onChange={(e) => setForm({ ...form, baa_renewal_at: e.target.value || null })} className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Contact Name</Label>
                <Input value={form.contact_name ?? ""} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label>Contact Email</Label>
                <Input type="email" value={form.contact_email ?? ""} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} className="mt-1" />
              </div>
            </div>
            <div>
              <Label>Notes & Compliance Details</Label>
              <Textarea rows={3} value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}Save Vendor</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Device Inventory Tab ──────────────────────────────────────────────────
function DeviceTab() {
  const [rows, setRows] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<Device>>(emptyDevice());
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const local: Device[] = JSON.parse(localStorage.getItem("rka_demo_devices") || "[]");
    setRows(local);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openNew() { setForm(emptyDevice()); setOpen(true); }
  function openEdit(d: Device) { setForm(d); setOpen(true); }

  async function save() {
    if (!form.device_name?.trim()) {
      toast({ title: "Device name required", variant: "destructive" });
      return;
    }
    setSaving(true);
    const local: Device[] = JSON.parse(localStorage.getItem("rka_demo_devices") || "[]");

    if (form.id) {
      const updated = local.map(d => d.id === form.id ? { ...d, ...form } as Device : d);
      localStorage.setItem("rka_demo_devices", JSON.stringify(updated));
    } else {
      const newDevice: Device = {
        id: `device-${Date.now()}`,
        device_name: form.device_name!.trim(),
        manufacturer: form.manufacturer || "Other",
        model: form.model || null,
        serial_number: form.serial_number || null,
        assigned_to: form.assigned_to || null,
        location: form.location || null,
        device_type: form.device_type || "Workstation",
        encryption_status: form.encryption_status || "Encrypted",
        os_version: form.os_version || null,
        purchase_date: form.purchase_date || null,
        warranty_expiry: form.warranty_expiry || null,
        notes: form.notes || null,
      };
      local.push(newDevice);
      localStorage.setItem("rka_demo_devices", JSON.stringify(local));
    }

    setSaving(false);
    setOpen(false);
    toast({ title: "Device saved successfully" });
    load();
  }

  function remove(id: string) {
    if (!confirm("Delete this device?")) return;
    const local: Device[] = JSON.parse(localStorage.getItem("rka_demo_devices") || "[]");
    localStorage.setItem("rka_demo_devices", JSON.stringify(local.filter(d => d.id !== id)));
    toast({ title: "Device deleted" });
    load();
  }

  const warrantyExpiringSoon = (d: string | null) => {
    if (!d) return false;
    const days = (new Date(d).getTime() - Date.now()) / 86400000;
    return days >= 0 && days <= 30;
  };
  const warrantyOverdue = (d: string | null) => d && new Date(d) < new Date();

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Track workstations, laptops, tablets, and other clinic IT hardware with encryption status for HIPAA compliance.
        </p>
        <Button onClick={openNew} className="rounded-full"><Plus className="h-4 w-4 mr-1.5" /> Add device</Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground bg-card">
          No devices yet — add your first one.
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border">
                <tr>
                  <th className="p-3.5">Device Name</th>
                  <th className="p-3.5">Manufacturer</th>
                  <th className="p-3.5">Type</th>
                  <th className="p-3.5">Serial #</th>
                  <th className="p-3.5">Assigned To</th>
                  <th className="p-3.5">Encryption</th>
                  <th className="p-3.5">Warranty</th>
                  <th className="p-3.5 text-right w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((d) => (
                  <tr key={d.id} className="hover:bg-muted/30 transition">
                    <td className="p-3.5 font-medium text-foreground">
                      {d.device_name}
                      {d.model && <div className="text-[11px] text-muted-foreground">{d.model}</div>}
                    </td>
                    <td className="p-3.5 text-muted-foreground">{d.manufacturer || "—"}</td>
                    <td className="p-3.5 text-muted-foreground">{d.device_type || "—"}</td>
                    <td className="p-3.5 text-xs font-mono text-muted-foreground">{d.serial_number || "—"}</td>
                    <td className="p-3.5 text-muted-foreground">
                      {d.assigned_to || "—"}
                      {d.location && <div className="text-[11px]">{d.location}</div>}
                    </td>
                    <td className="p-3.5">
                      <Badge className={ENCRYPT_STYLE[d.encryption_status] || "bg-muted"} variant="outline">
                        {d.encryption_status}
                      </Badge>
                    </td>
                    <td className="p-3.5">
                      {d.warranty_expiry ? (
                        <span className={warrantyOverdue(d.warranty_expiry) ? "text-red-600 font-medium text-xs" :
                          warrantyExpiringSoon(d.warranty_expiry) ? "text-amber-600 font-medium text-xs" : "text-muted-foreground text-xs"}>
                          {d.warranty_expiry}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="p-3.5 text-right whitespace-nowrap">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(d)} className="h-8 w-8 rounded-full"><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => remove(d.id)} className="h-8 w-8 rounded-full text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
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
          <DialogHeader><DialogTitle>{form.id ? "Edit Device" : "Add New Device"}</DialogTitle></DialogHeader>
          <div className="grid gap-3.5 py-2">
            <div>
              <Label>Device Name *</Label>
              <Input value={form.device_name ?? ""} onChange={(e) => setForm({ ...form, device_name: e.target.value })}
                placeholder="e.g. Reception MacBook Pro" className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Manufacturer</Label>
                <Select value={form.manufacturer ?? "Apple"} onValueChange={(v) => setForm({ ...form, manufacturer: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MANUFACTURERS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Model</Label>
                <Input value={form.model ?? ""} onChange={(e) => setForm({ ...form, model: e.target.value })}
                  placeholder="e.g. MacBook Pro 14-inch" className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Device Type</Label>
                <Select value={form.device_type ?? "Workstation"} onValueChange={(v) => setForm({ ...form, device_type: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DEVICE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Encryption Status</Label>
                <Select value={form.encryption_status ?? "Encrypted"} onValueChange={(v) => setForm({ ...form, encryption_status: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ENCRYPTION_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Serial Number</Label>
                <Input value={form.serial_number ?? ""} onChange={(e) => setForm({ ...form, serial_number: e.target.value })}
                  placeholder="e.g. C02XG0FNJGH7" className="mt-1" />
              </div>
              <div>
                <Label>OS / Firmware Version</Label>
                <Input value={form.os_version ?? ""} onChange={(e) => setForm({ ...form, os_version: e.target.value })}
                  placeholder="e.g. macOS 14.4" className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Assigned To</Label>
                <Input value={form.assigned_to ?? ""} onChange={(e) => setForm({ ...form, assigned_to: e.target.value })}
                  placeholder="Staff member name" className="mt-1" />
              </div>
              <div>
                <Label>Location</Label>
                <Input value={form.location ?? ""} onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="e.g. Front Desk, Room 2" className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Purchase Date</Label>
                <Input type="date" value={form.purchase_date ?? ""} onChange={(e) => setForm({ ...form, purchase_date: e.target.value || null })} className="mt-1" />
              </div>
              <div>
                <Label>Warranty Expiry</Label>
                <Input type="date" value={form.warranty_expiry ?? ""} onChange={(e) => setForm({ ...form, warranty_expiry: e.target.value || null })} className="mt-1" />
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea rows={2} value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="mt-1"
                placeholder="e.g. Full-disk encryption via FileVault, asset tag #004" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}Save Device</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
