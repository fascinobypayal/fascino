import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface StoreSettings {
  id: string;
  store_name: string;
  address: string | null;
  currency: string | null;
  return_policy: string | null;
  exchange_policy: string | null;
  support_email: string | null;
  support_phone: string | null;
  support_whatsapp: string | null;
  cod_enabled: boolean | null;
}

export const useStoreSettings = () => {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("store_settings")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings(data);
      } else {
        const { data: newRow, error: insertErr } = await supabase
          .from("store_settings")
          .insert({ store_name: "" })
          .select()
          .single();

        if (insertErr) throw insertErr;
        setSettings(newRow);
      }
    } catch (err: any) {
      toast({ title: "Failed to load settings", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateField = (field: keyof StoreSettings, value: string | boolean | null) => {
    setSettings(prev => prev ? { ...prev, [field]: value } : prev);
  };

  const saveSettings = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("store_settings")
        .update({
          store_name: settings.store_name,
          address: settings.address,
          currency: settings.currency,
          return_policy: settings.return_policy,
          exchange_policy: settings.exchange_policy,
          support_email: settings.support_email,
          support_phone: settings.support_phone,
          support_whatsapp: settings.support_whatsapp,
          cod_enabled: settings.cod_enabled,
        })
        .eq("id", settings.id);

      if (error) throw error;
      await fetchSettings();
      toast({ title: "Settings saved successfully" });
    } catch (err: any) {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return { settings, loading, saving, updateField, saveSettings };
};
