

# Comprehensive QA Test Plan — Fascino Admin

A production-grade test plan covering every screen, flow, edge case, and failure mode. Organized by priority so you can run it top-to-bottom and stop the moment anything fails.

---

## How to use this plan

- Each test has: **Setup → Action → Expected Result → Failure Mode to watch for**
- Mark each test ✅ Pass / ❌ Fail / ⚠️ Partial
- Test on **desktop (1440px)**, **tablet (768px)**, and **mobile (375px)** viewports
- Test in **Chrome, Safari, Firefox**, and as a **PWA installed on mobile**
- Test with **slow 3G throttling** to catch loading-state bugs
- Test with **DevTools console open** — zero errors/warnings is the bar

---

## SECTION 1 — Authentication & Session (CRITICAL)

### 1.1 Login Page
- Visit `/login` while logged out → form renders, no flash of protected content
- Submit empty form → email + password validation errors appear
- Submit invalid email format (`abc`, `abc@`, `abc@x`) → "Please enter a valid email"
- Submit valid email + wrong password → "Invalid email or password"
- Submit valid admin credentials → redirects to `/`
- Submit valid customer (non-admin) credentials → "Access denied", session signed out
- Click "Forgot password?" → navigates to `/forgot-password`
- Refresh while on `/login` with active admin session → auto-redirects to `/`
- Refresh while on `/login` with active non-admin session → stays on login, signs out stale session
- Disable network mid-submit → "Network error" message, no infinite spinner
- Submit twice rapidly → button disabled during request, no double-submit

### 1.2 Forgot / Reset Password
- Submit forgot-password with non-existent email → no information leak (same UI as success)
- Submit forgot-password with valid email → confirmation message, email arrives
- Click reset link → lands on `/reset-password` with token
- Submit password < 8 chars → validation error
- Submit mismatched passwords → validation error
- Submit valid new password → success → redirects to `/login`
- Open reset link twice (second time after use) → graceful "link expired" message

### 1.3 Protected Route Guard
- Visit `/`, `/catalog`, `/orders`, `/customers`, `/analytics`, `/more`, `/more/profile`, `/more/store`, `/more/notifications`, `/more/notification-settings`, `/more/security`, `/more/help`, `/more/about`, `/more/coupons` while logged out → all redirect to `/login`
- Visit unknown route `/foo/bar` → renders NotFound page
- Open app in two tabs, sign out in tab A → tab B redirects to login on next interaction
- Leave app idle 30+ minutes → auto-signout fires, redirects to login
- Refresh any protected page with active session → loads without flicker, no redirect loop

### 1.4 Session Edge Cases
- Manually delete `sb-*` cookies → next request redirects to login
- Token refresh during active use → no interruption, no console errors
- Network drops during auth check → graceful loader, recovers when network returns

---

## SECTION 2 — Catalog: Products

### 2.1 Catalog List Screen (`/catalog`)
- Empty state (no products) → friendly empty state, no broken layout
- Search by name → filters live, debounced, no flicker
- Search with 0 results → "no results" empty state
- Filter by category → list updates correctly
- Combine search + category filter → both apply
- Stock badge displays correctly (low / out of stock / in stock)
- "Featured" / "New" badges render only when flags are true
- Tap product card → opens detail page
- Tap FAB → opens Add Product
- Switch between Products and Collections tabs → no state leak, scroll resets
- 100+ products → scroll performance smooth, no lag
- Slow network → skeleton loaders show, no layout shift on load

### 2.2 Add Product (`/catalog/product/new`)
- Submit with no images → button disabled, helpful hint shown
- Submit with no name → validation error
- Submit with price = 0, negative, or non-numeric → validation error
- Submit with stock negative → validation error
- Upload 1 image → preview shows, marked as "Primary"
- Upload 5 images → all preview, primary badge stays on first
- Try to upload 6th image → blocked with toast
- Upload non-image file (PDF, .exe) → rejected with error
- Upload very large image (>10MB) → either rejected or compressed, no silent fail
- Remove image → preview disappears, primary moves to next
- Remove the primary image → next image becomes primary
- Toggle Published / Featured / New → state persists in form
- Add 3 customization options with prices → all persist
- Toggle "Free" on a customization → price field disables/zeroes
- Toggle "Allow custom note" → state persists
- Submit successfully → redirects to `/catalog` (NOT detail page)
- Verify product appears in catalog list immediately
- Verify all `product_images` records inserted with correct `sort_order`
- Verify `product_customizations` and `product_customization_settings` rows created
- **Failure flow**: simulate network failure mid-submit → product row deleted, storage files cleaned up, no orphans
- **Failure flow**: simulate storage upload failure → product row deleted, error toast shown
- Hit browser back during upload → confirm dialog or safe abort, no orphaned data

