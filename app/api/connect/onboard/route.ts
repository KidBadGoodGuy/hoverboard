import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "edge";

const STRIPE_VERSION = "2026-08-26.preview";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://hoverboard.arjun-singh.com";

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "You must be logged in." }, { status: 401 });

    const { data: profile } = await supabase.from("dj_profiles").select("stripe_connect_account_id").eq("user_id", user.id).maybeSingle();
    const secret = process.env.STRIPE_SECRET_KEY?.trim();
    if (!secret) return NextResponse.json({ error: "Stripe is not configured yet." }, { status: 503 });

    let accountId = profile?.stripe_connect_account_id as string | null;
    if (!accountId) {
      const accountResponse = await fetch("https://api.stripe.com/v2/core/accounts", {
        method: "POST",
        headers: { Authorization: `Bearer ${secret}`, "Stripe-Version": STRIPE_VERSION, "Content-Type": "application/json" },
        body: JSON.stringify({
          contact_email: user.email,
          display_name: "HOVERBOARD DJ",
          defaults: { responsibilities: { fees_collector: "application", losses_collector: "application" } },
          dashboard: "express",
          identity: { country: "us" },
          configuration: { recipient: { capabilities: { stripe_balance: { stripe_transfers: { requested: true } } } } },
          include: ["configuration.recipient", "identity", "requirements"],
        }),
      });
      const account = await accountResponse.json();
      if (!accountResponse.ok || !account.id) return NextResponse.json({ error: account?.error?.message || "Stripe could not create the DJ payout account." }, { status: 502 });
      accountId = account.id;
      const admin = createAdminClient();
      const { error } = await admin.from("dj_profiles").update({ stripe_connect_account_id: accountId }).eq("user_id", user.id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const linkResponse = await fetch("https://api.stripe.com/v2/core/account_links", {
      method: "POST",
      headers: { Authorization: `Bearer ${secret}`, "Stripe-Version": STRIPE_VERSION, "Content-Type": "application/json" },
      body: JSON.stringify({
        account: accountId,
        use_case: {
          type: "account_onboarding",
          account_onboarding: {
            configurations: ["recipient"],
            refresh_url: `${SITE_URL}/connect?refresh=1`,
            return_url: `${SITE_URL}/connect?return=1`,
          },
        },
      }),
    });
    const link = await linkResponse.json();
    if (!linkResponse.ok || !link.url) return NextResponse.json({ error: link?.error?.message || "Stripe could not create an onboarding link." }, { status: 502 });
    return NextResponse.json({ url: link.url });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Payout setup failed." }, { status: 500 });
  }
}
