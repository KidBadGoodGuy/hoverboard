import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "edge";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "You must be logged in." }, { status: 401 });

    const { bookingId } = await request.json();
    if (typeof bookingId !== "string" || !bookingId) return NextResponse.json({ error: "A booking ID is required." }, { status: 400 });

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("id, client_id, dj_id, price, status, event_date, location")
      .eq("id", bookingId)
      .eq("client_id", user.id)
      .maybeSingle();
    if (bookingError) return NextResponse.json({ error: bookingError.message }, { status: 500 });
    if (!booking) return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    if (booking.status !== "accepted") return NextResponse.json({ error: "This booking is not ready for payment." }, { status: 400 });

    const { data: djProfile, error: djError } = await supabase.from("dj_profiles").select("stripe_connect_account_id, dj_name").eq("user_id", booking.dj_id).maybeSingle();
    if (djError) return NextResponse.json({ error: djError.message }, { status: 500 });
    const connectedAccountId = djProfile?.stripe_connect_account_id as string | null;
    if (!connectedAccountId) return NextResponse.json({ error: "This DJ has not finished Stripe payout setup yet. Ask the DJ to complete DJ Payouts from their dashboard." }, { status: 400 });

    const secret = process.env.STRIPE_SECRET_KEY?.trim();
    if (!secret) return NextResponse.json({ error: "Stripe is not configured yet." }, { status: 503 });
    const amount = Math.round(Number(booking.price) * 100);
    if (!Number.isInteger(amount) || amount < 50) return NextResponse.json({ error: "The booking price must be at least $0.50." }, { status: 400 });

    const body = new URLSearchParams();
    body.set("ui_mode", "form");
    body.set("mode", "payment");
    body.set("billing_address_collection", "auto");
    body.set("phone_number_collection[enabled]", "false");
    body.set("automatic_tax[enabled]", "false");
    body.set("submit_type", "auto");
    body.set("integration_identifier", "custom_embedded_web_0001");
    body.set("client_reference_id", booking.id);
    body.set("metadata[booking_id]", booking.id);
    body.set("payment_intent_data[transfer_data][destination]", connectedAccountId);
    body.set("line_items[0][price_data][currency]", "usd");
    body.set("line_items[0][price_data][product_data][name]", `HOVERBOARD DJ Gig — ${djProfile?.dj_name || "Solo DJ"}`);
    body.set("line_items[0][price_data][product_data][description]", `${booking.event_date} · ${booking.location}`);
    body.set("line_items[0][price_data][unit_amount]", String(amount));
    body.set("line_items[0][quantity]", "1");

    const stripeResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "Stripe-Version": "2026-03-25.dahlia; custom_checkout_payment_form_preview=v1",
      },
      body,
    });
    const stripe = await stripeResponse.json();
    if (!stripeResponse.ok || !stripe.client_secret) return NextResponse.json({ error: stripe?.error?.message || "Stripe could not create checkout." }, { status: 502 });

    const { error: updateError } = await supabase.from("bookings").update({ stripe_checkout_session_id: stripe.id, payment_status: "pending" }).eq("id", booking.id).eq("client_id", user.id);
    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
    return NextResponse.json({ client_secret: stripe.client_secret });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Payment setup failed." }, { status: 500 });
  }
}
