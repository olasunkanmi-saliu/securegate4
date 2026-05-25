"use client";

import { useState } from "react";

import styles from "./ResendForm.module.css";

export function ResendForm(): JSX.Element {
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
      const res = await fetch("/api/verify-email/resend", {
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
      setMessage(
        "If your account requires verification, a new link has been sent."
      );
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
      <label htmlFor="resend-email" className={styles.label}>
        Email address
      </label>
      <input
        id="resend-email"
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
        {status === "loading" ? "Sending..." : "Resend verification link"}
      </button>
      {status === "error" && (
        <p className={styles.error} role="alert" aria-live="polite">
          {message}
        </p>
      )}
    </form>
  );
}
