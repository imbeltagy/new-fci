"use client";

import { useEffect } from "react";
import { yupResolver } from "@hookform/resolvers/yup";
import { FormProvider, useForm, type Resolver } from "react-hook-form";
import { toast } from "sonner";

import { createJoinYear, updateJoinYear } from "@repo/common/actions/join-years.action";
import { FormInput } from "@repo/common/components/custom/form-input";
import { Button } from "@repo/common/components/ui/button";
import { DialogFooter } from "@repo/common/components/ui/dialog";
import {
  createJoinYearSchema,
  type CreateJoinYearFormValues,
} from "@repo/common/schemas/join-year.schema";
import type { JoinYear } from "@repo/common/types/join-year";

interface JoinYearFormProps {
  joinYear?: JoinYear | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function JoinYearForm({ joinYear, onSuccess, onCancel }: JoinYearFormProps) {
  const form = useForm<CreateJoinYearFormValues>({
    resolver: yupResolver(createJoinYearSchema) as unknown as Resolver<CreateJoinYearFormValues>,
    defaultValues: { year: joinYear?.year ?? new Date().getFullYear() },
  });

  useEffect(() => {
    form.reset({ year: joinYear?.year ?? new Date().getFullYear() });
  }, [joinYear, form]);

  async function onSubmit(values: CreateJoinYearFormValues) {
    const res = joinYear
      ? await updateJoinYear(joinYear.id, { year: values.year })
      : await createJoinYear({ year: values.year });

    if (!res.success) {
      toast.error(res.message);
      return;
    }
    toast.success(joinYear ? "Join year updated." : "Join year created.");
    onSuccess();
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormInput name="year" label="Year" placeholder="2024" type="number" required />
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </form>
    </FormProvider>
  );
}
