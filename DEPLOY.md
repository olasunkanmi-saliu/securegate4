# Deploying SecureGate to Vercel

## Prerequisites
- GitHub repo (already wired: `olasunkanmi-saliu/securegate4`)
- Vercel account
- Neon Postgres project (existing: `cool-bar-66311064`)
- Resend account (sign up at https://resend.com — free tier is fine)
- Upstash Redis (already provisioned: `popular-bat-136284`)

## One-time setup

1. **Import the repo on Vercel.** Dashboard → Add New → Project → import `securegate4`. Use the default build settings (Vercel detects Next.js 14).

2. **Verify a sender domain in Resend.** Without a verified domain, Resend will only send to the address on the API key. Add and verify the domain you want to use for `EMAIL_FROM`.

3. **Add environment variables in Vercel.** Project Settings → Environment Variables. Add all seven for the **Production** environment:

| Name | Value |
|---|---|
| `DATABASE_URL` | Neon pooled connection string (the same one in your local `.env`) |
| `NEXTAUTH_SECRET` | 32-byte base64 (generate fresh for prod: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`) |
| `NEXTAUTH_URL` | `https://<your-vercel-domain>` (no trailing slash). Update after the first deploy if you add a custom domain. |
| `RESEND_API_KEY` | From Resend dashboard |
| `EMAIL_FROM` | `noreply@your-verified-domain.com` |
| `UPSTASH_REDIS_REST_URL` | Same as local `.env` |
| `UPSTASH_REDIS_REST_TOKEN` | Same as local `.env` |

   Do **not** add `NEXTAUTH_URL` for the Preview environment — Vercel sets `VERCEL_URL` automatically, and NextAuth will fall back to it.

4. **Apply migrations to prod DB.** Locally, with the prod `DATABASE_URL` exported:
   ```
   npx prisma migrate deploy
   ```
   This applies `prisma/migrations/20260525183514_init` (the only migration so far) to the database. The migration is idempotent — re-running is safe.

5. **Trigger the first deploy** by pushing to `master`. Vercel will build and publish.

## Production smoke test

After the first deploy, walk the whole flow on the live URL:

1. Visit `/` — landing page with two CTAs
2. Click **Create account**, sign up with a real email you control
3. Check inbox for the verification email (Resend, not the dev stub)
4. Click the verification link → redirects to `/login?verified=1` with a green alert
5. Sign in → lands on `/dashboard` with "Welcome back, <name>"
6. Click **Sign out** → returns to `/login`
7. Click **Forgot password**, submit your email
8. Check inbox for the reset email
9. Click the reset link → form renders → set a new password
10. Sign in with the new password
11. Confirm `curl -I` shows all five security headers on the live URL
12. Hit `/api/auth/signup` 6 times rapidly — the 6th should be `429 Too Many Requests` (Upstash active in prod)

## Rolling out schema changes later
- Edit `prisma/schema.prisma`
- Locally: `npx prisma migrate dev --name <change>` (creates and applies the migration to your dev DB)
- Commit and push the migration files
- Set up a Vercel build hook or a CI step that runs `npx prisma migrate deploy` before deploy
  (or run it once manually with the prod `DATABASE_URL` before pushing)

## Things to monitor after launch
- Resend dashboard for delivery / bounce rates
- Upstash dashboard for rate-limit hit counters (the limiter is configured with `analytics: true`)
- Neon dashboard for connection pool usage
- Vercel logs for the route-prefixed entries (`[SIGNUP]`, `[FORGOT_PASSWORD]`, etc.) — these are the only server-side errors that surface; clients always see generic messages.
