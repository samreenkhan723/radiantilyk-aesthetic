import { Stethoscope } from "lucide-react";
import { toast } from "sonner";

/**
 * Promotional banner advertising the nurse discount (15% off w/ code NURSE15).
 * Click anywhere on the banner to copy the code to the clipboard.
 */
export function NurseDiscountBanner({ className = "" }: { className?: string }) {
  const code = "NURSE15";
  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      toast.success(`Code ${code} copied`);
    } catch {
      toast.info(`Use code ${code} at checkout`);
    }
  }
  return (
    <button
      type="button"
      onClick={copy}
      className={`w-full text-left rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/10 via-secondary/40 to-background px-4 sm:px-5 py-3 sm:py-4 flex items-center gap-3 hover:bg-primary/15 transition ${className}`}
      aria-label="Nurses get 15 percent off your visit. Click to copy code NURSE15."
    >
      <div className="h-9 w-9 rounded-full bg-primary/15 text-primary flex items-center justify-center shrink-0">
        <Stethoscope className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm sm:text-base font-medium">Nurses get 15% off your visit <span aria-hidden>:)</span></div>
        <div className="text-xs text-muted-foreground">Use code <span className="font-mono font-semibold tracking-wider text-foreground">{code}</span> at checkout · tap to copy</div>
      </div>
    </button>
  );
}
