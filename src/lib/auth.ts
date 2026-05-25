import { compare } from "bcryptjs";
import CredentialsProvider from "next-auth/providers/credentials";

import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { signinSchema } from "@/lib/validations";

import type { NextAuthOptions } from "next-auth";

/**
 * Session strategy: JWT.
 *
 * JWT is chosen over database sessions because (1) this app deploys to
 * serverless functions on Vercel, where DB session lookups add a hop per
 * request and exhaust connection budgets, and (2) we ship no admin
 * "revoke session" feature, so per-token max-age is sufficient revocation.
 * Database-backed sessions would also require a Session table, which would
 * be the only piece of NextAuth state our schema needs. Skipping it keeps
 * the schema audit surface to exactly the three models the spec defines.
 */
export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60,
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        const parsed = signinSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }
        const { email, password } = parsed.data;

        const rawIp = req?.headers?.["x-forwarded-for"] ?? "unknown";
        const ip =
          (typeof rawIp === "string"
            ? rawIp.split(",")[0]?.trim()
            : rawIp[0]?.trim()) ?? "unknown";

        const rateLimit = await checkRateLimit(ip, "signin");
        if (!rateLimit.success) {
          throw new Error("RATE_LIMITED");
        }

        const user = await db.user.findUnique({ where: { email } });
        if (!user) {
          return null;
        }

        const passwordValid = await compare(password, user.password);
        if (!passwordValid) {
          return null;
        }

        if (!user.emailVerified) {
          throw new Error("EMAIL_NOT_VERIFIED");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user = {
          id: token.id,
          email: token.email,
          name: token.name,
        };
      }
      return session;
    },
  },
};
