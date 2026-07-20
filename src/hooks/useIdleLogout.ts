import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

/**
 * HIPAA: auto-logout staff after inactivity.
 * - Idle threshold: 15 minutes
 * - Warning shown at 14 minutes
 * Activity = mouse, keyboard, touch, scroll. Re-arms every interaction.
 */
const IDLE_MS = 15 * 60 * 1000;
const WARN_MS = 14 * 60 * 1000;

export function useIdleLogout(enabled: boolean) {
  const lastActivity = useRef<number>(Date.now());
  const warned = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    const bump = () => {
      lastActivity.current = Date.now();
      warned.current = false;
    };
    const events = ["mousemove", "mousedown", "keydown", "scroll", "touchstart"] as const;
    events.forEach((e) => window.addEventListener(e, bump, { passive: true }));
    document.addEventListener("visibilitychange", bump);

    const interval = window.setInterval(async () => {
      const idle = Date.now() - lastActivity.current;
      if (idle >= IDLE_MS) {
        try { await supabase.auth.signOut(); } catch {}
        window.location.href = "/staff/login?reason=idle";
        return;
      }
      if (idle >= WARN_MS && !warned.current) {
        warned.current = true;
        toast({
          title: "You'll be signed out soon",
          description: "Move your mouse or tap the screen to stay signed in. Auto-logout for patient privacy.",
        });
      }
    }, 15_000);

    return () => {
      events.forEach((e) => window.removeEventListener(e, bump));
      document.removeEventListener("visibilitychange", bump);
      window.clearInterval(interval);
    };
  }, [enabled]);
}
