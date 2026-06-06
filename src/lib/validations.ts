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

export const passwordSchema = z
  .string()
  .min(1, "Password field must not be empty")
  .max(128, "Password must be under 128 characters")
  .superRefine((val, ctx) => {
    if (!/[A-Z]/.test(val)) {
      ctx.addIssue({ code: "custom", message: "Password must contain an uppercase letter" });
      return;
    }
    if (!/[0-9]/.test(val)) {
      ctx.addIssue({ code: "custom", message: "Password must contain at least one number" });
      return;
    }
    if (!/[a-z]/.test(val)) {
      ctx.addIssue({ code: "custom", message: "Password must contain a lowercase letter" });
      return;
    }
    if (!PASSWORD_SPECIAL_CHARS.test(val)) {
      ctx.addIssue({ code: "custom", message: "Password must contain a special character" });
      return;
    }
    if (val.length < 8) {
      ctx.addIssue({ code: "custom", message: "Password must be at least 8 characters" });
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

