"use client";

import { useEffect } from "react";
import { yupResolver } from "@hookform/resolvers/yup";
import { Controller, FormProvider, useForm, useWatch, type Resolver } from "react-hook-form";
import { toast } from "sonner";

import { updateUser } from "@repo/common/actions/users.action";
import { FormSelect } from "@repo/common/components/custom/form-select";
import { Button } from "@repo/common/components/ui/button";
import { Checkbox } from "@repo/common/components/ui/checkbox";
import { DialogFooter } from "@repo/common/components/ui/dialog";
import { Label } from "@repo/common/components/ui/label";
import { useListJoinYearsQuery } from "@repo/common/queries/join-years.query";
import { useListMajorsQuery } from "@repo/common/queries/majors.query";
import { editUserSchema, type EditUserSchema } from "@repo/common/schemas/user.schema";
import type { User } from "@repo/common/types/user";

const ROLE_LABEL: Record<string, string> = {
  student: "Student",
  teacher: "Teacher",
  sub_teacher: "Sub Teacher",
  it: "IT",
  superadmin: "Super Admin",
};

interface EditUserFormProps {
  user: User;
  onSuccess: () => void;
  onCancel: () => void;
}

export function EditUserForm({ user, onSuccess, onCancel }: EditUserFormProps) {
  const { data: joinYearsData } = useListJoinYearsQuery();
  const { data: majorsData } = useListMajorsQuery();

  const joinYearOptions = (joinYearsData?.data?.joinYears ?? []).map((jy) => ({
    label: String(jy.year),
    value: jy.id,
  }));
  const majorOptions = (majorsData?.data?.majors ?? []).map((m) => ({
    label: `${m.name} (${m.code})`,
    value: m.id,
  }));

  const form = useForm<EditUserSchema>({
    resolver: yupResolver(editUserSchema) as unknown as Resolver<EditUserSchema>,
    defaultValues: {
      isActive: user.isActive,
      joinYearId: user.joinYearId ?? "",
      majorId: user.majorId ?? "",
    },
  });

  useEffect(() => {
    form.reset({
      isActive: user.isActive,
      joinYearId: user.joinYearId ?? "",
      majorId: user.majorId ?? "",
    });
  }, [user, form]);

  const isStudent = user.role === "student";

  async function onSubmit(values: EditUserSchema) {
    const res = await updateUser(user.id, {
      isActive: values.isActive,
      joinYearId: isStudent ? (values.joinYearId || undefined) : undefined,
      majorId: isStudent ? (values.majorId || undefined) : undefined,
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
        <div className="space-y-1">
          <Label className="text-muted-foreground text-xs uppercase tracking-wide">Role</Label>
          <p className="text-sm font-medium">{ROLE_LABEL[user.role] ?? user.role}</p>
        </div>
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
        {isStudent && (
          <>
            <FormSelect name="joinYearId" label="Join Year" options={joinYearOptions} />
            <FormSelect name="majorId" label="Major" options={majorOptions} />
          </>
        )}
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
