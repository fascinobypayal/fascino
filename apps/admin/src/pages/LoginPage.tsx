import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import fascinoLogo from "@/assets/logo.svg";

const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const { data: profile } = await supabase
            .from("admin_profiles")
            .select("id")
            .eq("id", session.user.id)
            .maybeSingle();

          if (profile) {
            navigate("/", { replace: true });
            return;
          } else {
            await supabase.auth.signOut();
          }
        }
      } catch {
        // Ignore errors, just show login
      } finally {
        setCheckingSession(false);
      }
    };

    checkExistingSession();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }
    if (!password) {
      setError("Password is required");
      return;
    }

    setLoading(true);
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        if (signInError.message?.includes("Invalid login credentials")) {
          setError("Invalid email or password");
        } else if (signInError.message?.includes("Email not confirmed")) {
          setError("Please confirm your email address before signing in");
        } else {
          setError("Invalid email or password");
        }
        setLoading(false);
        return;
      }

      if (data.session) {
        const { data: profile } = await supabase
          .from("admin_profiles")
          .select("id")
          .eq("id", data.session.user.id)
          .maybeSingle();

        if (profile) {
          navigate("/", { replace: true });
        } else {
          await supabase.auth.signOut();
          setError("Access denied");
        }
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm">
        {/* Card */}
        <div className="luxury-card space-y-8 p-8">
          {/* Brand */}
          <div className="text-center space-y-3">
            <img src={fascinoLogo} alt="Fascino logo" className="w-16 h-16 mx-auto object-contain" />
            <div className="space-y-1">
              <h1 className="text-3xl text-foreground">Fascino</h1>
              <p className="text-sm text-muted-foreground font-sans">Admin Dashboard</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground/80">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                disabled={loading}
                className="h-11 rounded-xl bg-muted/50 border-0 focus-visible:ring-primary/30"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-foreground/80">Password</Label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-primary hover:text-secondary transition-colors"
                  tabIndex={-1}
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
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
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
