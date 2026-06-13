import * as yup from "yup";

export const createJoinYearSchema = yup.object({
  year: yup.number().integer().min(2000).max(2100).required("Year is required"),
});

export const updateJoinYearSchema = yup.object({
  year: yup.number().integer().min(2000).max(2100).optional(),
});

export type CreateJoinYearFormValues = yup.InferType<typeof createJoinYearSchema>;
export type UpdateJoinYearFormValues = yup.InferType<typeof updateJoinYearSchema>;
