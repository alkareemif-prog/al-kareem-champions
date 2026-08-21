import { useCallback, useEffect, useRef, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "super_admin" | "competition_admin" | "evaluator" | "competitor";

function isRateLimitOrAuthFailure(error: unknown): boolean {
  const anyError = error as { status?: number; message?: string } | null;
  const status = anyError?.status;
  const message = (anyError?.message ?? "").toLowerCase();
  return (
    status === 429 ||
    message.includes("rate limit") ||
    message.includes("too many requests") ||
    message.includes("refresh token") ||
    message.includes("invalid claim")
  );
}

/** Last-resort recovery from a corrupted session that keeps hammering the auth API. */
export async function resetAuthState() {
  try {
    await supabase.auth.signOut({ scope: "local" });
  } catch {
    // ignore — we are clearing everything anyway
  }
  if (typeof window !== "undefined") {
    try {
      window.localStorage.clear();
    } catch {
      // ignore
    }
    if (window.location.pathname !== "/auth") {
      window.location.replace("/auth");
    }
  }
}

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);
  const sessionKeyRef = useRef<string | null>(null);
  const recoveredRef = useRef(false);

  const recover = useCallback(() => {
    if (recoveredRef.current) return;
    recoveredRef.current = true;
    void resetAuthState();
  }, []);

  useEffect(() => {
    let active = true;

    // Only commit state when the identity/token actually changed — this is what
    // prevents the render → getSession → setState → render loop that triggers 429s.
    const commit = (next: Session | null) => {
      const key = next ? `${next.user.id}:${next.access_token}` : null;
      if (key === sessionKeyRef.current) return;
      sessionKeyRef.current = key;
      if (!active) return;
      setSession(next);
      setUser(next?.user ?? null);
    };

    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      if (event === "TOKEN_REFRESHED" && !next) {
        recover();
        return;
      }
      commit(next);
    });

    (async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        commit(data.session);
      } catch (error) {
        if (isRateLimitOrAuthFailure(error)) {
          recover();
        } else {
          console.error("[auth] session check failed", error);
        }
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [recover]);

  useEffect(() => {
    if (!user) {
      setRoles([]);
      return;
    }
    let active = true;
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          if (isRateLimitOrAuthFailure(error)) recover();
          return;
        }
        setRoles(((data ?? []) as { role: AppRole }[]).map((r) => r.role));
      });
    return () => {
      active = false;
    };
  }, [user, recover]);

  const isAdmin = roles.includes("super_admin") || roles.includes("competition_admin");

  return {
    session,
    user,
    roles,
    loading,
    isAdmin,
    isEvaluator: roles.includes("evaluator"),
  };
}
