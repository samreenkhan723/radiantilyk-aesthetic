// Shared availability calendar + slot grid used by both the public booking
// funnel (StepDateTime) and the rebook/reschedule dialog (BookingStatus).
// Owning the data fetch + UI in one place keeps the two flows visually and
// behaviorally identical — pick a calendar day, see slot buttons, done.
import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { ArrowRight, Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  serviceIds: string[];
  staffId: string | null;
  locationId: string | null;
  value: string | null;
  onChange: (slotIso: string) => void;
  /** Compact = dialog/popover variant (smaller paddings, single column). */
  compact?: boolean;
  /** Hide the "Next available" shortcut (reschedule flows don't need it). */
  hideNextAvailable?: boolean;
  /** Pre-loaded per-day slots — if provided, skips the per-day fetch. */
  externalSlots?: string[];
  externalSlotsLoading?: boolean;
  onDateChange?: (d: Date | undefined) => void;
}

export function SlotPicker({
  serviceIds, staffId, locationId, value, onChange,
  compact, hideNextAvailable, externalSlots, externalSlotsLoading, onDateChange,
}: Props) {
  const tomorrow = useMemo(() => {
    const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + 1); return d;
  }, []);
  const max = useMemo(() => { const d = new Date(); d.setMonth(d.getMonth() + 6); return d; }, []);

  const [date, setDate] = useState<Date | undefined>();
  const [availableSet, setAvailableSet] = useState<Set<string>>(new Set());
  const [nextAvail, setNextAvail] = useState<{ date: string; slot: string } | null>(null);
  const [loadingRange, setLoadingRange] = useState(true);
  const [internalSlots, setInternalSlots] = useState<string[]>([]);
  const [internalLoading, setInternalLoading] = useState(false);

  const slots = externalSlots ?? internalSlots;
  const loadingSlots = externalSlots ? !!externalSlotsLoading : internalLoading;

  // Load the 6-month availability map so the calendar can dim unavailable days.
  useEffect(() => {
    if (serviceIds.length === 0 || !locationId || !staffId) return;
    setLoadingRange(true);
    supabase.functions.invoke("get-availability-range", {
      body: { serviceIds, staffId, locationId, days: 180 },
    }).then(({ data }) => {
      setAvailableSet(new Set(data?.availableDates ?? []));
      setNextAvail(data?.nextAvailable ?? null);
      setLoadingRange(false);
    });
  }, [serviceIds.join(","), locationId, staffId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Per-day slot fetch (only when caller did not provide externalSlots).
  useEffect(() => {
    if (externalSlots) return;
    if (!date || serviceIds.length === 0 || !staffId || !locationId) {
      setInternalSlots([]); return;
    }
    setInternalLoading(true);
    supabase.functions.invoke("get-availability", {
      body: { serviceIds, staffId, locationId, date: format(date, "yyyy-MM-dd") },
    }).then(({ data }) => {
      setInternalSlots(data?.slots ?? []);
      setInternalLoading(false);
    });
  }, [date, serviceIds.join(","), staffId, locationId, externalSlots]); // eslint-disable-line react-hooks/exhaustive-deps

  const ymd = (d: Date) => format(d, "yyyy-MM-dd");

  const setDateAndNotify = (d: Date | undefined) => {
    setDate(d);
    onDateChange?.(d);
  };

  const pickNext = () => {
    if (!nextAvail) return;
    const [y, m, dd] = nextAvail.date.split("-").map(Number);
    setDateAndNotify(new Date(y, m - 1, dd));
    setTimeout(() => onChange(nextAvail.slot), 600);
  };

  const layout = compact
    ? "grid gap-4"
    : "grid md:grid-cols-2 gap-6 md:gap-8";

  return (
    <div>
      {!hideNextAvailable && nextAvail && !loadingRange && (
        <button
          type="button"
          onClick={pickNext}
          className="w-full sm:w-auto inline-flex items-center justify-between sm:justify-start gap-3 rounded-full border border-primary/30 bg-primary/5 hover:bg-primary/10 transition px-4 py-2.5 mb-6 text-sm"
        >
          <span className="inline-flex items-center gap-2 text-primary">
            <Sparkles className="h-3.5 w-3.5" /> Next available
          </span>
          <span className="font-medium">
            {format(new Date(nextAvail.date + "T12:00:00"), "EEE, MMM d")} · {format(new Date(nextAvail.slot), "h:mm a")}
          </span>
          <ArrowRight className="h-3.5 w-3.5 opacity-60" />
        </button>
      )}

      <div className={layout}>
        <div className={`rounded-2xl border border-border bg-card ${compact ? "p-1 sm:p-2" : "p-2 sm:p-3"}`}>
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDateAndNotify}
            disabled={(d) => {
              if (d < tomorrow || d > max) return true;
              if (loadingRange) return false;
              return !availableSet.has(ymd(d));
            }}
            modifiers={{ available: (d) => availableSet.has(ymd(d)) }}
            modifiersClassNames={{ available: "font-semibold text-primary" }}
            className="pointer-events-auto mx-auto"
          />
          {!loadingRange && availableSet.size === 0 && (
            <p className="text-xs text-muted-foreground text-center px-3 pb-2">
              No availability in the next 6 months.
            </p>
          )}
        </div>

        <div>
          {!date && <p className="text-muted-foreground text-sm">Select a date to see available times.</p>}
          {date && loadingSlots && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading times…
            </div>
          )}
          {date && !loadingSlots && slots.length === 0 && (
            <p className="text-muted-foreground text-sm">No availability that day. Please try another date.</p>
          )}
          {date && !loadingSlots && slots.length > 0 && (
            <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Available times">
              {slots.map((s) => {
                const isSel = value === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => onChange(s)}
                    role="radio"
                    aria-checked={isSel}
                    className={`rounded-full border min-h-[52px] min-w-[44px] px-2 py-3 text-sm font-medium transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background ${isSel ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/50"}`}
                  >
                    {format(new Date(s), "h:mm a")}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
