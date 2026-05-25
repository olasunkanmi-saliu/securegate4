# SKILL: Component Builder

## Purpose

Scaffold a new UI component for SecureGate following the project's architecture, code style, and design system rules.

## When to Use

Use this skill when you need to create any new React component: form inputs, buttons, cards, alerts, layout wrappers, page sections, or any reusable UI element.

## Component Inventory

These are all the components SecureGate requires. Do not invent components outside this list without explicit instruction.

### Shared UI Components (`src/components/ui/`)

| Component           | Type       | Used On                                    |
|----------------------|------------|-------------------------------------------|
| FormInput            | client     | Login, Signup, Forgot Password, Reset Password |
| PasswordInput        | client     | Login, Signup, Reset Password              |
| PasswordStrength     | client     | Signup, Reset Password                     |
| SubmitButton         | client     | All forms                                  |
| Alert                | server     | All pages (success, error, info messages)  |
| AuthCard             | server     | Login, Signup, Forgot Password, Reset Password, Verify Email |
| LoadingSpinner       | server     | Inline in SubmitButton, standalone loading states |
| ResendLink           | client     | Verify Email (expired token fallback)      |

### Email Templates (`src/components/emails/`)

| Template                | Data Required                                  |
|-------------------------|------------------------------------------------|
| VerificationEmail       | `userName`, `verificationUrl`, `expiresIn` ("15 minutes") |
| PasswordResetEmail      | `userName`, `resetUrl`, `expiresIn` ("1 hour") |

### Page-Level Components (inside each page's directory, not shared)

| Component            | Location                           |
|----------------------|-------------------------------------|
| LoginForm            | `src/app/login/LoginForm.tsx`       |
| SignupForm           | `src/app/signup/SignupForm.tsx`     |
| ForgotPasswordForm   | `src/app/forgot-password/ForgotPasswordForm.tsx` |
| ResetPasswordForm    | `src/app/reset-password/[token]/ResetPasswordForm.tsx` |
| DashboardContent     | `src/app/dashboard/DashboardContent.tsx` |

Page-level components are `"use client"` forms that compose shared UI components. They are co-located with their page, not in `src/components/`.

## Inputs Required

1. **Component name** (PascalCase)
2. **Component type**: `"use client"` (interactive) or server component (static)
3. **Props** the component accepts
4. **Which design tokens** it uses

## Output Files

Every shared component produces exactly 2 files, co-located:

```
src/components/ui/{ComponentName}.tsx
src/components/ui/{ComponentName}.module.css
```

Page-level components produce 2 files in their page directory:

```
src/app/{page}/{ComponentName}.tsx
src/app/{page}/{ComponentName}.module.css
```

Email templates produce 1 file (no CSS Module — React Email uses inline styles):

```
src/components/emails/{TemplateName}.tsx
```

## Client Component Template

```typescript
"use client";

import styles from "./{ComponentName}.module.css";

interface {ComponentName}Props {
  // Define all props here. No optional props without defaults.
}

export function {ComponentName}({ prop1, prop2 }: {ComponentName}Props) {
  return (
    <div className={styles.container}>
      {/* Component markup */}
    </div>
  );
}
```

## Server Component Template

No `"use client"` directive. Can be async. Cannot use hooks, event handlers, or browser APIs.

```typescript
import styles from "./{ComponentName}.module.css";

interface {ComponentName}Props {
  children: React.ReactNode;
}

export function {ComponentName}({ children }: {ComponentName}Props) {
  return (
    <div className={styles.container}>
      {children}
    </div>
  );
}
```

## CSS Module Template

```css
/* {ComponentName}.module.css */

.container {
  /* Use only design tokens — no raw values */
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-xl);
  padding: var(--space-lg);
}
```

## Class Composition Utility

Use this pattern consistently across all components to join conditional class names. Do not use a different approach per component.

```typescript
function cx(...classes: (string | false | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

// Usage
const inputClass = cx(
  styles.input,
  error && styles.inputError,
  success && styles.inputSuccess,
  disabled && styles.inputDisabled,
);
```

Define this as a shared utility in `src/lib/utils.ts` and import it in every component that needs conditional classes.

## Rules

