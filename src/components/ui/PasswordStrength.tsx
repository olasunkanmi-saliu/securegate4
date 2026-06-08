"use client";

import { cx } from "@/lib/utils";
import { scorePassword } from "@/lib/validations";

import styles from "./PasswordStrength.module.css";

interface PasswordStrengthProps {
  password: string;
}

type StrengthTier = "none" | "weak" | "fair" | "strong";

interface StrengthResult {
  score: number;
  label: string;
  tier: StrengthTier;
}

function evaluateStrength(password: string): StrengthResult {
  if (!password) return { score: 0, label: "", tier: "none" };

  const score = scorePassword(password);

  if (score <= 2) return { score, label: "Weak", tier: "weak" };
  if (score <= 4) return { score, label: "Fair", tier: "fair" };
  return { score, label: "Strong", tier: "strong" };
}

export function PasswordStrength({
  password,
}: PasswordStrengthProps): JSX.Element | null {
  const { score, label, tier } = evaluateStrength(password);

  if (!password) return null;

  return (
    <div
      className={styles.container}
      aria-label={`Password strength: ${label}`}
    >
      <div className={styles.track}>
        <div
          className={cx(styles.fill, styles[tier])}
          /* inline width — CSS Modules cannot express a JS-driven percentage */
          style={{ width: `${(score / 5) * 100}%` }}
        />
      </div>
      <div className={styles.labels}>
        <span className={styles.text}>Password strength</span>
        <span className={cx(styles.level, styles[`level-${tier}`])}>
          {label}
        </span>
      </div>
    </div>
  );
}
