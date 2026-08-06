import { Suspense } from "react";

import { BrainGraph } from "@/components/brain/brain-graph";
import { LoginForm } from "@/app/login/login-form";

export const metadata = { title: "Sign in — Command Center" };

export default function LoginPage() {
  return (
    <main className="relative isolate flex h-dvh items-center justify-center overflow-hidden p-6">
      <BrainGraph className="absolute inset-0 -z-10 opacity-70" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-bg/70" />

      <div className="panel w-full max-w-sm rounded-xl p-6 shadow-lg shadow-black/50">
        <h1 className="text-sm font-semibold tracking-[0.24em] text-ink uppercase">
          Command Center
        </h1>
        <p className="mt-1 text-[11px] tracking-[0.16em] text-ink-dim uppercase">
          Growth Factor AI
        </p>
        {/* The form reads ?next= from the URL, so it renders inside Suspense. */}
        <Suspense fallback={<div className="mt-6 h-28" />}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
