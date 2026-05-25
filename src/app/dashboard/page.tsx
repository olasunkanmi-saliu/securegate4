import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export default async function DashboardPage(): Promise<JSX.Element> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect("/login");
  }

  const user = await db.user.findUnique({
    where: { email: session.user.email },
    select: { name: true, emailVerified: true },
  });

  if (!user || !user.emailVerified) {
    redirect("/verify-email/please-verify");
  }

  return (
    <main className={styles.main}>
      <h1 className={styles.title}>Dashboard</h1>
      <p className={styles.tagline}>Welcome back, {user.name}.</p>
    </main>
  );
}
