import { Suspense } from "react";
import AuthForm from "./auth-form";

export default function AuthPage() {
  return (
    <Suspense fallback={<main className="center-page"><div className="card"><p>Loading HOVERBOARD…</p></div></main>}>
      <AuthForm />
    </Suspense>
  );
}
