# Accessibility Audit Skill

Run comprehensive accessibility audits on web projects using axe-core (runtime browser scanning), `eslint-plugin-jsx-a11y` (static analysis), and a documented manual verification layer. Configurable scan modes let you choose the right level of depth.

**Standards:** WCAG 2.2 Level A & AA, EN 301 549 v3.2.1, Section 508 (revised), EAA-aligned.
**Last updated:** May 2026 — covers WCAG 2.2 success criteria.

## Triggers
- User says "run accessibility scan", "a11y audit", "check accessibility", "WCAG compliance", "WCAG 2.2 audit"
- User references "/accessibility" or "/a11y"

## Configuration

The skill supports four configurable modes. Ask the user which mode they prefer if not specified.

1. **`runtime`** — Browser-based axe-core scan
   - Injects axe-core into running pages via browser automation (Playwright preferred)
   - Tests against WCAG 2.0/2.1/2.2 Level A & AA, plus best-practice rules (separated in output)
   - Scans across multiple viewports (320, 768, 1440) and exercises interactive states
   - Reports violations *and* incomplete results with impact, affected elements, and fix recommendations

2. **`static`** — ESLint jsx-a11y static analysis
   - Runs `eslint-plugin-jsx-a11y` against source code with broadened globs (App Router, Pages Router, monorepos)
   - Catches issues at build time without a running server
   - Best for React/Next.js/Vue projects with JSX/TSX files
   - Requires: `eslint-plugin-jsx-a11y` installed as dev dependency

3. **`full`** — Static + runtime + manual verification (recommended for compliance reports)
   - Runs static analysis first for fast feedback
   - Starts dev server, runs runtime scans across viewports and interactive states
   - Includes a documented manual verification stage (keyboard walkthrough, screen-reader spot-check)
   - Includes companion structural / SEO scan
   - Generates a combined report with deduplicated findings and clear scope statement

4. **`ci`** — Headless, machine-readable runtime scan for continuous integration
   - JSON output, exit code mapped to violation severity
   - Designed for `@axe-core/playwright`, `jest-axe`, or `pa11y-ci` integration

If the user doesn't specify a mode, default to `full` when an audit report is the deliverable, and `ci` when integration is the deliverable.

## SecureGate Project Context

This skill is configured for the SecureGate authentication app. The following sections eliminate the need for route discovery or user prompts — all targets are pre-defined.

### Route Manifest

These are the only pages and API routes in the project. Do not scan routes outside this list.

**Pages (browser-scannable):**

| Path                        | Auth Required | Key Interactive Elements                     |
|-----------------------------|---------------|----------------------------------------------|
| /login                      | No            | Email input, password input, visibility toggle, submit button, forgot password link |
| /signup                     | No            | Name input, email input, password input, visibility toggle, password strength indicator, submit button |
| /forgot-password            | No            | Email input, submit button                   |
| /reset-password/[token]     | No            | Password input, visibility toggle, password strength indicator, submit button |
| /verify-email/[token]       | No            | Resend verification link button (on expired token) |
| /dashboard                  | Yes           | Sign out button                              |

**Not scannable (exclude from automated runs):**

- All `POST /api/*` routes — API endpoints, not rendered pages
- Email templates (`src/components/emails/`) — render in email clients, not browsers. Test manually in Litmus, Email on Acid, or real email clients. Do not attempt axe scans on these.

For authenticated routes (/dashboard), the agent must create a session first via the NextAuth signin flow before scanning.

### Interactive States to Exercise

Do not rely on generic selectors. Exercise these specific interactions on each page and rescan after each:

**Login page:**
1. Click password visibility toggle → rescan (input type changes)
2. Submit with empty fields → rescan (error messages appear)
3. Submit with invalid email → rescan (field-specific error)
4. Submit with valid data → rescan (loading spinner, disabled button)

