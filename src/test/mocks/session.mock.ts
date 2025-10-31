import { UserSession } from "@thallesp/nestjs-better-auth";

export const createMockSession = (overrides?: Partial<UserSession>): UserSession => {
	return {
		user: {
			id: "test-user-id-123",
			email: "test@example.com",
			name: "Test User",
			image: null,
			emailVerified: true,
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		session: {
			id: "test-session-id",
			expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
			token: "test-token",
			ipAddress: "127.0.0.1",
			userAgent: "test-agent",
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		...overrides,
	} as UserSession;
};

export const TEST_USER_ID = "test-user-id-123";
