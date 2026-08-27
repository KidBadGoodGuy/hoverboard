"use client";

import Link from "next/link";
import { useState } from "react";

const gigPrice = 500;
const platformFee = gigPrice * 0.1;
const total = gigPrice + platformFee;

export default function PaymentPage() {
  const [processing, setProcessing] = useState(false);

  function continueToPayment() {
    setProcessing(true);
    // Stripe Checkout will be connected here once the Live payment endpoint is ready.
    window.setTimeout(() => setProcessing(false), 900);
  }

  return (
    <main className="payment-page">
      <div className="payment-shell">
        <div className="payment-heading">
          <span className="eyebrow">SECURE CHECKOUT</span>
          <h1>Pay for your gig</h1>
          <p className="subtitle">Review the booking before continuing to secure payment.</p>
        </div>

        <section className="payment-grid">
          <div className="card payment-card">
            <div className="payment-card-header">
              <div>
                <span className="status-pill blue">Gig booking</span>
                <h2>Birthday Party</h2>
                <p className="muted">DJ Nova · September 12, 2026</p>
              </div>
            </div>

            <div className="payment-details">
              <div className="payment-row">
                <span>DJ price</span>
                <strong>${gigPrice.toFixed(2)}</strong>
              </div>
              <div className="payment-row">
                <span>HOVERBOARD fee <small>(10%)</small></span>
                <strong>${platformFee.toFixed(2)}</strong>
              </div>
              <div className="payment-total">
                <span>Total</span>
                <strong>${total.toFixed(2)}</strong>
              </div>
            </div>

            <div className="payment-note">
              <span className="payment-note-icon">✓</span>
              <div>
                <strong>Transparent pricing</strong>
                <p>The DJ keeps their listed price. HOVERBOARD&apos;s 10% client fee is shown before you pay.</p>
              </div>
            </div>
          </div>

          <div className="card payment-action-card">
            <div className="secure-badge">
              <span>🔒</span>
              <div>
                <strong>Secure payment</strong>
                <p>Payment details are handled securely by Stripe.</p>
              </div>
            </div>

            <div className="payment-method-preview">
              <span className="payment-method-label">Payment method</span>
              <div className="payment-method-placeholder">
                <span>Card, wallet, or other available method</span>
                <span className="payment-dots">••••</span>
              </div>
            </div>

            <button className="primary payment-button" onClick={continueToPayment} disabled={processing}>
              {processing ? "Opening secure checkout…" : `Continue · $${total.toFixed(2)}`}
            </button>

            <p className="payment-disclaimer">
              You&apos;ll be sent to Stripe&apos;s secure checkout to enter your payment details. HOVERBOARD does not store your card information.
            </p>

            <Link href="/discover" className="link-button payment-back">← Back to gigs</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
