"use client";

import { useState } from "react";

const bars = Array.from({ length: 37 }, (_, i) => ({
  id: i,
  height: 18 + Math.abs(Math.sin(i * 0.63)) * (i % 4 === 0 ? 74 : 48),
  delay: -((i * 0.17) % 2.4),
}));

export default function InteractiveHero() {
  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [pulseMode, setPulseMode] = useState(false);

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "touch") return;
    const bounds = event.currentTarget.getBoundingClientRect();
    setPointer({
      x: ((event.clientX - bounds.left) / bounds.width - 0.5) * 2,
      y: ((event.clientY - bounds.top) / bounds.height - 0.5) * 2,
    });
  }

  function resetPointer() {
    setIsHovering(false);
    setPointer({ x: 0, y: 0 });
  }

  return (
    <div
      className={`hero-art interactive-hero${isHovering ? " is-hovering" : ""}${pulseMode ? " pulse-mode" : ""}`}
      aria-label="Interactive HOVERBOARD sound visualizer"
      onPointerMove={handlePointerMove}
      onPointerEnter={() => setIsHovering(true)}
      onPointerLeave={resetPointer}
      style={{
        transform: `perspective(1100px) rotateX(${-pointer.y * 4}deg) rotateY(${pointer.x * 5}deg) translateY(${isHovering ? -3 : 0}px)`,
        ["--pointer-x" as string]: `${pointer.x * 12}px`,
        ["--pointer-y" as string]: `${pointer.y * 12}px`,
      }}
    >
      <div className="interactive-glow" />
      <div className="orbit orbit-one" />
      <div className="orbit orbit-two" />
      <div className="orbit orbit-three" />
      <div className="hero-art-top"><span className="mini-mark">H</span><span>HOVERBOARD / V1</span><span className="live-dot" /></div>

      <div className="visualizer-core">
        <div className="visualizer-ring ring-a" />
        <div className="visualizer-ring ring-b" />
        <div className="visualizer-center"><span>H</span><small>ON BEAT</small></div>
        <div className="sound-wave" aria-hidden="true">
          {bars.map((bar) => (
            <span
              key={bar.id}
              style={{
                height: `${bar.height}px`,
                animationDelay: `${bar.delay}s`,
              }}
            />
          ))}
        </div>
      </div>

      <div className="hero-art-caption">
        <span className="caption-kicker">YOUR NEXT CHAPTER</span>
        <strong>Starts with a booking.</strong>
        <span className="caption-line">DISCOVER <i /> CONNECT <i /> PLAY</span>
      </div>

      <div className="floating-chip chip-top">
        <span className="chip-icon">↗</span>
        <span><strong>Find your next gig</strong><small>Make the connection</small></span>
      </div>
      <div className="floating-chip chip-bottom">
        <span className="chip-icon chip-icon-blue">✓</span>
        <span><strong>Booking, simplified</strong><small>From request to confirmed</small></span>
      </div>

      <button
        type="button"
        className="pulse-toggle"
        aria-pressed={pulseMode}
        onClick={() => setPulseMode((current) => !current)}
      >
        <span className={`pulse-toggle-dot${pulseMode ? " active" : ""}`} />
        {pulseMode ? "Pulse mode on" : "Activate pulse"}
        <span aria-hidden="true">↗</span>
      </button>
    </div>
  );
}
