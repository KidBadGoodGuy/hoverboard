"use client";

import { useEffect, useState } from "react";

export default function SupabaseTestPage() {
  const [status, setStatus] = useState("Testing Supabase connection...");

  useEffect(() => {
    fetch("/api/supabase-test")
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok || !result.connected) {
          throw new Error(result.error ?? "Unknown connection error");
        }
        setStatus("Supabase connected");
      })
      .catch((error) => {
        setStatus(`Connection needs attention: ${error.message}`);
      });
  }, []);

  return (
    <main>
      <p>HOVERBOARD backend connection</p>
      <h1>{status}</h1>
    </main>
  );
}