1. **Named exports only.** No `export default`.
2. **One component per file.** No multi-component files.
3. **Props interface above the component.** Named `{ComponentName}Props`.
4. **Destructure props** in the function signature.
5. **All styling via CSS Modules.** No inline styles, no style prop.
6. **All values via design tokens.** No hardcoded colors, sizes, fonts. Exception: dynamic values that CSS Modules cannot express (e.g., percentage widths driven by JS state) may use inline `style` — annotate with a comment explaining why.
7. **Accessibility baked in:**
   - All inputs have `<label>` with `htmlFor`.
   - Error messages have `role="alert"` and `aria-live="polite"`.
   - Buttons have descriptive text or `aria-label`.
   - Focus indicators use `var(--shadow-focus)`.
   - Interactive elements have 44px minimum touch targets.
8. **No direct database access.** Components receive data via props.
9. **No internal fetch calls.** Form submissions use event handlers passed via props or call API routes via the page's submit handler.

## Form Component Checklist

When building a form component, ensure:

- [ ] All fields validate on blur (`onBlur`)
- [ ] All fields validate on submit
- [ ] Validation uses Zod schemas from `lib/validations.ts` (client-side mirror — keep in sync with server-side schema to avoid drift)
- [ ] Error messages are field-specific and context-aware
- [ ] Submit button shows a loading spinner during request
- [ ] Submit button is disabled during request
- [ ] Password fields have a visibility toggle
- [ ] Signup form has a password strength indicator
- [ ] All states visible: default, focus, error, success, loading, disabled

## Example: FormInput Component

### FormInput.tsx

```typescript
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
  onChange,
  onBlur,
}: FormInputProps) {
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>{label}</label>
      <input
        id={id}
        type={type}
        className={cx(
          styles.input,
          error && styles.inputError,
          success && styles.inputSuccess,
        )}
        placeholder={placeholder}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : success ? `${id}-success` : undefined}
      />
      {error && (
        <p id={`${id}-error`} className={styles.errorMsg} role="alert" aria-live="polite">
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
```

### FormInput.module.css

```css
.field {
  margin-bottom: var(--space-lg);
}

.label {
  display: block;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--input-label);
  margin-bottom: var(--space-xs);
}

.input {
  width: 100%;
  height: 44px;
  background: var(--input-bg);
  border: 1px solid var(--input-border);
  border-radius: var(--radius-lg);
  padding: 0 var(--space-md);
  font-size: var(--font-size-sm);
  font-family: var(--font-primary);
  color: var(--input-text);
  outline: none;
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.input::placeholder {
  color: var(--input-placeholder);
}

.input:hover {
  border-color: var(--input-border-hover);
}

.input:focus {
  border-color: var(--input-border-focus);
  box-shadow: var(--shadow-focus);
}

.inputError {
  border-color: var(--input-border-error);
  box-shadow: var(--shadow-error);
}

.inputSuccess {
  border-color: var(--input-border-success);
}

.errorMsg {
  font-size: var(--font-size-xs);
  color: var(--input-error-text);
  margin-top: var(--space-xs);
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.successMsg {
  font-size: var(--font-size-xs);
  color: var(--input-success-text);
  margin-top: var(--space-xs);
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}
```

## Example: PasswordStrength Component

### PasswordStrength.tsx

```typescript
"use client";

import { cx } from "@/lib/utils";
import styles from "./PasswordStrength.module.css";

interface PasswordStrengthProps {
  password: string;
}

interface StrengthResult {
  score: number;
  label: "Weak" | "Fair" | "Strong" | "";
  tier: "weak" | "fair" | "strong" | "none";
}

function evaluateStrength(password: string): StrengthResult {
  if (!password) return { score: 0, label: "", tier: "none" };

  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[!@#$%^&*()_+\-=\[\]{}|;:',.<>?\/]/.test(password)) score++;

  if (score <= 2) return { score, label: "Weak", tier: "weak" };
  if (score <= 4) return { score, label: "Fair", tier: "fair" };
  return { score, label: "Strong", tier: "strong" };
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const { score, label, tier } = evaluateStrength(password);

  if (!password) return null;

  return (
    <div className={styles.container} aria-label={`Password strength: ${label}`}>
      <div className={styles.track}>
        <div
          className={cx(styles.fill, styles[tier])}
          style={{ width: `${(score / 5) * 100}%` }} {/* inline style accepted — CSS Modules can't express dynamic percentage */}
        />
      </div>
      <div className={styles.labels}>
        <span className={styles.text}>Password strength</span>
        <span className={cx(styles.level, styles[`level${tier}`])}>{label}</span>
      </div>
    </div>
  );
}
```

