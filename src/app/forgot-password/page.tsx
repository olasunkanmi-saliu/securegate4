import { ForgotPasswordForm } from "./ForgotPasswordForm";
import styles from "./page.module.css";

interface ForgotPasswordPageProps {
  searchParams: { expired?: string };
}

export default function ForgotPasswordPage({
  searchParams,
}: ForgotPasswordPageProps): JSX.Element {
  const expired = searchParams.expired === "1";

  return (
    <main className={styles.main}>
      <h1 className={styles.title}>Forgot password</h1>
      <p className={styles.tagline}>
        Enter your email and we&apos;ll send a reset link.
      </p>
      {expired && (
        <p className={styles.notice} role="alert">
          Your previous reset link expired. Request a new one below.
        </p>
      )}
      <ForgotPasswordForm />
    </main>
  );
}
