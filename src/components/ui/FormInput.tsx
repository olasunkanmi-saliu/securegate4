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
  success?: string;
  disabled?: boolean;
  autoComplete?: string;
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
  success,
  disabled = false,
  autoComplete,
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
          error && styles.inputError,
          success && styles.inputSuccess
        )}
        placeholder={placeholder}
        value={value}
        disabled={disabled}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        aria-invalid={!!error}
        aria-describedby={
          error ? `${id}-error` : success ? `${id}-success` : undefined
        }
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
      {success && (
        <p id={`${id}-success`} className={styles.successMsg}>
          {success}
        </p>
      )}
    </div>
  );
}
