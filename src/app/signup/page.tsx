import { AuthCard } from "@/components/ui/AuthCard";

import { SignupForm } from "./SignupForm";

export default function SignupPage(): JSX.Element {
  return (
    <AuthCard
      title="Create your account"
      subtitle="Sign up to access your SecureGate dashboard."
    >
      <SignupForm />
    </AuthCard>
  );
}
