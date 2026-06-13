"use client";

import { useAuthStore } from "@repo/common/stores/auth.store";
import { ResetPasswordForm } from "../reset-password-form";

export function ResetPasswordView() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="w-full max-w-sm space-y-6 rounded-xl border bg-card p-8 shadow-sm">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Change Password</h1>
        {user?.mustChangePassword && (
          <p className="text-sm text-amber-600">
            You must change your password before continuing.
          </p>
        )}
      </div>
      <ResetPasswordForm />
    </div>
  );
}
