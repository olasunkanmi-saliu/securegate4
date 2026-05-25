import { Suspense } from "react";

import { AuthCard } from "@/components/ui/AuthCard";

import { LoginForm } from "./LoginForm";

export default function LoginPage(): JSX.Element {
  return (
    <AuthCard title="Sign in" subtitle="Welcome back to SecureGate.">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </AuthCard>
  );
}
