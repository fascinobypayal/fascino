import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface Category {
  id: string;
  name: string;
  sort_order: number;
  created_at: string;
}

export const useCategories = () => {
  const queryClient = useQueryClient();

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as Category[];
    },
  });

  const addCategory = useMutation({
    mutationFn: async (name: string) => {
      const maxOrder = categories.reduce((m, c) => Math.max(m, c.sort_order), 0);
      const { error } = await supabase
        .from("categories")
        .insert({ name: name.trim(), sort_order: maxOrder + 1 });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast({ title: "Category added" });
    },
    onError: (e: Error) => {
      toast({ title: "Error adding category", description: e.message, variant: "destructive" });
    },
  });

  const renameCategory = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase
        .from("categories")
        .update({ name: name.trim() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast({ title: "Category renamed" });
    },
    onError: (e: Error) => {
      toast({ title: "Error renaming category", description: e.message, variant: "destructive" });
    },
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      // Guard: check if any product uses this category
      const cat = categories.find((c) => c.id === id);
      if (cat) {
        const { count } = await supabase
          .from("products")
          .select("id", { count: "exact", head: true })
          .eq("category", cat.name);
        if ((count ?? 0) > 0) {
          throw new Error(`${count} product${count === 1 ? "" : "s"} use this category. Reassign them first.`);
        }
      }
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast({ title: "Category deleted" });
    },
    onError: (e: Error) => {
      toast({ title: "Cannot delete category", description: e.message, variant: "destructive" });
    },
  });

  const categoryNames = categories.map((c) => c.name);

  return {
    categories,
    categoryNames,
    isLoading,
    addCategory,
    renameCategory,
    deleteCategory,
  };
};