**Signup page:**
1. Click password visibility toggle → rescan
2. Type in password field → rescan (password strength indicator appears and changes: Weak → Fair → Strong)
3. Blur each field with invalid data → rescan (inline errors appear)
4. Blur each field with valid data → rescan (success states appear)
5. Submit with empty fields → rescan
6. Submit with valid data → rescan (loading state)

**Forgot password page:**
1. Submit with empty email → rescan
2. Submit with valid email → rescan (loading state, then success message)

**Reset password page:**
1. Click password visibility toggle → rescan
2. Type in password field → rescan (strength indicator)
3. Submit with weak password → rescan (validation errors)
4. Submit with valid password → rescan (loading state)

**Verify email page (expired token):**
1. Click "Resend verification link" → rescan (loading state, then success/error alert)

### SecureGate Form Accessibility Checklist

Beyond what axe catches, verify these project-specific requirements on every form:

- [ ] Every `<input>` has a `<label>` with matching `htmlFor`/`id`
- [ ] Errored inputs have `aria-invalid="true"`
- [ ] Errored inputs have `aria-describedby` pointing to the error message element's `id`
- [ ] Error messages render inside elements with `role="alert"` and `aria-live="polite"`
- [ ] Success messages have an `id` and are linked via `aria-describedby`
- [ ] Password visibility toggle has `aria-label` that updates ("Show password" / "Hide password")
- [ ] Password strength indicator has `aria-label` (e.g., "Password strength: Fair")
- [ ] Submit buttons have visible text content (not icon-only)
- [ ] Submit buttons show loading state with accessible text ("Authenticating..." not just a spinner)
- [ ] All interactive elements have minimum 44px touch targets
- [ ] Focus order follows visual order on all pages
- [ ] Focus ring uses `var(--shadow-focus)` from the design system — not browser default or `outline: none`
- [ ] Password fields allow paste (WCAG 3.3.8 AA — accessible authentication)

### Design Token Contrast Reference

SecureGate's colors are defined in `src/styles/design-tokens.css` using a 3-layer token system. See `.agents/rules/design-system.md` for the full specification.

If axe reports a `color-contrast` violation:
1. Identify which design token is being used on the affected element (inspect the CSS Module).
2. Check whether the token is being used in the correct context (e.g., `--text-placeholder` is designed for light-on-dark surfaces — using it on a light surface will fail contrast).
3. Fix by swapping to the correct role token — do not override with a raw hex value.

Key contrast pairs that are pre-validated:

| Text Token            | Surface Token         | Ratio   | Passes |
|-----------------------|-----------------------|---------|--------|
| --text-primary        | --surface-primary     | 15.4:1  | AAA    |
| --text-secondary      | --surface-primary     | 9.2:1   | AAA    |
| --text-muted          | --surface-primary     | 6.4:1   | AA     |
| --text-placeholder    | --surface-primary     | 3.5:1   | Fails body, passes large text |
| --input-error-text    | --input-bg            | 4.8:1   | AA     |
| --input-success-text  | --input-bg            | 5.1:1   | AA     |
| --btn-primary-text    | --btn-primary-bg      | 7.2:1   | AAA    |

`--text-placeholder` intentionally fails 4.5:1 — it is used only on placeholder text, which is not required to meet contrast minimums per WCAG. If axe flags it, note as an accepted exception in the report.

## Scope Statement (include in every report)

Every audit must explicitly state:
- Which pages were tested (full URLs or paths)
- Which viewports were tested
- Which interactive states were exercised
- Which standards were checked (tag list)
- What was **not** tested (e.g., authenticated routes, PDFs, embedded third-party widgets)
- The date and tool versions used

Automated tooling catches an estimated 30–40% of real accessibility defects. Reports must not be presented as exhaustive compliance certifications without the manual verification layer.

## Runtime Scan Procedure

### Step 1: Discover pages to scan

**For SecureGate:** Use the Route Manifest in the SecureGate Project Context section above. Do not run generic route discovery. The manifest lists all 6 pages, their auth requirements, and their interactive elements.

