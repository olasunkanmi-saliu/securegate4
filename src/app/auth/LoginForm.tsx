"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { Alert } from "@/components/ui/Alert";
import { FormInput } from "@/components/ui/FormInput";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { signinSchema } from "@/lib/validations";

import styles from "./LoginForm.module.css";

interface FieldErrors {
  email?: string;
  password?: string;
}

function describeError(): string {
  return "Invalid email or password.";
}

export function LoginForm(): JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const verified = searchParams.get("verified") === "1";
  const reset = searchParams.get("reset") === "1";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  function validateField(field: keyof FieldErrors): void {
    const result = signinSchema.safeParse({ email, password });
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

    const result = signinSchema.safeParse({ email, password });
    if (!result.success) {
      const err = result.error.flatten().fieldErrors;
      setFieldErrors({
        email: err.email?.[0],
        password: err.password?.[0],
      });
      return;
    }

    setFieldErrors({});
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        email: result.data.email,
        password: result.data.password,
        redirect: false,
      });

      if (!res || res.error) {
        setServerError(describeError());
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setServerError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form} noValidate>
      {verified && (
        <Alert
          variant="success"
          message="Email verified. You can now sign in."
        />
      )}
      {reset && (
        <Alert
          variant="success"
          message="Password updated. Sign in with your new password."
        />
      )}
      {serverError && <Alert variant="error" message={serverError} />}

      <FormInput
        id="email"
        label="Email address"
        type="email"
        value={email}
        error={fieldErrors.email}
        disabled={loading}
        autoComplete="email"
        onChange={(value) => {
          setEmail(value);
          if (fieldErrors.email) {
            setFieldErrors((prev) => ({ ...prev, email: undefined }));
          }
        }}
        onBlur={() => validateField("email")}
      />

      <PasswordInput
        id="password"
        label="Password"
        placeholder=""
        labelExtra={
          <Link className={styles.fieldLink} href="?mode=forgot-password">
            Forgot password?
          </Link>
        }
        value={password}
        error={fieldErrors.password}
        disabled={loading}
        autoComplete="current-password"
        onChange={(value) => {
          setPassword(value);
          if (fieldErrors.password) {
            setFieldErrors((prev) => ({ ...prev, password: undefined }));
          }
        }}
        onBlur={() => validateField("password")}
      />

      <SubmitButton
        label="Sign in"
        loadingLabel="Signing in..."
        loading={loading}
      />

      <div className={styles.footer}>
        <span>
          New here?{" "}
          <Link className={styles.footerLink} href="?mode=signup">
            Create an account
          </Link>
        </span>
      </div>
    </form>
  );
}
