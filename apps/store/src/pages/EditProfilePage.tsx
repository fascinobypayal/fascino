import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '@/components/PageHeader';
import { Camera, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const isValidPhone = (phone: string) => /^\d{10}$/.test(phone.replace(/\s+/g, ''));

const EditProfilePage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });

  useEffect(() => {
    if (!user) return;
    const loadProfile = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('customers')
        .select('full_name, email, phone')
        .eq('id', user.id)
        .maybeSingle();

      setFormData({
        name: data?.full_name || user.user_metadata?.full_name || '',
        email: data?.email || user.email || '',
        phone: data?.phone || '',
      });
      setLoading(false);
    };
    loadProfile();
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      // Allow only digits, max 10
      const digits = value.replace(/\D/g, '').slice(0, 10);
      setFormData((prev) => ({ ...prev, phone: digits }));
      setPhoneError(digits.length > 0 && digits.length !== 10 ? 'Enter a valid 10-digit phone number' : '');
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async () => {
    if (!user) return;

    if (formData.phone && !isValidPhone(formData.phone)) {
      setPhoneError('Enter a valid 10-digit phone number');
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from('customers')
      .update({
        full_name: formData.name || null,
        phone: formData.phone || null,
      })
      .eq('id', user.id);

    // Also update auth metadata for display name
    if (formData.name) {
      await supabase.auth.updateUser({ data: { full_name: formData.name } });
    }

    setSaving(false);

    if (error) {
      toast({ title: 'Error updating profile', variant: 'destructive' });
      return;
    }

    toast({
      title: 'Profile updated',
      description: 'Your changes have been saved',
    });
    navigate('/profile');
  };

  const userInitial = (formData.name || formData.email || 'U').charAt(0).toUpperCase();

  if (loading) {
    return (
      <div className="min-h-screen pb-20">
        <PageHeader title="Edit Profile" showBack />
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <PageHeader title="Edit Profile" showBack />

      {/* Profile Photo */}
      <div className="flex flex-col items-center py-8 border-b border-border">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center">
            <span className="font-serif text-3xl text-foreground">{userInitial}</span>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="px-4 py-6 space-y-4">
        <div>
          <label className="text-xs uppercase tracking-widest text-muted-foreground mb-2 block">
            Full Name
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className="w-full px-4 py-3 bg-transparent border border-border focus:border-accent focus:outline-none transition-colors text-sm"
          />
        </div>

        <div>
          <label className="text-xs uppercase tracking-widest text-muted-foreground mb-2 block">
            Email Address
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            disabled
            className="w-full px-4 py-3 bg-muted/50 border border-border text-muted-foreground text-sm cursor-not-allowed"
          />
          <p className="text-[11px] text-muted-foreground mt-1">Email cannot be changed</p>
        </div>

        <div>
          <label className="text-xs uppercase tracking-widest text-muted-foreground mb-2 block">
            Phone Number
          </label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            placeholder="10-digit phone number"
            inputMode="numeric"
            maxLength={10}
            className={`w-full px-4 py-3 bg-transparent border ${phoneError ? 'border-destructive' : 'border-border'} focus:border-accent focus:outline-none transition-colors text-sm`}
          />
          {phoneError && <p className="text-[11px] text-destructive mt-1">{phoneError}</p>}
        </div>
      </div>

      {/* Save Button */}
      <div className="px-4 py-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full btn-filled py-3 text-sm uppercase tracking-wider disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Save Changes
        </button>
      </div>
    </div>
  );
};

export default EditProfilePage;