### 2.3 Product Detail / Edit (`/catalog/product/:id`)
- Visit with valid id → loads all fields, images, customizations
- Visit with invalid uuid → shows "Product not found" (not crash)
- Visit with malformed id → handled gracefully
- Edit name, save → persists, toast shows
- Edit price to invalid value → validation blocks save
- Add new image to existing product → uploads, shows in carousel
- Reorder images (if supported) → sort_order updates correctly
- Delete an image → removed from storage AND `product_images` table
- Delete primary image → next image becomes primary
- Toggle Published off → product disappears from public store but remains in admin
- Add/edit/remove customization options → all CRUD paths work
- Toggle "Allow custom note" → persists
- Delete product → confirms, soft-deletes (`is_deleted = true`), removes from list
- Concurrent edit (two tabs) → last write wins gracefully, no corruption

### 2.4 Collections (`/catalog`, `/catalog/collection/*`)
- Add collection with no image → either allowed or blocked consistently
- Add collection with image → image uploads, preview shows
- Toggle "Show on home" + "Published" → both persist
- Add products to collection → multi-select works, count updates
- Remove product from collection → updates immediately
- Delete collection → products are NOT deleted, only the link
- Empty collection state → helpful empty message

---

## SECTION 3 — Orders & Returns

### 3.1 Orders List (`/orders`)
- Empty state → friendly empty UI
- Filter by status (PENDING / CONFIRMED / READY_TO_SHIP / SHIPPED / DELIVERED / CANCELLED) → each filter works
- Search by order number → finds correct order
- Sort by date → newest first by default
- Tap order → opens order detail
- Long order list (100+) → pagination or virtualized scroll works

### 3.2 Order Detail
- All order fields display: customer, items (with images, customizations, notes), address, totals, payment method, status history
- Status timeline shows all transitions in correct order
- Update status: PENDING → CONFIRMED → READY_TO_SHIP → SHIPPED → DELIVERED → each works, history row inserted, customer notification sent
- Cancel order before SHIPPED → stock restored, status = CANCELLED
- Cancel order after SHIPPED → blocked with clear error
- Mark DELIVERED → `delivered_at` timestamp set
- Concurrent status updates from two admins → second one fails gracefully (or wins), no corruption
- Order with deleted product → still displays product_name/image snapshot (denormalized)

### 3.3 Returns (`/orders/returns`)
**Critical — the new staged refund flow**
- Filter ALL / REQUESTED / APPROVED / REJECTED / COMPLETED → each works
- Status = REQUESTED → only `[Approve Return]` and `[Reject Request]` buttons show. **NO "Approve Refund" button anywhere.**
- Approve REQUESTED → status → APPROVED, refund_status untouched, customer notified
- Reject REQUESTED → status → REJECTED, customer notified
- Status = APPROVED, refund_status = null → only `[Mark Item Received]` button shows
- Mark Item Received → refund_status → PENDING, status stays APPROVED, customer notified
- Status = APPROVED, refund_status = PENDING → only `[Mark Refund Processed]` button shows
- Mark Refund Processed → refund_status → PROCESSED, status → COMPLETED, customer notified
- Status = COMPLETED → no action buttons, shows completed state
- Status = REJECTED → no action buttons
- Exchange type → completes via separate completeExchange path
- Verify `complete_return` RPC does NOT auto-process refund (manual only)
- Notification appears in customer's notifications list at each stage
- Two admins clicking same action → one succeeds, other gets clear error
- Return with deleted product → still renders product snapshot

---

## SECTION 4 — Customers

- Customer list loads with search + filter
- Tap customer → detail with order history
- Empty customer state → friendly UI
- Search with special characters (`'`, `"`, `;`, `<script>`) → no SQL/XSS, no crash
- Customer with 0 orders → empty section, no error

---

## SECTION 5 — Analytics

- Loads with no orders → zero state, no NaN / Infinity / divide-by-zero
- Loads with orders → totals match raw DB query
- Date range filter (if present) → updates all charts
- Charts render at all viewport sizes, no overflow
- Chart with 1 data point → renders, no crash

---

## SECTION 6 — More Section

### 6.1 Profile
- Loads admin name, email, role
- Update name → persists
- Update email → either disabled or triggers proper re-auth flow
- Empty name → validation blocks save

### 6.2 Store Settings
- Loads existing settings
- Update store name, currency, address, support email/phone/whatsapp → all persist
- Toggle COD enabled → persists, reflects on customer storefront
- Edit return/exchange policy (long text) → saves, no truncation
- Submit empty required fields → validation

