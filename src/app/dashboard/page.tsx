import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";

import styles from "./page.module.css";

export default async function DashboardPage(): Promise<JSX.Element> {
  const session = await getServerSession(authOptions);

  return (
    <main className={styles.main}>
      <h1 className={styles.title}>Dashboard</h1>
      <p className={styles.tagline}>
        Welcome back{session?.user?.name ? `, ${session.user.name}` : ""}.
      </p>
    </main>
  );
}
