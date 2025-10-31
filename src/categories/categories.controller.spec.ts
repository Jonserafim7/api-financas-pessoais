import { Test, type TestingModule } from "@nestjs/testing";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { CategoriesController } from "./categories.controller";
import { CategoriesService } from "./categories.service";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";
import { createMockSession, TEST_USER_ID } from "../test/mocks/session.mock";

describe("CategoriesController", () => {
	let controller: CategoriesController;
	let service: CategoriesService;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [CategoriesController],
			providers: [
				{
					provide: CategoriesService,
					useValue: {
						create: jest.fn(),
						findAll: jest.fn(),
						findOne: jest.fn(),
						update: jest.fn(),
						remove: jest.fn(),
					},
				},
			],
		}).compile();

		controller = module.get<CategoriesController>(CategoriesController);
		service = module.get<CategoriesService>(CategoriesService);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe("POST /categories", () => {
		it("should create a new category", async () => {
			const dto: CreateCategoryDto = {
				name: "Alimentação",
				type: "EXPENSE",
				color: "#FF5733",
			};

			const mockCategory = {
				id: "cat-1",
				userId: TEST_USER_ID,
				...dto,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			jest.spyOn(service, "create").mockResolvedValue(mockCategory);

			const session = createMockSession();
			const result = await controller.create(session, dto);

			expect(result).toEqual(mockCategory);
			expect(service.create).toHaveBeenCalledWith(TEST_USER_ID, dto);
		});

		it("should return 400 if category name already exists", async () => {
			const dto: CreateCategoryDto = {
				name: "Alimentação",
				type: "EXPENSE",
			};

			jest
				.spyOn(service, "create")
				.mockRejectedValue(
					new BadRequestException(
						"Categoria com este nome já existe para este usuário",
					),
				);

			const session = createMockSession();

			await expect(controller.create(session, dto)).rejects.toThrow(
				BadRequestException,
			);
		});
	});

	describe("GET /categories", () => {
		it("should return all categories for user", async () => {
			const mockCategories = [
				{
					id: "cat-1",
					userId: TEST_USER_ID,
					name: "Alimentação",
					type: "EXPENSE",
					color: "#FF5733",
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			];

			jest.spyOn(service, "findAll").mockResolvedValue(mockCategories);

			const session = createMockSession();
			const result = await controller.findAll(session);

			expect(result).toEqual(mockCategories);
			expect(service.findAll).toHaveBeenCalledWith(TEST_USER_ID);
		});
	});

	describe("GET /categories/:id", () => {
		it("should return a category by id", async () => {
			const mockCategory = {
				id: "cat-1",
				userId: TEST_USER_ID,
				name: "Alimentação",
				type: "EXPENSE",
				color: "#FF5733",
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			jest.spyOn(service, "findOne").mockResolvedValue(mockCategory);

			const session = createMockSession();
			const result = await controller.findOne("cat-1", session);

			expect(result).toEqual(mockCategory);
			expect(service.findOne).toHaveBeenCalledWith("cat-1", TEST_USER_ID);
		});

		it("should return 404 if category not found", async () => {
			jest
				.spyOn(service, "findOne")
				.mockRejectedValue(new NotFoundException("Categoria não encontrada"));

			const session = createMockSession();

			await expect(controller.findOne("non-existent", session)).rejects.toThrow(
				NotFoundException,
			);
		});
	});

	describe("PUT /categories/:id", () => {
		it("should update a category", async () => {
			const dto: UpdateCategoryDto = {
				name: "Alimentação Atualizada",
			};

			const mockCategory = {
				id: "cat-1",
				userId: TEST_USER_ID,
				name: "Alimentação Atualizada",
				type: "EXPENSE",
				color: "#FF5733",
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			jest.spyOn(service, "update").mockResolvedValue(mockCategory);

			const session = createMockSession();
			const result = await controller.update("cat-1", session, dto);

			expect(result).toEqual(mockCategory);
			expect(service.update).toHaveBeenCalledWith("cat-1", TEST_USER_ID, dto);
		});
	});

	describe("DELETE /categories/:id", () => {
		it("should delete a category", async () => {
			const mockCategory = {
				id: "cat-1",
				userId: TEST_USER_ID,
				name: "Alimentação",
				type: "EXPENSE",
				color: "#FF5733",
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			jest.spyOn(service, "remove").mockResolvedValue(mockCategory);

			const session = createMockSession();
			const result = await controller.remove("cat-1", session);

			expect(result).toEqual(mockCategory);
			expect(service.remove).toHaveBeenCalledWith("cat-1", TEST_USER_ID);
		});
	});
});
