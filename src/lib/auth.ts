import { compare, hash } from "bcryptjs";
import CredentialsProvider from "next-auth/providers/credentials";

import { BCRYPT_ROUNDS } from "@/lib/constants";
import { db } from "@/lib/db";
import { signinSchema } from "@/lib/validations";

import type { NextAuthOptions } from "next-auth";

let fakeHashPromise: Promise<string> | null = null;

async function getFakeHash(): Promise<string> {
  if (!fakeHashPromise) {
    fakeHashPromise = hash("dummy", BCRYPT_ROUNDS);
  }
  return fakeHashPromise;
}

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
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60,
  },
  pages: {
    signIn: "/auth?mode=login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = signinSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }
        const { email, password } = parsed.data;

        let user;
        try {
          user = await db.user.findUnique({ where: { email } });
        } catch (error) {
          console.error("[AUTH:FIND_USER]", error);
          return null;
        }

        if (!user) {
          await compare(password, await getFakeHash());
          return null;
        }

        const passwordValid = await compare(password, user.password);
        if (!passwordValid) {
          return null;
        }

        if (!user.emailVerified) {
          return null;
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
