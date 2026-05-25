# SKILL: Database Migration Runner

## Purpose

Manage Prisma schema changes and database migrations for SecureGate's PostgreSQL database.

## When to Use

Use this skill when you need to:

- Add, modify, or remove a model in `prisma/schema.prisma`
- Add or change fields, indexes, or constraints
- Run a migration to apply schema changes
- Reset the database during development

## Schema File

```
prisma/schema.prisma
```

This is the single source of truth for the database structure. All three models (User, VerificationToken, PasswordResetToken) are defined here.

## Current Schema

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String    @id @default(uuid())
  name          String
  email         String    @unique
  password      String
  emailVerified DateTime?
  createdAt     DateTime  @default(now())
}

model VerificationToken {
  id         String   @id @default(uuid())
  identifier String
  token      String   @unique
  expires    DateTime
  createdAt  DateTime @default(now())

  @@unique([identifier, token])
}

model PasswordResetToken {
  id        String   @id @default(uuid())
  email     String
  token     String   @unique
  expires   DateTime
  createdAt DateTime @default(now())

  @@unique([email, token])
}
```

## DATABASE_URL Format

The connection string must follow this format in `.env.local`:

```
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public
```

Examples:

```bash
# Local development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/securegate?schema=public

# Hosted (e.g., Supabase, Neon, Railway)
DATABASE_URL=postgresql://user:password@db.example.com:5432/securegate?schema=public&sslmode=require
```

The `?schema=public` parameter is required for Prisma. Hosted databases typically require `&sslmode=require`.

## Field Constraint Reference

This table maps every field across all models to its Prisma type, constraints, and corresponding Zod validation. If the schema changes, the Zod schema in `lib/validations.ts` must change to match.

### User

| Field         | Prisma Type    | Prisma Constraint          | Zod Validation                                    |
|---------------|----------------|----------------------------|---------------------------------------------------|
| id            | String         | `@id @default(uuid())`     | Never in request — auto-generated                 |
| name          | String         | Required                   | `z.string().trim().min(2).max(50)`                |
| email         | String         | `@unique`                  | `z.string().email().max(255).toLowerCase()`       |
| password      | String         | Required                   | `z.string().min(8).max(128)` + complexity regexes |
| emailVerified | DateTime?      | Nullable                   | Never in request — set server-side                |
| createdAt     | DateTime       | `@default(now())`          | Never in request — auto-generated                 |

### VerificationToken

| Field      | Prisma Type | Prisma Constraint          | Zod Validation                              |
|------------|-------------|----------------------------|----------------------------------------------|
| id         | String      | `@id @default(uuid())`     | Never in request — auto-generated            |
| identifier | String      | Required                   | Set server-side (user's email)               |
| token      | String      | `@unique`                  | Set server-side (SHA-256 hash)               |
| expires    | DateTime    | Required                   | Set server-side (`Date.now() + 15 * 60 * 1000`) |
| createdAt  | DateTime    | `@default(now())`          | Never in request — auto-generated            |

### PasswordResetToken

| Field     | Prisma Type | Prisma Constraint          | Zod Validation                                  |
|-----------|-------------|----------------------------|-------------------------------------------------|
| id        | String      | `@id @default(uuid())`     | Never in request — auto-generated               |
| email     | String      | Required                   | Set server-side (user's email)                  |
| token     | String      | `@unique`                  | Set server-side (SHA-256 hash)                  |
| expires   | DateTime    | Required                   | Set server-side (`Date.now() + 60 * 60 * 1000`) |
| createdAt | DateTime    | `@default(now())`          | Never in request — auto-generated               |

Key observation: only `name`, `email`, and `password` ever come from client input. Every other field is auto-generated or set server-side. This limits the Zod validation surface to three fields.

## Migration Commands

### Rapid prototype (no migration files)

```bash
npx prisma db push
```

Syncs the schema directly to the database without creating migration files. Useful during early development when schema is still in flux. Once stable, run `migrate dev` to create the first official migration.

### Create migration SQL without applying

```bash
npx prisma migrate dev --create-only
```

Generates the SQL migration file in `prisma/migrations/` without running it. Useful for reviewing the generated SQL before applying, or for CI pipelines.

### Create and apply a migration

```bash
npx prisma migrate dev --name <descriptive-name>
```

Name format: lowercase, hyphen-separated, describes the change.

Examples:
- `--name init` (initial schema)
- `--name add-user-role-field`
- `--name add-index-on-verification-token-expires`

### Apply migrations in production

```bash
npx prisma migrate deploy
```

### Reset database (dev only — destroys all data)

```bash
npx prisma migrate reset
```

### Generate Prisma client after schema change

```bash
npx prisma generate
```

### View current migration status

```bash
npx prisma migrate status
```

## Migration Troubleshooting

### Drift detected — schema and database are out of sync

This happens when the database was modified outside of Prisma migrations (manual SQL, another tool, or a failed migration).

```bash
# Check what drifted
npx prisma migrate diff --from-migrations ./prisma/migrations --to-schema-datamodel ./prisma/schema.prisma

