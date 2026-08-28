# Stripe Integration TODO

This file is the single source of truth for remaining Stripe setup work.

## Values to Replace

The following values are placeholders and must be configured in your deployment environment before live payments can work.

**Files containing placeholders:**
- [.env.example](.env.example)

| Field | Current Value | What to Set |
|-------|--------------|-------------|
| NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY | pk_live_REPLACE_ME | Your Stripe live publishable key (`pk_live_...`) for the HOVERBOARD account. This value is safe for the browser. |
| STRIPE_SECRET_KEY | sk_live_REPLACE_ME | Your Stripe live secret or restricted API key. Keep it server-side only. |
| STRIPE_WEBHOOK_SECRET | whsec_REPLACE_ME | The signing secret for the webhook endpoint `https://hoverboard.arjun-singh.com/api/payments/webhook`. |

No Checkout Session line-item placeholders remain: the existing booking price is converted into a real one-time dynamic line item on the server.

## Configured Parameters

**Files containing these parameters:**
- [app/api/payments/create-checkout-session/route.ts](app/api/payments/create-checkout-session/route.ts)
- [app/payments/checkout-form.tsx](app/payments/checkout-form.tsx)

| Parameter | Value |
|-----------|-------|
| ui_mode | form |
| mode | payment |
| billing_address_collection | auto |
| phone_number_collection.enabled | false |
| automatic_tax.enabled | false |
| submit_type | auto |
| integration_identifier | custom_embedded_web_0001 |
| line_items | Existing HOVERBOARD booking amount, generated dynamically from the accepted booking |
| payment_method_collection | Omitted because HOVERBOARD uses one-time payments, not subscriptions |

## Setup and next steps

1. Add the three Stripe environment values above to the production deployment environment. Do not commit real keys to GitHub.
2. Keep `STRIPE_SECRET_KEY` server-only. Do not rename it to a `NEXT_PUBLIC_*` variable.
3. Keep `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` browser-accessible; Next.js exposes `NEXT_PUBLIC_*` values to the client bundle.
4. Configure a Stripe webhook pointing to `/api/payments/webhook` and use its `whsec_...` signing secret as `STRIPE_WEBHOOK_SECRET`.
5. Keep the existing Supabase booking ownership check. Only the authenticated client who owns an accepted booking can create its Checkout Session.
6. HOVERBOARD currently uses one-time payments (`mode=payment`). Do not switch to subscription mode for DJ gig payments.
7. Before charging real customers, verify the live Stripe account's payment-method settings and Connect configuration. HOVERBOARD is a two-sided marketplace and will eventually need the connected-account/payout flow for paying DJs.

## Project structure

- `app/api/payments/create-checkout-session/route.ts` — authenticated server endpoint that creates the Checkout Session and returns its `client_secret`.
- `app/payments/checkout-form.tsx` — browser-side Stripe embedded Checkout Form loader, mount point, and confirmation handler.
- `app/dashboard/page.tsx` — opens the embedded form from an accepted client booking.
- `app/api/payments/webhook/route.ts` — verifies Stripe webhook signatures and marks bookings paid/confirmed or refunded.
- `app/layout.tsx` — loads Stripe's required `dahlia` Stripe.js build directly from `https://js.stripe.com/dahlia/stripe.js`.

## How the integration works

1. A client accepts a DJ application, creating an `accepted` booking.
2. The client clicks **Pay securely** on the dashboard.
3. HOVERBOARD calls `/api/payments/create-checkout-session` with the booking ID.
4. The server verifies the signed-in client owns the booking and that the booking is accepted.
5. The server creates a one-time embedded Checkout Session using the booking amount and returns the session `client_secret` as JSON.
6. The browser initializes Stripe with the `custom_checkout_payment_form_1` beta, creates the expanded Checkout Form, and mounts it inside HOVERBOARD.
7. Stripe securely collects the payment details in its hosted iframe.
8. Stripe sends the webhook event to HOVERBOARD. The existing webhook updates the booking to confirmed when payment is successful.

## Testing

The current integration is configured for the HOVERBOARD Stripe live account, not test mode. Do not put test keys into the live deployment.

For safe development testing, use a separate Stripe sandbox/test environment and its corresponding keys and webhook endpoint. Stripe's standard test card numbers are documented in the Stripe testing documentation.

## Remaining product work

- Create the real Stripe Connect connected-account onboarding for DJs.
- Decide and implement the final marketplace charge/transfer flow before real DJ payouts.
- Connect successful payments to the exact booking and payout lifecycle.
- Add refund/dispute handling appropriate for HOVERBOARD's marketplace model.
- Configure production monitoring and verify webhook delivery.

## Resources

- [Stripe Support](https://support.stripe.com)
- [Stripe Docs](https://docs.stripe.com)
- [Stripe MCP](https://docs.stripe.com/mcp)