For authenticated routes (/dashboard), sign in programmatically before scanning:

```javascript
// Create authenticated session for dashboard scanning
await page.goto(baseUrl + '/login');
await page.fill('input[type="email"]', testEmail);
await page.fill('input[type="password"]', testPassword);
await page.click('button[type="submit"]');
await page.waitForURL('**/dashboard');
```

**For other projects:** Follow generic route discovery:
- **Next.js App Router** (`src/app/**/page.tsx`, `app/**/page.tsx`) — account for route groups `(group)`, parallel routes `@slot`, dynamic segments `[id]`, and intercepting routes `(.)path`.
- **Next.js Pages Router** (`pages/**/*.tsx`, excluding `_app`, `_document`, `_error`, API routes).
- **React Router** — parse route definitions from a single source if present, otherwise ask user for a route manifest.
- **Static sites** — `sitemap.xml` first, then HTML files in build output.
- **Authenticated routes / feature flags** — explicitly ask the user; do not assume coverage.

If route discovery is ambiguous, ask the user for an explicit route list before proceeding.

### Step 2: Start dev server
- Detect the dev command from `package.json` scripts (`dev`, `start`, `serve`).
- Detect or ask for the port; do not assume `3000`.
- Start in the background; wait for HTTP 200 on the chosen port.
- Set a 60-second timeout; surface failures clearly.

### Step 3: Inject axe-core and scan each page across viewports

**Bundle axe-core locally to avoid CSP/CDN failures.** Use the npm package via Playwright's `addInitScript`, or vendor `axe.min.js` to a local path.

For each page, for each viewport, use browser automation to:
1. Set viewport size.
2. Navigate to the page; wait for `networkidle` plus a 500ms settle.
3. Inject axe-core (locally bundled, not from CDN).
4. Run the audit using the runner below.
5. Wait for `AXE_SCAN_DONE` log; retrieve `window.__axeResults`.

Standard viewports: `320×568` (WCAG 1.4.10 Reflow), `390×844` (modern phone), `768×1024` (tablet), `1440×900` (desktop). The 320 viewport is mandatory for WCAG 2.2 AA compliance reporting.

**Hardened axe runner:**

```javascript
(async () => {
  const loadAxe = () => new Promise((resolve, reject) => {
    if (window.axe) return resolve();
    const s = document.createElement('script');
    s.onload  = () => resolve();              // attach BEFORE append
    s.onerror = () => reject(new Error('axe-core failed to load (CSP/CDN/network?)'));
    s.src = '/vendor/axe.min.js';             // bundled locally, not cdnjs
    document.head.appendChild(s);
  });

  try {
    await loadAxe();
    const results = await axe.run(document, {
      runOnly: [
        'wcag2a',  'wcag2aa',
        'wcag21a', 'wcag21aa',
        'wcag22a', 'wcag22aa',                // WCAG 2.2 — REQUIRED
        'best-practice'
      ],
      resultTypes: ['violations', 'incomplete', 'passes']
    });

    window.__axeResults = {
      page: location.pathname,
      url:  location.href,
      timestamp: new Date().toISOString(),
      viewport: { w: innerWidth, h: innerHeight },
      counts: {
        violations: results.violations.length,
        incomplete: results.incomplete.length,
        passes:     results.passes.length
      },
      violations: results.violations.map(v => ({
        id: v.id,
        impact: v.impact,
        tags: v.tags,
        wcagLevel: v.tags.find(t => /^wcag2\d?(a|aa)$/.test(t)) ?? 'best-practice',
        isBestPractice: v.tags.includes('best-practice'),
        description: v.description,
        helpUrl: v.helpUrl,
        totalNodes: v.nodes.length,
        truncated: v.nodes.length > 10,
        sampledNodes: v.nodes.slice(0, 10).map(n => ({
          html: n.html.slice(0, 300),
          target: n.target,
          failureSummary: n.failureSummary
        }))
      })),
      incomplete: results.incomplete.map(v => ({
        id: v.id,
        description: v.description,
        helpUrl: v.helpUrl,
        nodeCount: v.nodes.length,
        sampledNodes: v.nodes.slice(0, 5).map(n => ({
          html: n.html.slice(0, 300),
          target: n.target
        })),
        reasonForReview: 'axe could not determine programmatically; human verification required'
      }))
    };
  } catch (err) {
    window.__axeResults = { error: String(err) };
  }
  console.log('AXE_SCAN_DONE');
})();
```

