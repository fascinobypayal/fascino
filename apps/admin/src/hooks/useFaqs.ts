import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

export type FAQ = Tables<"faqs">;

export const useFaqs = () => {
  return useQuery({
    queryKey: ["faqs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("faqs")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as FAQ[];
    },
  });
};

export const useCreateFaq = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (faq: { question: string; answer: string }) => {
      const { error } = await supabase.from("faqs").insert(faq);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["faqs"] });
      toast({ title: "FAQ added" });
    },
    onError: (err: any) => {
      toast({ title: "Failed to add FAQ", description: err.message, variant: "destructive" });
    },
  });
};

export const useUpdateFaq = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (faq: { id: string; question: string; answer: string }) => {
      const { error } = await supabase
        .from("faqs")
        .update({ question: faq.question, answer: faq.answer })
        .eq("id", faq.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["faqs"] });
      toast({ title: "FAQ updated" });
    },
    onError: (err: any) => {
      toast({ title: "Failed to update FAQ", description: err.message, variant: "destructive" });
    },
  });
};

export const useDeleteFaq = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("faqs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["faqs"] });
      toast({ title: "FAQ deleted" });
    },
    onError: (err: any) => {
      toast({ title: "Failed to delete FAQ", description: err.message, variant: "destructive" });
    },
  });
};
