"use client";

import { signOut } from "next-auth/react";
import { useState } from "react";

import styles from "./DashboardContent.module.css";

interface DashboardContentProps {
  userName: string;
  userEmail: string;
}

export function DashboardContent({
  userName,
  userEmail,
}: DashboardContentProps): JSX.Element {
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut(): Promise<void> {
    setSigningOut(true);
    await signOut({ callbackUrl: "/auth?mode=login" });
  }

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <div>
          <span className={styles.logo}>SecureGate</span>
        </div>
        <button
          type="button"
          className={styles.signOut}
          onClick={handleSignOut}
          disabled={signingOut}
          aria-busy={signingOut}
        >
          {signingOut ? "Signing out..." : "Sign out"}
        </button>
      </header>

      <section className={styles.card}>
        <h1 className={styles.title}>Welcome back, {userName}.</h1>
        <p className={styles.subtitle}>
          You&apos;re signed in as <span className={styles.email}>{userEmail}</span>.
        </p>
        <p className={styles.body}>
          This is your authenticated workspace. Add real product surface here as
          the app grows — for now, simply being able to reach this page proves
          the full signup → verify → sign in flow is working end to end.
        </p>
      </section>
    </main>
  );
}
