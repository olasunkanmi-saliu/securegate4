"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Alert } from "@/components/ui/Alert";
import { FormInput } from "@/components/ui/FormInput";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { PasswordStrength } from "@/components/ui/PasswordStrength";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { signupSchema } from "@/lib/validations";

import styles from "./SignupForm.module.css";

interface FieldErrors {
  name?: string;
  email?: string;
  password?: string;
}

export function SignupForm(): JSX.Element {
  const router = useRouter();
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

      setTimeout(() => router.push("/login"), 3000);
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
        label="Full name"
        value={name}
        error={fieldErrors.name}
        disabled={loading || !!success}
        autoComplete="name"
        onChange={setName}
        onBlur={() => validateField("name")}
      />

      <FormInput
        id="email"
        label="Email address"
        type="email"
        value={email}
        error={fieldErrors.email}
        disabled={loading || !!success}
        autoComplete="email"
        onChange={setEmail}
        onBlur={() => validateField("email")}
      />

      <PasswordInput
        id="password"
        label="Password"
        value={password}
        error={fieldErrors.password}
        disabled={loading || !!success}
        autoComplete="new-password"
        onChange={setPassword}
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
        <Link className={styles.footerLink} href="/login">
          Sign in
        </Link>
      </p>
    </form>
  );
}