### Step 4: Exercise interactive states
After the initial scan, exercise interactive states and rescan after each activation. Most real-world defects live in interactive states.

**For SecureGate:** Use the "Interactive States to Exercise" list in the SecureGate Project Context section above. Exercise every listed interaction on every page and rescan after each. Then run the "SecureGate Form Accessibility Checklist" on every form.

**For other projects:** Enumerate interactive triggers generically and rescan after activation:

```javascript
const triggers = await page.locator(
  '[aria-haspopup], [data-testid*="modal"], [data-testid*="menu"], details > summary, [role="tab"], [role="button"]:not(button)'
).all();

for (const t of triggers.slice(0, 25)) {
  try {
    await t.click({ trial: true });
    await t.click();
    await page.waitForTimeout(300);
    const r = await page.evaluate(runAxe);
    reports.push({ state: (await t.textContent())?.slice(0, 60), ...r });
    await page.keyboard.press('Escape');
  } catch { /* element may have moved or detached */ }
}
```

Also exercise **form error states** by submitting required forms with empty/invalid data and rescanning.

### Step 5: Companion structural / SEO scan
Run a parallel DOM evaluation on each page to capture structural and SEO signals that overlap with accessibility:

```javascript
const seoSignals = await page.evaluate(() => ({
  title:           document.title,
  titleLength:     document.title.length,
  metaDescription: document.querySelector('meta[name="description"]')?.content ?? null,
  lang:            document.documentElement.lang || null,
  canonical:       document.querySelector('link[rel="canonical"]')?.href ?? null,
  viewportMeta:    document.querySelector('meta[name="viewport"]')?.content ?? null,
  h1Count:         document.querySelectorAll('h1').length,
  headingOutline:  [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map(h => ({
                     level: +h.tagName[1],
                     text:  h.textContent.trim().slice(0, 80)
                   })),
  hasMain:         !!document.querySelector('main, [role="main"]'),
  hasSkipLink:     !!document.querySelector('a[href^="#"]'),
  imagesMissingAlt: [...document.querySelectorAll('img:not([alt])')].length,
  imagesEmptyAlt:   [...document.querySelectorAll('img[alt=""]')].length,
  genericLinks:     [...document.querySelectorAll('a')].filter(a =>
                       /^(click here|read more|learn more|here|more)$/i.test(a.textContent.trim())
                    ).length
}));
```

Surface findings in a dedicated **Structural & SEO** section of the report.

### Step 6: Preference-based testing
Test with `prefers-reduced-motion` and `prefers-color-scheme` set:

```javascript
await page.emulateMedia({ reducedMotion: 'reduce' });
// rescan and verify animations are paused/removed
await page.emulateMedia({ colorScheme: 'dark' });
// rescan and verify dark theme renders correctly
```

### Step 7: Kill dev server
After all pages, viewports, and states are scanned, kill the background dev server process.

## Manual Verification Procedure

Automated tools miss roughly two-thirds of real defects. The `full` mode requires this manual layer — document the results in the final report.

### Step 1: Keyboard-only walkthrough (priority pages)

**SecureGate priority pages:** `/login`, `/signup`, `/forgot-password`, `/reset-password/[token]`, `/verify-email/[token]`. These cover the complete authentication lifecycle. `/dashboard` is secondary.

