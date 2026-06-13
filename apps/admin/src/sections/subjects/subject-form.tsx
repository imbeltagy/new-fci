"use client";

import { useEffect } from "react";
import { yupResolver } from "@hookform/resolvers/yup";
import { FormProvider, useForm, type Resolver } from "react-hook-form";
import { toast } from "sonner";

import { createSubject, updateSubject } from "@repo/common/actions/subjects.action";
import { FormInput } from "@repo/common/components/custom/form-input";
import { FormSelect } from "@repo/common/components/custom/form-select";
import { Button } from "@repo/common/components/ui/button";
import { DialogFooter } from "@repo/common/components/ui/dialog";
import { useListJoinYearsQuery } from "@repo/common/queries/join-years.query";
import { useListMajorsQuery } from "@repo/common/queries/majors.query";
import {
  createSubjectSchema,
  semesterOptions,
  type CreateSubjectFormValues,
} from "@repo/common/schemas/subject.schema";
import type { Subject } from "@repo/common/types/subject";

const SEMESTER_OPTIONS = semesterOptions.map((s) => ({
  label: s.charAt(0).toUpperCase() + s.slice(1),
  value: s,
}));

interface SubjectFormProps {
  subject?: Subject | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function SubjectForm({ subject, onSuccess, onCancel }: SubjectFormProps) {
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

  const form = useForm<CreateSubjectFormValues>({
    resolver: yupResolver(createSubjectSchema) as unknown as Resolver<CreateSubjectFormValues>,
    defaultValues: {
      code: subject?.code ?? "",
      name: subject?.name ?? "",
      semester: subject?.semester ?? "first",
      joinYearId: subject?.joinYearId ?? "",
      majorId: subject?.majorId ?? "",
    },
  });

  useEffect(() => {
    form.reset({
      code: subject?.code ?? "",
      name: subject?.name ?? "",
      semester: subject?.semester ?? "first",
      joinYearId: subject?.joinYearId ?? "",
      majorId: subject?.majorId ?? "",
    });
  }, [subject, form]);

  async function onSubmit(values: CreateSubjectFormValues) {
    const res = subject
      ? await updateSubject(subject.id, { code: values.code, name: values.name, semester: values.semester })
      : await createSubject(values);

    if (!res.success) {
      toast.error(res.message);
      return;
    }
    toast.success(subject ? "Subject updated." : "Subject created.");
    onSuccess();
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormInput name="code" label="Code" placeholder="CS101" required />
        <FormInput name="name" label="Name" placeholder="Introduction to Programming" required />
        <FormSelect name="semester" label="Semester" options={SEMESTER_OPTIONS} required />
        {!subject && (
          <>
            <FormSelect name="joinYearId" label="Join Year" options={joinYearOptions} required />
            <FormSelect name="majorId" label="Major" options={majorOptions} required />
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
