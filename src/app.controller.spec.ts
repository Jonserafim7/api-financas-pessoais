import { Test, type TestingModule } from "@nestjs/testing";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";

describe("AppController", () => {
	let appController: AppController;

	beforeEach(async () => {
		const app: TestingModule = await Test.createTestingModule({
			controllers: [AppController],
			providers: [AppService],
		}).compile();

		appController = app.get<AppController>(AppController);
	});

	describe("getHelloPublic", () => {
		it('should return "Hello World!"', () => {
			expect(appController.getHelloPublic()).toBe("Hello World!");
		});
	});

	describe("getHelloPrivate", () => {
		it('should return "Hello World!"', () => {
			expect(appController.getHelloPrivate()).toBe("Hello World!");
		});
	});
});
