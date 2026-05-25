# Code Style Rules — SecureGate

## TypeScript

- Strict mode enabled in `tsconfig.json` (`"strict": true`).
- No `any` type anywhere. Use `unknown` for truly unknown types, then narrow with type guards.
- All function parameters and return types explicitly typed.
- Prefer `interface` for object shapes. Use `type` for unions, intersections, and mapped types.
- Use `as const` for literal objects that should not be widened.

## Naming Conventions

```
Files:          kebab-case          → rate-limit.ts, password-input.tsx
Components:     PascalCase          → LoginForm, PasswordInput, EmailTemplate
Functions:      camelCase           → validateEmail, hashToken, sendVerificationEmail
Constants:      UPPER_SNAKE_CASE    → MAX_LOGIN_ATTEMPTS, TOKEN_EXPIRY_MS
Types/Interfaces: PascalCase       → UserCredentials, TokenPayload, ApiResponse
Zod schemas:    camelCase + Schema  → signupSchema, emailSchema, resetPasswordSchema
CSS Modules:    camelCase           → .formContainer, .inputError, .strengthBar
CSS variables:  kebab-case          → --color-accent, --btn-primary-bg
Env vars:       UPPER_SNAKE_CASE    → DATABASE_URL, NEXTAUTH_SECRET
```

## File Structure

Every file follows this order:

```typescript
// 1. Imports — external packages first, then internal modules, then types
import { NextResponse } from "next/server";
import { hash } from "bcryptjs";

import { db } from "@/lib/db";
import { signupSchema } from "@/lib/validations";

// 2. Constants (if any)
const SALT_ROUNDS = 12;

// 3. Main export(s)
export async function POST(request: Request) {
  const parsed = signupSchema.safeParse(await request.json());
  // ...
}
```

## Import Rules

- Use `@/` path alias for all internal imports (maps to `src/`).
- Never use relative paths that go up more than one level (`../../` is banned).
- Group imports: external → internal → types. Separate groups with a blank line.
- Never import from `node:` protocol — use bare module names (`crypto`, not `node:crypto`).

## Function Rules

- One function per export where possible. Helper functions are private (not exported).
- Async functions must have explicit error handling. No unhandled promise rejections.
- Maximum function length: aim for under 40 lines. Extract helpers if longer.
- Pure functions preferred in `lib/`. Side effects (DB writes, emails) are explicit and top-level.

## Error Handling Pattern

```typescript
try {
  // business logic
} catch (error) {
  console.error("[ROUTE_NAME]", error);
  return NextResponse.json(
    { error: "Something went wrong. Please try again." },
    { status: 500 }
  );
}
```

- Always log the real error server-side with a route identifier prefix.
- Always return a generic message to the client.
- Never return `error.message` or `error.stack` to the client.

## Response Format

All API routes return consistent JSON shapes:

```typescript
// Success
{ success: true, message: "Account created successfully." }

// Error
{ error: "Invalid email or password." }

// Validation error
{ error: "Validation failed.", fieldErrors: { email: "Invalid email format." } }
```

No additional fields. No internal IDs. No database structure hints.

## Component Rules

- One component per file. File name matches component name.
- Props interface defined above the component, named `ComponentNameProps`.
- Destructure props in the function signature.
- No default exports for components — use named exports.
- Client components: `"use client"` directive on the first line, no blank lines above it.

```typescript
"use client";

import styles from "./LoginForm.module.css";

interface LoginFormProps {
  onSuccess?: () => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  // ...
}
```

## CSS Module Rules

- One `.module.css` file per component, co-located with the component file.
- Class names in camelCase.
- All colors, spacing, radii, and fonts reference CSS custom properties from `design-tokens.css`.
- No hardcoded hex values, pixel spacing, or font stacks in module files.
- No `!important`.
- No global selectors inside modules.

```css
/* Good */
.submitButton {
  background: var(--btn-primary-bg);
  color: var(--btn-primary-text);
  border-radius: var(--radius-lg);
  font-family: var(--font-primary);
}

/* Bad */
.submitButton {
  background: #0EA5E9;
  color: white;
  border-radius: 8px;
  font-family: 'Inter', sans-serif;
}
```

## Conditional Class Names

Use the `cx()` utility from `@/lib/utils` for conditional class composition. Defined once, imported everywhere.

```typescript
// lib/utils.ts
export function cx(...classes: (string | false | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

// Usage in components
import { cx } from "@/lib/utils";
import styles from "./FormInput.module.css";

const className = cx(
  styles.input,
  error && styles.inputError,
  disabled && styles.inputDisabled,
);
```

No other conditional class pattern is acceptable.

## SVG Icons

Inline SVG JSX in component files. No external icon libraries, no sprite sheets, no icon font files.

```typescript
// Define icons inline or as a const record keyed by variant
const icons = {
  success: (
    <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
};
```

Icons inherit color via `currentColor` so they respond to the parent element's text color.

## CSS Animations

Define `@keyframes` inside the component's `.module.css` file. Keep animation names short and prefixed to avoid collision.

```css
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-4px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

Use `animation` shorthand with a design token duration:
```css
.alert { animation: fadeIn var(--transition-base); }
.spinner { animation: spin 0.6s linear infinite; }
```

## Comments

- No commented-out code. Delete it.
- Comments explain *why*, not *what*. The code explains what.
- Security decisions get a comment: `// SHA-256 hash before storage — prevents token leak on DB breach`.
- TODO comments include a phase reference: `// TODO(Phase 5): add rate limiting here`.

## Zod Schema Style

```typescript
export const signupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be under 50 characters"),
  email: z
    .string()
    .email("Enter a valid email address")
    .max(255, "Email must be under 255 characters")
    .transform((v) => v.toLowerCase()),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be under 128 characters")
    .regex(/[A-Z]/, "Must contain an uppercase letter")
    .regex(/[a-z]/, "Must contain a lowercase letter")
    .regex(/[0-9]/, "Must contain a digit")
    .regex(/[!@#$%^&*()_+\-=\[\]{}|;:',.<>?\/]/, "Must contain a special character"),
});
```

Chain validators. Include human-readable error messages. Export from `lib/validations.ts` only.