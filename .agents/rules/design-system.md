# Design System Rules — SecureGate

## Overview

SecureGate uses a 3-layer color system called "Modern Futuristic" (Palette 2). All tokens are CSS custom properties defined in `src/styles/design-tokens.css`. No color, spacing, radius, shadow, or font value should ever appear as a raw literal in any component or module file.

## Token File

`src/styles/design-tokens.css` is imported once in `src/app/layout.tsx` and cascades globally. Never import it in individual components.

## Layer 1 — Primitives

Raw tonal scales. Named `--p-{scale}-{stop}`. These are building blocks — never reference them directly in components.

```
Scales: primary, secondary, tertiary, error, warning, neutral, neutralVariant (nv)
Stops:  0, 4, 5, 6, 10, 12, 15, 17, 20, 22, 24, 25, 30, 35, 40, 50, 60, 70, 80, 87, 90, 92, 94, 95, 96, 98, 99, 100
```

### Key Colors

| Scale     | Name         | Base HEX  |
|-----------|-------------|-----------|
| primary   | Deep Space  | #0D1B2A   |
| secondary | Cyber Cyan  | #0EA5E9   |
| tertiary  | Neon Mint   | #06D6A0   |
| error     | Red         | #EF4444   |
| warning   | Amber       | #FBBF24   |
| neutral   | Slate       | #334155   |
| nv        | Slate Var   | #475569   |

## Layer 2 — Semantic Tokens

Define what a color means. Named descriptively. Reference `--color-*` role variables from Layer 1.

```css
--surface-primary: var(--color-surface);
--surface-secondary: var(--color-surface-variant);
--surface-inverse: var(--color-inverse-surface);

--text-primary: var(--color-on-surface);
--text-secondary: var(--color-on-surface-variant);
--text-muted: var(--color-outline);
--text-placeholder: var(--color-outline-variant);

--border-default: var(--color-outline);

--brand-primary: var(--color-primary);

--success: var(--color-tertiary);
--error: var(--color-error);
--warning: hsl(38, 92%, 50%);
--info: var(--color-secondary);
```

Components may reference semantic tokens for one-off uses, but should prefer role tokens.

## Layer 3 — Role Tokens

Define which token goes on which component property. This is what components reference.

### Button Roles

```css
--btn-primary-bg
--btn-primary-text
--btn-primary-hover
--btn-primary-disabled-bg
--btn-primary-disabled-text
```

### Input Roles

```css
--input-bg
--input-text
--input-placeholder
--input-border
--input-border-hover
--input-border-focus
--input-border-error
--input-border-success
--input-focus-ring
--input-error-ring
--input-label
--input-error-text
--input-success-text
```

### Card Roles

```css
--card-bg
--card-border
```

### Nav Roles

```css
--nav-bg
--nav-text
--nav-active
```

### Password Strength Roles

```css
--strength-track
--strength-weak       /* Red — meets ≤2 criteria */
--strength-fair       /* Amber — meets 3–4 criteria */
--strength-strong     /* Green — meets all 5 criteria */
--strength-label
```

### Link Roles

```css
--link-default
--link-hover
```

### Alert Roles

```css
--alert-success-bg
--alert-success-border
--alert-success-text
--alert-success-icon
--alert-error-bg
--alert-error-border
--alert-error-text
--alert-error-icon
--alert-warning-bg
--alert-warning-border
--alert-warning-text
--alert-warning-icon
--alert-info-bg
--alert-info-border
--alert-info-text
--alert-info-icon
```

### Overlay

```css
--overlay-scrim
```

### Badge Roles

```css
--badge-bg
--badge-text
```

### Divider Roles

```css
--divider-border
```

### Tooltip Roles

```css
--tooltip-bg
--tooltip-text
```

### Skeleton Roles

```css
--skeleton-bg
--skeleton-shimmer
```

## Spacing Tokens

```css
--space-xs: 0.25rem;    /* 4px */
--space-sm: 0.5rem;     /* 8px */
--space-md: 1rem;       /* 16px */
--space-lg: 1.5rem;     /* 24px */
--space-xl: 2rem;       /* 32px */
--space-2xl: 3rem;      /* 48px */
```

## Radius Tokens

```css
--radius-sm: 4px;
--radius-md: 6px;
--radius-lg: 8px;
--radius-xl: 12px;
--radius-full: 9999px;
```

## Typography Tokens

```css
--font-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;

--font-size-xs: 0.75rem;     /* 12px — labels, captions */
--font-size-sm: 0.875rem;    /* 14px — body text */
--font-size-base: 1rem;      /* 16px — subheadings */
--font-size-lg: 1.25rem;     /* 20px — headings */
--font-size-xl: 1.75rem;     /* 28px — page titles */

--font-weight-regular: 400;
--font-weight-medium: 500;

--line-height-body: 1.5;
--line-height-heading: 1.2;
```

## Shadow Tokens

```css
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
--shadow-md: 0 4px 6px rgba(0, 0, 0, 0.4);
--shadow-lg: 0 10px 25px rgba(0, 0, 0, 0.5);
--shadow-focus: 0 0 0 3px var(--input-focus-ring);
--shadow-error: 0 0 0 3px var(--input-error-ring);
```

## Transition Tokens

```css
--transition-fast: 150ms ease;
--transition-base: 200ms ease;
--transition-slow: 300ms ease;
```

## CSS Module Rules

1. Every component gets a co-located `.module.css` file.
2. All values reference `var(--token-name)`. Zero raw literals.
3. Class names are camelCase.
4. No `!important`, no global selectors, no element selectors (use class selectors only).
5. No inline styles in JSX. All styling through CSS Modules.
6. No Tailwind, no styled-components, no CSS-in-JS.

### Example

```css
/* LoginForm.module.css */
.form {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-xl);
  padding: var(--space-xl) var(--space-lg);
  box-shadow: var(--shadow-lg);
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
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.input:focus {
  border-color: var(--input-border-focus);
  box-shadow: var(--shadow-focus);
  outline: none;
}

.inputError {
  border-color: var(--input-border-error);
  box-shadow: var(--shadow-error);
}
```

## Accessibility

- All text/background combinations must meet WCAG AA contrast ratio (4.5:1 body, 3:1 large text).
- All interactive elements must have a visible focus indicator (`--shadow-focus`).
- Never use color alone to convey state — pair with icons and text labels.
- Minimum touch target: 44x44px on all interactive elements.
- All form inputs must have associated `<label>` elements.
- Error messages must use `role="alert"` and `aria-live="polite"`.