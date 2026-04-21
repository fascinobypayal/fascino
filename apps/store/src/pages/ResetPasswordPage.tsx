import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ArrowRight, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import BrandLogo from '@/components/BrandLogo';

const ResetPasswordPage = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isRecovery, isAuthenticated, loading } = useAuth();
  const [hasValidContext, setHasValidContext] = useState<boolean | null>(null);

  useEffect(() => {
    if (loading) return;
    // Allow access if recovery flow is active OR user is authenticated (rare manual visit)
    setHasValidContext(isRecovery || isAuthenticated);
  }, [isRecovery, isAuthenticated, loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirmPassword) {
      toast({ title: 'Please fill all fields', variant: 'destructive' });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    if (password.length < 6) {
      toast({ title: 'Password must be at least 6 characters', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    setIsSubmitting(false);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setSuccess(true);
    }
  };

  if (loading || hasValidContext === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!hasValidContext) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 pb-12 text-center">
        <div className="w-full max-w-sm space-y-6">
          <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="text-xl font-serif font-semibold text-foreground">Invalid or Expired Link</h2>
          <p className="text-sm text-muted-foreground">
            This password reset link is no longer valid. Please request a new one from the login screen.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="w-full flex items-center justify-center gap-2 bg-accent text-accent-foreground py-3.5 rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors shadow-sm"
          >
            Back to Login
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 pb-12 text-center">
        <div className="w-full max-w-sm space-y-6">
          <div className="mx-auto w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-accent" />
          </div>
          <h2 className="text-xl font-serif font-semibold text-foreground">Password Updated</h2>
          <p className="text-sm text-muted-foreground">Your password has been updated successfully.</p>
          <button
            onClick={() => navigate('/login')}
            className="w-full flex items-center justify-center gap-2 bg-accent text-accent-foreground py-3.5 rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors shadow-sm"
          >
            Go to Login
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 pb-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <BrandLogo size="sm" />
        </div>
        <h2 className="text-lg font-serif font-semibold text-foreground mb-1">Set New Password</h2>
        <p className="text-sm text-muted-foreground mb-6">Enter your new password below.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New Password"
              className="w-full pl-11 pr-4 py-3.5 bg-muted/50 border border-border rounded-lg text-sm focus:border-accent focus:outline-none transition-colors"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm Password"
              className="w-full pl-11 pr-4 py-3.5 bg-muted/50 border border-border rounded-lg text-sm focus:border-accent focus:outline-none transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 bg-accent text-accent-foreground py-3.5 rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors shadow-sm disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Update Password <ArrowRight className="h-4 w-4" /></>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
