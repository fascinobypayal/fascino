import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface StoreSettings {
  store_name: string;
  currency: string;
  support_email: string | null;
  support_phone: string | null;
  support_whatsapp: string | null;
  return_policy: string | null;
  exchange_policy: string | null;
  cod_enabled: boolean;
  address: string | null;
}

interface StoreSettingsContextType {
  settings: StoreSettings | null;
  loading: boolean;
  formatPrice: (amount: number) => string;
}

const defaultSettings: StoreSettings = {
  store_name: 'Fascino',
  currency: 'INR',
  support_email: null,
  support_phone: null,
  support_whatsapp: null,
  return_policy: null,
  exchange_policy: null,
  cod_enabled: true,
  address: null,
};

const StoreSettingsContext = createContext<StoreSettingsContextType | undefined>(undefined);

export const StoreSettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('store_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Failed to load store settings:', error);
        setSettings(defaultSettings);
      } else if (!data) {
        setSettings(defaultSettings);
      } else {
        setSettings({
          store_name: data.store_name,
          currency: data.currency || 'INR',
          support_email: data.support_email,
          support_phone: data.support_phone,
          support_whatsapp: data.support_whatsapp,
          return_policy: data.return_policy,
          exchange_policy: data.exchange_policy,
          cod_enabled: data.cod_enabled ?? true,
          address: data.address,
        });
      }
      setLoading(false);
    };
    fetchSettings();
  }, []);

  const formatPrice = (amount: number): string => {
    if (!settings || settings.currency === 'INR') {
      return `₹${amount.toLocaleString('en-IN')}`;
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: settings.currency,
    }).format(amount);
  };

  return (
    <StoreSettingsContext.Provider value={{ settings, loading, formatPrice }}>
      {children}
    </StoreSettingsContext.Provider>
  );
};

export const useStoreSettings = () => {
  const context = useContext(StoreSettingsContext);
  if (!context) throw new Error('useStoreSettings must be used within StoreSettingsProvider');
  return context;
};
