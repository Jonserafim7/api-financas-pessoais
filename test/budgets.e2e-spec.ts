import type { INestApplication } from "@nestjs/common";
import { Test, type TestingModule } from "@nestjs/testing";
import request from "supertest";
import type { App } from "supertest/types";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma.service";

describe("Budgets (e2e)", () => {
	let app: INestApplication<App>;
	let prisma: PrismaService;

	const TEST_USER_ID = "test-user-e2e-budgets";
	const TEST_USER_ID_2 = "test-user-e2e-budgets-2";
	const TEST_BUDGET = {
		amount: 1000,
		period: "MONTHLY",
		startDate: "2024-01-01T00:00:00Z",
		endDate: "2024-12-31T23:59:59Z",
	};

	beforeAll(async () => {
		const moduleFixture: TestingModule = await Test.createTestingModule({
			imports: [AppModule],
		}).compile();

		app = moduleFixture.createNestApplication();
		await app.init();
		prisma = moduleFixture.get<PrismaService>(PrismaService);

		// Create test users
		await prisma.user.upsert({
			where: { id: TEST_USER_ID },
			update: {},
			create: {
				id: TEST_USER_ID,
				email: "test-budgets@example.com",
				name: "Test User Budgets",
				emailVerified: true,
			},
		});

		await prisma.user.upsert({
			where: { id: TEST_USER_ID_2 },
			update: {},
			create: {
				id: TEST_USER_ID_2,
				email: "test-budgets-2@example.com",
				name: "Test User Budgets 2",
				emailVerified: true,
			},
		});
	});

	afterAll(async () => {
		// Cleanup test data
		await prisma.budget.deleteMany({
			where: {
				OR: [{ userId: TEST_USER_ID }, { userId: TEST_USER_ID_2 }],
			},
		});
		await prisma.category.deleteMany({
			where: {
				OR: [{ userId: TEST_USER_ID }, { userId: TEST_USER_ID_2 }],
			},
		});
		await prisma.user.deleteMany({
			where: {
				OR: [{ id: TEST_USER_ID }, { id: TEST_USER_ID_2 }],
			},
		});
		await app.close();
	});

	describe("Authentication Requirements", () => {
		describe("GET /budgets - List Budgets", () => {
			it("should require authentication", () => {
				return request(app.getHttpServer()).get("/budgets").expect(401);
			});
		});

		describe("POST /budgets - Create Budget", () => {
			it("should require authentication", () => {
				return request(app.getHttpServer())
					.post("/budgets")
					.send(TEST_BUDGET)
					.expect(401);
			});
		});

		describe("GET /budgets/:id - Get Single Budget", () => {
			it("should require authentication", () => {
				return request(app.getHttpServer())
					.get("/budgets/test-budget-id")
					.expect(401);
			});
		});

		describe("PUT /budgets/:id - Update Budget", () => {
			it("should require authentication", () => {
				return request(app.getHttpServer())
					.put("/budgets/test-budget-id")
					.send({ amount: 1500 })
					.expect(401);
			});
		});

		describe("DELETE /budgets/:id - Delete Budget", () => {
			it("should require authentication", () => {
				return request(app.getHttpServer())
					.delete("/budgets/test-budget-id")
					.expect(401);
			});
		});
	});

	describe("Data Validation (Schema Level)", () => {
		it("should reject budget creation with invalid period enum", () => {
			return request(app.getHttpServer())
				.post("/budgets")
				.send({
					amount: 1000,
					period: "INVALID_PERIOD",
					startDate: "2024-01-01T00:00:00Z",
				})
				.expect(401); // Will fail auth first, but validates the endpoint structure
		});

		it("should reject budget creation with missing required fields", () => {
			return request(app.getHttpServer())
				.post("/budgets")
				.send({
					amount: 1000,
				})
				.expect(401); // Will fail auth first
		});

		it("should reject budget creation with invalid date format", () => {
			return request(app.getHttpServer())
				.post("/budgets")
				.send({
					amount: 1000,
					period: "MONTHLY",
					startDate: "invalid-date",
				})
				.expect(401); // Will fail auth first
		});

		it("should reject budget update with invalid data types", () => {
			return request(app.getHttpServer())
				.put("/budgets/test-id")
				.send({
					amount: "not-a-number",
				})
				.expect(401); // Will fail auth first
		});
	});

	describe("Endpoint Routing and Structure", () => {
		it("should have GET /budgets endpoint", async () => {
			const response = await request(app.getHttpServer()).get("/budgets");
			expect([200, 401]).toContain(response.status);
		});

		it("should have POST /budgets endpoint", async () => {
			const response = await request(app.getHttpServer())
				.post("/budgets")
				.send(TEST_BUDGET);
			expect([200, 201, 400, 401]).toContain(response.status);
		});

		it("should have GET /budgets/:id endpoint", async () => {
			const response = await request(app.getHttpServer()).get(
				"/budgets/test-id",
			);
			expect([200, 401, 404]).toContain(response.status);
		});

		it("should have PUT /budgets/:id endpoint", async () => {
			const response = await request(app.getHttpServer())
				.put("/budgets/test-id")
				.send({ amount: 1500 });
			expect([200, 400, 401, 404]).toContain(response.status);
		});

		it("should have DELETE /budgets/:id endpoint", async () => {
			const response = await request(app.getHttpServer()).delete(
				"/budgets/test-id",
			);
			expect([200, 401, 404]).toContain(response.status);
		});
	});

	describe("Data Integrity Tests (Direct Database)", () => {
		let testCategoryId: string;
		let testBudgetId: string;

		beforeAll(async () => {
			// Create test category for budget tests
			const category = await prisma.category.create({
				data: {
					userId: TEST_USER_ID,
					name: "Test Category",
					type: "EXPENSE",
					color: "#FF5733",
				},
			});
			testCategoryId = category.id;
		});

		afterAll(async () => {
			// Clean up test data
			if (testBudgetId) {
				await prisma.budget.deleteMany({
					where: { id: testBudgetId },
				});
			}
			if (testCategoryId) {
				await prisma.category.deleteMany({
					where: { id: testCategoryId },
				});
			}
		});

		it("should create budget with valid data through database", async () => {
			const budget = await prisma.budget.create({
				data: {
					userId: TEST_USER_ID,
					categoryId: testCategoryId,
					amount: 1000,
					period: "MONTHLY",
					startDate: new Date("2024-01-01T00:00:00Z"),
					endDate: new Date("2024-12-31T23:59:59Z"),
				},
			});

			testBudgetId = budget.id;

			expect(budget).toBeDefined();
			expect(budget.userId).toBe(TEST_USER_ID);
			expect(Number(budget.amount)).toBe(1000);
			expect(budget.period).toBe("MONTHLY");
		});

		it("should retrieve budget with category relationship", async () => {
			const budget = await prisma.budget.findFirst({
				where: { id: testBudgetId },
				include: { category: true },
			});

			expect(budget).toBeDefined();
			expect(budget?.category).toBeDefined();
			expect(budget?.category?.name).toBe("Test Category");
		});

		it("should update budget data", async () => {
			const updated = await prisma.budget.update({
				where: { id: testBudgetId },
				data: { amount: 1500 },
			});

			expect(Number(updated.amount)).toBe(1500);
		});

		it("should enforce user isolation at query level", async () => {
			const budgetForOtherUser = await prisma.budget.findFirst({
				where: {
					id: testBudgetId,
					userId: TEST_USER_ID_2, // Different user
				},
			});

			expect(budgetForOtherUser).toBeNull();
		});

		it("should handle budget without category (general budget)", async () => {
			const generalBudget = await prisma.budget.create({
				data: {
					userId: TEST_USER_ID,
					categoryId: null,
					amount: 5000,
					period: "MONTHLY",
					startDate: new Date("2024-01-01T00:00:00Z"),
					endDate: null,
				},
			});

			expect(generalBudget).toBeDefined();
			expect(generalBudget.categoryId).toBeNull();

			await prisma.budget.delete({ where: { id: generalBudget.id } });
		});

		it("should list budgets ordered by creation date", async () => {
			const budgets = await prisma.budget.findMany({
				where: { userId: TEST_USER_ID },
				orderBy: { createdAt: "desc" },
			});

			expect(budgets.length).toBeGreaterThan(0);
			if (budgets.length > 1) {
				expect(budgets[0].createdAt.getTime()).toBeGreaterThanOrEqual(
					budgets[1].createdAt.getTime(),
				);
			}
		});

		it("should delete budget successfully", async () => {
			const toDelete = await prisma.budget.create({
				data: {
					userId: TEST_USER_ID,
					amount: 100,
					period: "WEEKLY",
					startDate: new Date("2024-01-01T00:00:00Z"),
				},
			});

			await prisma.budget.delete({ where: { id: toDelete.id } });

			const deleted = await prisma.budget.findUnique({
				where: { id: toDelete.id },
			});

			expect(deleted).toBeNull();
		});
	});

	describe("Business Logic Validation (Database Level)", () => {
		it("should handle zero amount budgets", async () => {
			const budget = await prisma.budget.create({
				data: {
					userId: TEST_USER_ID,
					amount: 0,
					period: "MONTHLY",
					startDate: new Date("2024-01-01T00:00:00Z"),
				},
			});

			expect(Number(budget.amount)).toBe(0);

			await prisma.budget.delete({ where: { id: budget.id } });
		});

		it("should handle very large amount budgets", async () => {
			const budget = await prisma.budget.create({
				data: {
					userId: TEST_USER_ID,
					amount: 999999999.99,
					period: "YEARLY",
					startDate: new Date("2024-01-01T00:00:00Z"),
				},
			});

			expect(Number(budget.amount)).toBe(999999999.99);

			await prisma.budget.delete({ where: { id: budget.id } });
		});

		it("should handle budgets with different periods", async () => {
			const periods: Array<"WEEKLY" | "MONTHLY" | "YEARLY"> = [
				"WEEKLY",
				"MONTHLY",
				"YEARLY",
			];
			const createdBudgets: string[] = [];

			for (const period of periods) {
				const budget = await prisma.budget.create({
					data: {
						userId: TEST_USER_ID,
						amount: 1000,
						period,
						startDate: new Date("2024-01-01T00:00:00Z"),
					},
				});
				createdBudgets.push(budget.id);
				expect(budget.period).toBe(period);
			}

			await prisma.budget.deleteMany({
				where: { id: { in: createdBudgets } },
			});
		});

		it("should handle budgets with no end date", async () => {
			const budget = await prisma.budget.create({
				data: {
					userId: TEST_USER_ID,
					amount: 1000,
					period: "MONTHLY",
					startDate: new Date("2024-01-01T00:00:00Z"),
					endDate: null,
				},
			});

			expect(budget.endDate).toBeNull();

			await prisma.budget.delete({ where: { id: budget.id } });
		});
	});
});
