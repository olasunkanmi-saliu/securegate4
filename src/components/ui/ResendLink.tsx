"use client";

import { useState } from "react";

import styles from "./ResendLink.module.css";

interface ResendLinkProps {
  email: string;
}

export function ResendLink({ email }: ResendLinkProps): JSX.Element {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleResend(): Promise<void> {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/verify-email/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.status === 429) {
        setError("Too many attempts. Please try again later.");
        return;
      }

      setSent(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <p className={styles.sent} role="status">
        If the email exists, a verification link has been sent.
      </p>
    );
  }

  return (
    <div className={styles.wrapper}>
      {error && (
        <p className={styles.error} role="alert" aria-live="polite">
          {error}
        </p>
      )}
      <button
        type="button"
        className={styles.link}
        onClick={handleResend}
        disabled={loading}
        aria-busy={loading}
      >
        {loading ? "Sending..." : "Resend verification link"}
      </button>
    </div>
  );
}
