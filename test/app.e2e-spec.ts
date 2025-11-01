import type { INestApplication } from "@nestjs/common";
import { Test, type TestingModule } from "@nestjs/testing";
import request from "supertest";
import type { App } from "supertest/types";
import { AppModule } from "./../src/app.module";

describe("AppController (e2e)", () => {
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

	it("/public (GET) - anonymous access", () => {
		return request(app.getHttpServer())
			.get("/public")
			.expect(200)
			.expect("Hello World!");
	});

	it("/private (GET) - requires authentication", () => {
		return request(app.getHttpServer()).get("/private").expect(401);
	});
});
