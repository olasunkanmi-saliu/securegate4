import styles from "./page.module.css";

export default function LoginPage(): JSX.Element {
  return (
    <main className={styles.main}>
      <h1 className={styles.title}>Sign in</h1>
      <p className={styles.tagline}>
        Login form lands here in Phase 6. Authentication API is live.
      </p>
    </main>
  );
}
