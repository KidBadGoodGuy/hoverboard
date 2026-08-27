"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const DEMO_PRICE = 500;
const PLATFORM_RATE = 0.1;

export default function PaymentPage() {
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("booking_id");
    setBookingId(id);
  }, []);

  const platformFee = DEMO_PRICE * PLATFORM_RATE;
  const total = DEMO_PRICE + platformFee;

  async function startCheckout() {
    if (!bookingId) {
      setError("Open payment from an accepted booking so HOVERBOARD knows which booking to charge.");
      return;
    }

    if (starting) return;
    setStarting(true);
    setError("");

    try {
      const response = await fetch("/api/payments/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      });
      const result = await response.json();
      if (!response.ok || typeof result.url !== "string") {
        throw new Error(result.error || "We couldn't start secure checkout.");
      }
      window.location.assign(result.url);
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : "We couldn't start secure checkout.");
      setStarting(false);
    }
  }

  return (
    <main className="payment-page">
      <div className="payment-shell">
        <div className="payment-heading">
          <span className="eyebrow">SECURE CHECKOUT</span>
          <h1>Pay for your gig</h1>
          <p className="subtitle">Review the booking total before continuing to secure payment.</p>
        </div>

        <section className="payment-grid">
          <div className="card payment-card">
            <span className="status-pill blue">Gig booking</span>
            <h2>DJ Gig</h2>
            <p className="muted">Your accepted HOVERBOARD booking</p>

            <div className="payment-details">
              <div className="payment-row"><span>DJ price</span><strong>${DEMO_PRICE.toFixed(2)}</strong></div>
              <div className="payment-row"><span>HOVERBOARD fee <small>(10%)</small></span><strong>${platformFee.toFixed(2)}</strong></div>
              <div className="payment-total"><span>Total</span><strong>${total.toFixed(2)}</strong></div>
            </div>

            <div className="payment-note">
              <span className="payment-note-icon">✓</span>
              <div><strong>Transparent pricing</strong><p>The DJ keeps their listed price. HOVERBOARD's client fee is shown before payment.</p></div>
            </div>
          </div>

          <div className="card payment-action-card">
            <div className="secure-badge">
              <span>Secure</span>
              <div><strong>Stripe checkout</strong><p>Your payment details are entered on Stripe's secure checkout page.</p></div>
            </div>

            <div className="payment-method-preview">
              <span className="payment-method-label">Payment</span>
              <div className="payment-method-placeholder"><span>Secure checkout</span><span className="payment-dots">••••</span></div>
            </div>

            {error && <div className="notice">{error}</div>}

            <button className="primary payment-button" onClick={() => void startCheckout()} disabled={starting}>
              {starting ? "Opening secure checkout…" : `Pay $${total.toFixed(2)}`}
            </button>
            <p className="payment-disclaimer">HOVERBOARD does not store your card information.</p>
            <Link href="/dashboard" className="link-button payment-back">← Back to dashboard</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
