import { confirmDialog, alertDialog } from "@/components/ui/confirm";
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Calendar, MapPin, FileText, LogOut, Plus, FileCheck2, AlertCircle, Pencil, MessageSquare, Camera } from "lucide-react";
import { SmsThread } from "@/components/messaging/SmsThread";
import { MyTreatmentPlansCard } from "@/components/MyTreatmentPlansCard";
import MyReceiptsCard from "@/components/MyReceiptsCard";
import { MyChartTimelineCard } from "@/components/MyChartTimelineCard";
import { PreOpCountdownCard } from "@/components/PreOpCountdownCard";
import { PostOpCheckInsCard } from "@/components/PostOpCheckInsCard";
import { PromSurveysCard } from "@/components/PromSurveysCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { toast } from "sonner";
import { ClientAvatar } from "@/components/ClientAvatar";
import {
  CANCELLATION_NOTICE_HOURS, CLINIC_PHONE_DISPLAY, CLINIC_PHONE_TEL, WITHIN_WINDOW_WARNING,
} from "@/lib/cancellationPolicy";

const TABS = ["appointments", "messages", "forms", "photos", "profile"] as const;
type TabKey = typeof TABS[number];

interface Appt {
  id: string;
  start_at: string;
  end_at: string;
  status: string;
  client_first_name: string;
  client_last_name: string;
  client_email: string;
  client_phone: string;
  service_id: string;
  staff_id: string;
  location_id: string;
  consent_pdf_url: string | null;
}

