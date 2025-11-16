import { expo } from "@better-auth/expo";
import { betterAuth } from "better-auth";
import { createAuthMiddleware } from "better-auth/api";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "../../generated/prisma/client";
import { seedUserCategories } from "./seed-categories";

const prisma = new PrismaClient();

/**
 * Better Auth instance for email/password authentication with mobile support
 *
 * Configuration:
 * - Database: PostgreSQL via Prisma adapter
 * - Plugins: Expo plugin for mobile app authentication (appfinancaspessoais://)
 * - Trusted Origins: Mobile app and local development Expo server
 * - Hooks: Seed default categories on user signup
 */
export const auth = betterAuth({
  basePath: "/auth",
  // Alinha o prefixo das rotas de autenticação com o front (sem "/api")
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  // Allow authentication from localhost, mobile app (appfinancaspessoais://), and local Expo development server
  trustedOrigins: [
    "http://localhost:3000",
    "http://localhost:5173",
    "appfinancaspessoais://",
    "exp://192.168.0.76:8081",
  ],
  // Enable Expo plugin for React Native mobile support
  plugins: [expo()],
  // Enable email/password authentication method
  emailAndPassword: {
    enabled: true,
  },
  user: {
    changeEmail: {
      enabled: true,
    },
  },
  // Hooks: seed categories on successful signup
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      // Only seed on sign-up endpoint
      if (ctx.path.startsWith("/sign-up")) {
        const session = ctx.context.newSession;
        if (session?.user?.id) {
          await seedUserCategories(session.user.id, prisma);
        }
      }
    }),
  },
});
