"use client";

import Link from "next/link";
import { useState } from "react";

import { ForgotPasswordForm } from "../forgot-password-form";

export function ForgotPasswordView() {
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <div className="w-full max-w-sm space-y-4 rounded-xl border bg-card p-8 shadow-sm text-center">
        <h1 className="text-2xl font-semibold">Check your email</h1>
        <p className="text-sm text-muted-foreground">
          If an account with that email exists, you&apos;ll receive a password reset link shortly.
        </p>
        <Link href="/auth/login" className="text-sm text-primary underline-offset-4 hover:underline">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm space-y-6 rounded-xl border bg-card p-8 shadow-sm">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Forgot password</h1>
        <p className="text-sm text-muted-foreground">
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>

      <ForgotPasswordForm onSuccess={() => setSent(true)} />

      <div className="text-center">
        <Link
          href="/auth/login"
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
