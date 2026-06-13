"use client";

import { useState } from "react";
import { yupResolver } from "@hookform/resolvers/yup";
import { useRouter } from "next/navigation";
import { FormProvider, useForm } from "react-hook-form";

import { adminChangePassword, adminLogout } from "@repo/common/actions/auth.action";
import { FormInput } from "@repo/common/components/custom/form-input";
import { Button } from "@repo/common/components/ui/button";
import { resetPasswordSchema, type ResetPasswordSchema } from "@repo/common/schemas/auth.schema";
import { useAuthStore } from "@repo/common/stores/auth.store";

export function ResetPasswordForm() {
  const router = useRouter();
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<ResetPasswordSchema>({
    resolver: yupResolver(resetPasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  async function onSubmit(values: ResetPasswordSchema) {
    setFormError(null);
    const res = await adminChangePassword(values.currentPassword, values.newPassword);
    if (!res.success) {
      setFormError(res.message);
      return;
    }
    await adminLogout();
    clearAuth();
    router.push("/auth/login");
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {formError && (
          <div role="alert" className="rounded-md border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {formError}
          </div>
        )}
        <FormInput name="currentPassword" label="Current Password" type="password" placeholder="••••••••" required />
        <FormInput name="newPassword" label="New Password" type="password" placeholder="••••••••" required />
        <FormInput name="confirmPassword" label="Confirm New Password" type="password" placeholder="••••••••" required />
        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Saving..." : "Change password"}
        </Button>
      </form>
    </FormProvider>
  );
}
