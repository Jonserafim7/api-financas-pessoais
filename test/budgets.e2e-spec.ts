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
	});

	afterAll(async () => {
		// Cleanup test data
		await prisma.budget.deleteMany({
			where: { userId: TEST_USER_ID },
		});
		await app.close();
	});

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

