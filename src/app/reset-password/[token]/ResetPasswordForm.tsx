"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Alert } from "@/components/ui/Alert";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { PasswordStrength } from "@/components/ui/PasswordStrength";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { resetPasswordSchema } from "@/lib/validations";

import styles from "./ResetPasswordForm.module.css";

interface FieldErrors {
  password?: string;
  confirmPassword?: string;
}

interface ResetPasswordFormProps {
  token: string;
}

export function ResetPasswordForm({
  token,
}: ResetPasswordFormProps): JSX.Element {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  function validateField(field: keyof FieldErrors): void {
    const result = resetPasswordSchema.safeParse({ token, password, confirmPassword });
    if (!result.success) {
      const err = result.error.flatten().fieldErrors;
      setFieldErrors((prev) => ({ ...prev, [field]: err[field]?.[0] }));
    } else {
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }

  async function handleSubmit(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    setServerError("");

    const result = resetPasswordSchema.safeParse({ token, password, confirmPassword });
    if (!result.success) {
      const err = result.error.flatten().fieldErrors;
      setFieldErrors({
        password: err.password?.[0],
        confirmPassword: err.confirmPassword?.[0],
      });
      return;
    }

    setFieldErrors({});
    setLoading(true);

    try {
      const res = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: result.data.password }),
      });

      if (res.status === 429) {
        setServerError("Too many attempts. Please try again later.");
        return;
      }

      if (res.status === 400) {
        const body = await res.json();
        if (body.fieldErrors?.password?.[0]) {
          setFieldError("password", body.fieldErrors.password[0]);
        } else {
          router.push("/auth?mode=forgot-password&expired=1");
        }
        return;
      }

      if (!res.ok) {
        setServerError("Something went wrong. Please try again.");
        return;
      }

      router.push("/auth?mode=login&reset=1");
    } catch {
      setServerError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function setFieldError(field: keyof FieldErrors, message: string): void {
    setFieldErrors((prev) => ({ ...prev, [field]: message }));
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form} noValidate>
      {serverError && <Alert variant="error" message={serverError} />}

      <PasswordInput
        id="new-password"
        label="New password"
        placeholder="Enter a strong password"
        value={password}
        error={fieldErrors.password}
        disabled={loading}
        autoComplete="new-password"
        onChange={setPassword}
        onBlur={() => validateField("password")}
      />

      <PasswordStrength password={password} />

      <PasswordInput
        id="confirmPassword"
        label="Confirm password"
        placeholder="Re-enter your password"
        value={confirmPassword}
        error={fieldErrors.confirmPassword}
        disabled={loading}
        autoComplete="new-password"
        onChange={setConfirmPassword}
        onBlur={() => validateField("confirmPassword")}
      />

      <SubmitButton
        label="Update password"
        loadingLabel="Updating..."
        loading={loading}
      />
    </form>
  );
}
