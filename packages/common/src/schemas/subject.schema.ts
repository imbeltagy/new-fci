import * as yup from "yup";

import type { Semester } from "../types/subject";

export const semesterOptions: Semester[] = ["first", "second", "summer"];

export const createSubjectSchema = yup.object({
  code: yup.string().required("Code is required"),
  name: yup.string().required("Name is required"),
  semester: yup.mixed<Semester>().oneOf(semesterOptions, "Invalid semester").required("Semester is required"),
  joinYearId: yup.string().uuid().required("Join year is required"),
  majorId: yup.string().uuid().required("Major is required"),
});

export const updateSubjectSchema = yup.object({
  code: yup.string().optional(),
  name: yup.string().optional(),
  semester: yup.mixed<Semester>().oneOf(semesterOptions).optional(),
});

export type CreateSubjectFormValues = yup.InferType<typeof createSubjectSchema>;
export type UpdateSubjectFormValues = yup.InferType<typeof updateSubjectSchema>;
