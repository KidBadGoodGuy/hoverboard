import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "edge";

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL?.trim() || "HOVERBOARD <info@arjun-singh.com>";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "You must be logged in." }, { status: 401 });

    const body = await request.json();
    const applicationId = typeof body?.applicationId === "string" ? body.applicationId : "";
    if (!applicationId) return NextResponse.json({ error: "An application ID is required." }, { status: 400 });

    const { data, error } = await supabase.rpc("accept_gig_application", { p_application_id: applicationId });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    const booking = Array.isArray(data) ? data[0] : data;
    if (!booking) return NextResponse.json({ error: "The booking could not be created." }, { status: 500 });

    const recipient = booking.direction === "dj_offer" ? booking.dj_email : booking.client_email;
    const subject = booking.direction === "dj_offer" ? `Your HOVERBOARD offer was accepted — ${booking.title}` : `Your HOVERBOARD DJ request was accepted — ${booking.title}`;
    const text = booking.direction === "dj_offer"
      ? `Good news! Your DJ offer for "${booking.title}" was accepted by the client.\n\nDate: ${booking.event_date}\nTime: ${booking.start_time} – ${booking.end_time}\nLocation: ${booking.location}\nAgreed price: $${Number(booking.price).toFixed(2)}\n\nLog in to HOVERBOARD to message the client and continue to payment.`
      : `Good news! Your DJ request for "${booking.title}" was accepted.\n\nDate: ${booking.event_date}\nTime: ${booking.start_time} – ${booking.end_time}\nLocation: ${booking.location}\nAgreed price: $${Number(booking.price).toFixed(2)}\n\nLog in to HOVERBOARD to message the client and continue to payment.`;

    const resendKey = process.env.RESEND_API_KEY?.trim();
    let emailSent = false;
    if (resendKey && recipient) {
      const emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: FROM_EMAIL, to: [recipient], subject, text }),
      });
      emailSent = emailResponse.ok;
    }

    return NextResponse.json({ bookingId: booking.booking_id, emailSent });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "The request could not be accepted." }, { status: 500 });
  }
}
