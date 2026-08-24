"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../lib/supabase/client";

export default function SupabaseTestPage() {
  const [status, setStatus] = useState("Testing Supabase connection...");

  useEffect(() => {
    const testConnection = async () => {
      try {
        const supabase = createClient();
        const { error } = await supabase.from("dj_profiles").select("user_id").limit(1);

        if (error) {
          setStatus(`Connection needs attention: ${error.message}`);
          return;
        }

        setStatus("Supabase connected");
      } catch (error) {
        setStatus(
          `Connection needs attention: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    };

    testConnection();
  }, []);

  return (
    <main>
      <p>HOVERBOARD backend connection</p>
      <h1>{status}</h1>
    </main>
  );
}
