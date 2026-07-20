import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ArrowRight, MapPin } from "lucide-react";
import type { Location, Service, Staff, ProviderRow } from "./types";

export const StepLocationStaff = ({
  services, locations, staff, locationId, staffId, onLocation, onStaff, canContinue, onContinue,
}: {
  services: Service[]; locations: Location[]; staff: Staff[]; providers: ProviderRow[];
  locationId: string | null; staffId: string | null;
  onLocation: (id: string) => void; onStaff: (id: string) => void;
  canContinue: boolean; onContinue: () => void;
}) => {
  const label = services.map(s => s.name).join(" + ");
  return (
    <div>
      <h1 className="font-serif text-4xl md:text-5xl mb-3">Where & with whom?</h1>
      <p className="text-muted-foreground mb-10">For your <span className="text-foreground">{label}</span> appointment.</p>

      {locations.length > 1 && (
        <div className="mb-10">
          <Label className="text-xs uppercase tracking-widest text-muted-foreground">Location</Label>
          <div className="grid sm:grid-cols-2 gap-3 mt-3">
            {locations.map(l => (
              <button key={l.id} onClick={() => onLocation(l.id)}
                className={`rounded-2xl border p-5 text-left transition ${locationId === l.id ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/50"}`}>
                <div className="flex items-center gap-2 font-serif text-xl"><MapPin className="h-4 w-4 text-primary" />{l.name}</div>
                <div className="text-xs text-muted-foreground mt-1">{l.address}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {locationId && staff.length > 0 && (
        <div className="mb-10">
          <Label className="text-xs uppercase tracking-widest text-muted-foreground">Provider</Label>
          <div className="grid sm:grid-cols-2 gap-3 mt-3">
            {staff.map(s => (
              <button key={s.id} onClick={() => onStaff(s.id)}
                className={`rounded-2xl border p-5 text-left transition ${staffId === s.id ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/50"}`}>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full" style={{ background: s.color }} />
                  <div>
                    <div className="font-medium">{s.full_name}</div>
                    <div className="text-xs text-muted-foreground">{s.title}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="md:hidden h-20" aria-hidden />
      <div className="fixed bottom-0 inset-x-0 md:static md:mt-2 bg-background/95 backdrop-blur md:backdrop-blur-none border-t md:border-0 border-border p-4 md:p-0 z-30">
        <Button onClick={onContinue} disabled={!canContinue} size="lg" className="rounded-full px-8 w-full md:w-auto">
          Continue <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
