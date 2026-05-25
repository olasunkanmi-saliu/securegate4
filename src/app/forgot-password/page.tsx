import { Alert } from "@/components/ui/Alert";
import { AuthCard } from "@/components/ui/AuthCard";

import { ForgotPasswordForm } from "./ForgotPasswordForm";

interface ForgotPasswordPageProps {
  searchParams: { expired?: string };
}

export default function ForgotPasswordPage({
  searchParams,
}: ForgotPasswordPageProps): JSX.Element {
  const expired = searchParams.expired === "1";

  return (
    <AuthCard
      title="Forgot password"
      subtitle="Enter your email and we'll send a reset link."
    >
      {expired && (
        <Alert
          variant="warning"
          message="Your previous reset link expired. Request a new one below."
        />
      )}
      <ForgotPasswordForm />
    </AuthCard>
  );
}
