import Link from "next/link";
import type { JSX } from "react";

import styles from "./page.module.css";

export default function HomePage(): JSX.Element {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.logo} aria-label="SecureGate home">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className={styles.logoMark}
            aria-hidden="true"
          >
            <path
              d="M12 2.5 4.5 5.5v5.6c0 4.7 3.2 9.1 7.5 10.4 4.3-1.3 7.5-5.7 7.5-10.4V5.5L12 2.5Z"
              fill="var(--color-primary-container)"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
            <path
              d="m8.5 12 2.4 2.4 4.6-4.8"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className={styles.logoName}>SecureGate</span>
        </Link>
      </header>

      <main className={styles.main}>
        <h1 className={styles.title}>Authentication that&apos;s built right</h1>
        <p className={styles.tagline}>
          Email verification, password reset, rate
          <br />
          limiting, and secure auth.
        </p>
        <Link href="/auth?mode=signup" className={styles.cta}>
          Get started
        </Link>
      </main>
    </div>
  );
}