On each priority page, complete the primary user journey using only `Tab`, `Shift+Tab`, `Enter`, `Space`, `Arrow keys`, and `Esc`. Verify:
- All interactive elements are reachable in a logical order (WCAG 2.4.3 A).
- Focus is always visible (WCAG 2.4.7 AA).
- Focus is not obscured by sticky headers, footers, or cookie banners (WCAG 2.4.11 AA — new in 2.2).
- No keyboard traps (WCAG 2.1.2 A).
- `Esc` closes dialogs and returns focus to the trigger.
- Skip-link works and moves focus to `<main>`.
- Custom widgets follow ARIA Authoring Practices keyboard patterns (combobox, menu, tablist, etc.).

### Step 2: Screen-reader spot-check
On the same priority pages, run NVDA + Firefox (Windows) **or** VoiceOver + Safari (macOS) and verify:
- Page title is announced and meaningful.
- Headings form a logical outline (use the rotor / element list).
- Landmarks are announced (`<main>`, `<nav>`, `<aside>`, `<footer>`).
- Form fields announce label, type, required state, and errors.
- Custom widgets announce role, name, value, and state.
- Live regions announce dynamic content (toasts, validation, async updates).
- Image alt text reads naturally and adds value (or is empty for decorative images).
- Link text makes sense out of context (rotor link list).

If a screen reader is not available, document this in the scope statement — do not silently omit it.

### Step 3: Touch target & dragging verification (mobile/tablet)
- Interactive targets meet WCAG 2.5.8 AA (24×24 CSS pixels minimum, with spacing exceptions). Spot-check at 320 viewport.
- Any drag interactions have a single-pointer alternative (WCAG 2.5.7 AA — new in 2.2).

### Step 4: Cognitive & authentication checks
- WCAG 3.2.6 A (new in 2.2): Help mechanisms appear in the same relative order across pages. **SecureGate:** verify "Forgot password?" link position is consistent on /login and any page that shows it.
- WCAG 3.3.7 A (new in 2.2): Previously entered information is not required again unnecessarily. **SecureGate:** after a failed signup attempt, the form should retain the user's name and email — only the password field should clear.
- WCAG 3.3.8 AA (new in 2.2): Authentication does not rely on cognitive function tests (e.g., transcribing puzzle text); password manager / paste must be allowed. **SecureGate:** verify all password fields accept paste. No CAPTCHA is used — this check should pass.

## Static Analysis Procedure

### Step 1: Check if `eslint-plugin-jsx-a11y` is installed
Look in `package.json` devDependencies. If missing, install with the project's package manager:
```bash
pnpm add -D eslint-plugin-jsx-a11y typescript-eslint  # or npm/yarn based on lockfile
```

### Step 2: Create temporary standalone config
Due to ESLint 9 flat config compatibility issues with some frameworks, create a standalone config with broad file coverage:

```javascript
// eslint.a11y.mjs
import jsxA11y  from "eslint-plugin-jsx-a11y";
import tseslint from "typescript-eslint";

export default [
  {
    files: [
      "src/**/*.{ts,tsx,js,jsx}",
      "app/**/*.{ts,tsx,js,jsx}",          // Next.js App Router
      "pages/**/*.{ts,tsx,js,jsx}",        // Next.js Pages Router
      "components/**/*.{ts,tsx,js,jsx}",
      "packages/*/src/**/*.{ts,tsx,js,jsx}", // monorepos
    ],
    plugins: { "jsx-a11y": jsxA11y },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      ...jsxA11y.flatConfigs.recommended.rules,
      // Tighten where 'recommended' is too lenient
      "jsx-a11y/no-autofocus":                   "error",
      "jsx-a11y/anchor-is-valid":                "error",
      "jsx-a11y/click-events-have-key-events":   "error",
      "jsx-a11y/no-static-element-interactions": "error",
      "jsx-a11y/label-has-associated-control":   "error",
    },
  },
];
```

