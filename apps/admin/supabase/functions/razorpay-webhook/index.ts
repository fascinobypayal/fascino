import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.177.0/node/crypto.ts";

Deno.serve(async (req) => {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature");

    if (!signature) {
      return new Response("Missing signature", { status: 400 });
    }

    const webhookSecret = Deno.env.get("RAZORPAY_WEBHOOK_SECRET")!;
    const expectedSignature = createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");

    if (signature !== expectedSignature) {
      return new Response("Invalid signature", { status: 400 });
    }

    const event = JSON.parse(rawBody);
    const eventType = event.event;

    // Handle both payment.captured (cards) and order.paid (UPI/QR).
    // Razorpay fires order.paid for UPI transactions; the old code only handled
    // payment.captured and silently ignored UPI payments.
    const isPaymentEvent =
      eventType === "payment.captured" || eventType === "order.paid";

    if (!isPaymentEvent) {
      console.log("Ignored event:", eventType);
      return new Response("Ignored", { status: 200 });
    }

    const payment = event.payload.payment.entity;
    const razorpayOrderId = payment.order_id;
    const razorpayPaymentId = payment.id;
    const paidAmount = payment.amount / 100;

    if (!razorpayOrderId) {
      console.error("No order_id in payment payload for event:", eventType);
      return new Response("No order_id", { status: 400 });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find checkout session by Razorpay order ID
    const { data: session, error: sessionError } = await supabase
      .from("checkout_sessions")
      .select("*")
      .eq("razorpay_order_id", razorpayOrderId)
      .single();

    if (sessionError || !session) {
      console.error("Session not found for order:", razorpayOrderId, sessionError);
      return new Response("Session not found", { status: 500 });
    }

    // Idempotency: already processed, skip
    if (session.status === "PAYMENT_SUCCESS") {
      console.log("Session already processed:", session.id);
      return new Response("Already processed", { status: 200 });
    }

    // Mark session as paid
    const { error: updateError } = await supabase
      .from("checkout_sessions")
      .update({
        status: "PAYMENT_SUCCESS",
        payment_id: razorpayPaymentId,
        paid_amount: paidAmount,
        updated_at: new Date().toISOString(),
      })
      .eq("id", session.id);

    if (updateError) {
      console.error("Failed to update session:", updateError);
      return new Response("Failed to update session", { status: 500 });
    }

    // Create order atomically
    const { error: rpcError } = await supabase.rpc(
      "process_successful_payment",
      { p_checkout_session_id: session.id }
    );

    if (rpcError) {
      console.error("RPC failed:", rpcError);
      return new Response("Order processing failed", { status: 500 });
    }

    console.log("Order processed successfully for session:", session.id);
    return new Response("OK", { status: 200 });

  } catch (err) {
    console.error("Webhook crashed:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
});