### PasswordStrength.module.css

```css
.container {
  margin-top: var(--space-sm);
}

.track {
  height: 3px;
  background: var(--strength-track);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.fill {
  height: 100%;
  border-radius: var(--radius-full);
  transition: width var(--transition-base), background-color var(--transition-base);
}

.weak {
  background: var(--strength-weak);
}

.fair {
  background: var(--strength-fair);
}

.strong {
  background: var(--strength-strong);
}

.labels {
  display: flex;
  justify-content: space-between;
  margin-top: var(--space-xs);
  font-size: var(--font-size-xs);
}

.text {
  color: var(--strength-label);
}

.level {
  font-weight: var(--font-weight-medium);
  transition: color var(--transition-base);
}

.levelweak {
  color: var(--strength-weak);
}

.levelfair {
  color: var(--strength-fair);
}

.levelstrong {
  color: var(--strength-strong);
}
```

## Example: PasswordInput Component

Wraps a standard input with a visibility toggle button. Used on Login, Signup, and Reset Password.

### PasswordInput.tsx

```typescript
"use client";

import { useState } from "react";
import { cx } from "@/lib/utils";
import styles from "./PasswordInput.module.css";

interface PasswordInputProps {
  id: string;
  label: string;
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
  placeholder = "Enter your password",
  value,
  error,
  disabled = false,
  autoComplete = "current-password",
  onChange,
  onBlur,
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>{label}</label>
      <div className={styles.inputWrap}>
        <input
          id={id}
          type={visible ? "text" : "password"}
          className={cx(
            styles.input,
            error && styles.inputError,
          )}
          placeholder={placeholder}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          autoComplete={autoComplete}
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
            <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
              <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
          ) : (
            <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      </div>
      {error && (
        <p id={`${id}-error`} className={styles.errorMsg} role="alert" aria-live="polite">
          {error}
        </p>
      )}
    </div>
  );
}
```

### PasswordInput.module.css

```css
.field {
  margin-bottom: var(--space-lg);
}

.label {
  display: block;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--input-label);
  margin-bottom: var(--space-xs);
}

.inputWrap {
  position: relative;
}

.input {
  width: 100%;
  height: 44px;
  background: var(--input-bg);
  border: 1px solid var(--input-border);
  border-radius: var(--radius-lg);
  padding: 0 44px 0 var(--space-md);
  font-size: var(--font-size-sm);
  font-family: var(--font-primary);
  color: var(--input-text);
  outline: none;
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.input::placeholder {
  color: var(--input-placeholder);
}

.input:hover {
  border-color: var(--input-border-hover);
}

.input:focus {
  border-color: var(--input-border-focus);
  box-shadow: var(--shadow-focus);
}

.inputError {
  border-color: var(--input-border-error);
  box-shadow: var(--shadow-error);
}

.toggle {
  position: absolute;
  right: 1px;
  top: 1px;
  height: 42px;
  width: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--input-placeholder);
  transition: color var(--transition-fast);
  border-radius: 0 var(--radius-lg) var(--radius-lg) 0;
}

.toggle:hover {
  color: var(--input-label);
}

.toggle:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.icon {
  width: 18px;
  height: 18px;
}

.errorMsg {
  font-size: var(--font-size-xs);
  color: var(--input-error-text);
  margin-top: var(--space-xs);
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}
```

## Example: SubmitButton Component

Handles loading state with spinner, disabled styling, and accessible loading text. Used on all forms.

### SubmitButton.tsx

```typescript
"use client";

import { cx } from "@/lib/utils";
import styles from "./SubmitButton.module.css";

interface SubmitButtonProps {
  label: string;
  loadingLabel: string;
  loading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

export function SubmitButton({
  label,
  loadingLabel,
  loading = false,
  disabled = false,
  onClick,
}: SubmitButtonProps) {
  return (
    <button
      type="submit"
      className={cx(
        styles.button,
        loading && styles.buttonLoading,
      )}
      disabled={loading || disabled}
      onClick={onClick}
      aria-busy={loading}
    >
      {loading && <span className={styles.spinner} aria-hidden="true" />}
      <span>{loading ? loadingLabel : label}</span>
    </button>
  );
}
```

