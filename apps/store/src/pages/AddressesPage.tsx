import { useState, useEffect } from 'react';
import PageHeader from '@/components/PageHeader';
import { MapPin, Plus, Trash2, Edit2, Check, Loader2 } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useBottomNav } from '@/contexts/BottomNavContext';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { isValidPhone, sanitizePhone } from '@/lib/phoneValidation';

interface Address {
  id: string;
  full_name: string;
  phone: string;
  address_line_1: string;
  address_line_2?: string | null;
  city: string;
  state: string;
  postal_code: string;
  is_default: boolean;
}

const emptyForm = {
  full_name: '',
  phone: '',
  address_line_1: '',
  address_line_2: '',
  city: '',
  state: '',
  postal_code: '',
};

const AddressesPage = () => {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const { hideNav, showNav } = useBottomNav();
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchAddresses = async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('customer_addresses')
      .select('*')
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setAddresses(data.map(a => ({
        id: a.id,
        full_name: a.full_name,
        phone: a.phone,
        address_line_1: a.address_line_1,
        address_line_2: a.address_line_2,
        city: a.city,
        state: a.state,
        postal_code: a.postal_code,
        is_default: a.is_default ?? false,
      })));
    }
    setLoading(false);
  };

  useEffect(() => { fetchAddresses(); }, [user]);

  const handleOpenSheet = (address?: Address) => {
    hideNav();
    if (address) {
      setEditingAddress(address);
      setFormData({
        full_name: address.full_name,
        phone: address.phone,
        address_line_1: address.address_line_1,
        address_line_2: address.address_line_2 || '',
        city: address.city,
        state: address.state,
        postal_code: address.postal_code,
      });
    } else {
      setEditingAddress(null);
      setFormData(emptyForm);
    }
    setShowAddSheet(true);
  };

  const handleCloseSheet = () => {
    showNav();
    setShowAddSheet(false);
    setEditingAddress(null);
    setFormData(emptyForm);
  };

  const [phoneError, setPhoneError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      const sanitized = sanitizePhone(value);
      setFormData((prev) => ({ ...prev, phone: sanitized }));
      setPhoneError(sanitized.length > 0 && sanitized.length !== 10 ? 'Enter a valid 10-digit phone number' : '');
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async () => {
    if (!user || !formData.full_name || !formData.phone || !formData.address_line_1 || !formData.city || !formData.state || !formData.postal_code) {
      toast({ title: 'Please fill all required fields' });
      return;
    }
    if (!isValidPhone(formData.phone)) {
      setPhoneError('Enter a valid 10-digit phone number');
      return;
    }

    if (editingAddress) {
      const { error } = await supabase
        .from('customer_addresses')
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          address_line_1: formData.address_line_1,
          address_line_2: formData.address_line_2 || null,
          city: formData.city,
          state: formData.state,
          postal_code: formData.postal_code,
        })
        .eq('id', editingAddress.id);

      if (error) {
        toast({ title: 'Error updating address', variant: 'destructive' });
        return;
      }
      toast({ title: 'Address updated' });
    } else {
      const isFirst = addresses.length === 0;
      const { error } = await supabase
        .from('customer_addresses')
        .insert({
          customer_id: user.id,
          full_name: formData.full_name,
          phone: formData.phone,
          address_line_1: formData.address_line_1,
          address_line_2: formData.address_line_2 || null,
          city: formData.city,
          state: formData.state,
          postal_code: formData.postal_code,
          is_default: isFirst,
        });

      if (error) {
        toast({ title: 'Error saving address', variant: 'destructive' });
        return;
      }
      toast({ title: 'Address added' });
    }
    handleCloseSheet();
    fetchAddresses();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('customer_addresses').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error deleting address', variant: 'destructive' });
      return;
    }
    toast({ title: 'Address removed' });
    fetchAddresses();
  };

  const handleSetDefault = async (id: string) => {
    if (!user) return;
    // Unset all defaults, then set the chosen one
    await supabase.from('customer_addresses').update({ is_default: false }).eq('customer_id', user.id);
    await supabase.from('customer_addresses').update({ is_default: true }).eq('id', id);
    toast({ title: 'Default address updated' });
    fetchAddresses();
  };

  if (loading) {
    return (
      <div className="min-h-screen pb-20">
        <PageHeader title="Addresses" showBack />
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <PageHeader title="Addresses" showBack />

      {addresses.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[60vh] px-4 text-center">
          <MapPin className="h-16 w-16 text-muted-foreground/50 mb-4" />
          <h2 className="font-serif text-xl mb-2">No saved addresses</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Add your delivery addresses for faster checkout
          </p>
          <button
            onClick={() => handleOpenSheet()}
            className="btn-filled px-6 py-2.5 text-sm uppercase tracking-wider"
          >
            Add Address
          </button>
        </div>
      ) : (
        <>
          <div className="px-4 py-4 space-y-4">
            {addresses.map((address) => (
              <div
                key={address.id}
                className={`p-4 border ${
                  address.is_default ? 'border-accent bg-accent/5' : 'border-border'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{address.full_name}</span>
                    {address.is_default && (
                      <span className="text-[10px] uppercase tracking-wider text-accent bg-accent/10 px-2 py-0.5">
                        Default
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenSheet(address)}
                      className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label="Edit address"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(address.id)}
                      className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                      aria-label="Delete address"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{address.address_line_1}</p>
                {address.address_line_2 && (
                  <p className="text-sm text-muted-foreground">{address.address_line_2}</p>
                )}
                <p className="text-sm text-muted-foreground">
                  {address.city}, {address.state} - {address.postal_code}
                </p>
                <p className="text-sm text-muted-foreground mt-1">{address.phone}</p>
                
                {!address.is_default && (
                  <button
                    onClick={() => handleSetDefault(address.id)}
                    className="flex items-center gap-1.5 mt-3 text-xs text-accent"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Set as default
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="px-4 py-4">
            <button
              onClick={() => handleOpenSheet()}
              className="w-full flex items-center justify-center gap-2 btn-premium py-3 text-sm uppercase tracking-wider"
            >
              <Plus className="h-4 w-4" />
              Add New Address
            </button>
          </div>
        </>
      )}

      {/* Add/Edit Address Sheet */}
      <Sheet open={showAddSheet} onOpenChange={(open) => !open && handleCloseSheet()}>
        <SheetContent side="bottom" className="h-[85vh] overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle className="font-serif text-xl">
              {editingAddress ? 'Edit Address' : 'Add New Address'}
            </SheetTitle>
          </SheetHeader>

          <div className="space-y-4">
            <input type="text" name="full_name" value={formData.full_name} onChange={handleInputChange} placeholder="Full Name" className="w-full px-4 py-3 bg-transparent border border-border focus:border-accent focus:outline-none transition-colors text-sm" />
            <div>
              <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="Phone Number" inputMode="numeric" maxLength={10} className={`w-full px-4 py-3 bg-transparent border ${phoneError ? 'border-destructive' : 'border-border'} focus:border-accent focus:outline-none transition-colors text-sm`} />
              {phoneError && <p className="text-[11px] text-destructive mt-1">{phoneError}</p>}
            </div>
            <input type="text" name="address_line_1" value={formData.address_line_1} onChange={handleInputChange} placeholder="Address Line 1" className="w-full px-4 py-3 bg-transparent border border-border focus:border-accent focus:outline-none transition-colors text-sm" />
            <input type="text" name="address_line_2" value={formData.address_line_2} onChange={handleInputChange} placeholder="Address Line 2 (Optional)" className="w-full px-4 py-3 bg-transparent border border-border focus:border-accent focus:outline-none transition-colors text-sm" />
            <div className="grid grid-cols-2 gap-4">
              <input type="text" name="city" value={formData.city} onChange={handleInputChange} placeholder="City" className="w-full px-4 py-3 bg-transparent border border-border focus:border-accent focus:outline-none transition-colors text-sm" />
              <input type="text" name="state" value={formData.state} onChange={handleInputChange} placeholder="State" className="w-full px-4 py-3 bg-transparent border border-border focus:border-accent focus:outline-none transition-colors text-sm" />
            </div>
            <input type="text" name="postal_code" value={formData.postal_code} onChange={handleInputChange} placeholder="PIN Code" className="w-full px-4 py-3 bg-transparent border border-border focus:border-accent focus:outline-none transition-colors text-sm" />

            <button onClick={handleSave} className="w-full mt-4 btn-filled py-3 text-sm uppercase tracking-wider">
              {editingAddress ? 'Update Address' : 'Save Address'}
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default AddressesPage;
