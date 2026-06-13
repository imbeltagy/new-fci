import * as yup from "yup";

export const accessGroupSchema = yup.object({
  name: yup.string().required("Name is required"),
  description: yup.string().optional(),
  permissionKeys: yup.array().of(yup.string().required()).default([]),
});
export type AccessGroupSchema = yup.InferType<typeof accessGroupSchema>;
