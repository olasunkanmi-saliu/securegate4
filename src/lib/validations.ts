import { z } from "zod";

const PASSWORD_SPECIAL_CHARS = /[!@#$%^&*()_+\-=\[\]{}|;:',.<>?/]/;

export const emailSchema = z
  .string()
  .email("Enter a valid email address")
  .max(255, "Email must be under 255 characters")
  .transform((value) => value.toLowerCase());

export const nameSchema = z
  .string()
  .trim()
  .min(2, "Name must be at least 2 characters")
  .max(50, "Name must be under 50 characters");

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must be under 128 characters")
  .regex(/[A-Z]/, "Must contain an uppercase letter")
  .regex(/[a-z]/, "Must contain a lowercase letter")
  .regex(/[0-9]/, "Must contain a digit")
  .regex(PASSWORD_SPECIAL_CHARS, "Must contain a special character");

export const signupSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
});

export const signinSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export const resendVerifySchema = z.object({
  email: emailSchema,
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: passwordSchema,
});

export type SignupInput = z.infer<typeof signupSchema>;
export type SigninInput = z.infer<typeof signinSchema>;
export type ResendVerifyInput = z.infer<typeof resendVerifySchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
