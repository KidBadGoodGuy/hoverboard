import { createClient } from "../../lib/supabase/client";

export default async function SupabaseTestPage() {
  const supabase = createClient();
  const { error } = await supabase.from("dj_profiles").select("user_id").limit(1);

  return (
    <main>
      <p>HOVERBOARD backend connection</p>
      <h1>{error ? "Connection needs attention" : "Supabase connected"}</h1>
      <p>{error ? error.message : "The HOVERBOARD app can communicate with Supabase."}</p>
    </main>
  );
}
