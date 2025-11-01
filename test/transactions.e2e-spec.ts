import type { INestApplication } from "@nestjs/common";
import { Test, type TestingModule } from "@nestjs/testing";
import request from "supertest";
import type { App } from "supertest/types";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma.service";

describe("Transactions (e2e)", () => {
	let app: INestApplication<App>;
	let prisma: PrismaService;

	const TEST_USER_ID = "test-user-e2e-transactions";
	const TEST_TRANSACTION = {
		categoryId: "test-category-id",
		amount: 150.5,
		description: "Test transaction",
		date: "2024-10-31T20:00:00Z",
		type: "EXPENSE",
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
		await prisma.transaction.deleteMany({
			where: { userId: TEST_USER_ID },
		});
		await app.close();
	});

	describe("GET /transactions - List Transactions", () => {
		it("should require authentication", () => {
			return request(app.getHttpServer()).get("/transactions").expect(401);
		});

		it("should require authentication with filters", () => {
			return request(app.getHttpServer())
				.get("/transactions")
				.query({
					dateFrom: "2024-10-01T00:00:00Z",
					dateTo: "2024-10-31T23:59:59Z",
					type: "EXPENSE",
				})
				.expect(401);
		});
	});

	describe("POST /transactions - Create Transaction", () => {
		it("should require authentication", () => {
			return request(app.getHttpServer())
				.post("/transactions")
				.send(TEST_TRANSACTION)
				.expect(401);
		});
	});

	describe("GET /transactions/:id - Get Single Transaction", () => {
		it("should require authentication", () => {
			return request(app.getHttpServer())
				.get("/transactions/test-transaction-id")
				.expect(401);
		});
	});

	describe("PUT /transactions/:id - Update Transaction", () => {
		it("should require authentication", () => {
			return request(app.getHttpServer())
				.put("/transactions/test-transaction-id")
				.send({ amount: 200 })
				.expect(401);
		});
	});

	describe("DELETE /transactions/:id - Delete Transaction", () => {
		it("should require authentication", () => {
			return request(app.getHttpServer())
				.delete("/transactions/test-transaction-id")
				.expect(401);
		});
	});
});
