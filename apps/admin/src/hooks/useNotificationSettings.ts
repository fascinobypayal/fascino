import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface NotificationSettingsData {
  new_orders: boolean;
  order_updates: boolean;
  customer_messages: boolean;
  new_customers: boolean;
  low_stock: boolean;
}

const defaults: NotificationSettingsData = {
  new_orders: true,
  order_updates: true,
  customer_messages: false,
  new_customers: false,
  low_stock: true,
};

export const useNotificationSettings = () => {
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["notification-settings"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return defaults;

      const { data, error } = await supabase
        .from("notification_settings")
        .select("*")
        .eq("admin_id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        // Create default row
        const { data: newRow, error: insertErr } = await supabase
          .from("notification_settings")
          .insert({ admin_id: user.id })
          .select()
          .single();
        if (insertErr) throw insertErr;
        return newRow as NotificationSettingsData;
      }

      return data as NotificationSettingsData;
    },
  });

  const updateSetting = useMutation({
    mutationFn: async (updates: Partial<NotificationSettingsData>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("notification_settings")
        .update(updates)
        .eq("admin_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-settings"] });
      toast({ title: "Setting updated" });
    },
    onError: (err: any) => {
      toast({ title: "Failed to update", description: err.message, variant: "destructive" });
    },
  });

  return { settings: settings || defaults, isLoading, updateSetting };
};
