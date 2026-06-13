"use client";

import { yupResolver } from "@hookform/resolvers/yup";
import { FormProvider, useForm, useWatch, type Resolver } from "react-hook-form";
import { toast } from "sonner";

import { createUser } from "@repo/common/actions/users.action";
import { FormInput } from "@repo/common/components/custom/form-input";
import { FormSelect } from "@repo/common/components/custom/form-select";
import { Button } from "@repo/common/components/ui/button";
import { DialogFooter } from "@repo/common/components/ui/dialog";
import { useListJoinYearsQuery } from "@repo/common/queries/join-years.query";
import { useListMajorsQuery } from "@repo/common/queries/majors.query";
import { createUserSchema, type CreateUserSchema } from "@repo/common/schemas/user.schema";

const ROLE_OPTIONS = [
  { label: "Student", value: "student" },
  { label: "Teacher", value: "teacher" },
  { label: "Sub Teacher", value: "sub_teacher" },
  { label: "IT", value: "it" },
];

interface CreateUserFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function CreateUserForm({ onSuccess, onCancel }: CreateUserFormProps) {
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

  const form = useForm<CreateUserSchema>({
    resolver: yupResolver(createUserSchema) as unknown as Resolver<CreateUserSchema>,
    defaultValues: { email: "", name: "", role: "student", joinYearId: "", majorId: "" },
  });

  const role = useWatch({ control: form.control, name: "role" });
  const isStudent = role === "student";

  async function onSubmit(values: CreateUserSchema) {
    const res = await createUser({
      email: values.email,
      name: values.name,
      role: values.role,
      joinYearId: isStudent ? (values.joinYearId || undefined) : undefined,
      majorId: isStudent ? (values.majorId || undefined) : undefined,
    });
    if (!res.success) {
      toast.error(res.message);
      return;
    }
    toast.success(`User created. Temporary password: ${res.data!.temporaryPassword}`);
    onSuccess();
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormInput name="email" label="Email" placeholder="user@example.com" required />
        <FormInput name="name" label="Name" placeholder="Full name" required />
        <FormSelect name="role" label="Role" options={ROLE_OPTIONS} required />
        {isStudent && (
          <>
            <FormSelect name="joinYearId" label="Join Year" options={joinYearOptions} />
            <FormSelect name="majorId" label="Major" options={majorOptions} />
          </>
        )}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Creating..." : "Create"}
          </Button>
        </DialogFooter>
      </form>
    </FormProvider>
  );
}
