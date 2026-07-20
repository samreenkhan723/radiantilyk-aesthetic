import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Download, FileText, CheckCircle2, Archive, History, Save, Plus, Search } from "lucide-react";
import { toast } from "sonner";

type Policy = {
  id: string;
  slug: string;
  title: string;
  category: string;
  summary: string | null;
  body_markdown: string;
  version: number;
  status: "draft" | "approved" | "archived";
  approved_at: string | null;
  effective_date: string | null;
  review_due_date: string | null;
  updated_at: string;
};

type Version = {
  id: string;
  version: number;
  title: string;
  approved_at: string;
  effective_date: string | null;
  body_markdown: string;
  summary: string | null;
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-amber-100 text-amber-800 border-amber-200",
  approved: "bg-emerald-100 text-emerald-800 border-emerald-200",
  archived: "bg-muted text-muted-foreground",
};

function downloadFile(name: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

function policyToHtml(p: Policy) {
  const bodyHtml = p.body_markdown
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/^# (.*)$/gm, "<h1>$1</h1>")
    .replace(/^## (.*)$/gm, "<h2>$1</h2>")
    .replace(/^### (.*)$/gm, "<h3>$1</h3>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/^- (.*)$/gm, "<li>$1</li>")
    .replace(/(<li>[\s\S]*?<\/li>)/g, "<ul>$1</ul>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/^(?!<h|<ul|<li|<p)(.+)$/gm, "<p>$1</p>");
  return `<!doctype html><html><head><meta charset="utf-8"><title>${p.title}</title>
<style>body{font-family:Georgia,serif;max-width:780px;margin:40px auto;padding:0 24px;color:#111;line-height:1.55}
h1{border-bottom:2px solid #333;padding-bottom:8px} h2{margin-top:28px;color:#333}
.meta{background:#f5f5f5;padding:12px 16px;border-radius:6px;font-size:13px;color:#555;margin-bottom:24px}
code{background:#f0f0f0;padding:1px 5px;border-radius:3px;font-size:0.92em}
@media print{body{margin:0}}</style></head><body>
<div class="meta"><strong>${p.title}</strong> — Version ${p.version} • Status: ${p.status.toUpperCase()}
${p.effective_date ? ` • Effective ${p.effective_date}` : ""}
${p.approved_at ? ` • Approved ${new Date(p.approved_at).toLocaleDateString()}` : ""}
<br/>Radiantilyk Aesthetic • HIPAA Policy & Procedure</div>
${bodyHtml}
</body></html>`;
}

export default function StaffHipaaPolicies() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Policy | null>(null);
  const [versions, setVersions] = useState<Version[]>([]);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showHistory, setShowHistory] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("hipaa_policies" as any).select("*").order("category").order("title");
    if (error) toast.error(error.message);
    setPolicies((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!selectedId) { setDraft(null); setVersions([]); return; }
    const p = policies.find((x) => x.id === selectedId);
    if (p) setDraft({ ...p });
    supabase.from("hipaa_policy_versions" as any)
      .select("*").eq("policy_id", selectedId).order("version", { ascending: false })
      .then(({ data }) => setVersions((data as any) || []));
  }, [selectedId, policies]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return policies.filter((p) =>
      (filterStatus === "all" || p.status === filterStatus) &&
      (!q || p.title.toLowerCase().includes(q) || p.category.toLowerCase().includes(q) || (p.summary || "").toLowerCase().includes(q))
    );
  }, [policies, search, filterStatus]);

  const grouped = useMemo(() => {
    const g: Record<string, Policy[]> = {};
    filtered.forEach((p) => { (g[p.category] ||= []).push(p); });
    return g;
  }, [filtered]);

  const save = async () => {
    if (!draft) return;
    setSaving(true);
    const { error } = await supabase.from("hipaa_policies" as any).update({
      title: draft.title, category: draft.category, summary: draft.summary,
      body_markdown: draft.body_markdown, effective_date: draft.effective_date,
      review_due_date: draft.review_due_date,
    }).eq("id", draft.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Saved");
    load();
  };

  const approve = async () => {
    if (!draft) return;
    if (!confirm(`Approve "${draft.title}" as version ${draft.version + 1}? An immutable snapshot will be recorded.`)) return;
    setSaving(true);
    const user = (await supabase.auth.getUser()).data.user;
    const newVersion = draft.version + 1;
    const { error: uErr } = await supabase.from("hipaa_policies" as any).update({
      title: draft.title, summary: draft.summary, body_markdown: draft.body_markdown,
      category: draft.category, effective_date: draft.effective_date, review_due_date: draft.review_due_date,
      version: newVersion, status: "approved", approved_by: user?.id, approved_at: new Date().toISOString(),
    }).eq("id", draft.id);
    if (uErr) { setSaving(false); return toast.error(uErr.message); }
    const { error: vErr } = await supabase.from("hipaa_policy_versions" as any).insert({
      policy_id: draft.id, version: newVersion, title: draft.title, summary: draft.summary,
      body_markdown: draft.body_markdown, effective_date: draft.effective_date, approved_by: user?.id,
    });
    setSaving(false);
    if (vErr) return toast.error(vErr.message);
    toast.success(`Approved as v${newVersion}`);
    load();
  };

  const archive = async () => {
    if (!draft || !confirm("Archive this policy?")) return;
    const { error } = await supabase.from("hipaa_policies" as any).update({ status: "archived" }).eq("id", draft.id);
    if (error) return toast.error(error.message);
    toast.success("Archived");
    load();
  };

  const reactivate = async () => {
    if (!draft) return;
    const { error } = await supabase.from("hipaa_policies" as any).update({ status: "draft" }).eq("id", draft.id);
    if (error) return toast.error(error.message);
    toast.success("Moved back to draft");
    load();
  };

  const createNew = async () => {
    const title = prompt("New policy title:");
    if (!title) return;
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + Date.now().toString(36);
    const { data, error } = await supabase.from("hipaa_policies" as any).insert({
      slug, title, category: "Custom", body_markdown: `# ${title}\n\n## 1. Purpose\n\n## 2. Scope\n\n## 3. Policy\n\n## 4. Procedures\n`,
    }).select().single();
    if (error) return toast.error(error.message);
    await load();
    setSelectedId((data as any).id);
  };

  const downloadCurrent = (format: "md" | "html") => {
    if (!draft) return;
    if (format === "md") downloadFile(`${draft.slug}-v${draft.version}.md`, draft.body_markdown, "text/markdown");
    else downloadFile(`${draft.slug}-v${draft.version}.html`, policyToHtml(draft), "text/html");
  };

  const downloadAll = async () => {
    const approved = policies.filter((p) => p.status === "approved");
    if (approved.length === 0) return toast.info("No approved policies yet.");
    const combined = approved.map((p) => `\n\n---\n\n${p.body_markdown}\n\n_Version ${p.version} • Effective ${p.effective_date || "—"}_`).join("\n");
    downloadFile(`hipaa-policies-approved-${new Date().toISOString().slice(0,10)}.md`,
      `# Radiantilyk Aesthetic — HIPAA Policies & Procedures\n\nExported ${new Date().toLocaleString()}\n${combined}`,
      "text/markdown");
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6">
      <header className="mb-4 flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl">HIPAA Policies & Procedures</h1>
          <p className="text-sm text-muted-foreground mt-1">Review, edit, approve, and download policy templates. Approved versions are snapshotted for audit.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={downloadAll}><Download className="h-4 w-4 mr-1.5" />Export all approved</Button>
          <Button size="sm" onClick={createNew}><Plus className="h-4 w-4 mr-1.5" />New policy</Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
        <Card className="p-3">
          <div className="flex gap-2 mb-3">
            <div className="relative flex-1">
              <Search className="h-4 w-4 absolute left-2 top-2.5 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" className="pl-8 h-9" />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-28 h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {loading ? (
            <div className="py-8 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="space-y-4 max-h-[70vh] overflow-y-auto">
              {Object.entries(grouped).map(([cat, items]) => (
                <div key={cat}>
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-1 mb-1">{cat}</div>
                  <div className="space-y-1">
                    {items.map((p) => (
                      <button key={p.id} onClick={() => setSelectedId(p.id)}
                        className={`w-full text-left rounded-md px-2 py-2 border transition ${selectedId === p.id ? "bg-accent border-primary/40" : "border-transparent hover:bg-accent"}`}>
                        <div className="flex items-start gap-2">
                          <FileText className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium truncate">{p.title}</div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${STATUS_COLORS[p.status]}`}>{p.status}</Badge>
                              <span className="text-[10px] text-muted-foreground">v{p.version}</span>
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {filtered.length === 0 && <div className="text-sm text-muted-foreground text-center py-6">No policies match.</div>}
            </div>
          )}
        </Card>

        <Card className="p-4 md:p-5">
          {!draft ? (
            <div className="text-sm text-muted-foreground text-center py-16">Select a policy to review or edit.</div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                    className="text-lg font-serif border-0 px-0 h-auto shadow-none focus-visible:ring-0" />
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <Badge variant="outline" className={STATUS_COLORS[draft.status]}>{draft.status}</Badge>
                    <span className="text-xs text-muted-foreground">Version {draft.version}</span>
                    {draft.approved_at && <span className="text-xs text-muted-foreground">Approved {new Date(draft.approved_at).toLocaleDateString()}</span>}
                    <Input type="text" value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                      className="h-6 w-32 text-xs" placeholder="Category" />
                  </div>
                </div>
                <div className="flex gap-1 flex-wrap">
                  <Button variant="outline" size="sm" onClick={() => setShowHistory(!showHistory)}><History className="h-4 w-4 mr-1" />History ({versions.length})</Button>
                  <Button variant="outline" size="sm" onClick={() => downloadCurrent("md")}><Download className="h-4 w-4 mr-1" />.md</Button>
                  <Button variant="outline" size="sm" onClick={() => downloadCurrent("html")}><Download className="h-4 w-4 mr-1" />.html</Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Summary</label>
                  <Input value={draft.summary || ""} onChange={(e) => setDraft({ ...draft, summary: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Effective date</label>
                  <Input type="date" value={draft.effective_date || ""} onChange={(e) => setDraft({ ...draft, effective_date: e.target.value || null })} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Review due</label>
                  <Input type="date" value={draft.review_due_date || ""} onChange={(e) => setDraft({ ...draft, review_due_date: e.target.value || null })} />
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground">Body (Markdown)</label>
                <Textarea value={draft.body_markdown} onChange={(e) => setDraft({ ...draft, body_markdown: e.target.value })}
                  className="font-mono text-sm min-h-[420px]" />
              </div>

              <div className="flex flex-wrap gap-2 pt-2 border-t">
                <Button onClick={save} disabled={saving}><Save className="h-4 w-4 mr-1.5" />Save draft</Button>
                <Button onClick={approve} disabled={saving} variant="default" className="bg-emerald-600 hover:bg-emerald-700">
                  <CheckCircle2 className="h-4 w-4 mr-1.5" />Approve as v{draft.version + 1}
                </Button>
                {draft.status !== "archived" ? (
                  <Button onClick={archive} variant="outline"><Archive className="h-4 w-4 mr-1.5" />Archive</Button>
                ) : (
                  <Button onClick={reactivate} variant="outline">Reactivate</Button>
                )}
              </div>

              {showHistory && (
                <div className="pt-3 border-t">
                  <div className="text-sm font-medium mb-2">Approved versions</div>
                  {versions.length === 0 ? (
                    <div className="text-xs text-muted-foreground">No approved versions yet.</div>
                  ) : (
                    <div className="space-y-2">
                      {versions.map((v) => (
                        <div key={v.id} className="rounded-md border p-2 text-xs flex items-center justify-between gap-2">
                          <div>
                            <div className="font-medium">v{v.version} — {v.title}</div>
                            <div className="text-muted-foreground">Approved {new Date(v.approved_at).toLocaleString()}{v.effective_date ? ` • Effective ${v.effective_date}` : ""}</div>
                          </div>
                          <div className="flex gap-1">
                            <Button variant="outline" size="sm" onClick={() => downloadFile(`${draft.slug}-v${v.version}.md`, v.body_markdown, "text/markdown")}>
                              <Download className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
