-- product_sizes: per-size stock for admin-managed products
CREATE TABLE public.product_sizes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  size_label text NOT NULL,
  stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, size_label)
);

-- Only admins can manage sizes
CREATE POLICY "Admins manage product_sizes"
  ON public.product_sizes FOR ALL
  TO authenticated
  USING (auth.uid() IN (SELECT id FROM public.admin_profiles))
  WITH CHECK (auth.uid() IN (SELECT id FROM public.admin_profiles));

-- Products with sizes: enforce at least 1 size selected
CREATE OR REPLACE FUNCTION public.validate_product_sizes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
begin
  if not exists (
    select 1 from public.product_sizes
    where product_id = new.product_id
    and stock > 0
  ) then
    raise exception 'Product must have at least one size with stock > 0';
  end if;
  return new;
end;
$function$;

COMMENT ON TABLE public.product_sizes IS 'Tracks available sizes and per-size stock for each product';