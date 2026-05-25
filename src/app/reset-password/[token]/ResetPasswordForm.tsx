"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Alert } from "@/components/ui/Alert";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { PasswordStrength } from "@/components/ui/PasswordStrength";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { passwordSchema } from "@/lib/validations";

import styles from "./ResetPasswordForm.module.css";

interface ResetPasswordFormProps {
  token: string;
}

export function ResetPasswordForm({
  token,
}: ResetPasswordFormProps): JSX.Element {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [fieldError, setFieldError] = useState<string | undefined>(undefined);
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  function validate(): void {
    const result = passwordSchema.safeParse(password);
    setFieldError(result.success ? undefined : result.error.issues[0]?.message);
  }

  async function handleSubmit(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    setServerError("");

    const result = passwordSchema.safeParse(password);
    if (!result.success) {
      setFieldError(result.error.issues[0]?.message);
      return;
    }

    setFieldError(undefined);
    setLoading(true);

    try {
      const res = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      if (res.status === 400) {
        const data: { fieldErrors?: { password?: string[] } } = await res.json();
        if (data.fieldErrors?.password?.[0]) {
          setFieldError(data.fieldErrors.password[0]);
        } else {
          router.push("/forgot-password?expired=1");
        }
        return;
      }

      if (!res.ok) {
        setServerError("Something went wrong. Please try again.");
        return;
      }

      router.push("/login?reset=1");
    } catch {
      setServerError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form} noValidate>
      {serverError && <Alert variant="error" message={serverError} />}

      <PasswordInput
        id="new-password"
        label="New password"
        placeholder="Enter a strong password"
        value={password}
        error={fieldError}
        disabled={loading}
        autoComplete="new-password"
        onChange={setPassword}
        onBlur={validate}
      />

      <PasswordStrength password={password} />

      <SubmitButton
        label="Update password"
        loadingLabel="Updating..."
        loading={loading}
      />
    </form>
  );
}
