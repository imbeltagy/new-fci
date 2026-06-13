"use client";

import { useEffect } from "react";
import { yupResolver } from "@hookform/resolvers/yup";
import { Controller, FormProvider, useForm, type Resolver } from "react-hook-form";
import { toast } from "sonner";

import { updateUser } from "@repo/common/actions/users.action";
import { FormInput } from "@repo/common/components/custom/form-input";
import { FormSelect } from "@repo/common/components/custom/form-select";
import { Button } from "@repo/common/components/ui/button";
import { Checkbox } from "@repo/common/components/ui/checkbox";
import { DialogFooter } from "@repo/common/components/ui/dialog";
import { Label } from "@repo/common/components/ui/label";
import { editUserSchema, type EditUserSchema } from "@repo/common/schemas/user.schema";
import type { User } from "@repo/common/types/user";

const ROLE_OPTIONS = [
  { label: "Student", value: "student" },
  { label: "Teacher", value: "teacher" },
  { label: "Sub Teacher", value: "sub_teacher" },
  { label: "IT", value: "it" },
];

interface EditUserFormProps {
  user: User;
  onSuccess: () => void;
  onCancel: () => void;
}

export function EditUserForm({ user, onSuccess, onCancel }: EditUserFormProps) {
  const form = useForm<EditUserSchema>({
    resolver: yupResolver(editUserSchema) as unknown as Resolver<EditUserSchema>,
    defaultValues: {
      role: (user.role as EditUserSchema["role"]) ?? "student",
      isActive: user.isActive,
      joinYearId: user.joinYearId ?? "",
      majorId: user.majorId ?? "",
      accessGroupId: user.accessGroupId ?? "",
    },
  });

  useEffect(() => {
    form.reset({
      role: (user.role as EditUserSchema["role"]) ?? "student",
      isActive: user.isActive,
      joinYearId: user.joinYearId ?? "",
      majorId: user.majorId ?? "",
      accessGroupId: user.accessGroupId ?? "",
    });
  }, [user, form]);

  async function onSubmit(values: EditUserSchema) {
    const res = await updateUser(user.id, {
      role: values.role,
      isActive: values.isActive,
      joinYearId: values.joinYearId || undefined,
      majorId: values.majorId || undefined,
      accessGroupId: values.accessGroupId === "" ? null : values.accessGroupId,
    });
    if (!res.success) {
      toast.error(res.message);
      return;
    }
    toast.success("User updated.");
    onSuccess();
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormSelect name="role" label="Role" options={ROLE_OPTIONS} />
        <Controller
          name="isActive"
          control={form.control}
          render={({ field }) => (
            <div className="flex items-center gap-2">
              <Checkbox
                id="isActive"
                checked={field.value ?? true}
                onCheckedChange={(v) => field.onChange(!!v)}
              />
              <Label htmlFor="isActive">Active</Label>
            </div>
          )}
        />
        <FormInput name="joinYearId" label="Join Year ID" placeholder="Optional" />
        <FormInput name="majorId" label="Major ID" placeholder="Optional" />
        <FormInput name="accessGroupId" label="Access Group ID" placeholder="Leave empty to remove" />
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