### Step 3: Run ESLint with the a11y config
```bash
npx eslint --config eslint.a11y.mjs --no-error-on-unmatched-pattern \
  "src/**/*.{ts,tsx,js,jsx}" "app/**/*.{ts,tsx,js,jsx}" \
  "pages/**/*.{ts,tsx,js,jsx}" "components/**/*.{ts,tsx,js,jsx}"
```

### Step 4: Report findings
List each violation with file, line number, rule, and description. Group by rule to identify systemic issues vs. localised ones.

### Step 5: Clean up
Remove the temporary config file. Keep `eslint-plugin-jsx-a11y` installed for future use.

### Step 6: Handle false positives
Common false positives to note:
- Custom component props named `role` (not the HTML role attribute) — pattern common in design-system libraries.
- Components that pass through ARIA attributes to child elements (Radix, Headless UI, Material UI compound components).
- Dynamic content loaded after initial render.
- Translated/i18n string keys that don't pass language detection rules.

## Auto-Fix Suggestions

For each violation found, provide specific fix recommendations:

| Violation | Fix |
|-----------|-----|
| `region` (content not in landmarks) | Wrap page content in `<main>`, ensure nav in `<nav>`, footer in `<footer>` |
| `landmark-one-main` | Exactly one `<main>` per page |
| `heading-order` (skipped levels) | Change heading level or add intermediate headings; use `<p>` with styling for decorative text |
| `color-contrast` | Adjust foreground/background to meet 4.5:1 (3:1 for large text ≥18pt or 14pt bold). **SecureGate-specific:** check the Design Token Contrast Reference above — the fix is usually swapping to the correct role token, not changing a hex value. See `.agents/rules/design-system.md`. |
| `image-alt` | Add descriptive `alt`; use `alt=""` for decorative images. **Note:** axe checks presence, not quality — flag for manual review |
| `button-name` | Add text content, `aria-label`, or `aria-labelledby` |
| `link-name` | Add text content or `aria-label`; avoid generic "click here" / "read more" |
| `label` | Associate `<label>` with form controls via `htmlFor`/`id` or wrapping |
| `aria-*` (invalid roles/attrs/values) | Verify against ARIA 1.2 spec; check role-attribute compatibility |
| `html-has-lang` / `valid-lang` | Set `<html lang="en">` (or appropriate BCP 47 tag) |
| `document-title` | Add a unique, descriptive `<title>` per page |
| `frame-title` | Add `title` attribute to `<iframe>` elements |
| `bypass` | Provide a skip link to `<main>` as the first focusable element |
| `target-size` (WCAG 2.2 AA) | Interactive targets ≥ 24×24 CSS pixels, with spacing exceptions per spec |
| `focus-order-semantics` | Ensure tab order matches visual/reading order |
| `link-in-text-block` | Distinguish links by more than colour alone (underline or 3:1 contrast against surrounding text) |

## Output Format

Always present the final report in this structure. **The header must reflect what was actually tested** — do not hardcode standards or scope.

