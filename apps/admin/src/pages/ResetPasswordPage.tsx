import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2, AlertTriangle } from "lucide-react";

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [expired, setExpired] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Listen for the PASSWORD_RECOVERY event that Supabase fires
    // when the user lands with a recovery token in the URL
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setSessionReady(true);
        setChecking(false);
      }
    });

    // Also check if there's already a session (page refresh scenario)
    const checkSession = async () => {
      // Give a moment for the auth state change to fire
      await new Promise((r) => setTimeout(r, 1500));

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setSessionReady(true);
      } else {
        // Check URL hash for error (expired link)
        const hash = window.location.hash;
        if (hash.includes("error_description") || hash.includes("error=")) {
          setExpired(true);
        } else if (!sessionReady) {
          // No session and no recovery event — redirect
          navigate("/login", { replace: true });
          return;
        }
      }
      setChecking(false);
    };

    checkSession();

    return () => {
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const isValid = password.length >= 8 && password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        setError("Could not update password. Please try again.");
      } else {
        setSuccess(true);
        // Sign out and redirect to login after 2 seconds
        await supabase.auth.signOut();
        setTimeout(() => {
          navigate("/login", { replace: true });
        }, 2000);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (expired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6">
        <div className="w-full max-w-sm">
          <div className="luxury-card space-y-6 p-8 text-center">
            <AlertTriangle className="w-10 h-10 text-destructive mx-auto" />
            <div className="space-y-1">
              <h1 className="text-2xl text-foreground">Link Expired</h1>
              <p className="text-sm text-muted-foreground font-sans">
                This reset link has expired. Please request a new one.
              </p>
            </div>
            <Link to="/forgot-password">
              <Button className="w-full h-11 rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary/90 transition-colors">
                Request new link
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm">
        <div className="luxury-card space-y-8 p-8">
          <div className="text-center space-y-1">
            <h1 className="text-2xl text-foreground">New Password</h1>
            <p className="text-sm text-muted-foreground font-sans">
              Choose a new password for your account
            </p>
          </div>

          {success ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <CheckCircle2 className="w-10 h-10 text-primary" />
              <p className="text-sm text-muted-foreground text-center">
                Password updated successfully. Redirecting to sign in…
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground/80">New password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Minimum 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  disabled={loading}
                  className="h-11 rounded-xl bg-muted/50 border-0 focus-visible:ring-primary/30"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-foreground/80">Confirm password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  disabled={loading}
                  className="h-11 rounded-xl bg-muted/50 border-0 focus-visible:ring-primary/30"
                />
              </div>

              {error && (
                <div className="rounded-xl bg-destructive/10 px-4 py-3">
                  <p className="text-sm text-destructive text-center">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-11 rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary/90 transition-colors"
                disabled={loading || !isValid}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Updating…
                  </>
                ) : (
                  "Update password"
                )}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
