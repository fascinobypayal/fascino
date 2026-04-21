import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, User, Phone, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import BrandLogo from '@/components/BrandLogo';
import { isValidPhone, sanitizePhone } from '@/lib/phoneValidation';

type View = 'auth' | 'forgot-password' | 'reset-sent';

const LoginPage = () => {
  const { isAuthenticated, loading } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [view, setView] = useState<View>('auth');
  const { login, signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const locationState = location.state as { from?: string; defaultSignUp?: boolean } | null;
  const redirectTo = locationState?.from || '/';

  // Default to signup tab when coming from checkout
  useEffect(() => {
    if (locationState?.defaultSignUp) {
      setIsSignUp(true);
    }
  }, []);

  // Redirect authenticated users away from login page
  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate(redirectTo, { replace: true });
    }
  }, [loading, isAuthenticated, navigate, redirectTo]);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({ title: 'Please enter your email', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/login',
    });
    setIsSubmitting(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setView('reset-sent');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: 'Please fill all fields', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);

    if (isSignUp) {
      if (!name) {
        toast({ title: 'Please enter your name', variant: 'destructive' });
        setIsSubmitting(false);
        return;
      }
      if (!isValidPhone(phone)) {
        setPhoneError('Enter a valid 10-digit mobile number');
        setIsSubmitting(false);
        return;
      }
      const { error } = await signUp(email, password, name, phone);
      if (error) {
        toast({ title: 'Sign up failed', description: error, variant: 'destructive' });
      } else {
        toast({ title: 'Welcome to Fascino!' });
        // Auto-redirect happens via useEffect when isAuthenticated becomes true
      }
    } else {
      const { error } = await login(email, password);
      if (error) {
        toast({ title: 'Login failed', description: error, variant: 'destructive' });
      } else {
        toast({ title: 'Welcome back!' });
        navigate(redirectTo);
      }
    }
    setIsSubmitting(false);
  };

  // ── Reset Password Sent Screen ──
  if (view === 'reset-sent') {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <button onClick={() => setView('auth')} className="p-4 self-start" aria-label="Go back">
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-12 text-center">
          <div className="w-full max-w-sm space-y-6">
            <div className="mx-auto w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center">
              <Mail className="h-8 w-8 text-accent" />
            </div>
            <h2 className="text-xl font-serif font-semibold text-foreground">Check Your Email</h2>
            <p className="text-sm text-muted-foreground">
              We've sent a password reset link to <span className="font-medium text-foreground">{email}</span>.
            </p>
            <button
              onClick={() => { setView('auth'); setIsSignUp(false); }}
              className="w-full flex items-center justify-center gap-2 bg-accent text-accent-foreground py-3.5 rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors shadow-sm"
            >
              Back to Login
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Forgot Password Screen ──
  if (view === 'forgot-password') {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <button onClick={() => setView('auth')} className="p-4 self-start" aria-label="Go back">
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-12">
          <div className="w-full max-w-sm">
            <div className="text-center mb-8">
              <BrandLogo size="sm" />
            </div>
            <h2 className="text-lg font-serif font-semibold text-foreground mb-1">Forgot Password</h2>
            <p className="text-sm text-muted-foreground mb-6">Enter your email and we'll send you a reset link.</p>
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email Address"
                  className="w-full pl-11 pr-4 py-3.5 bg-muted/50 border border-border rounded-lg text-sm focus:border-accent focus:outline-none transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 bg-accent text-accent-foreground py-3.5 rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors shadow-sm disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Send Reset Link <ArrowRight className="h-4 w-4" /></>}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ── Main Auth Screen ──
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <button onClick={() => navigate(-1)} className="p-4 self-start" aria-label="Go back">
        <ArrowLeft className="h-5 w-5 text-foreground" />
      </button>

      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-12">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <BrandLogo size="sm" />
          </div>

          {/* Tabs */}
          <div className="flex border-b border-border mb-6">
            <button
              onClick={() => setIsSignUp(false)}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                !isSignUp ? 'text-foreground border-b-2 border-accent' : 'text-muted-foreground'
              }`}
            >
              Log In
            </button>
            <button
              onClick={() => setIsSignUp(true)}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                isSignUp ? 'text-foreground border-b-2 border-accent' : 'text-muted-foreground'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full Name"
                    className="w-full pl-11 pr-4 py-3.5 bg-muted/50 border border-border rounded-lg text-sm focus:border-accent focus:outline-none transition-colors" />
                </div>
                <div>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => { setPhone(sanitizePhone(e.target.value)); setPhoneError(''); }}
                      placeholder="Mobile Number (10 digits)"
                      className={`w-full pl-11 pr-4 py-3.5 bg-muted/50 border rounded-lg text-sm focus:outline-none transition-colors ${
                        phoneError ? 'border-destructive focus:border-destructive' : 'border-border focus:border-accent'
                      }`}
                    />
                  </div>
                  {phoneError && <p className="text-xs text-destructive mt-1">{phoneError}</p>}
                </div>
              </>
            )}
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email Address"
                className="w-full pl-11 pr-4 py-3.5 bg-muted/50 border border-border rounded-lg text-sm focus:border-accent focus:outline-none transition-colors" />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password"
                className="w-full pl-11 pr-4 py-3.5 bg-muted/50 border border-border rounded-lg text-sm focus:border-accent focus:outline-none transition-colors" />
            </div>

            {!isSignUp && (
              <div className="text-right">
                <button type="button" onClick={() => setView('forgot-password')} className="text-xs text-accent hover:underline">
                  Forgot Password?
                </button>
              </div>
            )}

            <button type="submit" disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 bg-accent text-accent-foreground py-3.5 rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors shadow-sm disabled:opacity-50">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <>{isSignUp ? 'Create Account' : 'Log In'} <ArrowRight className="h-4 w-4" /></>}
            </button>
          </form>

          <p className="text-center text-xs text-muted-foreground mt-6">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
