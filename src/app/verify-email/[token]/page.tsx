import Link from "next/link";
import { redirect } from "next/navigation";

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
  const incomingToken = params.token;
  const hashed = hashToken(incomingToken);

  const record = await db.verificationToken.findUnique({
    where: { token: hashed },
  });

  if (!record || record.expires < new Date()) {
    return (
      <main className={styles.main}>
        <h1 className={styles.title}>Link expired</h1>
        <p className={styles.tagline}>
          This verification link is no longer valid. Request a new one to
          continue.
        </p>
        <Link href="/verify-email/please-verify" className={styles.link}>
          Request a new link
        </Link>
      </main>
    );
  }

  await db.$transaction([
    db.user.update({
      where: { email: record.identifier },
      data: { emailVerified: new Date() },
    }),
    db.verificationToken.delete({ where: { id: record.id } }),
  ]);

  redirect("/login?verified=1");
}
