# SecureGate

Standalone, production-grade authentication and identity security app. Built for independent security audit — every decision assumes adversarial conditions.

## Tech Stack

- **Framework**: Next.js 14 (App Router, TypeScript)
- **ORM**: Prisma + PostgreSQL
- **Auth**: NextAuth.js (Credentials provider, JWT sessions)
- **Hashing**: bcryptjs (12 rounds)
- **Validation**: Zod (server-side, before any DB op)
- **Rate Limiting**: @upstash/ratelimit + Upstash Redis (sliding window)
- **Email**: Resend / SMTP / Console stub
- **Styling**: CSS Modules + design tokens
- **Deployment**: Vercel

## Quick Start

```bash
cp .env.example .env.local
npm install
npx prisma generate
npx prisma db push
npm run dev
```

## Security Model

The application follows Kerckhoffs's Principle and Murphy's Law:

- **No input trust** — every payload validated with Zod before any database operation
- **No information leaks** — all API errors return generic messages; no stack traces, no email-existence confirmation
- **Token security** — `crypto.randomBytes(32)` → SHA-256 hash before storage; deleted after single use
- **Password hashing** — bcryptjs with 12 salt rounds
- **Rate limiting** — fail-closed in production; 429 with `Retry-After` on all auth endpoints
- **CSRF protection** — `Origin`/`Referer` validation on every custom POST route
- **Enumeration defense** — identical response shapes for existent/non-existent emails; timing padding on sensitive endpoints

See `AGENTS.md` for full architecture and `DEPLOY.md` for deployment checklist.
