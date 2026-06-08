import { z } from "zod";

export const PASSWORD_SPECIAL_CHARS = /[!@#$%^&*()_+\-=\[\]{}|;:',.<>?/]/;

export const emailSchema = z
  .string()
  .trim()
  .email("Enter a valid email address")
  .max(255, "Email must be under 255 characters")
  .transform((value) => value.toLowerCase());

export const nameSchema = z
  .string()
  .trim()
  .min(2, "Name must be at least 2 characters")
  .max(50, "Name must be under 50 characters");

export function checkPassword(value: string): string | null {
  if (!/[A-Z]/.test(value)) return "Password must contain an uppercase letter";
  if (!/[0-9]/.test(value)) return "Password must contain at least one number";
  if (!/[a-z]/.test(value)) return "Password must contain a lowercase letter";
  if (!PASSWORD_SPECIAL_CHARS.test(value)) return "Password must contain a special character";
  if (value.length < 8) return "Password must be at least 8 characters";
  return null;
}

export function scorePassword(value: string): number {
  if (!value) return 0;
  let score = 0;
  if (value.length >= 8) score++;
  if (/[A-Z]/.test(value)) score++;
  if (/[a-z]/.test(value)) score++;
  if (/[0-9]/.test(value)) score++;
  if (PASSWORD_SPECIAL_CHARS.test(value)) score++;
  return score;
}

export const passwordSchema = z
  .string()
  .min(1, "Password field must not be empty")
  .max(128, "Password must be under 128 characters")
  .superRefine((val, ctx) => {
    const error = checkPassword(val);
    if (error) {
      ctx.addIssue({ code: "custom", message: error });
    }
  });

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
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const resetPasswordApiSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: passwordSchema,
});

