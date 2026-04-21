

# Comprehensive QA Test Plan — Fascino Store

A full production-readiness audit covering every screen, flow, edge case, and failure mode. Tests are organized by priority and area, with clear pass criteria for each.

## Phase 1 — Critical Path Tests (P0 — Blockers)

These flows must work flawlessly. Failure = revenue loss.

### 1.1 Guest → Authenticated Cart Merge
- Add 3 items as guest (different products + customizations + notes)
- Apply a coupon as guest
- Refresh browser → cart + coupon must persist (localStorage)
- Click "Proceed to Checkout" → signup
- Verify: all 3 items, customizations, notes, AND coupon merge into DB cart
- Verify: localStorage is cleared after merge
- Edge: signup fails midway → guest cart must NOT be lost

### 1.2 Checkout — Online Payment (Razorpay)
- Place order with valid address → Razorpay opens
- Complete payment → order created, cart cleared, redirect to success page
- Cancel Razorpay modal → cart preserved, no orphan order
- Payment timeout → user sees retry option
- Network failure during payment → no double-charge
- Verify webhook idempotency (duplicate `process_successful_payment` calls)

### 1.3 Checkout — COD
- Place COD order → order created instantly
- Coupon with `allow_cod=false` → COD button disabled with reason
- Out-of-stock product → stock error modal with adjust/remove options

### 1.4 Stock Validation
- Add product with stock=5, set quantity=10 → blocked at checkout
- Two users buy last item simultaneously → only one succeeds, other gets stock error
- Cancelled order → stock restored correctly

## Phase 2 — Authentication & Account (P0)

### 2.1 Signup
- Valid signup → instant login → redirect to intended page
- Invalid phone (9 digits, letters, 11 digits) → validation error
- Duplicate email → clear error message
- Weak password → Supabase error surfaced
- Phone stored correctly in `customers` table

### 2.2 Login
- Valid credentials → redirect to `from` route
- Wrong password → error toast, no lockout
- Non-existent email → generic error (no user enumeration)

### 2.3 Password Reset
- Request reset → email sent confirmation screen
- Click link → lands on `/reset-password`
- Set new password → auto-login or redirect to login
- Recovery token detection works on page load
- Old password no longer works

### 2.4 Session Handling
- Refresh token expired → graceful logout, no crash (currently throws `AuthApiError` in console)
- Logout → all contexts clear (cart, wishlist, notifications)
- Multi-tab: logout in one tab → other tabs detect

## Phase 3 — Product Catalog (P1)

### 3.1 Home Page
- Hero CTA → routes to correct collection/product based on `hero_link_type`
- Featured products/collections respect `show_on_home` flag
- Empty state when no published products
- Image fallback when `image_url` is null

### 3.2 Shop Page
- Category filter → only matching products
- Price range filter (under5k, 5k-25k, 25k-50k, above50k) → correct results
- Sort (newest, price asc/desc) → correct order
- Combined filters → correct intersection
- Filter state persists in URL (shareable)
- Clear filters → resets to all
- Empty filter result → empty state

### 3.3 Collections
- Collection card click → collection detail page
- Collection with 0 products → empty state, no crash
- Deleted collection ID in URL → 404 or redirect

### 3.4 Product Detail
- All images load in carousel (sorted by `sort_order`)
- Out-of-stock → "Add to Cart" / "Buy Now" disabled
- Customizations: paid + free, signature uniqueness
- Custom note (when `allow_custom_note=true`)
- Wishlist toggle (auth required, modal shown)
- Share via Web Share API + clipboard fallback
- Invalid product ID → 404

## Phase 4 — Cart (P1)

- Increase quantity → DB updated, total recalculates
- Decrease to 0 → item removed
- Remove item → confirmation, no orphan customizations
- Same product + different customizations → separate line items
- Same product + same customizations → quantity merges
- Coupon: invalid code → error
- Coupon: expired → error
- Coupon: max usage reached → error
- Coupon: percent vs flat discount calculation
- Remove coupon → total recalculates

