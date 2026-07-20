import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { SlotPicker } from "@/components/booking/SlotPicker";
import { CANCELLATION_POLICY_SHORT } from "@/lib/cancellationPolicy";

export const StepDateTime = ({
  date, onDate, slot, onSlot, slots, loading, onContinue, durationMin, serviceIds, locationId, staffId,
}: {
  date: Date | undefined; onDate: (d: Date | undefined) => void;
  slot: string | null; onSlot: (s: string) => void;
  slots: string[]; loading: boolean; onContinue: () => void; durationMin: number;
  serviceIds: string[]; locationId: string; staffId: string | null;
}) => {
  return (
    <div>
      <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl mb-3">Pick a time.</h1>
      <p className="text-muted-foreground mb-2">Approximately {durationMin} minutes.</p>
      <p className="text-xs text-muted-foreground mb-6">
        ⏱ Times update live — book within ~10 min to hold your slot. No charge today; {CANCELLATION_POLICY_SHORT}
      </p>

      <SlotPicker
        serviceIds={serviceIds}
        staffId={staffId}
        locationId={locationId}
        value={slot}
        onChange={onSlot}
        onDateChange={onDate}
        externalSlots={date ? slots : undefined}
        externalSlotsLoading={loading}
      />

      <div className="md:hidden h-20" aria-hidden />
      <div className="fixed bottom-0 inset-x-0 md:static md:mt-10 bg-background/95 backdrop-blur md:backdrop-blur-none border-t md:border-0 border-border p-4 md:p-0 z-30">
        <Button onClick={onContinue} disabled={!slot} size="lg" className="rounded-full px-8 w-full md:w-auto">
          Continue <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
