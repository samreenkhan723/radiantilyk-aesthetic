import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

export type AppRole = "admin" | "staff" | "scheduler" | "nurse_practitioner" | "receptionist";

export interface AuthState {
  session: Session | null;
  user: User | null;
  roles: AppRole[];
  staffId: string | null;
  loading: boolean;
  isAdmin: boolean;
  isScheduler: boolean;
  isReceptionist: boolean;
  isStaff: boolean;
  isNP: boolean;
  isClinicalStaff: boolean;
  canSeeAll: boolean; // admin OR scheduler OR receptionist OR nurse practitioner
  canOverride: boolean; // admin OR scheduler OR receptionist OR nurse practitioner (matches is_scheduler_or_admin)
}

export function useAuth(): AuthState {
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [staffId, setStaffId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_evt, s) => {
      setSession(s);
      if (s?.user) {
        // Defer DB calls
        setTimeout(() => loadProfile(s.user.id), 0);
      } else {
        setRoles([]);
        setStaffId(null);
        setLoading(false);
      }
    });
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s?.user) loadProfile(s.user.id);
      else setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function loadProfile(uid: string) {
    const { data: access, error: accessError } = await (supabase as any).rpc("get_my_staff_access");
    if (!accessError && access?.[0]) {
      setRoles((access[0].roles ?? []) as AppRole[]);
      setStaffId(access[0].staff_id ?? null);
      setLoading(false);
      return;
    }

    const [{ data: r }, { data: sp }] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", uid),
      supabase.from("staff_profiles").select("id").eq("user_id", uid).maybeSingle(),
    ]);
    setRoles((r ?? []).map((x) => x.role as AppRole));
    setStaffId(sp?.id ?? null);
    setLoading(false);
  }

  const isAdmin = roles.includes("admin");
  const isScheduler = roles.includes("scheduler");
  const isReceptionist = roles.includes("receptionist");
  const isStaff = roles.includes("staff");
  const isNP = roles.includes("nurse_practitioner");
  const isClinicalStaff = isAdmin || isStaff || isScheduler || isNP;
  const canOverride = isAdmin || isScheduler || isReceptionist || isNP;
  const canSeeAll = canOverride || isNP;
  return {
    session,
    user: session?.user ?? null,
    roles,
    staffId,
    loading,
    isAdmin,
    isScheduler,
    isReceptionist,
    isStaff,
    isNP,
    isClinicalStaff,
    canSeeAll,
    canOverride,
  };
}
