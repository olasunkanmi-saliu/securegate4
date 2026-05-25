# Architecture Rules — SecureGate

## Application Type

Next.js 14 App Router application. Server-first architecture. All authentication logic runs server-side. Client components are used only for interactive form elements.

## Directory Ownership

Each directory has a single responsibility. Do not place files outside their designated directory.

```
src/app/          → Pages and API routes only. No business logic.
src/lib/          → Shared server-side logic. No UI code.
src/components/   → Reusable UI components and email templates (src/components/emails/). No direct DB access.
src/styles/       → Design tokens and global styles only. Imported by src/app/layout.tsx.
tokens/           → Source JSON design tokens + generator script. Outputs to src/styles/.
prisma/           → Schema and migrations only.
```

## File Boundaries

- **Page files** (`page.tsx`) orchestrate layout and call components. They do not contain fetch logic, database queries, or validation.
- **API route files** (`route.ts`) handle HTTP concerns: parse request, validate with Zod, call lib functions, return response. They do not contain business logic directly.
- **Lib files** contain pure business logic. They do not import from `next/server`, `next/navigation`, or any UI package.
- **Component files** render UI. They receive data via props. They do not call `fetch()` to internal API routes.

## Data Flow

```
Client → API Route → Zod Validation → Lib Function → Prisma → PostgreSQL
```

Every step is mandatory. No shortcutting from API route directly to Prisma without validation. No shortcutting from client directly to Prisma.

## Server vs Client Components

Default to server components. Mark a component with `"use client"` only when it requires:

- `useState`, `useEffect`, or other React hooks
- Browser event handlers (`onClick`, `onSubmit`, `onBlur`)
- Browser APIs (`window`, `document`, `localStorage`)

Forms are client components. Layout wrappers and page shells are server components.

## API Route Pattern

Every API route follows this exact structure:

```
1. Extract body from request
2. Validate with Zod schema from lib/validations.ts
3. If validation fails → return 400 with field errors
4. Check rate limit via lib/rate-limit.ts
5. If rate limited → return 429 with Retry-After
6. Execute business logic via lib/ functions
7. Return sanitized response
8. Catch all errors → return 500 with generic message, log server-side
```

No deviation from this order.

Exception: `src/app/api/auth/[...nextauth]/route.ts` delegates entirely to NextAuth's handler and does not follow the 8-step pattern.

## User Enumeration Defense

Any API route that checks email existence (signup, forgot-password, verify-email/resend) must return identical response shapes, status codes, and similar timing regardless of whether the email exists. Never reveal whether an email is registered.

## Authentication Flow

```
Signup → Hash password → Create user → Generate verify token → Send email
Login  → Find user → Compare hash → Check emailVerified → Create session
Logout → Destroy session → Redirect to /login
```

## Token Flow

```
Generate: crypto.randomBytes(32).toString('hex')
Store:    SHA-256 hash of token → database
Email:    Raw token in URL → user's inbox
Verify:   Hash incoming token → lookup hash in DB → consume + delete
```

Raw tokens exist only in memory during generation and in the email link. They are never persisted.

## Session Strategy

JWT-based sessions via NextAuth. No database session table. JWTs are signed with `NEXTAUTH_SECRET`. Session data contains only: `user.id`, `user.email`, `user.name`.

## Middleware

`middleware.ts` at project root protects routes. It runs before page rendering. Protected routes are defined explicitly — not by glob pattern.

Protected: `/dashboard` and any future authenticated routes.
Public: `/login`, `/signup`, `/forgot-password`, `/reset-password/*`, `/verify-email/*`, all `/api/*` routes.

Scope middleware with `config.matcher` to avoid running on every request:
```typescript
export const config = { matcher: ["/dashboard"] };
```

## Database Access

Prisma client is a singleton instantiated in `src/lib/db.ts`. Every file that needs database access imports from this single location. Never instantiate `new PrismaClient()` anywhere else.

## Imports

All imports use the `@/` path alias mapping to `src/`. No relative imports beyond the immediate parent directory.

## Environment Variables

Accessed via `process.env.VARIABLE_NAME`. Never passed to client components. Never logged. Never included in API responses. Validated at application startup where possible.