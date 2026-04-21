import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Coupon = Tables<"coupons">;

export type CouponStatus = "active" | "expired" | "disabled";
export type DiscountType = "FLAT" | "PERCENT";

export const getCouponStatus = (coupon: Coupon): CouponStatus => {
  if (!coupon.is_active) return "disabled";
  if (coupon.expiry_date && new Date(coupon.expiry_date) < new Date()) return "expired";
  if (coupon.max_usage != null && (coupon.usage_count ?? 0) >= coupon.max_usage) return "expired";
  return "active";
};

export const useCoupons = () => {
  return useQuery({
    queryKey: ["coupons"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Coupon[];
    },
  });
};

export const useCoupon = (id: string | undefined) => {
  return useQuery({
    queryKey: ["coupons", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data as Coupon | null;
    },
    enabled: !!id,
  });
};

export const useCreateCoupon = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (coupon: TablesInsert<"coupons">) => {
      const { data, error } = await supabase
        .from("coupons")
        .insert(coupon)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["coupons"] }),
  });
};

export const useUpdateCoupon = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: TablesUpdate<"coupons"> & { id: string }) => {
      const { data, error } = await supabase
        .from("coupons")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["coupons"] }),
  });
};

export const useDeleteCoupon = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("coupons").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["coupons"] }),
  });
};
