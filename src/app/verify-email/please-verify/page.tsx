import { AuthCard } from "@/components/ui/AuthCard";

import { ResendForm } from "./ResendForm";

export default function PleaseVerifyPage(): JSX.Element {
  return (
    <AuthCard
      title="Verify your email"
      subtitle="Enter your email and we'll send a new verification link."
    >
      <ResendForm />
    </AuthCard>
  );
}
