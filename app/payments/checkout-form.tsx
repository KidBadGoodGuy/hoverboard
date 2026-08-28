"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    Stripe?: (publishableKey: string, options?: { betas?: string[] }) => {
      initCheckoutFormSdk: (options: { clientSecret: Promise<string>; appearance: Record<string, unknown> }) => {
        createForm: (options: { layout: "expanded" }) => { mount: (selector: string) => void; on: (event: "confirm", handler: (event: unknown) => void | Promise<void>) => void };
        loadActions: () => Promise<{ type: "success"; actions: { confirm: (options: { formConfirmEvent: unknown }) => Promise<void> } } | { type: string }>;
      };
    };
  }
}

type Props = {
  bookingId: string;
  onMessage: (message: string) => void;
};

const appearance = {
  theme: "stripe",
  labels: "auto",
  inputs: "spaced",
  variables: {
    borderRadius: "4px",
    colorBackground: "#ffffff",
    colorDanger: "#df1b41",
    colorPrimary: "#0570de",
    colorSuccess: "#00c853",
    colorText: "#30313d",
    fontFamily: "default",
    fontSizeBase: "16px",
    spacingUnit: "4px",
  },
};

export default function CheckoutForm({ bookingId, onMessage }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState("Loading secure payment form…");

  useEffect(() => {
    let cancelled = false;
    let confirmReady = false;

    async function mountCheckout() {
      const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
      if (!publishableKey) {
        setStatus("Stripe payment form is not configured yet.");
        return;
      }

      if (!window.Stripe) {
        setStatus("Stripe is still loading. Please try again in a moment.");
        return;
      }

      const clientSecret = fetch("/api/payments/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      })
        .then(async (response) => {
          const json = await response.json();
          if (!response.ok || !json.client_secret) throw new Error(json.error || "We couldn't start checkout.");
          return json.client_secret as string;
        });

      const stripe = window.Stripe(publishableKey, { betas: ["custom_checkout_payment_form_1"] });
      const checkout = stripe.initCheckoutFormSdk({ clientSecret, appearance });
      const form = checkout.createForm({ layout: "expanded" });
      const container = containerRef.current;
      if (!container) return;
      form.mount(`#${container.id}`);
      setStatus("");

      const loadActionsResult = await checkout.loadActions();
      if (cancelled) return;
      if (loadActionsResult.type !== "success") {
        setStatus("The secure payment form could not finish loading. Please try again.");
        return;
      }

      confirmReady = true;
      form.on("confirm", async (event) => {
        if (!confirmReady) return;
        try {
          setStatus("Processing payment…");
          await loadActionsResult.actions.confirm({ formConfirmEvent: event });
          if (!cancelled) {
            setStatus("Payment submitted successfully.");
            onMessage("Payment submitted. Your booking will switch to Confirmed after Stripe verifies the payment.");
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : "Payment confirmation failed.";
          if (!cancelled) setStatus(message);
        }
      });
    }

    void mountCheckout().catch((error) => {
      if (!cancelled) setStatus(error instanceof Error ? error.message : "We couldn't load the payment form.");
    });

    return () => {
      cancelled = true;
      confirmReady = false;
    };
  }, [bookingId, onMessage]);

  return (
    <div className="checkout-panel card">
      <div className="section-heading">
        <div>
          <p className="eyebrow">SECURE CHECKOUT</p>
          <h3>Pay for this booking</h3>
          <p className="muted">Your payment details are collected securely by Stripe.</p>
        </div>
      </div>
      {status && <p className="checkout-status">{status}</p>}
      <div ref={containerRef} id={`checkout-form-${bookingId}`} className="checkout-form-container" />
    </div>
  );
}
