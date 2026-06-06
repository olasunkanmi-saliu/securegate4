"use client";

import { cx } from "@/lib/utils";

import styles from "./SubmitButton.module.css";

interface SubmitButtonProps {
  label: string;
  loadingLabel: string;
  loading?: boolean;
  disabled?: boolean;
}

export function SubmitButton({
  label,
  loadingLabel,
  loading = false,
  disabled = false,
}: SubmitButtonProps): JSX.Element {
  return (
    <button
      type="submit"
      className={cx(styles.button, loading && styles.buttonLoading)}
      disabled={loading || disabled}
      aria-busy={loading}
    >
      {loading && <span className={styles.spinner} aria-hidden="true" />}
      <span>{loading ? loadingLabel : label}</span>
    </button>
  );
}