### 6.3 Notifications + Notification Settings
- Notifications list loads, sorted newest first
- Mark as read → persists, count badge updates
- Mark all as read → batch works
- Empty state → friendly UI
- Toggle each notification preference → persists, controls actual delivery
- Real-time: new notification arrives → appears without refresh (if subscriptions wired)

### 6.4 Security
- Change password flow → old + new validated, success → re-auth or stay signed in consistently
- Sign out → clears session, redirects to login

### 6.5 Help / About / FAQs
- All static content renders, no broken links
- FAQ accordion expands/collapses
- About page shows Fascino branding only — search page source for "lovable" → 0 hits
- Footer copyright year correct

### 6.6 Coupons
- List with active + inactive coupons
- Add coupon: code uniqueness, discount type (% vs flat), expiry date in future
- Expired coupon shows as inactive
- Max usage = 0 → blocked or treated as unlimited consistently
- Toggle COD / Online allowed → persists
- Delete coupon → confirms, removes
- Coupon used in order → usage_count increments, coupon_usages row exists

---

## SECTION 7 — PWA & Branding

- Open in browser → install prompt appears (after engagement criteria)
- Install as PWA → app opens standalone, splash screen shows Fascino logo
- Favicon shows Fascino logo (no Lovable trace)
- Browser tab title = Fascino Admin
- View source → meta tags, og:tags, twitter tags all Fascino
- Share URL on WhatsApp → preview shows Fascino og-image, title, description
- robots.txt + manifest.json → no Lovable references
- Service worker → bumped version, caches updated
- Offline mode → graceful offline page, no white screen
- Search entire built bundle for "lovable" (case-insensitive) → 0 user-facing hits

---

## SECTION 8 — Cross-Cutting Concerns

### 8.1 Console & Network Hygiene
- Zero console errors on every page
- Zero console warnings (React keys, deprecated APIs, etc.)
- No 404s in network tab on any page
- No requests to lovable.* domains
- No exposed secrets in client bundle
- No source maps leaking in production

### 8.2 Performance
- Lighthouse score: Performance ≥ 85, Accessibility ≥ 95, Best Practices ≥ 90, SEO ≥ 90, PWA installable
- First contentful paint < 2s on 4G
- No layout shift on image load (use `aspect-ratio`)

### 8.3 Accessibility
- Tab through every page → focus visible, logical order
- All interactive elements reachable by keyboard
- All images have alt text
- All form inputs have labels
- Color contrast meets WCAG AA
- Screen reader announces page changes

### 8.4 Responsive
- 320px width → no horizontal scroll, touch targets ≥ 44px
- 768px → layout adapts
- 1440px → max-width prevents over-stretching
- Landscape phone → bottom nav doesn't cover content

### 8.5 Data Integrity / RLS
- Try to query `admin_profiles` of another admin via DevTools → RLS blocks
- Try to insert into `products` while logged in as customer → RLS blocks
- Try to read another customer's orders → RLS blocks
- Try to call admin RPCs (`update_order_status`, `complete_return`) as non-admin → RPC raises Unauthorized
- No client-side admin checks (localStorage, hardcoded) — verify in source

### 8.6 Error Boundaries
- Force a render error in any page → caught by error boundary, shows fallback UI, doesn't white-screen the whole app
- Network failure on any read → shows retry UI, not a blank page
- Network failure on any write → toast error, form state preserved

### 8.7 Race Conditions
- Rapidly toggle a switch 10x → final state matches last click, no flicker
- Submit form, navigate away mid-request → no "set state on unmounted" warning
- Upload image, navigate away → upload aborted cleanly

---

## SECTION 9 — Production Readiness Checklist

- [ ] All `console.log` debug statements removed
- [ ] All `TODO` / `FIXME` comments resolved or tracked
- [ ] Error monitoring (Sentry or equivalent) wired
- [ ] Analytics wired (if desired)
- [ ] Environment variables: only `VITE_*` exposed client-side
- [ ] Service role key NOT in client bundle (grep build output)
- [ ] Supabase linter clean (`supabase--linter`)
- [ ] Security advisor clean (run `security--run_security_scan`)
- [ ] All migrations applied and reversible
- [ ] Database backups enabled
- [ ] Custom domain + HTTPS verified
- [ ] Email deliverability tested (SPF/DKIM/DMARC for support email)

---

## Execution approach

I'll execute this plan in 4 phases when you approve:

1. **Automated checks** (run security linter, search bundle for "lovable", verify RLS via SQL, check for orphan storage objects)
2. **Browser-driven smoke tests** (login, create product, place order status updates, full return flow, sign out)
3. **Manual edge-case fixes** — for each failure found, I'll fix the code and re-verify
4. **Final report** listing every test, pass/fail, and fixes applied

Approve and I'll start with Phase 1.

