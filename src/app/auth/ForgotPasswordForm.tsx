"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { Alert } from "@/components/ui/Alert";
import { FormInput } from "@/components/ui/FormInput";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { forgotPasswordSchema } from "@/lib/validations";

import styles from "./ForgotPasswordForm.module.css";

const GENERIC_OK =
  "If an account exists, a reset link has been sent.";

export function ForgotPasswordForm(): JSX.Element {
  const searchParams = useSearchParams();
  const expired = searchParams.get("expired") === "1";

  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState<string | undefined>(undefined);
  const [serverError, setServerError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  function validate(): void {
    const result = forgotPasswordSchema.safeParse({ email });
    if (!result.success) {
      setFieldError(result.error.flatten().fieldErrors.email?.[0]);
    } else {
      setFieldError(undefined);
    }
  }

  async function handleSubmit(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    setServerError("");
    setSuccess("");

    const result = forgotPasswordSchema.safeParse({ email });
    if (!result.success) {
      setFieldError(result.error.flatten().fieldErrors.email?.[0]);
      return;
    }

    setFieldError(undefined);
    setLoading(true);

    try {
      const res = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.data),
      });

      if (res.status === 429) {
        setServerError("Too many attempts. Please try again later.");
        return;
      }

      setSuccess(GENERIC_OK);
    } catch {
      setServerError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form} noValidate>
      {expired && (
        <Alert
          variant="warning"
          message="Your previous reset link expired. Request a new one below."
        />
      )}
      {serverError && <Alert variant="error" message={serverError} />}
      {success && <Alert variant="success" message={success} />}

      <FormInput
        id="forgot-email"
        label="Email address"
        type="email"
        value={email}
        error={fieldError}
        disabled={loading || !!success}
        autoComplete="email"
        onChange={setEmail}
        onBlur={validate}
      />

      <SubmitButton
        label="Send reset link"
        loadingLabel="Sending..."
        loading={loading}
        disabled={!!success}
      />

      <p className={styles.footer}>
        Remembered it?{" "}
        <Link className={styles.footerLink} href="?mode=login">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
