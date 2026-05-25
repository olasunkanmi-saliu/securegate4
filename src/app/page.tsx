import Link from "next/link";

import styles from "./page.module.css";

export default function HomePage(): JSX.Element {
  return (
    <main className={styles.main}>
      <h1 className={styles.title}>SecureGate</h1>
      <p className={styles.tagline}>
        Production-grade authentication and identity security.
      </p>
      <div className={styles.actions}>
        <Link href="/login" className={styles.primary}>
          Sign in
        </Link>
        <Link href="/signup" className={styles.secondary}>
          Create account
        </Link>
      </div>
    </main>
  );
}
