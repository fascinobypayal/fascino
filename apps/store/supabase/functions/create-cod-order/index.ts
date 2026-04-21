import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify user
    const supabaseAuth = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const customerId = user.id;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get active cart
    const { data: cart, error: cartError } = await supabase
      .from("carts")
      .select("id, coupon_id")
      .eq("customer_id", customerId)
      .eq("status", "active")
      .single();

    if (cartError || !cart) {
      return new Response(JSON.stringify({ error: "No active cart found" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate address
    const { data: cartAddress } = await supabase
      .from("cart_addresses")
      .select("cart_id")
      .eq("cart_id", cart.id)
      .maybeSingle();

    if (!cartAddress) {
      return new Response(JSON.stringify({ error: "Shipping address required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get cart items
    const { data: cartItems, error: itemsError } = await supabase
      .from("cart_items")
      .select("base_price, quantity, id")
      .eq("cart_id", cart.id);

    if (itemsError || !cartItems || cartItems.length === 0) {
      return new Response(JSON.stringify({ error: "Cart is empty" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Calculate subtotal
    let subtotal = 0;
    for (const item of cartItems) {
      const basePrice = Number(item.base_price) || 0;
      const qty = Number(item.quantity) || 0;
      let itemTotal = basePrice * qty;

      const { data: customizations } = await supabase
        .from("cart_item_customizations")
        .select("customization_price")
        .eq("cart_item_id", item.id);
      if (customizations) {
        for (const c of customizations) {
          itemTotal += (Number(c.customization_price) || 0) * qty;
        }
      }
      subtotal += itemTotal;
    }

    // Validate coupon
    let discount = 0;
    if (cart.coupon_id) {
      const { data: coupon } = await supabase
        .from("coupons")
        .select("*")
        .eq("id", cart.coupon_id)
        .single();

      if (!coupon || !coupon.is_active) {
        return new Response(JSON.stringify({ error: "Coupon expired or invalid" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (coupon.expiry_date && new Date(coupon.expiry_date) < new Date()) {
        return new Response(JSON.stringify({ error: "Coupon expired or invalid" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (coupon.max_usage !== null && (coupon.usage_count ?? 0) >= coupon.max_usage) {
        return new Response(JSON.stringify({ error: "Coupon usage limit reached" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (coupon.allow_cod === false) {
        return new Response(JSON.stringify({ error: "Coupon is not valid for Cash on Delivery" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (coupon.discount_type === "PERCENT") {
        discount = Math.round(subtotal * (Number(coupon.discount_value) / 100));
      } else {
        discount = Number(coupon.discount_value) || 0;
      }
    }

    const totalAmount = Math.max(subtotal - discount, 0);

    // Update cart payment method
    await supabase.from("carts").update({ payment_method: "cod" }).eq("id", cart.id);

    // Create checkout session
    const { data: session, error: sessionError } = await supabase
      .from("checkout_sessions")
      .insert({
        cart_id: cart.id,
        customer_id: customerId,
        amount: totalAmount,
        status: "CREATED",
      })
      .select("id")
      .single();

    if (sessionError || !session) {
      console.error("Session error:", sessionError);
      return new Response(JSON.stringify({ error: "Failed to create checkout session" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Process order using same function as online payments
    const { error: rpcError } = await supabase.rpc("process_successful_payment", {
      p_checkout_session_id: session.id,
    });

    if (rpcError) {
      console.error("RPC error:", rpcError);
      return new Response(JSON.stringify({ error: rpcError.message || "Failed to create order" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, session_id: session.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
