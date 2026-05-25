"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import styles from "./ResetPasswordForm.module.css";

interface ResetPasswordFormProps {
  token: string;
}

interface FieldErrors {
  password?: string;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps): JSX.Element {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setServerError("");
    setFieldErrors({});
    setLoading(true);

    try {
      const res = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      if (res.status === 400) {
        const data = await res.json();
        if (data?.fieldErrors?.password?.[0]) {
          setFieldErrors({ password: data.fieldErrors.password[0] });
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
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <label htmlFor="new-password" className={styles.label}>
        New password
      </label>
      <input
        id="new-password"
        type="password"
        className={styles.input}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Enter a strong password"
        required
        autoComplete="new-password"
        disabled={loading}
        aria-invalid={!!fieldErrors.password}
        aria-describedby={fieldErrors.password ? "new-password-error" : undefined}
      />
      {fieldErrors.password && (
        <p
          id="new-password-error"
          className={styles.error}
          role="alert"
          aria-live="polite"
        >
          {fieldErrors.password}
        </p>
      )}
      <button
        type="submit"
        className={styles.button}
        disabled={loading || password.length === 0}
        aria-busy={loading}
      >
        {loading ? "Updating..." : "Update password"}
      </button>
      {serverError && (
        <p className={styles.error} role="alert" aria-live="polite">
          {serverError}
        </p>
      )}
    </form>
  );
}
