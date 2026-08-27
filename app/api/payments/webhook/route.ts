import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "edge";

function hex(buffer: ArrayBuffer) {
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function verifyStripeSignature(payload: string, header: string, secret: string) {
  const parts = header.split(",");
  const timestamp = parts.find((part) => part.startsWith("t="))?.slice(2);
  if (!timestamp) return false;
  const signatures = parts.filter((part) => part.startsWith("v1=")).map((part) => part.slice(3));
  if (!signatures.length) return false;
  const timestampNumber = Number(timestamp);
  if (!Number.isFinite(timestampNumber) || Math.abs(Date.now() / 1000 - timestampNumber) > 300) return false;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const digest = hex(await crypto.subtle.sign("HMAC", key, encoder.encode(`${timestamp}.${payload}`)));
  return signatures.some((signature) => signature.length === digest.length && signature === digest);
}

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret) return NextResponse.json({ error: "Stripe webhook is not configured." }, { status: 503 });

  const signature = request.headers.get("stripe-signature");
  const payload = await request.text();
  if (!signature || !(await verifyStripeSignature(payload, signature, secret))) {
    return NextResponse.json({ error: "Invalid Stripe signature." }, { status: 400 });
  }

  try {
    const event = JSON.parse(payload);
    const object = event.data?.object;
    const bookingId = object?.metadata?.booking_id || object?.client_reference_id;
    if (!bookingId) return NextResponse.json({ received: true });

    const admin = createAdminClient();

    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
      const paymentIntent = typeof object.payment_intent === "string" ? object.payment_intent : null;
      const paid = object.payment_status === "paid" || event.type === "checkout.session.async_payment_succeeded";
      if (paid) {
        const { error } = await admin.from("bookings").update({
          status: "confirmed",
          payment_status: "paid",
          stripe_checkout_session_id: object.id,
          stripe_payment_intent_id: paymentIntent,
        }).eq("id", bookingId);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    if (event.type === "payment_intent.payment_failed") {
      const { error } = await admin.from("bookings").update({
        payment_status: "failed",
        stripe_payment_intent_id: object.id,
      }).eq("id", bookingId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (event.type === "charge.refunded") {
      const { error } = await admin.from("bookings").update({ payment_status: "refunded" }).eq("id", bookingId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ error: "Invalid webhook payload." }, { status: 400 });
  }
}
