import type { INestApplication } from "@nestjs/common";
import { Test, type TestingModule } from "@nestjs/testing";
import request from "supertest";
import type { App } from "supertest/types";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma.service";

describe("Categories (e2e)", () => {
	let app: INestApplication<App>;
	let prisma: PrismaService;

	const TEST_USER_ID = "test-user-e2e";
	const TEST_CATEGORY = {
		name: "Alimentação",
		type: "EXPENSE" as const,
		color: "#FF5733",
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
		await prisma.category.deleteMany({
			where: { userId: TEST_USER_ID },
		});
		await app.close();
	});

	describe("GET /categories - Protected Route", () => {
		it("should require authentication", () => {
			return request(app.getHttpServer()).get("/categories").expect(401);
		});
	});

	describe("POST /categories - Create Category", () => {
		it("should require authentication", () => {
			return request(app.getHttpServer())
				.post("/categories")
				.send(TEST_CATEGORY)
				.expect(401);
		});
	});

	describe("GET /public - Public Route", () => {
		it("should allow anonymous access", () => {
			return request(app.getHttpServer()).get("/public").expect(200);
		});
	});
});