## Phase 5 — Orders (P1)

### 5.1 Order History
- Lists user's orders only (RLS verified)
- Sorted newest first
- Empty state for new users
- Image fallback for deleted products

### 5.2 Order Detail
- Uses `order_items.product_image_url` and `product_name` (not joined from products)
- Click product image → product page (or "no longer available" if deleted)
- Status timeline renders correctly
- Cancel button only for PENDING/CONFIRMED/READY_TO_SHIP
- Cancel → stock restored, status updated, notification created
- Return/Exchange request only for DELIVERED + within 7 days
- Return window expired → option hidden

## Phase 6 — Profile & Settings (P2)

- Edit Profile shows real user data (name, email, phone)
- Update name/phone → persisted in `customers` table
- Phone validation enforced
- Addresses: add, edit, delete, set default
- Multiple defaults → most recent wins
- Wishlist: add/remove, persists across sessions
- Notifications: mark read, unread count
- Help & Support: pulls from `store_settings`, hides empty fields

## Phase 7 — Routing & PWA (P2)

- Direct URL to `/orders/:id` works (SPA fallback via `vercel.json`)
- 404 page for unknown routes
- Browser back/forward preserves state
- Recovery mode forces `/reset-password` regardless of URL
- Service worker cache invalidation on deploy

## Phase 8 — Edge Cases & Error Handling (P1)

- Supabase offline → user sees retry, not blank screen
- Slow network → loading skeletons, no layout shift
- Concurrent cart edits across tabs → last write wins, no corruption
- localStorage disabled → guest flow degrades gracefully
- Very long product names / descriptions → no overflow
- Special characters in inputs → no XSS
- Right-to-left content → no broken layout
- Mobile viewport (320px) → all CTAs reachable, no horizontal scroll

## Phase 9 — Security Audit (P0)

- RLS: cannot read another user's cart/orders/addresses
- RLS: cannot insert orders directly (must go through edge function)
- Coupon validation server-side (not just client)
- Payment amount computed server-side (cannot tamper with price)
- No secrets exposed in client bundle
- No `Lovable` strings remaining (final regex sweep)
- Session token not logged anywhere

## Phase 10 — Known Issues to Fix

Based on console logs and code review, these defects will likely surface:

1. **`AuthApiError: Invalid Refresh Token`** thrown to console on stale sessions — needs graceful handling in `AuthContext` (catch and `signOut` silently)
2. **`vercel.json` may not apply to Lovable preview** — Lovable hosting handles SPA fallback natively, but custom domain on Vercel needs the file (already in place)
3. **Coupon `applicable_to_cod` field naming** inconsistency between local (`allow_cod`) and DB (`applicable_to_cod` vs `allow_cod`) — verify CartContext mapping
4. **Cart merge race condition** — if user signs up while merge is in-flight, second `initCart` call may duplicate items
5. **Product deletion** — orders reference `product_id` but product could be soft-deleted; OrderDetail must handle gracefully

## Execution Approach

After plan approval, I will:

1. **Static audit pass** — read every page/context/edge function, run TypeScript/lint checks, scan for `Lovable` residue
2. **Fix discovered defects** — patch refresh-token handler, audit coupon field mapping, harden cart merge, add error boundaries
3. **Database integrity check** — query Supabase for orphan rows, missing FKs, stale carts
4. **Browser-driven smoke test** — execute Phase 1 critical path end-to-end in the preview (guest → signup → checkout → order)
5. **Edge case verification** — invalid inputs, slow network simulation, RLS probes
6. **Final report** — list of issues found, fixes applied, residual risks, and any items requiring user action (e.g. Supabase email confirmation toggle, Razorpay webhook config)

Note: "Opus 4.7" is not a model I can switch to — model selection is controlled by the user in Lovable settings, not by me. I will execute this plan thoroughly with the current model.