```
## Accessibility Audit Results

**Scan mode:** [runtime / static / full / ci]
**Standards tested:** [WCAG 2.0 A/AA, 2.1 A/AA, 2.2 A/AA, best-practice — list actual tags used]
**Pages scanned:** [count] ([list paths or attach manifest])
**Viewports tested:** [e.g., 320, 390, 768, 1440]
**Interactive states exercised:** [Yes — list / No]
**Manual verification performed:** [Keyboard / Screen reader / Both / None]
**Tool versions:** axe-core [version], eslint-plugin-jsx-a11y [version]
**Date:** [ISO date]

### Scope & Limits
[Explicit list of what was NOT tested — authenticated routes, PDFs, embedded widgets, specific browsers, etc.]

### Summary
| Page | WCAG Violations | Best-Practice | Incomplete (manual review) | Passes | Worst Impact |
|------|-----------------|---------------|----------------------------|--------|--------------|
| /    | 2               | 1             | 3                          | 38     | moderate     |

### Violations Found (WCAG-mapped)

#### 1. [rule-id] — [impact] — [WCAG SC reference]
**Description:** [what the rule checks]
**Pages affected:** [list]
**Total instances:** [n] (showing [m] examples; [truncated/complete])
**Example:**
```html
<element that failed>
```
**Fix:** [specific recommendation]
**WCAG:** [SC number, level, link]

---

### Best-Practice Findings (not strictly required for compliance)
[Same format, separated to avoid overstating non-compliance]

### Incomplete Results (Require Human Review)
[List each — these are NOT confirmed pass; they need a human to verify]

### Structural & SEO Signals
- `<html lang>`: [value or MISSING]
- `<title>`: [length, uniqueness across pages]
- Meta description: [present / missing]
- Canonical: [present / missing]
- `<h1>` count per page: [list anomalies]
- Heading outline anomalies: [list]
- Skip link: [present / missing]
- Generic anchor text instances: [count]
- Images missing alt: [count]

### Manual Verification Notes
[Keyboard walkthrough results — focus visibility, focus order, traps, Esc behaviour]
[Screen reader spot-check results — announcements, landmarks, live regions]
[Touch target / dragging notes — at 320 viewport]
[WCAG 2.2 cognitive/auth checks — consistent help, redundant entry, accessible authentication]

### Summary
- Total WCAG violations: [n]
- Critical: [n] | Serious: [n] | Moderate: [n] | Minor: [n]
- Best-practice findings: [n]
- Incomplete (require review): [n]
- Recommendation: [prioritized next steps]

### Compliance Statement
This audit covers [list standards]. Items marked "Incomplete" and findings from the manual verification layer must be resolved before any compliance claim is made under EN 301 549, EAA, ADA, or Section 508.
```

## CI Integration Appendix

For continuous coverage, integrate into CI/CD using one of:

- **`@axe-core/playwright`** — runtime scans in Playwright test suites; assert on violation counts per route.
- **`jest-axe`** — component-level scans in Jest/Vitest unit tests.
- **`pa11y-ci`** — multi-URL scans via a sitemap or URL list; suitable for static sites.
- **Lighthouse CI** — adds Core Web Vitals and additional best-practice signals; useful as a complement, not a replacement.

Recommended baseline:
1. `eslint-plugin-jsx-a11y` runs on every PR (pre-commit or CI lint step).
2. `@axe-core/playwright` runs on the build preview deployment with viewports `[320, 768, 1440]` and a curated route manifest.
3. PR fails if new WCAG-mapped violations are introduced (use a baseline file to suppress known pre-existing issues during remediation).
4. Schedule a weekly full-mode audit (including manual verification) on `main`.

## Common Anti-Patterns to Flag

Beyond what axe and jsx-a11y catch automatically, manually flag these in code review:

- `<a onClick>` without an `href` — should be a `<button>`.
- `<div role="button">` instead of `<button>` — loses keyboard, focus, and form semantics.
- `<section>` without `aria-label` / `aria-labelledby` — not a landmark.
- `list-style: none` without `role="list"` — Safari + VoiceOver strips list semantics.
- Custom modals instead of native `<dialog>` — `<dialog>` provides focus trap, `Esc`, inert background.
- `<button>` inside a form without explicit `type="submit"` or `type="button"` — common accidental-submit bug.
- `tabindex` values greater than 0 — breaks natural tab order.
- `outline: none` on focusable elements without a replacement focus indicator.
- Heading components (`<Heading level={n}>`) that produce out-of-order DOM headings when sections reorder visually.
- Auto-playing carousels or auto-advancing content without pause controls (WCAG 2.2.2 A).

## Versioning & Maintenance

- Pin axe-core, `eslint-plugin-jsx-a11y`, and Playwright versions in the report.
- Re-evaluate this skill against the latest WCAG version annually (or whenever W3C publishes a new Recommendation).
- WCAG 2.2 is the current Recommendation as of October 2023. WCAG 3.0 is in development; track its progress.
