import NextAuth, { type DefaultSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import * as argon2 from "argon2";
import { eq } from "drizzle-orm";
import { getDb, ensureDatabaseSchema } from "../db";
import { users, workspaceMembers, workspaces } from "../db/schema";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      defaultWorkspaceId?: string;
      role?: string;
    } & DefaultSession["user"];
  }

  interface User {
    defaultWorkspaceId?: string;
    role?: string;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET || "devflow-super-secret-key-32-chars-minimum-length-needed-12345",
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    newUser: "/onboarding",
    error: "/login",
  },
  providers: [
    ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
      ? [
          GithubProvider({
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
          }),
        ]
      : []),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
    CredentialsProvider({
      name: "Email and Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        await ensureDatabaseSchema();
        const db = getDb();
        const emailStr = String(credentials.email).toLowerCase().trim();

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, emailStr))
          .limit(1);

        if (!user || !user.passwordHash) {
          return null;
        }

        const isValid = await argon2.verify(user.passwordHash, String(credentials.password));
        if (!isValid) {
          return null;
        }

        // Fetch user default workspace role if workspace exists
        let role = "member";
        if (user.defaultWorkspaceId) {
          const [membership] = await db
            .select()
            .from(workspaceMembers)
            .where(eq(workspaceMembers.userId, user.id))
            .limit(1);
          if (membership) {
            role = membership.role;
          }
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          defaultWorkspaceId: user.defaultWorkspaceId || undefined,
          role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.defaultWorkspaceId = user.defaultWorkspaceId;
        token.role = user.role;
      }
      if (trigger === "update" && session) {
        if (session.defaultWorkspaceId) {
          token.defaultWorkspaceId = session.defaultWorkspaceId;
        }
        if (session.role) {
          token.role = session.role;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = (token.id as string) || (token.sub as string);
        session.user.defaultWorkspaceId = token.defaultWorkspaceId as string | undefined;
        session.user.role = token.role as string | undefined;
      }
      return session;
    },
  },
});
