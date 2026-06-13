import * as yup from "yup";

const creatableRoles = ["student", "teacher", "sub_teacher", "it"] as const;

export const createUserSchema = yup.object({
  email: yup.string().email("Invalid email address").required("Email is required"),
  name: yup.string().required("Name is required"),
  role: yup
    .mixed<(typeof creatableRoles)[number]>()
    .oneOf([...creatableRoles], "Invalid role")
    .required("Role is required"),
  joinYearId: yup.string().optional(),
  majorId: yup.string().optional(),
});
export type CreateUserSchema = yup.InferType<typeof createUserSchema>;

export const editUserSchema = yup.object({
  role: yup
    .mixed<(typeof creatableRoles)[number]>()
    .oneOf([...creatableRoles])
    .optional(),
  isActive: yup.boolean().optional(),
  joinYearId: yup.string().optional(),
  majorId: yup.string().optional(),
  accessGroupId: yup.string().nullable().optional(),
});
export type EditUserSchema = yup.InferType<typeof editUserSchema>;
