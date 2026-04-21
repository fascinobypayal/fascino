import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

interface AdminProfile {
  full_name: string;
  email: string;
  role: string | null;
}

export const useAdminAuth = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  const signOutAndRedirect = useCallback(async () => {
    try {
      await supabase.auth.signOut({ scope: "global" });
    } catch {
      // ignore
    }
    setProfile(null);
    setAuthenticated(false);
    setLoading(false);
    navigate("/login", { replace: true });
  }, [navigate]);

  const validateSession = useCallback(async () => {
    setLoading(true);
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      setProfile(null);
      setAuthenticated(false);
      setLoading(false);
      navigate("/login", { replace: true });
      return;
    }

    const { data: adminProfile, error: profileError } = await supabase
      .from("admin_profiles")
      .select("full_name, email, role")
      .eq("id", session.user.id)
      .maybeSingle();

    if (profileError || !adminProfile) {
      await signOutAndRedirect();
      return;
    }

    setProfile(adminProfile);
    setAuthenticated(true);
    setLoading(false);
  }, [navigate, signOutAndRedirect]);

  // Inactivity timer
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetInactivityTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      signOutAndRedirect();
    }, INACTIVITY_TIMEOUT_MS);
  }, [signOutAndRedirect]);

  useEffect(() => {
    validateSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        setProfile(null);
        setAuthenticated(false);
        setLoading(false);
        navigate("/login", { replace: true });
      } else if (event === "TOKEN_REFRESHED") {
        validateSession();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [validateSession, navigate]);

  // Set up inactivity listeners
  useEffect(() => {
    if (!authenticated) return;

    const events = ["mousedown", "keydown", "touchstart", "scroll"];
    events.forEach((e) => window.addEventListener(e, resetInactivityTimer, { passive: true }));
    resetInactivityTimer(); // start timer

    return () => {
      events.forEach((e) => window.removeEventListener(e, resetInactivityTimer));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [authenticated, resetInactivityTimer]);

  return { profile, loading, authenticated, signOutAndRedirect };
};
