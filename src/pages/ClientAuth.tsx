import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { setDemoAuthSession } from "@/hooks/useAuth";

const signupSchema = z.object({
  firstName: z.string().trim().min(1, "Required").max(60),
  lastName: z.string().trim().min(1, "Required").max(60),
  email: z.string().trim().email().max(120),
  phone: z.string().trim().min(7).max(20),
  password: z.string().min(8, "At least 8 characters").max(72),
});

export default function ClientAuth() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const initialMode = params.get("mode") === "signup" ? "signup" : "signin";
  const [mode, setMode] = useState<"signin" | "signup">(initialMode);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "", password: "",
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate("/account", { replace: true });
    });
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (mode === "signin") {
      const cleanEmail = form.email.trim().toLowerCase();

      // Demo fallback for user@gmail.com
      if (cleanEmail === "user@gmail.com" && form.password === "12345678") {
        setDemoAuthSession("user@gmail.com", []);
        setLoading(false);
        toast.success("Signed in as Demo User");
        navigate("/account", { replace: true });
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: form.password,
      });

      setLoading(false);
      if (error) {
        const msg = error.message?.toLowerCase() ?? "";
        if (msg.includes("invalid") || msg.includes("credentials") || msg.includes("not found")) {
          toast.error("We couldn't sign you in. Try the email sign-in link below — it works even if you've never set a password.");
        } else {
          toast.error(error.message);
        }
        return;
      }
      navigate("/account");
      return;
    }

    const parsed = signupSchema.safeParse(form);
    if (!parsed.success) {
      setLoading(false);
      toast.error(parsed.error.issues[0]?.message ?? "Please complete the form");
      return;
    }

    const email = form.email.trim().toLowerCase();
    const { data, error } = await supabase.auth.signUp({
      email,
      password: form.password,
      options: {
        emailRedirectTo: `${window.location.origin}/account`,
        data: {
          first_name: form.firstName.trim(),
          last_name: form.lastName.trim(),
          phone: form.phone.trim(),
        },
      },
    });
    if (error) {
      setLoading(false);
      toast.error(error.message);
      return;
    }

    // Insert client profile (best-effort if session exists)
    if (data.user && data.session) {
      await supabase.from("client_profiles").upsert({
        user_id: data.user.id,
        email,
        first_name: form.firstName.trim(),
        last_name: form.lastName.trim(),
        phone: form.phone.trim(),
      }, { onConflict: "user_id" });
    }

    // Sync to GoHighLevel (best-effort)
    supabase.functions.invoke("ghl-sync-contact", {
      body: {
        email,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone.trim(),
        source: "rkabook signup",
        tags: ["rkabook", "signup"],
      },
    }).catch((e) => console.error("ghl sync failed", e));

    setLoading(false);
    if (data.session) {
      toast.success("Account created");
      navigate("/account");
    } else {
      toast.success("Check your email to verify your account");
      setMode("signin");
    }
  };

  const sendMagicLink = async () => {
    const email = form.email.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Enter your email first"); return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/account`, shouldCreateUser: true },
    });
    setLoading(false);
    if (error) {
      const m = error.message?.toLowerCase() ?? "";
      if (m.includes("rate") || m.includes("too many")) {
        toast.error("Too many attempts. Please wait a minute and try again.");
      } else {
        toast.error(error.message);
      }
      return;
    }
    toast.success("Check your email for a sign-in link (also check spam).");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />
      <main className="flex-1 flex items-start justify-center px-4 py-10 md:py-16">
        <div className="w-full max-w-sm">
          {/* Portal Switcher Tabs */}
          <div className="flex items-center justify-between p-1 mb-6 rounded-xl bg-muted/60 border border-border text-xs font-medium">
            <Link
              to="/staff/login?role=admin"
              className="flex-1 py-2 rounded-lg text-muted-foreground hover:text-foreground transition text-center"
            >
              Admin Login
            </Link>
            <Link
              to="/staff/login?role=staff"
              className="flex-1 py-2 rounded-lg text-muted-foreground hover:text-foreground transition text-center"
            >
              Staff Login
            </Link>
            <button
              type="button"
              className="flex-1 py-2 rounded-lg bg-background text-foreground shadow-sm transition text-center font-semibold"
            >
              User Login
            </button>
          </div>

          <div className="text-center mb-8">
            <h1 className="font-serif text-3xl">{mode === "signin" ? "Welcome back" : "Create your account"}</h1>
            <p className="text-sm text-muted-foreground mt-2">
              {mode === "signin"
                ? "Sign in to view and rebook appointments."
                : "Save your details for faster booking next time."}
            </p>
          </div>

          {mode === "signin" && (
            <div className="mb-5 rounded-xl border border-primary/20 bg-primary/5 p-3.5 text-xs">
              <div className="font-semibold text-foreground mb-1">⚡ Quick Demo User Credentials</div>
              <div className="text-muted-foreground mb-2">Click below to auto-fill demo user login details:</div>
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, email: "user@gmail.com", password: "12345678" }))}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background hover:bg-secondary/60 transition text-left text-xs font-medium"
              >
                👤 <strong>Demo User Account</strong><br /><span className="text-[10px] text-muted-foreground">user@gmail.com (Password: 12345678)</span>
              </button>
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            {mode === "signup" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="fn">First name</Label>
                  <Input id="fn" required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="ln">Last name</Label>
                  <Input id="ln" required value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className="mt-1.5" />
                </div>
              </div>
            )}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoFocus autoComplete="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1.5" />
            </div>
            {mode === "signup" && (
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" type="tel" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-1.5" />
              </div>
            )}
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="mt-1.5" />
            </div>
            <Button type="submit" disabled={loading} className="w-full rounded-full">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === "signin" ? "Sign in" : "Create account"}
            </Button>
          </form>

          {mode === "signin" && (
            <>
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-border" />
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">or</span>
                <div className="flex-1 h-px bg-border" />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={sendMagicLink}
                disabled={loading}
                className="w-full rounded-full gap-2"
              >
                <Mail className="h-4 w-4" /> Email me a sign-in link
              </Button>
              <p className="text-[11px] text-center text-muted-foreground mt-2">
                Forgot your password? We'll send a one-tap link instead.
              </p>
            </>
          )}

          <p className="text-xs text-center text-muted-foreground mt-6">
            {mode === "signin" ? (
              <>New here? <button onClick={() => setMode("signup")} className="text-primary hover:underline">Create an account</button></>
            ) : (
              <>Already have one? <button onClick={() => setMode("signin")} className="text-primary hover:underline">Sign in</button></>
            )}
          </p>
          <p className="text-xs text-center text-muted-foreground mt-2">
            <Link to="/book" className="hover:text-foreground">Continue as guest</Link>
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