export default function ClientAccount() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [appts, setAppts] = useState<Appt[]>([]);
  const [services, setServices] = useState<Record<string, string>>({});
  const [staff, setStaff] = useState<Record<string, { name: string; title: string }>>({});
  const [locations, setLocations] = useState<Record<string, { name: string; city: string }>>({});

  const tabParam = (searchParams.get("tab") ?? "appointments") as TabKey;
  const activeTab: TabKey = (TABS as readonly string[]).includes(tabParam) ? tabParam : "appointments";
  const onTabChange = (v: string) => {
    const next = new URLSearchParams(searchParams);
    if (v === "appointments") next.delete("tab"); else next.set("tab", v);
    setSearchParams(next, { replace: true });
  };

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/account/auth"); return; }
      setUser(session.user);

      const [{ data: prof }, { data: ap }, { data: sv }, { data: st }, { data: loc }] = await Promise.all([
        supabase.from("client_profiles").select("*").eq("user_id", session.user.id).maybeSingle(),
        supabase.from("appointments").select("*").order("start_at", { ascending: false }),
        supabase.from("services").select("id, name"),
        supabase.from("staff_directory" as any).select("id, full_name, title"),
        supabase.from("locations").select("id, name, city"),
      ]);

      // If no profile yet, create one from auth metadata
      if (!prof && session.user.email) {
        const md = session.user.user_metadata ?? {};
        const { data: created } = await supabase.from("client_profiles").insert({
          user_id: session.user.id,
          email: session.user.email,
          first_name: md.first_name ?? "",
          last_name: md.last_name ?? "",
          phone: md.phone ?? null,
        }).select().single();
        setProfile(created);
      } else {
        setProfile(prof);
      }

      setAppts((ap ?? []) as Appt[]);
      setServices(Object.fromEntries((sv ?? []).map((s: any) => [s.id, s.name])));
      setStaff(Object.fromEntries((st ?? []).map((s: any) => [s.id, { name: s.full_name, title: s.title }])));
      setLocations(Object.fromEntries((loc ?? []).map((l: any) => [l.id, { name: l.name, city: l.city }])));
      setLoading(false);
    })();
  }, [navigate]);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const cancel = async (id: string) => {
    try {
      const appt = appts.find(a => a.id === id);
      if (!appt) return;
      const hoursUntil = (new Date(appt.start_at).getTime() - Date.now()) / 3600000;
      if (hoursUntil < 48) {
        const ok = await confirmDialog({
          title: "Cancel this appointment?",
          description: WITHIN_WINDOW_WARNING,
          confirmLabel: "Cancel anyway",
          cancelLabel: "Keep appointment",
          destructive: true,
        });
        if (!ok) return;
      } else {
        if (!(await confirmDialog({ title: "Cancel this appointment?", confirmLabel: "Cancel appointment", cancelLabel: "Keep it" }))) return;
      }
      const t = toast.loading("Cancelling appointment…");
      const { error } = await supabase
        .from("appointments")
        .update({ status: "cancelled" })
        .eq("id", id);
      toast.dismiss(t);
      if (error) {
        toast.error(error.message || "Could not cancel appointment");
        await alertDialog({
          title: "Couldn't cancel",
          description: error.message || "Please try again or call us.",
        });
        return;
      }
      setAppts(prev => prev.map(a => a.id === id ? { ...a, status: "cancelled" } : a));
      toast.success("Appointment cancelled");
      // Fire-and-forget side effects — never let them blank the page
      supabase.functions.invoke("google-calendar-sync", {
        body: { appointmentId: id, action: "delete" },
      }).catch(() => {});
      supabase.functions.invoke("notify-cancellation", {
        body: { appointmentId: id, cancelledBy: "client" },
      }).catch(() => {});
      if (appt?.client_email) {
        supabase.functions.invoke("ghl-sync-contact", {
          body: { email: appt.client_email, tags: ["rkabook", "appointment-cancelled"] },
        }).catch(() => {});
      }
      await alertDialog({
        title: "Appointment cancelled",
        description: "You'll get a confirmation email shortly. We hope to see you again soon.",
        okLabel: "Done",
      });
      navigate("/");
    } catch (e: any) {
      console.error("cancel appointment failed", e);
      toast.error(e?.message || "Something went wrong. Please try again.");
      await alertDialog({
        title: "Couldn't cancel",
        description: e?.message || "Please try again or call us.",
      });
    }
  };

  const reschedule = (a: Appt) => {
    const params = new URLSearchParams({
      service: a.service_id,
      location: a.location_id,
      staff: a.staff_id,
      reschedule: a.id,
    });
    navigate(`/book?${params.toString()}`);
  };

  const rebook = (a: Appt) => {
    const params = new URLSearchParams({
      service: a.service_id,
      location: a.location_id,
      staff: a.staff_id,
    });
    navigate(`/book?${params.toString()}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const now = Date.now();
  const upcoming = appts.filter(a => new Date(a.start_at).getTime() >= now && !["cancelled", "denied", "no_show"].includes(a.status));
  const past = appts.filter(a => new Date(a.start_at).getTime() < now || ["cancelled", "denied", "no_show", "completed"].includes(a.status));

  const favoriteService = (() => {
    if (upcoming.length > 0) return null;
    const counts = new Map<string, { service_id: string; staff_id: string; location_id: string; count: number; last: number }>();
    for (const a of past) {
      if (["cancelled", "denied"].includes(a.status)) continue;
      const t = new Date(a.start_at).getTime();
      const e = counts.get(a.service_id);
      if (e) { e.count++; e.last = Math.max(e.last, t); }
      else counts.set(a.service_id, { service_id: a.service_id, staff_id: a.staff_id, location_id: a.location_id, count: 1, last: t });
    }
    return [...counts.values()].sort((a, b) => b.count - a.count || b.last - a.last)[0] ?? null;
  })();

  const isVerified = !!user?.email_confirmed_at;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />
      <main className="flex-1 container mx-auto px-4 py-8 md:py-12 max-w-4xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-center gap-4 min-w-0">
            <ClientAvatar
              clientEmail={user?.email ?? ""}
              avatarPath={(profile as any)?.avatar_path ?? null}
              editable
              size={72}
              fallbackInitials={(profile?.first_name?.[0] ?? user?.email?.[0] ?? "") + (profile?.last_name?.[0] ?? "")}
              onChange={(path) => setProfile((p: any) => ({ ...(p ?? {}), avatar_path: path }))}
            />
            <div className="min-w-0">
              <h1 className="font-serif text-3xl md:text-4xl truncate">
                {profile?.first_name ? `Hello, ${profile.first_name}` : "Your account"}
              </h1>
              <p className="text-sm text-muted-foreground mt-1 truncate">{user?.email}</p>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Link to="/book">
              <Button className="rounded-full"><Plus className="h-4 w-4 mr-1" /> Book</Button>
            </Link>
            <Button variant="outline" className="rounded-full" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-1" /> Sign out
            </Button>
          </div>
        </div>


        {!isVerified && (
          <div className="rounded-xl border border-warning/30 bg-warning/10 p-4 text-sm mb-6">
            Please verify your email. Past appointments will appear here once your email is confirmed.
          </div>
        )}

        {favoriteService && services[favoriteService.service_id] && (
          <Link
            to={`/book?service=${favoriteService.service_id}&location=${favoriteService.location_id}&staff=${favoriteService.staff_id}`}
            className="block rounded-2xl border border-primary/30 bg-primary/5 p-5 mb-8 hover:bg-primary/10 transition"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-1">Book again</div>
                <div className="font-serif text-lg truncate">{services[favoriteService.service_id]}</div>
                <div className="text-xs text-muted-foreground mt-0.5 truncate">
                  {staff[favoriteService.staff_id]?.name && `with ${staff[favoriteService.staff_id].name}`}
                  {locations[favoriteService.location_id] && ` · ${locations[favoriteService.location_id].name}`}
                </div>
              </div>
              <Button size="sm" className="rounded-full shrink-0">Book</Button>
            </div>
          </Link>
        )}

        <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-3 sm:grid-cols-5 mb-6 h-auto sm:h-10 gap-1 sm:gap-0">
            <TabsTrigger value="appointments" className="text-xs sm:text-sm">Appointments</TabsTrigger>
            <TabsTrigger value="messages" className="text-xs sm:text-sm"><MessageSquare className="h-3.5 w-3.5 mr-1" />Messages</TabsTrigger>
            <TabsTrigger value="forms" className="text-xs sm:text-sm">Forms &amp; Credits</TabsTrigger>
            <TabsTrigger value="photos" className="text-xs sm:text-sm"><Camera className="h-3.5 w-3.5 mr-1" />Photos</TabsTrigger>
            <TabsTrigger value="profile" className="text-xs sm:text-sm">Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="appointments" className="mt-0 space-y-6">
            <PreOpCountdownCard />
            <PostOpCheckInsCard />
            <PromSurveysCard />
            <Section title="Upcoming">
              {upcoming.length === 0 ? (
                <Empty text="No upcoming appointments." />
              ) : (
                <div className="space-y-3">
                  {upcoming.map(a => (
                    <ApptCard key={a.id} a={a} services={services} staff={staff} locations={locations}
                      onCancel={() => cancel(a.id)} onReschedule={() => reschedule(a)} onRebook={() => rebook(a)} />
                  ))}
                </div>
              )}
            </Section>

            <Section title="Past">
              {past.length === 0 ? (
                <Empty text="No past appointments." />
              ) : (
                <div className="space-y-3">
                  {past.map(a => (
                    <ApptCard key={a.id} a={a} services={services} staff={staff} locations={locations}
                      onRebook={() => rebook(a)} />
                  ))}
                </div>
              )}
            </Section>
          </TabsContent>

          <TabsContent value="messages" className="mt-0">
            <section className="mb-6">
              <h2 className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-3">Text the team</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Send a text message to the Radiantilyk team. We'll reply by SMS to the number on your profile.
                {!profile?.phone && (
                  <span className="block mt-1 text-warning-foreground">
                    Add a phone number on the Profile tab before sending.
                  </span>
                )}
              </p>
              <div className="rounded-2xl border border-border bg-card p-4">
                <SmsThread
                  clientEmail={user?.email ?? ""}
                  viewerRole="client"
                  composerDisabledReason={!profile?.phone ? "Add a phone number to your profile to send messages." : null}
                />
              </div>
            </section>
          </TabsContent>

          <TabsContent value="forms" className="mt-0 space-y-6">
            <MyChartTimelineCard />
            <MyTreatmentPlansCard />
            <RewardsCard />
            <CreditsCard />
            <MyReceiptsCard />
            <MyConsentsCard />
          </TabsContent>

          <TabsContent value="photos" className="mt-0">
            <MyPhotosCard clientEmail={user?.email ?? ""} />
          </TabsContent>

          <TabsContent value="profile" className="mt-0">
            <ProfileEditCard profile={profile} userEmail={user?.email ?? ""} onUpdated={(p) => setProfile(p)} />
            <ReferralCard />
            <PrivacyRightsCard userEmail={user?.email ?? ""} />
          </TabsContent>

        </Tabs>
      </main>
      <SiteFooter />
    </div>
  );
}

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mb-10">
    <h2 className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-4">{title}</h2>
    {children}
  </section>
);

function ReferralCard() {
  const [code, setCode] = useState<string | null>(null);
  const [stats, setStats] = useState<{ total: number; completed: number } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.email) return;
      const email = session.user.email.toLowerCase();
      const { data: existing } = await supabase
        .from("referral_codes").select("code").eq("owner_email", email).maybeSingle();
      if (existing?.code) {
        setCode(existing.code);
        const { data: appts } = await supabase
          .from("appointments").select("id, status").eq("referral_code", existing.code).neq("client_email", email);
        const total = appts?.length ?? 0;
        const completed = appts?.filter((a: any) => a.status === "completed").length ?? 0;
        setStats({ total, completed });
      }
    })();
  }, []);

  const generate = async () => {
    setBusy(true);
    const { data, error } = await supabase.rpc("get_or_create_referral_code");
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    setCode(data as string);
    setStats({ total: 0, completed: 0 });
  };

  const shareUrl = code ? `https://bookrka.com/book?ref=${code}` : "";
  const copy = async (text: string, label: string) => {
    try { await navigator.clipboard.writeText(text); toast.success(`${label} copied`); }
    catch { toast.error("Could not copy"); }
  };

  return (
    <Section title="Refer a friend">
      <div className="rounded-2xl border border-border bg-card p-6">
        <p className="text-sm text-foreground/80 leading-relaxed">
          Love your visits? Share your personal link. We'll thank you both with a little something at your next appointment.
        </p>
        {!code ? (
          <Button onClick={generate} disabled={busy} className="mt-4">
            {busy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Get my referral link
          </Button>
        ) : (
          <div className="mt-5 space-y-4">
            <div>
              <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-1.5">Your code</div>
              <div className="flex items-center gap-2">
                <code className="font-mono text-lg tracking-widest bg-secondary/50 px-3 py-2 rounded-md">{code}</code>
                <Button variant="outline" size="sm" onClick={() => copy(code, "Code")}>Copy</Button>
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-1.5">Share link</div>
              <div className="flex items-center gap-2">
                <input readOnly value={shareUrl} onFocus={(e) => e.currentTarget.select()}
                  className="flex-1 text-xs font-mono bg-secondary/50 px-3 py-2 rounded-md border-0 truncate" />
                <Button variant="outline" size="sm" onClick={() => copy(shareUrl, "Link")}>Copy</Button>
              </div>
            </div>
            {stats && (
              <p className="text-xs text-muted-foreground pt-2 border-t border-border">
                {stats.total === 0
                  ? "No referrals yet — share your link to get started."
                  : `${stats.total} friend${stats.total === 1 ? " has" : "s have"} booked · ${stats.completed} visit${stats.completed === 1 ? "" : "s"} completed.`}
              </p>
            )}
          </div>
        )}
      </div>
    </Section>
  );
}

function RewardsCard() {
  const [balance, setBalance] = useState<number | null>(null);
  const [valueCents, setValueCents] = useState<number>(10);
  const [history, setHistory] = useState<{ id: string; delta: number; reason: string; notes: string | null; created_at: string }[]>([]);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.email) return;
      const email = session.user.email.toLowerCase();
      const [{ data: bal }, { data: hist }, { data: settings }] = await Promise.all([
        supabase.rpc("get_points_balance" as any, { _client_email: email }),
        supabase.from("client_points_ledger" as any).select("id, delta, reason, notes, created_at").ilike("client_email", email).order("created_at", { ascending: false }).limit(20),
        supabase.from("client_points_settings" as any).select("point_value_cents").eq("id", true).maybeSingle(),
      ]);
      setBalance(Number(bal ?? 0));
      setHistory((hist as any) ?? []);
      setValueCents(Number((settings as any)?.point_value_cents ?? 10));
    })();
  }, []);

  if (balance === null || (balance === 0 && history.length === 0)) return null;

  return (
    <Section title="Rewards points">
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-baseline justify-between gap-4 mb-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Available points</div>
            <div className="font-serif text-3xl mt-1">
              {balance.toLocaleString()} <span className="text-base text-muted-foreground">pts</span>
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              Worth ${((balance * valueCents) / 100).toFixed(2)} off your next visit
            </div>
          </div>
          <p className="text-xs text-muted-foreground max-w-[180px] text-right">
            Earn 1 pt for every $10 of services. Points expire after 12 months of inactivity.
          </p>
        </div>
        {history.length > 0 && (
          <div className="border-t border-border pt-3 -mx-2">
            <ul className="divide-y divide-border">
              {history.map((c) => (
                <li key={c.id} className="px-2 py-2.5 flex items-start justify-between gap-3 text-sm">
                  <div className="min-w-0">
                    <div className="font-medium capitalize">{c.reason.replace("_", " ")}</div>
                    {c.notes && <div className="text-xs text-muted-foreground mt-0.5">{c.notes}</div>}
                    <div className="text-[11px] text-muted-foreground font-mono mt-0.5">{format(new Date(c.created_at), "MMM d, yyyy")}</div>
                  </div>
                  <div className={`font-mono shrink-0 ${c.delta >= 0 ? "text-success-soft-foreground" : "text-foreground/60"}`}>
                    {c.delta >= 0 ? "+" : "−"}{Math.abs(c.delta).toLocaleString()} pts
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Section>
  );
}

function CreditsCard() {
  const [balance, setBalance] = useState<number | null>(null);
  const [history, setHistory] = useState<{ id: string; amount_cents: number; reason: string; note: string | null; created_at: string }[]>([]);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.email) return;
      const email = session.user.email.toLowerCase();
      const [{ data: bal }, { data: hist }] = await Promise.all([
        supabase.from("client_credit_balances" as any).select("balance_cents").eq("client_email", email).maybeSingle(),
        supabase.from("client_credits").select("id, amount_cents, reason, note, created_at").ilike("client_email", email).order("created_at", { ascending: false }).limit(20),
      ]);
      setBalance((bal as any)?.balance_cents ?? 0);
      setHistory((hist as any) ?? []);
    })();
  }, []);

  if (balance === null || (balance === 0 && history.length === 0)) return null;

  return (
    <Section title="Account credit">
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-baseline justify-between gap-4 mb-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Available balance</div>
            <div className={`font-serif text-3xl mt-1 ${balance > 0 ? "text-success-soft-foreground" : ""}`}>
              ${(balance / 100).toFixed(2)}
            </div>
          </div>
          <p className="text-xs text-muted-foreground max-w-[180px] text-right">
            Applied automatically at your next visit.
          </p>
        </div>
        {history.length > 0 && (
          <div className="border-t border-border pt-3 -mx-2">
            <ul className="divide-y divide-border">
              {history.map((c) => (
                <li key={c.id} className="px-2 py-2.5 flex items-start justify-between gap-3 text-sm">
                  <div className="min-w-0">
                    <div className="font-medium">{c.reason}</div>
                    {c.note && <div className="text-xs text-muted-foreground mt-0.5">{c.note}</div>}
                    <div className="text-[11px] text-muted-foreground font-mono mt-0.5">{format(new Date(c.created_at), "MMM d, yyyy")}</div>
                  </div>
                  <div className={`font-mono shrink-0 ${c.amount_cents >= 0 ? "text-success-soft-foreground" : "text-foreground/60"}`}>
                    {c.amount_cents >= 0 ? "+" : "−"}${(Math.abs(c.amount_cents) / 100).toFixed(2)}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Section>
  );
}

const Empty = ({ text }: { text: string }) => (
  <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">{text}</div>
);

interface MyConsentRow {
  id: string;
  signed_at: string;
  expires_at: string | null;
  form_version: number;
  decision: string;
  consent_forms: { title: string; slug: string; version: number; consent_scope: string } | null;
}

function MyConsentsCard() {
  const [rows, setRows] = useState<MyConsentRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.email) { setLoading(false); return; }
      const email = session.user.email.toLowerCase();
      const { data } = await supabase
        .from("consent_signatures")
        .select("id, signed_at, expires_at, form_version, decision, consent_forms!inner(title, slug, version, consent_scope)")
        .eq("client_email", email)
        .order("signed_at", { ascending: false });
      // Keep only the latest signature per form
      const latest = new Map<string, MyConsentRow>();
      for (const r of (data ?? []) as any[]) {
        if (!latest.has(r.consent_forms?.slug ?? r.id)) latest.set(r.consent_forms?.slug ?? r.id, r);
      }
      setRows(Array.from(latest.values()));
      setLoading(false);
    })();
  }, []);

  if (loading || rows.length === 0) return null;

  const now = Date.now();
  const sorted = [...rows].sort((a, b) => {
    const aExp = a.expires_at ? new Date(a.expires_at).getTime() : Infinity;
    const bExp = b.expires_at ? new Date(b.expires_at).getTime() : Infinity;
    return aExp - bExp;
  });

  return (
    <Section title="Consents on file">
      <div className="rounded-2xl border border-border bg-card p-6">
        <p className="text-xs text-muted-foreground mb-4">
          We only ask you to re-sign forms that are missing or expired. Annual consents are valid for 12 months from the date signed.
        </p>
        <ul className="divide-y divide-border -mx-2">
          {sorted.map((r) => {
            const expired = r.expires_at && new Date(r.expires_at).getTime() <= now;
            const declined = r.decision === "decline";
            return (
              <li key={r.id} className="px-2 py-2.5 flex items-start justify-between gap-3 text-sm">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {expired || declined
                      ? <AlertCircle className="h-3.5 w-3.5 text-warning-soft-foreground shrink-0" />
                      : <FileCheck2 className="h-3.5 w-3.5 text-success-soft-foreground shrink-0" />}
                    <span className="truncate">{r.consent_forms?.title ?? "Consent form"}</span>
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground border border-border rounded-full px-2 py-0.5">
                      {r.consent_forms?.consent_scope === "per_treatment" ? "Per treatment" : r.consent_forms?.consent_scope === "perpetual" ? "Perpetual" : "Annual"}
                    </span>
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5 font-mono">
                    Signed {format(new Date(r.signed_at), "MMM d, yyyy")}
                    {r.expires_at && (
                      <> · {expired ? "expired" : "valid through"} {format(new Date(r.expires_at), "MMM d, yyyy")}</>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </Section>
  );
}

const ApptCard = ({
  a, services, staff, locations, onCancel, onRebook, onReschedule,
}: {
  a: Appt;
  services: Record<string, string>;
  staff: Record<string, { name: string; title: string }>;
  locations: Record<string, { name: string; city: string }>;
  onCancel?: () => void;
  onRebook?: () => void;
  onReschedule?: () => void;
}) => {
  const canCancel = !!onCancel && ["pending", "approved"].includes(a.status);
  const isUpcoming = ["pending", "approved"].includes(a.status);
  const hoursUntil = (new Date(a.start_at).getTime() - Date.now()) / 36e5;
  const within48 = isUpcoming && hoursUntil < 48 && hoursUntil > -2;
  const canReschedule = !!onReschedule && isUpcoming && !within48;
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="font-serif text-lg">{services[a.service_id] ?? "Service"}</div>
          <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-x-4 gap-y-1">
            <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />{format(new Date(a.start_at), "EEE, MMM d · h:mm a")}</span>
            {staff[a.staff_id] && <span>with {staff[a.staff_id].name}</span>}
            {locations[a.location_id] && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{locations[a.location_id].name}</span>}
          </div>
          <div className="mt-2"><StatusPill status={a.status} /></div>
          {within48 && onReschedule && (
            <p className="text-[11px] text-muted-foreground mt-2">
              Within {CANCELLATION_NOTICE_HOURS} hours — please call <a href={CLINIC_PHONE_TEL} className="underline">{CLINIC_PHONE_DISPLAY}</a> to reschedule.
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <ConsentDownloadButton appointmentId={a.id} initialUrl={a.consent_pdf_url} />
          {canReschedule && <Button variant="outline" size="sm" className="rounded-full" onClick={onReschedule}>Reschedule</Button>}
          {onRebook && !isUpcoming && <Button variant="outline" size="sm" className="rounded-full" onClick={onRebook}>Rebook</Button>}
          {canCancel && <Button variant="ghost" size="sm" className="rounded-full text-destructive hover:text-destructive" onClick={onCancel}>Cancel</Button>}
        </div>
      </div>
    </div>
  );
};

const ConsentDownloadButton = ({ appointmentId, initialUrl }: { appointmentId: string; initialUrl: string | null }) => {
  const [url, setUrl] = useState<string | null>(initialUrl);
  const [loading, setLoading] = useState(false);
  const [hasSigned, setHasSigned] = useState<boolean | null>(initialUrl ? true : null);

  useEffect(() => {
    if (initialUrl) return;
    (async () => {
      const { count } = await supabase
        .from("consent_signatures")
        .select("id", { count: "exact", head: true })
        .eq("appointment_id", appointmentId);
      setHasSigned((count ?? 0) > 0);
    })();
  }, [appointmentId, initialUrl]);

  const handle = async () => {
    if (url) { window.open(url, "_blank", "noopener,noreferrer"); return; }
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("generate-consent-pdf", {
      body: { appointmentId },
    });
    setLoading(false);
    if (error || data?.error) { toast.error(data?.error || error?.message || "Could not generate PDF"); return; }
    setUrl(data.url);
    window.open(data.url, "_blank", "noopener,noreferrer");
  };

  if (hasSigned === false) return null;

  return (
    <Button variant="outline" size="sm" className="rounded-full" onClick={handle} disabled={loading}>
      {loading ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <FileText className="h-3 w-3 mr-1" />}
      {url ? "Download consents" : "Generate consents PDF"}
    </Button>
  );
};

const StatusPill = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
    pending: "bg-warning/15 text-warning-foreground border-warning/30",
    approved: "bg-success/15 text-success border-success/30",
    completed: "bg-success/15 text-success border-success/30",
    denied: "bg-destructive/15 text-destructive border-destructive/30",
    cancelled: "bg-muted text-muted-foreground border-border",
    no_show: "bg-destructive/15 text-destructive border-destructive/30",
  };
  return <span className={`inline-block text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${map[status] ?? map.pending}`}>{status.replace("_", " ")}</span>;
};

function ProfileEditCard({ profile, userEmail, onUpdated }: { profile: any; userEmail: string; onUpdated: (p: any) => void }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    first_name: profile?.first_name ?? "",
    last_name: profile?.last_name ?? "",
    email: profile?.email ?? userEmail ?? "",
    phone: profile?.phone ?? "",
  });

  useEffect(() => {
    setForm({
      first_name: profile?.first_name ?? "",
      last_name: profile?.last_name ?? "",
      email: profile?.email ?? userEmail ?? "",
      phone: profile?.phone ?? "",
    });
  }, [profile, userEmail]);

  const save = async () => {
    const first = form.first_name.trim();
    const last = form.last_name.trim();
    const email = form.email.trim();
    const phone = form.phone.trim();
    if (!first || !last) { toast.error("First and last name are required"); return; }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { toast.error("Enter a valid email"); return; }
    setSaving(true);
    try {
      const { data: updated, error } = await supabase
        .from("client_profiles")
        .update({ first_name: first, last_name: last, email, phone: phone || null })
        .eq("id", profile.id)
        .select()
        .single();
      if (error) throw error;
      onUpdated(updated);
      if (email.toLowerCase() !== (userEmail ?? "").toLowerCase()) {
        const { error: aerr } = await supabase.auth.updateUser({ email });
        if (aerr) throw aerr;
        toast.success("Saved. Check your new email to confirm the change.");
      } else {
        toast.success("Profile updated");
      }
      setEditing(false);
    } catch (e: any) {
      toast.error(e.message ?? "Could not save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Section title="Your details">
      <div className="rounded-2xl border border-border bg-card p-6">
        {!editing ? (
          <div className="flex items-start justify-between gap-4">
            <div className="text-sm space-y-1">
              <div className="font-medium">{profile?.first_name} {profile?.last_name}</div>
              <div className="text-muted-foreground">{profile?.email ?? userEmail}</div>
              {profile?.phone && <div className="text-muted-foreground">{profile.phone}</div>}
            </div>
            <Button variant="outline" size="sm" className="rounded-full" onClick={() => setEditing(true)}>
              <Pencil className="h-3.5 w-3.5 mr-1.5" /> Edit
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>First name</Label>
                <Input className="mt-1.5" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
              </div>
              <div>
                <Label>Last name</Label>
                <Input className="mt-1.5" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Email</Label>
              <Input className="mt-1.5" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <p className="text-[11px] text-muted-foreground mt-1">Changing this also updates your sign-in email. You'll get a confirmation link.</p>
            </div>
            <div>
              <Label>Phone</Label>
              <Input className="mt-1.5" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="flex gap-2 pt-1">
              <Button onClick={save} disabled={saving} className="rounded-full">
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Save
              </Button>
              <Button variant="ghost" onClick={() => setEditing(false)} className="rounded-full">Cancel</Button>
            </div>
          </div>
        )}
      </div>
    </Section>
  );
}

function MyPhotosCard({ clientEmail }: { clientEmail: string }) {
  const [rows, setRows] = useState<{ id: string; storage_path: string; caption: string | null; uploaded_at: string; url?: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clientEmail) return;
    (async () => {
      const { data } = await supabase
        .from("client_uploaded_photos")
        .select("id, storage_path, caption, uploaded_at")
        .eq("client_email", clientEmail.toLowerCase())
        .order("uploaded_at", { ascending: false })
        .limit(50);
      const list = data ?? [];
      const signed = await Promise.all(list.map(async (r) => {
        const { data: s } = await supabase.storage.from("client-uploaded-photos").createSignedUrl(r.storage_path, 3600);
        return { ...r, url: s?.signedUrl };
      }));
      setRows(signed);
      setLoading(false);
    })();
  }, [clientEmail]);

  if (loading) {
    return <Section title="Your photos"><div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div></Section>;
  }
  if (rows.length === 0) {
    return (
      <Section title="Your photos">
        <Empty text="No photos uploaded yet. When your provider asks for a progress photo, the link will let you upload here." />
      </Section>
    );
  }
  return (
    <Section title="Your photos">
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="grid grid-cols-3 gap-2">
          {rows.map((r) => (
            <a key={r.id} href={r.url} target="_blank" rel="noopener noreferrer" className="block aspect-square rounded-lg overflow-hidden bg-muted relative group">
              {r.url ? <img src={r.url} alt={r.caption ?? "Uploaded photo"} className="w-full h-full object-cover" loading="lazy" /> : null}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent text-[10px] text-white p-1 opacity-0 group-hover:opacity-100 transition">
                {format(new Date(r.uploaded_at), "MMM d, yyyy")}
              </div>
            </a>
          ))}
        </div>
      </div>
    </Section>
  );
}

function PrivacyRightsCard({ userEmail }: { userEmail: string }) {
  const [exporting, setExporting] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [existingRequest, setExistingRequest] = useState<any>(null);

  useEffect(() => {
    if (!userEmail) return;
    supabase.from("phi_deletion_requests" as any)
      .select("id, requested_at, status, resolved_at")
      .eq("client_email", userEmail.toLowerCase())
      .order("requested_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => setExistingRequest(data));
  }, [userEmail]);

  const exportData = async () => {
    if (!userEmail) return;
    setExporting(true);
    try {
      const email = userEmail.toLowerCase();
      const [profile, appts, consents, receipts, photos, credits] = await Promise.all([
        supabase.from("client_profiles").select("*").eq("email", email).maybeSingle(),
        supabase.from("appointments").select("*").eq("client_email", email),
        supabase.from("consent_signatures").select("*").eq("client_email", email),
        supabase.from("sales").select("*").eq("client_email", email),
        supabase.from("client_uploaded_photos").select("*").eq("client_email", email),
        supabase.from("client_credits").select("*").eq("client_email", email),
      ]);
      const bundle = {
        exported_at: new Date().toISOString(),
        exported_for: email,
        source: "Radiantilyk Aesthetic — patient self-service export",
        profile: profile.data ?? null,
        appointments: appts.data ?? [],
        consent_signatures: consents.data ?? [],
        receipts: receipts.data ?? [],
        uploaded_photos: photos.data ?? [],
        credits: credits.data ?? [],
        note: "This is patient-visible data only. Some clinical records (chart notes, GFE, provider assessments) are protected by state medical-records law and are provided only by written request to privacy@bookrka.com under HIPAA §164.524.",
      };
      const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `radiantilyk-my-data-${email}-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      toast.success("Your data has been exported");
    } catch (e: any) {
      toast.error(e?.message || "Export failed");
    } finally {
      setExporting(false);
    }
  };

  const requestDeletion = async () => {
    if (!userEmail) return;
    const reason = window.prompt(
      "Please describe your request. A copy will go to our Privacy Officer, who will contact you within 30 days.\n\nNote: Some records must be retained under state and federal law and cannot be deleted.",
    );
    if (reason === null) return;
    setRequesting(true);
    const { data, error } = await supabase.from("phi_deletion_requests" as any).insert({
      client_email: userEmail.toLowerCase(),
      reason: reason || "No reason provided",
    }).select().maybeSingle();
    setRequesting(false);
    if (error) { toast.error(error.message); return; }
    setExistingRequest(data);
    toast.success("Request received. Our Privacy Officer will follow up within 30 days.");
  };

  return (
    <Section title="Privacy & my rights">
      <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
        <p className="text-sm text-foreground/80 leading-relaxed">
          Under HIPAA you have the right to access and request deletion of your health
          information. Review our{" "}
          <Link to="/privacy-practices" className="underline">Notice of Privacy Practices</Link>{" "}
          for the full list of your rights.
        </p>

        <div className="grid sm:grid-cols-2 gap-3">
          <div className="rounded-xl border border-border p-4">
            <div className="text-sm font-medium mb-1">Export my data</div>
            <p className="text-xs text-muted-foreground mb-3">
              Download a JSON copy of your profile, appointments, receipts, consents, and uploads.
            </p>
            <Button onClick={exportData} disabled={exporting} size="sm" variant="outline" className="w-full">
              {exporting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Download my data
            </Button>
          </div>

          <div className="rounded-xl border border-border p-4">
            <div className="text-sm font-medium mb-1">Request deletion</div>
            <p className="text-xs text-muted-foreground mb-3">
              Ask our Privacy Officer to delete records not required by law to retain.
            </p>
            {existingRequest && existingRequest.status !== "denied" ? (
              <div className="text-xs text-muted-foreground">
                Requested {format(new Date(existingRequest.requested_at), "MMM d, yyyy")} · Status:{" "}
                <span className="font-medium text-foreground">{existingRequest.status}</span>
              </div>
            ) : (
              <Button onClick={requestDeletion} disabled={requesting} size="sm" variant="outline" className="w-full">
                {requesting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Request deletion
              </Button>
            )}
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground">
          For any other privacy request or concern, contact{" "}
          <a className="underline" href="mailto:privacy@bookrka.com">privacy@bookrka.com</a>.
        </p>
      </div>
    </Section>
  );
}

