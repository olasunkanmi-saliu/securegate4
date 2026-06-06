"use client";

import Link from "next/link";
import { useState } from "react";

import { Alert } from "@/components/ui/Alert";
import { FormInput } from "@/components/ui/FormInput";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { PasswordStrength } from "@/components/ui/PasswordStrength";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { signupSchema } from "@/lib/validations";
import { PASSWORD_SPECIAL_CHARS } from "@/lib/validations";

import styles from "./SignupForm.module.css";

interface FieldErrors {
  name?: string;
  email?: string;
  password?: string;
}

export function SignupForm(): JSX.Element {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  function validateField(field: keyof FieldErrors): void {
    const result = signupSchema.safeParse({ name, email, password });
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
    setSuccess("");

    const result = signupSchema.safeParse({ name, email, password });
    if (!result.success) {
      const err = result.error.flatten().fieldErrors;
      setFieldErrors({
        name: err.name?.[0],
        email: err.email?.[0],
        password: err.password?.[0],
      });
      return;
    }

    setFieldErrors({});
    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.data),
      });

      if (res.status === 429) {
        setServerError("Too many attempts. Please try again later.");
        return;
      }

      if (!res.ok) {
        setServerError("Something went wrong. Please try again.");
        return;
      }

      setSuccess("Account created. Check your email to verify your address.");
      setName("");
      setEmail("");
      setPassword("");
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
        id="name"
        label="Enter Full Name"
        value={name}
        error={fieldErrors.name}
        disabled={loading || !!success}
        autoComplete="name"
        autoFocus
        onChange={(value) => {
          setName(value);
          if (fieldErrors.name) {
            setFieldErrors((prev) => ({ ...prev, name: undefined }));
          }
        }}
        onBlur={() => validateField("name")}
      />

      <FormInput
        id="email"
        label="Enter Email"
        type="email"
        value={email}
        error={fieldErrors.email}
        disabled={loading || !!success}
        autoComplete="email"
        onChange={(value) => {
          setEmail(value);
          if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            setFieldErrors((prev) => ({ ...prev, email: "Enter a valid email address" }));
          } else {
            setFieldErrors((prev) => ({ ...prev, email: undefined }));
          }
        }}
        onBlur={() => validateField("email")}
      />

      <PasswordInput
        id="password"
        label="Choose Password"
        placeholder=""
        value={password}
        error={fieldErrors.password}
        disabled={loading || !!success}
        autoComplete="new-password"
        onChange={(value) => {
          setPassword(value);
          if (!value) {
            setFieldErrors((prev) => ({ ...prev, password: undefined }));
            return;
          }
          if (!/[A-Z]/.test(value)) {
            setFieldErrors((prev) => ({ ...prev, password: "Password must contain an uppercase letter" }));
          } else if (!/[0-9]/.test(value)) {
            setFieldErrors((prev) => ({ ...prev, password: "Password must contain at least one number" }));
          } else if (!/[a-z]/.test(value)) {
            setFieldErrors((prev) => ({ ...prev, password: "Password must contain a lowercase letter" }));
          } else if (!PASSWORD_SPECIAL_CHARS.test(value)) {
            setFieldErrors((prev) => ({ ...prev, password: "Password must contain a special character" }));
          } else if (value.length < 8) {
            setFieldErrors((prev) => ({ ...prev, password: "Password must be at least 8 characters" }));
          } else {
            setFieldErrors((prev) => ({ ...prev, password: undefined }));
          }
        }}
        onBlur={() => validateField("password")}
      />

      <PasswordStrength password={password} />

      <SubmitButton
        label="Create account"
        loadingLabel="Creating account..."
        loading={loading}
        disabled={!!success}
      />

      <p className={styles.footer}>
        Already have an account?{" "}
        <Link className={styles.footerLink} href="?mode=login">
          Sign in
        </Link>
      </p>
    </form>
  );
}
