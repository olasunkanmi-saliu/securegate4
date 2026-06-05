"use client";

import { useSearchParams } from "next/navigation";

import { AuthCard } from "@/components/ui/AuthCard";

import { ForgotPasswordForm } from "./ForgotPasswordForm";
import { LoginForm } from "./LoginForm";
import { SignupForm } from "./SignupForm";

export function AuthContent(): JSX.Element {
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") ?? "login";

  switch (mode) {
    case "signup":
      return (
        <AuthCard
          title="Create your account"
          subtitle="Sign up to access your SecureGate dashboard."
        >
          <SignupForm />
        </AuthCard>
      );

    case "forgot-password":
      return (
        <AuthCard
          title="Forgot password"
          subtitle="Enter your email and we'll send a reset link."
        >
          <ForgotPasswordForm />
        </AuthCard>
      );

    case "login":
    default:
      return (
        <AuthCard title="Sign in" subtitle="Welcome back to SecureGate.">
          <LoginForm />
        </AuthCard>
      );
  }
}
