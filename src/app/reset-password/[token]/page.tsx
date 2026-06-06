import { redirect } from "next/navigation";

import { Alert } from "@/components/ui/Alert";
import { AuthCard } from "@/components/ui/AuthCard";
import { GENERIC_SERVER_ERROR } from "@/lib/constants";
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
  let record;
  try {
    record = await db.passwordResetToken.findUnique({
      where: { token: hashToken(params.token) },
    });
  } catch (error) {
    console.error("[RESET_PASSWORD:FIND]", error);
    return (
      <AuthCard title="Something went wrong" subtitle="Please try again later.">
        <Alert variant="error" message={GENERIC_SERVER_ERROR} />
      </AuthCard>
    );
  }

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
