import * as yup from "yup";
import YupPassword from "yup-password";

YupPassword(yup);

export const loginSchema = yup.object({
  email: yup.string().email("Invalid email address").required("Email is required"),
  password: yup.string().required("Password is required"),
});
export type LoginSchema = yup.InferType<typeof loginSchema>;

export const resetPasswordSchema = yup.object({
  currentPassword: yup.string().required("Current password is required"),
  newPassword: yup
    .string()
    .min(8, "At least 8 characters")
    .minLowercase(1, "Must contain a lowercase letter")
    .minUppercase(1, "Must contain an uppercase letter")
    .minNumbers(1, "Must contain a number")
    .required("New password is required"),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("newPassword")], "Passwords do not match")
    .required("Please confirm your password"),
});
export type ResetPasswordSchema = yup.InferType<typeof resetPasswordSchema>;

export const forgotPasswordSchema = yup.object({
  email: yup.string().email("Invalid email address").required("Email is required"),
});
export type ForgotPasswordSchema = yup.InferType<typeof forgotPasswordSchema>;

export const confirmResetSchema = yup.object({
  newPassword: yup
    .string()
    .min(8, "At least 8 characters")
    .minLowercase(1, "Must contain a lowercase letter")
    .minUppercase(1, "Must contain an uppercase letter")
    .minNumbers(1, "Must contain a number")
    .required("New password is required"),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("newPassword")], "Passwords do not match")
    .required("Please confirm your password"),
});
export type ConfirmResetSchema = yup.InferType<typeof confirmResetSchema>;
