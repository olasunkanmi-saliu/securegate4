import { redirect } from "next/navigation";

import { AuthCard } from "@/components/ui/AuthCard";
import { db } from "@/lib/db";
import { hashToken } from "@/lib/tokens";

import { ResetPasswordForm } from "./ResetPasswordForm";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface ResetPasswordPageProps {
  params: { token: string };
}

export default async function ResetPasswordPage({
  params,
}: ResetPasswordPageProps): Promise<JSX.Element> {
  const record = await db.passwordResetToken.findUnique({
    where: { token: hashToken(params.token) },
  });

  if (!record || record.expires < new Date()) {
    redirect("/auth?mode=forgot-password&expired=1");
  }

  return (
    <AuthCard
      title="Reset your password"
      subtitle="Choose a new password to finish signing back in."
    >
      <ResetPasswordForm token={params.token} />
    </AuthCard>
  );
}
