
-- Add allow_online column
ALTER TABLE public.coupons ADD COLUMN allow_online boolean DEFAULT true;

-- Rename applicable_to_cod to allow_cod
ALTER TABLE public.coupons RENAME COLUMN applicable_to_cod TO allow_cod;
