"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { ConfirmResetForm } from "../confirm-reset-form";

function ConfirmResetContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  return (
    <div className="w-full max-w-sm space-y-6 rounded-xl border bg-card p-8 shadow-sm">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Set new password</h1>
        <p className="text-sm text-muted-foreground">Enter your new password below.</p>
      </div>

      <ConfirmResetForm token={token} />

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

export function ConfirmResetView() {
  return (
    <Suspense>
      <ConfirmResetContent />
    </Suspense>
  );
}
