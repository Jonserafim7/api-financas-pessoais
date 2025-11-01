import type { INestApplication } from "@nestjs/common";
import { Test, type TestingModule } from "@nestjs/testing";
import request from "supertest";
import type { App } from "supertest/types";
import { AppModule } from "../src/app.module";

describe("Reports (e2e)", () => {
	let app: INestApplication<App>;

	beforeAll(async () => {
		const moduleFixture: TestingModule = await Test.createTestingModule({
			imports: [AppModule],
		}).compile();

		app = moduleFixture.createNestApplication();
		await app.init();
	});

	afterAll(async () => {
		await app.close();
	});

	describe("GET /reports/summary - Get Financial Summary", () => {
		it("should require authentication", () => {
			return request(app.getHttpServer()).get("/reports/summary").expect(401);
		});

		it("should require authentication with date filters", () => {
			return request(app.getHttpServer())
				.get("/reports/summary")
				.query({
					dateFrom: "2024-10-01T00:00:00Z",
					dateTo: "2024-10-31T23:59:59Z",
				})
				.expect(401);
		});
	});

	describe("GET /reports/by-category - Get Spending by Category", () => {
		it("should require authentication", () => {
			return request(app.getHttpServer())
				.get("/reports/by-category")
				.expect(401);
		});

		it("should require authentication with date filters", () => {
			return request(app.getHttpServer())
				.get("/reports/by-category")
				.query({
					dateFrom: "2024-10-01T00:00:00Z",
					dateTo: "2024-10-31T23:59:59Z",
				})
				.expect(401);
		});
	});

	describe("GET /reports/budget-status - Get Budget Status", () => {
		it("should require authentication", () => {
			return request(app.getHttpServer())
				.get("/reports/budget-status")
				.expect(401);
		});

		it("should require authentication with date filters", () => {
			return request(app.getHttpServer())
				.get("/reports/budget-status")
				.query({
					dateFrom: "2024-10-01T00:00:00Z",
					dateTo: "2024-10-31T23:59:59Z",
				})
				.expect(401);
		});
	});

	describe("GET /reports/trends - Get Monthly Trends", () => {
		it("should require authentication", () => {
			return request(app.getHttpServer()).get("/reports/trends").expect(401);
		});

		it("should require authentication with months parameter", () => {
			return request(app.getHttpServer())
				.get("/reports/trends")
				.query({ months: "12" })
				.expect(401);
		});
	});
});
