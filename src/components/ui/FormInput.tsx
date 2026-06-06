"use client";

import { cx } from "@/lib/utils";

import styles from "./FormInput.module.css";

interface FormInputProps {
  id: string;
  label: string;
  type?: string;
  placeholder?: string;
  value: string;
  error?: string;
  disabled?: boolean;
  autoComplete?: string;
  autoFocus?: boolean;
  onChange: (value: string) => void;
  onBlur: () => void;
}

export function FormInput({
  id,
  label,
  type = "text",
  placeholder,
  value,
  error,
  disabled = false,
  autoComplete,
  autoFocus,
  onChange,
  onBlur,
}: FormInputProps): JSX.Element {
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <input
        id={id}
        type={type}
        className={cx(
          styles.input,
          error && styles.inputError
        )}
        placeholder={placeholder}
        value={value}
        disabled={disabled}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
      />
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
