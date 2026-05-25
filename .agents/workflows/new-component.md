# Workflow: New Component

## Trigger

Use this workflow whenever you need to create a new UI component for SecureGate.

## Prerequisites

Before starting, confirm:

- [ ] `src/styles/design-tokens.css` exists and is imported in `layout.tsx`
- [ ] `src/lib/utils.ts` exists with the `cx()` class composition utility
- [ ] You know the component name (PascalCase)
- [ ] You know if it needs `"use client"` (uses hooks, events, or browser APIs)
- [ ] You know what props it will accept

## Steps

### Step 1 — Check the Component Inventory

Open `.agents/skills/component-builder/SKILL.md` and find the Component Inventory section. Confirm:

- [ ] The component is listed in the inventory
- [ ] You know which category it belongs to:
  - **Shared UI** → goes in `src/components/ui/`
  - **Page-level** → goes in `src/app/{page}/`
  - **Email template** → goes in `src/components/emails/` (skip to Step 8)
- [ ] You know which pages consume it

If the component is not in the inventory, do not create it without explicit instruction. Once instructed, add the new component to the inventory table in `.agents/skills/component-builder/SKILL.md` after creation.

### Step 2 — Check if the component already exists

```bash
# For shared UI components
ls src/components/ui/

# For page-level components
ls src/app/{page}/
```

If a similar component exists, extend it instead of creating a duplicate.

### Step 3 — Determine the file path

**Shared UI component:**

```
src/components/ui/{ComponentName}.tsx
src/components/ui/{ComponentName}.module.css
```

**Page-level component:**

```
src/app/{page}/{ComponentName}.tsx
src/app/{page}/{ComponentName}.module.css
```

The CSS Module filename must match the component filename exactly, including casing. `FormInput.tsx` pairs with `FormInput.module.css` — not `formInput.module.css`, not `form-input.module.css`. A mismatched name will cause a silent import failure.

### Step 4 — Create the component file

**Client component** (uses hooks, events, browser APIs):

```typescript
"use client";

import { cx } from "@/lib/utils";
import styles from "./{ComponentName}.module.css";

interface {ComponentName}Props {
  // Define all props here. No optional props without defaults.
}

export function {ComponentName}({ prop1, prop2 }: {ComponentName}Props) {
  return (
    <div className={styles.container}>
      {/* Markup */}
    </div>
  );
}
```

**Server component** (static, no hooks or events):

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

Use the `cx()` utility for any conditional class names:

```typescript
import { cx } from "@/lib/utils";

const inputClass = cx(
  styles.input,
  error && styles.inputError,
  success && styles.inputSuccess,
  disabled && styles.inputDisabled,
);
```

### Step 5 — Create the CSS Module

File: `{ComponentName}.module.css` (same directory, same name as the component)

```css
.container {
  /* Reference design tokens only — no raw values */
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-xl);
  padding: var(--space-lg);
}
```

### Step 6 — Verify token usage

Scan your CSS module file. Every value must be a `var(--token)` reference (see `.agents/rules/design-system.md` for the full token inventory). If you see any of these raw values, replace them:

- Any hex color → use a role or semantic token
- Any `px`/`rem` spacing → use `var(--space-*)`
- Any border-radius → use `var(--radius-*)`
- Any font-family → use `var(--font-primary)` or `var(--font-mono)`
- Any font-size → use `var(--font-size-*)`
- Any box-shadow → use `var(--shadow-*)`
- Any transition → use `var(--transition-*)`

The only exceptions where raw values are acceptable:

- `1px` for border width (no token needed)
- `100%` for full-width elements
- `0` for zero values
- `none` for removing properties

### Step 7 — Accessibility audit

Verify:

- [ ] All `<input>` elements have a `<label>` with matching `htmlFor`/`id`
- [ ] All `<button>` elements have visible text or `aria-label`
- [ ] Error messages use `role="alert"` and `aria-live="polite"`
- [ ] Success messages have an `id` and are linked via `aria-describedby`
- [ ] Focus states use `var(--shadow-focus)` — never remove outline without replacing it
- [ ] Color is never the sole indicator of state (pair with icon + text)
- [ ] Interactive elements have minimum 44px touch targets

### Step 8 — Email template fork

If the component is an email template, do NOT create a CSS Module. Email templates follow different rules:

**File:** `src/components/emails/{TemplateName}.tsx`

**Rules:**
- Use `@react-email/components` imports (`Html`, `Head`, `Body`, `Container`, `Section`, `Text`, `Button`, `Hr`)
- Use inline style objects (not CSS Modules) — email clients do not support external stylesheets
- Use the project's brand hex values directly in inline styles (email clients do not support CSS custom properties)
- Named export, no `export default`
- See `.agents/skills/component-builder/SKILL.md` for the full VerificationEmail and PasswordResetEmail examples

After creating the template, verify it renders correctly by previewing with:

```bash
npx react-email dev
```

Once verified, skip to the Checklist — steps 9 and 10 do not apply to email templates.

### Step 9 — Add to page

Import the component into the relevant page file:

**Shared UI component:**

```typescript
import { ComponentName } from "@/components/ui/{ComponentName}";
```

**Page-level component:**

```typescript
import { ComponentName } from "./{ComponentName}";
```

### Step 10 — Test states

#### Visual states (all form components)

Verify all states render correctly:

1. Default (empty, no interaction)
2. Focus (keyboard tab or click)
3. Filled (valid content)
4. Error (invalid content, after blur)
5. Success (valid content, after blur)
6. Disabled (during loading/submission)
7. Loading (spinner visible, button disabled)

#### Responsive check

Verify the component renders correctly at these widths:

- [ ] 375px (mobile — iPhone SE)
- [ ] 768px (tablet)
- [ ] 1280px (desktop)

Auth pages are mobile-critical — users verify emails and reset passwords on phones. At 375px, verify:

- Inputs are full-width and not clipped
- Labels are visible and not overlapping
- Touch targets are at least 44px
- Error messages are fully readable
- The password strength indicator is visible and not truncated

#### Dark mode check

Verify the component renders correctly with dark theme:
- [ ] All text is readable against dark surfaces
- [ ] Borders and outlines are visible
- [ ] Focus indicators have sufficient contrast

#### Reduced motion check

If the component uses CSS animations (`@keyframes`), verify:
- [ ] Animations pause or disappear when OS `prefers-reduced-motion` is enabled in browser dev tools
- [ ] No information depends solely on animation (WCAG 2.2.2 A)

#### TypeScript & lint check

After creating both files, run:
```bash
npx tsc --noEmit
npx next lint
```
Fix any type errors or lint warnings before committing.

## Checklist

Before committing, verify:

- [ ] Component is listed in the Component Inventory
- [ ] Component file is in the correct directory (shared vs page-level)
- [ ] CSS Module filename matches the component filename exactly (including casing)
- [ ] Component file uses named export (no `export default`)
- [ ] Props interface is defined and named `{ComponentName}Props`
- [ ] `cx()` utility used for conditional classes (imported from `@/lib/utils`)
- [ ] CSS Module is co-located with the component
- [ ] All CSS values reference design tokens — no raw hex, spacing, or font values
- [ ] No inline styles in JSX
- [ ] Accessibility requirements met (labels, aria attributes, focus states, touch targets)
- [ ] All visual states render correctly
- [ ] Responsive check passed at 375px, 768px, and 1280px
- [ ] Component imported and rendered in its page