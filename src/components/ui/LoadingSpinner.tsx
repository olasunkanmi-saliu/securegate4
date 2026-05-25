import { cx } from "@/lib/utils";

import styles from "./LoadingSpinner.module.css";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  centered?: boolean;
  label?: string;
}

const sizeMap = {
  sm: 16,
  md: 24,
  lg: 36,
} as const;

export function LoadingSpinner({
  size = "md",
  centered = false,
  label,
}: LoadingSpinnerProps): JSX.Element {
  const diameter = sizeMap[size];

  return (
    <div
      className={cx(styles.wrapper, centered && styles.centered)}
      role="status"
      aria-label={label ?? "Loading"}
    >
      <span
        className={styles.spinner}
        /* inline width/height — CSS Modules cannot key by a runtime size prop */
        style={{ width: diameter, height: diameter }}
        aria-hidden="true"
      />
      {label && <span className={styles.label}>{label}</span>}
    </div>
  );
}
