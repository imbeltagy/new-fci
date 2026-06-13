"use client";

import { useState } from "react";
import { yupResolver } from "@hookform/resolvers/yup";
import { FormProvider, useForm } from "react-hook-form";

import { requestPasswordReset } from "@repo/common/actions/auth.action";
import { FormInput } from "@repo/common/components/custom/form-input";
import { Button } from "@repo/common/components/ui/button";
import { forgotPasswordSchema, type ForgotPasswordSchema } from "@repo/common/schemas/auth.schema";

interface ForgotPasswordFormProps {
  onSuccess: () => void;
}

export function ForgotPasswordForm({ onSuccess }: ForgotPasswordFormProps) {
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<ForgotPasswordSchema>({
    resolver: yupResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: ForgotPasswordSchema) {
    setFormError(null);
    const res = await requestPasswordReset(values.email);
    if (!res.success) {
      setFormError(res.message);
      return;
    }
    onSuccess();
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {formError && (
          <div role="alert" className="rounded-md border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {formError}
          </div>
        )}
        <FormInput name="email" label="Email" placeholder="you@example.com" required />
        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Sending..." : "Send reset link"}
        </Button>
      </form>
    </FormProvider>
  );
}
