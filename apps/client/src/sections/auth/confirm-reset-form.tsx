"use client";

import { useState } from "react";
import { yupResolver } from "@hookform/resolvers/yup";
import { useRouter } from "next/navigation";
import { FormProvider, useForm } from "react-hook-form";

import { confirmPasswordReset } from "@repo/common/actions/auth.action";
import { FormInput } from "@repo/common/components/custom/form-input";
import { Button } from "@repo/common/components/ui/button";
import { confirmResetSchema, type ConfirmResetSchema } from "@repo/common/schemas/auth.schema";

interface ConfirmResetFormProps {
  token: string;
}

export function ConfirmResetForm({ token }: ConfirmResetFormProps) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<ConfirmResetSchema>({
    resolver: yupResolver(confirmResetSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  async function onSubmit(values: ConfirmResetSchema) {
    setFormError(null);
    if (!token) {
      setFormError("Invalid or missing reset token.");
      return;
    }
    const res = await confirmPasswordReset(token, values.newPassword);
    if (!res.success) {
      setFormError(res.message);
      return;
    }
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
        <FormInput name="newPassword" label="New Password" type="password" placeholder="••••••••" required />
        <FormInput name="confirmPassword" label="Confirm Password" type="password" placeholder="••••••••" required />
        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting || !token}>
          {form.formState.isSubmitting ? "Saving..." : "Set password"}
        </Button>
      </form>
    </FormProvider>
  );
}