# If in development, reset is the fastest fix
npx prisma migrate reset

# If you need to preserve data, create a new migration to reconcile
npx prisma migrate dev --name fix-drift
```

### Shadow database error

Prisma uses a temporary "shadow database" during `migrate dev`. If it fails:

1. Ensure your `DATABASE_URL` user has `CREATE DATABASE` permissions.
2. Or, add a separate shadow database URL in `schema.prisma`:

```prisma
datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  shadowDatabaseUrl = env("SHADOW_DATABASE_URL")
}
```

### Migration failed mid-way

If a migration partially applied and left the database in a broken state:

```bash
# Mark the failed migration as rolled back
npx prisma migrate resolve --rolled-back <migration-name>

# Then re-run
npx prisma migrate dev
```

### Merge conflict on migration files

When multiple developers create migrations on the same branch, migration file timestamps can conflict:

```bash
# 1. Keep the migration with the latest timestamp from each developer
# 2. Run migrate dev to reconcile
npx prisma migrate dev --name merge-reconciliation
```

Prisma will detect drift and create a new migration that reconciles all changes. Do not manually reorder migration file timestamps.

### Types out of date after schema change

If TypeScript shows stale types after editing the schema:

```bash
npx prisma generate
```

Then restart your IDE / TypeScript server.

## Rules

1. **Never edit migration files after they are created.** If a migration is wrong, create a new migration to correct it.
2. **Never delete migration files** from the `prisma/migrations/` directory.
3. **Always run `prisma generate`** after schema changes so the client types are updated.
4. **Always use `@default(uuid())`** for primary keys. No auto-incrementing integers.
5. **Always use `@default(now())`** for `createdAt` fields.
6. **Always add `@unique`** on fields that must be unique (email, token hashes).
7. **Always add `@@index`** on fields used in lookups (token). `@unique` already creates an index in PostgreSQL — do not add a redundant `@@index` on unique fields.
8. **Never add nullable fields without a reason.** `emailVerified` is nullable because it represents "not yet verified." All other fields are required.
9. **Token fields store SHA-256 hashes**, not raw tokens. The column name is `token` but the value is always a hash.

## Schema Change Workflow

```
1. Edit prisma/schema.prisma
2. Run: npx prisma migrate dev --name <descriptive-name>
3. Run: npx prisma generate
4. Update the Field Constraint Reference table above
5. Update any Zod schemas in lib/validations.ts if field constraints changed
6. Update any lib/ files that reference changed models
7. Test the affected API routes
8. Commit the schema file AND the migration files together
```

## Prisma Client Singleton

The Prisma client is instantiated once in `src/lib/db.ts`:

```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
```

Every file that needs database access imports `db` from this file. Never create a new `PrismaClient()` anywhere else. The singleton pattern prevents connection exhaustion during development hot reloads.

## Complete Query Reference

Every database operation SecureGate needs, organized by model and use case.

### User — Create (Signup)

```typescript
import { hash } from "bcryptjs";

