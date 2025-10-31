import { expo } from "@better-auth/expo";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "../../generated/prisma/client";

const prisma = new PrismaClient();

/**
 * Better Auth instance for email/password authentication with mobile support
 *
 * Configuration:
 * - Database: PostgreSQL via Prisma adapter
 * - Plugins: Expo plugin for mobile app authentication (appfinancaspessoais://)
 * - Trusted Origins: Mobile app and local development Expo server
 */
export const auth = betterAuth({
	database: prismaAdapter(prisma, {
		provider: "postgresql",
	}),
	// Allow authentication from localhost, mobile app (appfinancaspessoais://), and local Expo development server
	trustedOrigins: ["http://localhost:3000", "appfinancaspessoais://", "exp://192.168.0.30:8081"],
	// Enable Expo plugin for React Native mobile support
	plugins: [expo()],
	// Enable email/password authentication method
	emailAndPassword: {
		enabled: true,
	},
});