### SubmitButton.module.css

```css
.button {
  width: 100%;
  height: 44px;
  border: none;
  border-radius: var(--radius-lg);
  font-family: var(--font-primary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  background: var(--btn-primary-bg);
  color: var(--btn-primary-text);
  transition: background var(--transition-fast), transform var(--transition-fast), box-shadow var(--transition-fast);
  box-shadow: var(--shadow-sm);
}

.button:hover:not(:disabled) {
  background: var(--btn-primary-hover);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.button:active:not(:disabled) {
  transform: translateY(0);
}

.button:focus-visible {
  box-shadow: var(--shadow-focus);
  outline: none;
}

.button:disabled {
  background: var(--btn-primary-disabled-bg);
  color: var(--btn-primary-disabled-text);
  cursor: not-allowed;
  box-shadow: none;
  transform: none;
}

.buttonLoading {
  cursor: wait;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
```

## Example: LoadingSpinner Component

Standalone loading spinner used for async operations outside form submissions.
Can be used inline or as a centered full-width indicator.

### LoadingSpinner.tsx

```typescript
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
};

export function LoadingSpinner({
  size = "md",
  centered = false,
  label,
}: LoadingSpinnerProps) {
  const diameter = sizeMap[size];

  return (
    <div
      className={cx(styles.wrapper, centered && styles.centered)}
      role="status"
      aria-label={label || "Loading"}
    >
      <span
        className={styles.spinner}
        style={{ width: diameter, height: diameter }}
        aria-hidden="true"
      />
      {label && <span className={styles.label}>{label}</span>}
    </div>
  );
}
```

### LoadingSpinner.module.css

```css
.wrapper {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
}

.centered {
  display: flex;
  justify-content: center;
  padding: var(--space-xl) 0;
}

.spinner {
  display: inline-block;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: var(--radius-full);
  animation: lspin 0.6s linear infinite;
  color: var(--color-primary);
}

.label {
  font-size: var(--font-size-sm);
  color: var(--color-on-surface-variant);
}

@keyframes lspin {
  to {
    transform: rotate(360deg);
  }
}
```

## Example: Alert Component

Renders success, error, warning, and info messages. Used on all pages. Selects the correct token set based on a `variant` prop.

### Alert.tsx

```typescript
import React from "react";
import { cx } from "@/lib/utils";
import styles from "./Alert.module.css";

type AlertVariant = "success" | "error" | "warning" | "info";

interface AlertProps {
  variant: AlertVariant;
  message: string;
  visible?: boolean;
}

const icons: Record<AlertVariant, React.ReactNode> = {
  success: (
    <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  error: (
    <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  ),
  warning: (
    <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  info: (
    <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
};

export function Alert({ variant, message, visible = true }: AlertProps) {
  if (!visible) return null;

  return (
    <div
      className={cx(styles.alert, styles[variant])}
      role="alert"
      aria-live="polite"
    >
      {icons[variant]}
      <span className={styles.message}>{message}</span>
    </div>
  );
}
```

### Alert.module.css

```css
.alert {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-lg);
  border: 1px solid;
  font-size: var(--font-size-sm);
  font-family: var(--font-primary);
  margin-bottom: var(--space-lg);
  animation: fadeIn var(--transition-base);
}

.success {
  background: var(--alert-success-bg);
  border-color: var(--alert-success-border);
  color: var(--alert-success-text);
}

.error {
  background: var(--alert-error-bg);
  border-color: var(--alert-error-border);
  color: var(--alert-error-text);
}

.warning {
  background: var(--alert-warning-bg);
  border-color: var(--alert-warning-border);
  color: var(--alert-warning-text);
}

.info {
  background: var(--alert-info-bg);
  border-color: var(--alert-info-border);
  color: var(--alert-info-text);
}

.icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.message {
  flex: 1;
  line-height: var(--line-height-body);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

## Example: AuthCard Component

A server component that wraps auth page forms in a centered card layout with logo/brand area.

### AuthCard.tsx

```typescript
import styles from "./AuthCard.module.css";

