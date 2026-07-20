import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowRight, Check, Clock, ShieldCheck, Star, CreditCard, Calendar as CalIcon } from "lucide-react";
import type { Category, Service, ProviderRow } from "./types";

export const StepService = ({
  categories, services, providers, selected, onToggle, onContinue,
}: {
  categories: Category[]; services: Service[]; providers: ProviderRow[];
  selected: string[]; onToggle: (id: string) => void; onContinue: () => void;
}) => {
  const offeredServiceIds = new Set(providers.map(p => p.service_id));
  const cats = categories.filter(c =>
    services.some(s => s.category_id === c.id && offeredServiceIds.has(s.id))
  );
  const initialOpen = selected.length
    ? (services.find(s => s.id === selected[selected.length - 1])?.category_id ?? null)
    : null;
  const [openCat, setOpenCat] = useState<string | null>(initialOpen ?? (cats.length === 1 ? cats[0].id : null));

  const selectedSvcs = selected
    .map(id => services.find(s => s.id === id))
    .filter(Boolean) as Service[];
  const totalMin = selectedSvcs.reduce((sum, s) => sum + s.duration_minutes, 0);
  const totalCents = selectedSvcs.reduce((sum, s) => sum + (s.price_cents ?? 0), 0);

  return (
    <div>
      <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl mb-3">What would you like?</h1>
      <p className="text-muted-foreground mb-3">
        Add one or more services — you can book several in a single visit.
      </p>
      <p className="text-sm mb-6">
        <a href="/quiz" className="text-primary hover:underline">Not sure what you need? Take the 60-second quiz →</a>
      </p>


      <div className="flex flex-wrap gap-2 mb-8 text-[11px]">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5">
          <Star className="h-3 w-3 fill-amber-500 text-warning" /> 5.0 on Google
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5">
          <ShieldCheck className="h-3 w-3 text-primary" /> Licensed providers
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5">
          <CreditCard className="h-3 w-3 text-primary" /> No deposit charged
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5">
          <CalIcon className="h-3 w-3 text-primary" /> Free 48h cancellation
        </span>
      </div>

      {selectedSvcs.length > 0 && (
        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 mb-6">
          <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
            Your visit · {selectedSvcs.length} service{selectedSvcs.length > 1 ? "s" : ""} · {totalMin} min{totalCents > 0 ? ` · $${(totalCents/100).toFixed(totalCents % 100 === 0 ? 0 : 2)}` : ""}
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedSvcs.map(s => (
              <button
                key={s.id}
                onClick={() => onToggle(s.id)}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground text-xs px-3 py-1.5 hover:opacity-90"
                aria-label={`Remove ${s.name}`}
              >
                {s.name}
                <span aria-hidden className="text-base leading-none">×</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        {cats.map(c => {
          const isOpen = openCat === c.id;
          const catServices = services.filter(s => s.category_id === c.id && offeredServiceIds.has(s.id));
          const selCount = catServices.filter(s => selected.includes(s.id)).length;
          return (
            <div key={c.id} className={isOpen ? "sm:col-span-2" : undefined}>
              <button
                onClick={() => setOpenCat(isOpen ? null : c.id)}
                className={`w-full text-left rounded-2xl border p-6 transition ${isOpen ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/50"}`}
              >
                <div className="font-serif text-2xl">{c.name}</div>
                {c.description && <div className="text-xs text-muted-foreground mt-1">{c.description}</div>}
                <div className="text-xs text-primary mt-3">
                  {catServices.length} services{selCount > 0 ? ` · ${selCount} selected` : ""}
                </div>
              </button>
              {isOpen && (
                <div className="mt-2 space-y-2 sm:grid sm:grid-cols-2 sm:gap-3 sm:space-y-0">
                  {catServices.map(s => {
                    const isSel = selected.includes(s.id);
                    const price = typeof s.price_cents === "number"
                      ? (s.price_cents === 0
                          ? "Complimentary"
                          : `$${(s.price_cents / 100).toFixed(s.price_cents % 100 === 0 ? 0 : 2)}`)
                      : null;
                    return (
                      <button key={s.id}
                        onClick={() => onToggle(s.id)}
                        className={`w-full text-left rounded-xl border p-4 transition ${isSel ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:bg-accent"}`}>
                        <div className="grid grid-cols-[1.25rem_minmax(0,1fr)] gap-3">
                          <span className={`mt-0.5 h-5 w-5 shrink-0 rounded-md border flex items-center justify-center ${isSel ? "bg-primary-foreground border-primary-foreground text-primary" : "border-muted-foreground/40"}`}>
                            {isSel && <Check className="h-3.5 w-3.5" />}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="space-y-2">
                              <div className="font-medium leading-snug whitespace-normal break-words text-pretty">{s.name}</div>
                              {price && (
                                <div className="text-sm font-semibold leading-none">{price}</div>
                              )}
                            </div>
                            {s.price_note && (
                              <div className={`text-xs mt-2 leading-relaxed whitespace-normal break-words ${isSel ? "opacity-90" : "text-muted-foreground"}`}>
                                {s.price_note}
                              </div>
                            )}
                            {s.description && (
                              <div className={`text-xs mt-1.5 line-clamp-2 leading-relaxed ${isSel ? "opacity-90" : "text-muted-foreground"}`}>
                                {s.description}
                              </div>
                            )}
                            <div className={`text-xs mt-2 inline-flex items-center gap-1 ${isSel ? "opacity-80" : "text-muted-foreground"}`}>
                              <Clock className="h-3 w-3" />{s.duration_minutes} min
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-10">
        <Accordion type="single" collapsible className="rounded-2xl border border-border bg-card">
          <AccordionItem value="faq" className="border-0 px-4">
            <AccordionTrigger className="text-sm font-serif">Common questions</AccordionTrigger>
            <AccordionContent>
              <Accordion type="single" collapsible className="divide-y divide-border border-t border-border -mx-4">
                <AccordionItem value="deposit" className="border-0 px-4">
                  <AccordionTrigger className="text-sm">Do I need to pay a deposit?</AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">
                    No. We don't charge a booking deposit. We do require a card on file — it's only charged if you no-show or cancel with less than 48 hours notice ($200 fee), or for the service you receive.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="cancel" className="border-0 px-4">
                  <AccordionTrigger className="text-sm">Can I reschedule or cancel?</AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">
                    Yes — anytime up to 48 hours before your appointment, free of charge. Just sign in to your account or use the link in your confirmation email.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="approval" className="border-0 px-4">
                  <AccordionTrigger className="text-sm">Is my appointment confirmed right away?</AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">
                    You'll get instant confirmation that we received your request. Our team reviews and approves new bookings within a few hours during business hours, then you'll receive a final confirmation by email.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="first" className="border-0 px-4">
                  <AccordionTrigger className="text-sm">It's my first visit — what should I expect?</AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">
                    We'll guide you through consents during checkout, and your provider will do a brief in-person consultation before any treatment to make sure the plan is right for you.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="locations" className="border-0 px-4">
                  <AccordionTrigger className="text-sm">Where are you located?</AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">
                    Our studio is in San Jose at 2100 Curtner Ave, Ste 1B.
                  </AccordionContent>
                </AccordionItem>

              </Accordion>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {selected.length > 0 && (
        <>
          <div className="h-24" aria-hidden />
          <div className="fixed bottom-0 inset-x-0 bg-background/95 backdrop-blur border-t border-border p-4 z-30">
            <div className="container mx-auto max-w-3xl flex items-center justify-between gap-3">
              <div className="text-xs text-muted-foreground">
                {selected.length} service{selected.length > 1 ? "s" : ""} · {totalMin} min
              </div>
              <Button onClick={onContinue} size="lg" className="rounded-full px-8">
                Continue <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
