import * as yup from "yup";

export const createMajorSchema = yup.object({
  name: yup.string().required("Name is required"),
  code: yup
    .string()
    .matches(/^[A-Z0-9_-]+$/, "Code must be uppercase letters, digits, underscores or dashes")
    .required("Code is required"),
});

export const updateMajorSchema = yup.object({
  name: yup.string().optional(),
  code: yup
    .string()
    .matches(/^[A-Z0-9_-]+$/, "Code must be uppercase letters, digits, underscores or dashes")
    .optional(),
});

export type CreateMajorFormValues = yup.InferType<typeof createMajorSchema>;
export type UpdateMajorFormValues = yup.InferType<typeof updateMajorSchema>;
