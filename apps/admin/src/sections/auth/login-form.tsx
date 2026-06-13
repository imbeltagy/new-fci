"use client";

import { useState } from "react";
import { yupResolver } from "@hookform/resolvers/yup";
import { useRouter } from "next/navigation";
import { FormProvider, useForm } from "react-hook-form";

import { adminLogin } from "@repo/common/actions/auth.action";
import { FormInput } from "@repo/common/components/custom/form-input";
import { Button } from "@repo/common/components/ui/button";
import { loginSchema, type LoginSchema } from "@repo/common/schemas/auth.schema";
import { useAuthStore } from "@repo/common/stores/auth.store";

export function LoginForm() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<LoginSchema>({
    resolver: yupResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginSchema) {
    setFormError(null);
    const res = await adminLogin(values.email, values.password);
    if (!res.success) {
      setFormError(res.message);
      return;
    }
    setUser(res.data!.user);
    router.push("/");
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
        <FormInput name="password" label="Password" type="password" placeholder="••••••••" required />
        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Signing in..." : "Sign in"}
        </Button>
      </form>
    </FormProvider>
  );
}
