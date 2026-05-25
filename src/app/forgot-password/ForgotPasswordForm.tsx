"use client";

import { useState } from "react";

import styles from "./ForgotPasswordForm.module.css";

export function ForgotPasswordForm(): JSX.Element {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">(
    "idle"
  );
  const [message, setMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.status === 429) {
        setStatus("error");
        setMessage("Too many attempts. Please try again later.");
        return;
      }

      setStatus("done");
      setMessage("If an account exists, a reset link has been sent.");
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    }
  }

  if (status === "done") {
    return (
      <p className={styles.confirmation} role="status">
        {message}
      </p>
    );
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <label htmlFor="forgot-email" className={styles.label}>
        Email address
      </label>
      <input
        id="forgot-email"
        type="email"
        className={styles.input}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        required
        autoComplete="email"
        disabled={status === "loading"}
      />
      <button
        type="submit"
        className={styles.button}
        disabled={status === "loading" || email.length === 0}
        aria-busy={status === "loading"}
      >
        {status === "loading" ? "Sending..." : "Send reset link"}
      </button>
      {status === "error" && (
        <p className={styles.error} role="alert" aria-live="polite">
          {message}
        </p>
      )}
    </form>
  );
}
