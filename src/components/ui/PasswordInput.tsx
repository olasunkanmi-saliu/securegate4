"use client";

import { useState } from "react";

import { cx } from "@/lib/utils";

import styles from "./PasswordInput.module.css";

interface PasswordInputProps {
  id: string;
  label: string;
  labelExtra?: React.ReactNode;
  placeholder?: string;
  value: string;
  error?: string;
  disabled?: boolean;
  autoComplete?: "current-password" | "new-password";
  onChange: (value: string) => void;
  onBlur: () => void;
}

export function PasswordInput({
  id,
  label,
  labelExtra,
  placeholder = "Enter your password",
  value,
  error,
  disabled = false,
  autoComplete = "current-password",
  onChange,
  onBlur,
}: PasswordInputProps): JSX.Element {
  const [visible, setVisible] = useState(false);

  return (
    <div className={styles.field}>
      <div className={styles.labelRow}>
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
        {labelExtra}
      </div>
      <div className={styles.inputWrap}>
        <input
          id={id}
          type={visible ? "text" : "password"}
          className={cx(styles.input, error && styles.inputError)}
          placeholder={placeholder}
          value={value}
          disabled={disabled}
          autoComplete={autoComplete}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        <button
          type="button"
          className={styles.toggle}
          onClick={() => setVisible(!visible)}
          aria-label={visible ? "Hide password" : "Show password"}
          tabIndex={-1}
          disabled={disabled}
        >
          {visible ? (
            <svg
              className={styles.icon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            >
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
              <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
          ) : (
            <svg
              className={styles.icon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            >
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      </div>
      {error && (
        <p
          id={`${id}-error`}
          className={styles.errorMsg}
          role="alert"
          aria-live="polite"
        >
          {error}
        </p>
      )}
    </div>
  );
}
