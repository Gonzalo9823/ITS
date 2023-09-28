import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { type GetServerSidePropsContext } from "next";
import { getServerSession, type DefaultSession, type NextAuthOptions, type Awaitable } from "next-auth";
import type { AdapterSession, AdapterUser } from "next-auth/adapters";
import GoogleProvider from "next-auth/providers/google";

import { env } from "~/env.mjs";
import { prisma } from "~/server/db";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: DefaultSession["user"] & {
      id: string;
      role: "student" | "teacher";
    };
  }

  interface User {
    role: "student" | "teacher";
  }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authOptions: NextAuthOptions = {
  callbacks: {
    session: ({ session, user }) => ({
      ...session,
      user: {
        ...session.user,
        id: user.id,
        role: user.role,
      },
    }),
  },
  adapter: {
    ...PrismaAdapter(prisma),
    createUser: async (data) => {
      const user = await prisma.user.create({ data });
      const subjects = await prisma.subject.findMany();

      for (const subject of subjects) {
        await prisma.userSubject.create({
          data: {
            userId: user.id,
            subjectId: subject.id,
          },
        });
      }

      return user as Awaitable<AdapterUser>;
    },
    getUser: async (id) => {
      const user = await prisma.user.findUnique({ where: { id } });

      if (user) {
        await prisma.user.update({
          data: {
            lastConnection: new Date(),
          },
          where: {
            id,
          },
        });
      }

      return user as Awaitable<AdapterUser>;
    },
    getUserByEmail: async (email) => {
      const user = await prisma.user.findUnique({ where: { email } });

      if (user) {
        await prisma.user.update({
          data: {
            lastConnection: new Date(),
          },
          where: {
            email,
          },
        });
      }

      return user as Awaitable<AdapterUser>;
    },
    getUserByAccount: async (provider_providerAccountId) => {
      const account = await prisma.account.findUnique({
        where: { provider_providerAccountId },
        select: { user: true },
      });

      if (account?.user.id) {
        await prisma.user.update({
          data: {
            lastConnection: new Date(),
          },
          where: {
            id: account.user.id,
          },
        });
      }

      return (account?.user ?? null) as Awaitable<AdapterUser> | null;
    },
    getSessionAndUser: async (sessionToken) => {
      const userAndSession = await prisma.session.findUnique({
        where: { sessionToken },
        include: { user: true },
      });

      if (!userAndSession) return null;

      const { user, ...session } = userAndSession;

      await prisma.user.update({
        data: {
          lastConnection: new Date(),
        },
        where: {
          id: user.id,
        },
      });

      return { user, session } as {
        session: AdapterSession;
        user: AdapterUser;
      };
    },
  },
  providers: [
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    }),
    /**
     * ...add more providers here.
     *
     * Most other providers require a bit more work than the Discord provider. For example, the
     * GitHub provider requires you to add the `refresh_token_expires_in` field to the Account
     * model. Refer to the NextAuth.js docs for the provider you want to use. Example:
     *
     * @see https://next-auth.js.org/providers/github
     */
  ],
};

/**
 * Wrapper for `getServerSession` so that you don't need to import the `authOptions` in every file.
 *
 * @see https://next-auth.js.org/configuration/nextjs
 */
export const getServerAuthSession = (ctx: { req: GetServerSidePropsContext["req"]; res: GetServerSidePropsContext["res"] }) => {
  return getServerSession(ctx.req, ctx.res, authOptions);
};
