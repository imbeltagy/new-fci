"use client";

import { LoginForm } from "../login-form";

export function LoginView() {
  return (
    <div className="w-full max-w-sm space-y-6 rounded-xl border bg-card p-8 shadow-sm">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Sign in</h1>
        <p className="text-sm text-muted-foreground">Welcome back</p>
      </div>
      <LoginForm />
    </div>
  );
}
