-- Allow "best_seller" as a hero CTA link target on home_config.
-- Fixes: new row for relation "home_config" violates check constraint
--        "home_config_hero_link_type_check" when choosing the Best Seller CTA.
-- The Best Sellers storefront page is curated via products.is_new
-- (relabeled "Best Seller" in the admin product editor).

ALTER TABLE public.home_config
  DROP CONSTRAINT IF EXISTS home_config_hero_link_type_check;

ALTER TABLE public.home_config
  ADD CONSTRAINT home_config_hero_link_type_check
  CHECK (
    hero_link_type IS NULL
    OR hero_link_type IN ('collection', 'product', 'best_seller')
  );