const hashedPassword = await hash(password, 12);

const user = await db.user.create({
  data: {
    name,
    email,
    password: hashedPassword,
  },
});
```

### User — Find by email

```typescript
const user = await db.user.findUnique({ where: { email } });
```

### User — Update email verification

```typescript
await db.user.update({
  where: { email: token.identifier },
  data: { emailVerified: new Date() },
});
```

### User — Update password (Reset)

```typescript
import { hash } from "bcryptjs";

const hashedPassword = await hash(newPassword, 12);

await db.user.update({
  where: { email: resetToken.email },
  data: { password: hashedPassword },
});
```

### User — Check if email exists

```typescript
const existingUser = await db.user.findUnique({ where: { email } });
if (existingUser) {
  // Return generic error — do not say "email already registered"
}
```

### VerificationToken — Delete existing + Create new

Always delete existing tokens for the same email before creating a new one. This prevents token accumulation from repeated resend requests.

```typescript
import { generateToken, hashToken } from "@/lib/tokens";

// Clean up any existing tokens for this email
await db.verificationToken.deleteMany({
  where: { identifier: email },
});

const rawToken = generateToken();
const hashed = hashToken(rawToken);

await db.verificationToken.create({
  data: {
    identifier: email,
    token: hashed,
    expires: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
  },
});

// rawToken goes in the email link, hashed goes in the DB
```

### VerificationToken — Find by hash

```typescript
import { hashToken } from "@/lib/tokens";

const hashedToken = hashToken(incomingToken);

const verifyToken = await db.verificationToken.findUnique({
  where: { token: hashedToken },
});
```

### VerificationToken — Check expiry

```typescript
if (!verifyToken || verifyToken.expires < new Date()) {
  // Token missing or expired — show error + resend link
}
```

### VerificationToken — Consume (verify + delete)

```typescript
// Update user
await db.user.update({
  where: { email: verifyToken.identifier },
  data: { emailVerified: new Date() },
});

// Delete consumed token — single-use, no reuse
await db.verificationToken.delete({
  where: { id: verifyToken.id },
});
```

### PasswordResetToken — Delete existing + Create new

Same pattern as VerificationToken — clean up before creating.

```typescript
import { generateToken, hashToken } from "@/lib/tokens";

await db.passwordResetToken.deleteMany({
  where: { email },
});

const rawToken = generateToken();
const hashed = hashToken(rawToken);

await db.passwordResetToken.create({
  data: {
    email,
    token: hashed,
    expires: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
  },
});
```

### PasswordResetToken — Find by hash

```typescript
import { hashToken } from "@/lib/tokens";

const hashedToken = hashToken(incomingToken);

const resetToken = await db.passwordResetToken.findUnique({
  where: { token: hashedToken },
});
```

### PasswordResetToken — Check expiry

```typescript
if (!resetToken || resetToken.expires < new Date()) {
  // Token missing or expired — show error + redirect to /forgot-password
}
```

### PasswordResetToken — Consume (update password + delete)

```typescript
import { hash } from "bcryptjs";

const hashedPassword = await hash(newPassword, 12);

await db.user.update({
  where: { email: resetToken.email },
  data: { password: hashedPassword },
});

await db.passwordResetToken.delete({
  where: { id: resetToken.id },
});
```

## Token Cleanup Strategy

Expired tokens that are never consumed (user never clicks the link) will accumulate in the database over time.

**Cleanup approach:** delete existing tokens for the same user/email before creating new ones. This is already enforced in the "Delete existing + Create new" patterns above. Every time a user requests a new verification or reset token, any prior tokens for that email are wiped first.

This means the maximum number of unconsumed tokens per email is always 1. No cron job or scheduled cleanup is needed for this project scope.