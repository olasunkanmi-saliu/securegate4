"use client";

import { useState } from "react";

import { Alert } from "@/components/ui/Alert";
import { FormInput } from "@/components/ui/FormInput";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { resendVerifySchema } from "@/lib/validations";

import styles from "./ResendForm.module.css";

const GENERIC_OK =
  "If your account requires verification, a new link has been sent.";

export function ResendForm(): JSX.Element {
  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState<string | undefined>(undefined);
  const [serverError, setServerError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  function validate(): void {
    const result = resendVerifySchema.safeParse({ email });
    setFieldError(
      result.success ? undefined : result.error.flatten().fieldErrors.email?.[0]
    );
  }

  async function handleSubmit(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    setServerError("");
    setSuccess("");

    const result = resendVerifySchema.safeParse({ email });
    if (!result.success) {
      setFieldError(result.error.flatten().fieldErrors.email?.[0]);
      return;
    }

    setFieldError(undefined);
    setLoading(true);

    try {
      const res = await fetch("/api/verify-email/resend", {
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
      {serverError && <Alert variant="error" message={serverError} />}
      {success && <Alert variant="success" message={success} />}

      <FormInput
        id="resend-email"
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
        label="Resend verification link"
        loadingLabel="Sending..."
        loading={loading}
        disabled={!!success}
      />
    </form>
  );
}
