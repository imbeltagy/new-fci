"use client";

import { useEffect } from "react";
import { yupResolver } from "@hookform/resolvers/yup";
import { FormProvider, useForm, type Resolver } from "react-hook-form";
import { toast } from "sonner";

import { createMajor, updateMajor } from "@repo/common/actions/majors.action";
import { FormInput } from "@repo/common/components/custom/form-input";
import { Button } from "@repo/common/components/ui/button";
import { DialogFooter } from "@repo/common/components/ui/dialog";
import {
  createMajorSchema,
  type CreateMajorFormValues,
} from "@repo/common/schemas/major.schema";
import type { Major } from "@repo/common/types/major";

interface MajorFormProps {
  major?: Major | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function MajorForm({ major, onSuccess, onCancel }: MajorFormProps) {
  const form = useForm<CreateMajorFormValues>({
    resolver: yupResolver(createMajorSchema) as unknown as Resolver<CreateMajorFormValues>,
    defaultValues: { name: major?.name ?? "", code: major?.code ?? "" },
  });

  useEffect(() => {
    form.reset({ name: major?.name ?? "", code: major?.code ?? "" });
  }, [major, form]);

  async function onSubmit(values: CreateMajorFormValues) {
    const res = major
      ? await updateMajor(major.id, values)
      : await createMajor(values);

    if (!res.success) {
      toast.error(res.message);
      return;
    }
    toast.success(major ? "Major updated." : "Major created.");
    onSuccess();
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormInput name="name" label="Name" placeholder="Computer Science" required />
        <FormInput name="code" label="Code" placeholder="CS" required />
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
