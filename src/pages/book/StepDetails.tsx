import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, MapPin, Clock } from "lucide-react";
import { format } from "date-fns";
import { Field } from "./Field";

export const StepDetails = ({
  client, setClient, summary, onContinue, fieldErrors, onClearError,
}: {
  client: any; setClient: (c: any) => void;
  summary: { serviceName: string; staffName: string; locationName: string; startAt: string };
  onContinue: () => void;
  fieldErrors: Record<string, string>;
  onClearError: (key: string) => void;
}) => {
  const setField = (k: string, v: string | boolean) => {
    setClient({ ...client, [k]: v });
    if (typeof v === "string" && fieldErrors[k]) onClearError(k);
  };
  return (
    <div>
      <h1 className="font-serif text-4xl md:text-5xl mb-3">Your details.</h1>
      <p className="text-muted-foreground mb-8">Tell us a bit about you.</p>

      <div className="rounded-2xl bg-secondary/50 p-5 mb-8 text-sm">
        <div className="flex items-center gap-2 font-serif text-lg">{summary.serviceName}</div>
        <div className="text-muted-foreground mt-1 flex flex-wrap gap-x-4">
          <span>with {summary.staffName}</span>
          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {summary.locationName}</span>
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {format(new Date(summary.startAt), "EEE, MMM d · h:mm a")}</span>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="First name *" error={fieldErrors.firstName}><Input id="book-firstName" aria-invalid={!!fieldErrors.firstName} value={client.firstName} onChange={(e) => setField("firstName", e.target.value)} maxLength={60} className={`h-12 ${fieldErrors.firstName ? "border-destructive focus-visible:ring-destructive" : ""}`} autoComplete="given-name" autoCapitalize="words" /></Field>
        <Field label="Last name *" error={fieldErrors.lastName}><Input id="book-lastName" aria-invalid={!!fieldErrors.lastName} value={client.lastName} onChange={(e) => setField("lastName", e.target.value)} maxLength={60} className={`h-12 ${fieldErrors.lastName ? "border-destructive focus-visible:ring-destructive" : ""}`} autoComplete="family-name" autoCapitalize="words" /></Field>
        <Field label="Email *" error={fieldErrors.email}><Input id="book-email" aria-invalid={!!fieldErrors.email} type="email" inputMode="email" autoComplete="email" autoCapitalize="off" autoCorrect="off" value={client.email} onChange={(e) => setField("email", e.target.value)} maxLength={120} className={`h-12 ${fieldErrors.email ? "border-destructive focus-visible:ring-destructive" : ""}`} /></Field>
        <Field label="Phone *" error={fieldErrors.phone}><Input id="book-phone" aria-invalid={!!fieldErrors.phone} type="tel" inputMode="tel" autoComplete="tel" value={client.phone} onChange={(e) => setField("phone", e.target.value)} maxLength={20} className={`h-12 ${fieldErrors.phone ? "border-destructive focus-visible:ring-destructive" : ""}`} /></Field>
        <Field label="Date of birth" hint="Required for medical records"><Input id="book-dob" type="date" value={client.dob} onChange={(e) => setField("dob", e.target.value)} className="h-12" /></Field>
      </div>

      <Field label="Anything we should know? (optional)" className="mt-4">
        <Textarea rows={3} value={client.notes} onChange={(e) => setClient({...client, notes: e.target.value})} maxLength={1000} />
      </Field>

      <label className="mt-6 flex items-start gap-3 rounded-xl border border-border p-4 cursor-pointer hover:bg-secondary/30 transition">
        <input
          type="checkbox"
          checked={!!client.smsOptIn}
          onChange={(e) => setClient({ ...client, smsOptIn: e.target.checked })}
          className="mt-1 h-4 w-4 accent-primary"
        />
        <span className="text-sm text-muted-foreground leading-relaxed">
          Text me appointment confirmations and reminders at the number above from Radiantilyk Aesthetic.
          Msg &amp; data rates may apply. Reply STOP to opt out at any time. Consent is not a condition of booking.
        </span>
      </label>

      <label className={`mt-3 flex items-start gap-3 rounded-xl border p-4 cursor-pointer hover:bg-secondary/30 transition ${fieldErrors.nppAck ? "border-destructive" : "border-border"}`}>
        <input
          type="checkbox"
          checked={!!client.nppAck}
          onChange={(e) => { setClient({ ...client, nppAck: e.target.checked }); if (e.target.checked && fieldErrors.nppAck) onClearError("nppAck"); }}
          className="mt-1 h-4 w-4 accent-primary"
        />
        <span className="text-sm text-muted-foreground leading-relaxed">
          I acknowledge that I have received and reviewed the{" "}
          <a href="/privacy-practices" target="_blank" rel="noopener noreferrer" className="underline text-foreground">
            Notice of Privacy Practices
          </a>{" "}
          describing how my health information is used and protected. <span className="text-destructive">*</span>
        </span>
      </label>
      {fieldErrors.nppAck && <p className="text-xs text-destructive mt-1">{fieldErrors.nppAck}</p>}


      <div className="md:hidden h-24" aria-hidden />
      <div className="fixed bottom-0 inset-x-0 md:static md:mt-8 bg-background/95 backdrop-blur md:backdrop-blur-none border-t md:border-0 border-border p-4 md:p-0 z-30">
        <Button onClick={onContinue} size="lg" className="rounded-full px-8 w-full md:w-auto">
          Continue to consents <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
