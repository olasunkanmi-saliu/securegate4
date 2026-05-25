import { ResendForm } from "./ResendForm";
import styles from "./page.module.css";

export default function PleaseVerifyPage(): JSX.Element {
  return (
    <main className={styles.main}>
      <h1 className={styles.title}>Verify your email</h1>
      <p className={styles.tagline}>
        Enter your email and we&apos;ll send a new verification link.
      </p>
      <ResendForm />
    </main>
  );
}
