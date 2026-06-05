import Link from "next/link";
import type { ReactNode } from "react";

import styles from "./AuthCard.module.css";

interface AuthCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function AuthCard({
  title,
  subtitle,
  children,
}: AuthCardProps): JSX.Element {
  return (
    <div className={styles.wrapper}>
      <Link href="/" className={styles.brand} aria-label="SecureGate home">
        SecureGate
      </Link>
      <div className={styles.card}>
        <h1 className={styles.title}>{title}</h1>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        {children}
      </div>
    </div>
  );
}
