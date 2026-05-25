import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { hashToken } from "@/lib/tokens";

import { ResetPasswordForm } from "./ResetPasswordForm";
import styles from "./page.module.css";

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
    redirect("/forgot-password?expired=1");
  }

  return (
    <main className={styles.main}>
      <h1 className={styles.title}>Reset your password</h1>
      <p className={styles.tagline}>
        Choose a new password to finish signing back in.
      </p>
      <ResetPasswordForm token={params.token} />
    </main>
  );
}