interface AuthCardProps {
  children: React.ReactNode;
}

export function AuthCard({ children }: AuthCardProps) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <div className={styles.brand}>
          <span className={styles.logo} aria-hidden="true">SecureGate</span>
        </div>
        {children}
      </div>
    </div>
  );
}
```

### AuthCard.module.css

```css
.wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: var(--space-lg);
}

.card {
  width: 100%;
  max-width: 400px;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-xl);
  padding: var(--space-xl) var(--space-lg);
  box-shadow: var(--shadow-md);
}

.brand {
  text-align: center;
  margin-bottom: var(--space-lg);
}

.logo {
  font-family: var(--font-primary);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-medium);
  color: var(--color-primary);
}
```

## Example: ResendLink Component

Used on the verify email page when the verification token has expired. Calls `POST /api/verify-email/resend` with the user's email. Uses enumeration defense — shows the same generic message regardless of whether the email exists.

### ResendLink.tsx

```typescript
"use client";

import { useState } from "react";
import styles from "./ResendLink.module.css";

interface ResendLinkProps {
  email: string;
}

export function ResendLink({ email }: ResendLinkProps) {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleResend() {
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

      // Enumeration defense: same outcome regardless of email existence
      setSent(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <p className={styles.sent}>
        If the email exists, a verification link has been sent.
      </p>
    );
  }

  return (
    <div className={styles.wrapper}>
      {error && <p className={styles.error}>{error}</p>}
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
```

### ResendLink.module.css

```css
.wrapper {
  text-align: center;
  margin-top: var(--space-md);
}

.link {
  background: none;
  border: none;
  font-family: var(--font-primary);
  font-size: var(--font-size-sm);
  color: var(--link-default);
  cursor: pointer;
  text-decoration: underline;
  transition: color var(--transition-fast);
}

.link:hover {
  color: var(--link-hover);
}

.link:disabled {
  color: var(--color-on-surface-variant);
  cursor: not-allowed;
  text-decoration: none;
}

.error {
  font-size: var(--font-size-xs);
  color: var(--input-error-text);
  margin-bottom: var(--space-xs);
}

.sent {
  text-align: center;
  font-size: var(--font-size-sm);
  color: var(--color-on-surface-variant);
  margin-top: var(--space-md);
}
```

## Example: Page-Level Form (SignupForm)

Page-level forms compose shared UI components, manage local state, call API routes, and handle security-critical patterns (enumeration defense, rate limiting, validation).

### SignupForm.tsx

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signupSchema } from "@/lib/validations";
import { FormInput } from "@/components/ui/FormInput";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { PasswordStrength } from "@/components/ui/PasswordStrength";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Alert } from "@/components/ui/Alert";
import { AuthCard } from "@/components/ui/AuthCard";
import styles from "./SignupForm.module.css";

interface FieldErrors {
  name?: string;
  email?: string;
  password?: string;
}

export function SignupForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  function validateField(field: keyof FieldErrors) {
    const result = signupSchema.safeParse({ name, email, password });
    if (!result.success) {
      const err = result.error.flatten().fieldErrors;
      setFieldErrors((prev) => ({ ...prev, [field]: err[field]?.[0] }));
    } else {
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError("");
    setSuccess("");

    const result = signupSchema.safeParse({ name, email, password });
    if (!result.success) {
      const err = result.error.flatten().fieldErrors;
      setFieldErrors({
        name: err.name?.[0],
        email: err.email?.[0],
        password: err.password?.[0],
      });
      return;
    }

    setFieldErrors({});
    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.data),
      });

      if (res.status === 429) {
        setServerError("Too many attempts. Please try again later.");
        return;
      }

      if (!res.ok) {
        // Enumeration defense: same generic message for all errors
        setServerError("Something went wrong. Please try again.");
        return;
      }

      setSuccess("Account created! Check your email to verify your account.");
      setName("");
      setEmail("");
      setPassword("");

      setTimeout(() => router.push("/login"), 3000);
    } catch {
      setServerError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard>
      <form onSubmit={handleSubmit} className={styles.form} noValidate>
        {serverError && (
          <Alert variant="error" message={serverError} />
        )}
        {success && (
          <Alert variant="success" message={success} />
        )}

        <FormInput
          id="name"
          label="Full name"
          value={name}
          error={fieldErrors.name}
          onChange={setName}
          onBlur={() => validateField("name")}
        />

        <FormInput
          id="email"
          label="Email address"
          type="email"
          value={email}
          error={fieldErrors.email}
          onChange={setEmail}
          onBlur={() => validateField("email")}
        />

        <PasswordInput
          id="password"
          label="Password"
          value={password}
          error={fieldErrors.password}
          onChange={setPassword}
          onBlur={() => validateField("password")}
          autoComplete="new-password"
        />

        <PasswordStrength password={password} />

        <SubmitButton
          label="Create account"
          loadingLabel="Creating account..."
          loading={loading}
          disabled={!!success}
        />
      </form>
    </AuthCard>
  );
}
```

### SignupForm.module.css

```css
.form {
  display: flex;
  flex-direction: column;
}
```

> **Pattern reference:** LoginForm, ForgotPasswordForm, and ResetPasswordForm follow the same structure — compose shared UI, import the relevant Zod schema, call the matching API route, and return identical generic error shapes regardless of whether the email exists. Only the field set and API endpoint differ.

## Example: Email Template (React Email)

Email templates use `@react-email/components`. They use inline styles (not CSS Modules) because email clients do not support external stylesheets.

> **Note on design tokens:** Inline styles cannot reference CSS custom properties. Hardcoded color/size values in email templates are an accepted tradeoff — they do not violate the "no hardcoded values" rule, which applies only to CSS Modules in the app UI.

### VerificationEmail.tsx

```typescript
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Button,
  Hr,
} from "@react-email/components";

interface VerificationEmailProps {
  userName: string;
  verificationUrl: string;
  expiresIn: string;
}

export function VerificationEmail({
  userName,
  verificationUrl,
  expiresIn,
}: VerificationEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={body}>
        <Container style={container}>
          <Text style={heading}>Verify your email</Text>
          <Text style={paragraph}>
            Hi {userName}, please verify your email address to access your
            SecureGate dashboard.
          </Text>
          <Section style={buttonSection}>
            <Button style={button} href={verificationUrl}>
              Verify Email Address
            </Button>
          </Section>
          <Text style={footnote}>
            This link expires in {expiresIn}. If you did not create an account,
            you can safely ignore this email.
          </Text>
          <Hr style={hr} />
          <Text style={footer}>SecureGate — Secure Authentication System</Text>
        </Container>
      </Body>
    </Html>
  );
}

// Inline styles for email clients
const body = {
  backgroundColor: "#F0F4F8",
  fontFamily: "'Inter', -apple-system, sans-serif",
};

const container = {
  margin: "0 auto",
  padding: "40px 24px",
  maxWidth: "480px",
};

const heading = {
  fontSize: "24px",
  fontWeight: "600" as const,
  color: "#0D1B2A",
  marginBottom: "16px",
};

const paragraph = {
  fontSize: "14px",
  lineHeight: "1.6",
  color: "#334155",
  marginBottom: "24px",
};

const buttonSection = {
  textAlign: "center" as const,
  marginBottom: "24px",
};

const button = {
  backgroundColor: "#0EA5E9",
  color: "#FFFFFF",
  fontSize: "14px",
  fontWeight: "500" as const,
  padding: "12px 24px",
  borderRadius: "8px",
  textDecoration: "none",
};

const footnote = {
  fontSize: "12px",
  color: "#64748B",
  marginBottom: "24px",
};

const hr = {
  borderColor: "#E2E8F0",
  marginBottom: "16px",
};

const footer = {
  fontSize: "12px",
  color: "#94A3B8",
  textAlign: "center" as const,
};
```

### PasswordResetEmail.tsx

Same structure as VerificationEmail. Replace:

- Heading: `"Reset your password"`
- Body text: `"Hi {userName}, we received a request to reset your password."`
- Button text: `"Reset Password"`
- Button href: `{resetUrl}`
- Footnote: `"This link expires in {expiresIn}. If you did not request a password reset, you can safely ignore this email."`

Props interface:

```typescript
interface PasswordResetEmailProps {
  userName: string;
  resetUrl: string;
  expiresIn: string;
}
```
