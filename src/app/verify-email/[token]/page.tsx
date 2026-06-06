import Link from "next/link";
import { redirect } from "next/navigation";

import { Alert } from "@/components/ui/Alert";
import { AuthCard } from "@/components/ui/AuthCard";
import { GENERIC_SERVER_ERROR } from "@/lib/constants";
import { db } from "@/lib/db";
import { hashToken } from "@/lib/tokens";

import styles from "./page.module.css";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface VerifyEmailPageProps {
  params: { token: string };
}

export default async function VerifyEmailPage({
  params,
}: VerifyEmailPageProps): Promise<JSX.Element> {
  let record;
  try {
    record = await db.verificationToken.findUnique({
      where: { token: hashToken(params.token) },
    });
  } catch (error) {
    console.error("[VERIFY_EMAIL:FIND]", error);
    return (
      <AuthCard title="Something went wrong" subtitle="Please try again later.">
        <Alert variant="error" message={GENERIC_SERVER_ERROR} />
        <Link href="/verify-email/please-verify" className={styles.link}>
          Request a new link
        </Link>
      </AuthCard>
    );
  }

  if (!record || record.expires < new Date()) {
    return (
      <AuthCard title="Link expired" subtitle="This verification link is no longer valid.">
        <Alert
          variant="warning"
          message="Request a new verification link to continue."
        />
        <Link href="/verify-email/please-verify" className={styles.link}>
          Request a new link
        </Link>
      </AuthCard>
    );
  }

  try {
    await db.$transaction([
      db.user.update({
        where: { email: record.identifier },
        data: { emailVerified: new Date() },
      }),
      db.verificationToken.delete({ where: { id: record.id } }),
    ]);
  } catch (error) {
    console.error("[VERIFY_EMAIL:TRANSACTION]", error);
    return (
      <AuthCard title="Something went wrong" subtitle="Please try again later.">
        <Alert variant="error" message={GENERIC_SERVER_ERROR} />
        <Link href="/verify-email/please-verify" className={styles.link}>
          Request a new link
        </Link>
      </AuthCard>
    );
  }

  redirect("/auth?mode=login&verified=1");
}
