import { Test, TestingModule } from "@nestjs/testing";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { CategoriesService } from "./categories.service";
import { PrismaService } from "../prisma.service";
import { PrismaMock, createPrismaMock } from "../test/mocks/prisma.mock";
import { TEST_USER_ID } from "../test/mocks/session.mock";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";

describe("CategoriesService", () => {
	let service: CategoriesService;
	let prisma: PrismaMock;

	beforeEach(async () => {
		prisma = createPrismaMock();

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				CategoriesService,
				{
					provide: PrismaService,
					useValue: prisma,
				},
			],
		}).compile();

		service = module.get<CategoriesService>(CategoriesService);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe("create", () => {
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

			prisma.category.create.mockResolvedValue(mockCategory);

			const result = await service.create(TEST_USER_ID, dto);

			expect(result).toEqual(mockCategory);
			expect(prisma.category.create).toHaveBeenCalledWith({
				data: {
					userId: TEST_USER_ID,
					name: dto.name,
					type: dto.type,
					color: dto.color || "#3B82F6",
				},
			});
		});

		it("should use default color if not provided", async () => {
			const dto: CreateCategoryDto = {
				name: "Transporte",
				type: "EXPENSE",
			};

			const mockCategory = {
				id: "cat-2",
				userId: TEST_USER_ID,
				...dto,
				color: "#3B82F6",
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			prisma.category.create.mockResolvedValue(mockCategory);

			await service.create(TEST_USER_ID, dto);

			expect(prisma.category.create).toHaveBeenCalledWith({
				data: {
					userId: TEST_USER_ID,
					name: dto.name,
					type: dto.type,
					color: "#3B82F6",
				},
			});
		});

		it("should throw BadRequestException if category name already exists", async () => {
			const dto: CreateCategoryDto = {
				name: "Alimentação",
				type: "EXPENSE",
			};

			prisma.category.create.mockRejectedValue({
				code: "P2002",
				message: "Unique constraint failed",
			});

			await expect(service.create(TEST_USER_ID, dto)).rejects.toThrow(
				BadRequestException,
			);
		});
	});

	describe("findAll", () => {
		it("should return all categories for a user", async () => {
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
				{
					id: "cat-2",
					userId: TEST_USER_ID,
					name: "Salário",
					type: "INCOME",
					color: "#00FF00",
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			];

			prisma.category.findMany.mockResolvedValue(mockCategories);

			const result = await service.findAll(TEST_USER_ID);

			expect(result).toEqual(mockCategories);
			expect(prisma.category.findMany).toHaveBeenCalledWith({
				where: { userId: TEST_USER_ID },
				orderBy: { createdAt: "desc" },
			});
		});

		it("should return empty array if no categories exist", async () => {
			prisma.category.findMany.mockResolvedValue([]);

			const result = await service.findAll(TEST_USER_ID);

			expect(result).toEqual([]);
		});
	});

	describe("findOne", () => {
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

			prisma.category.findFirst.mockResolvedValue(mockCategory);

			const result = await service.findOne("cat-1", TEST_USER_ID);

			expect(result).toEqual(mockCategory);
			expect(prisma.category.findFirst).toHaveBeenCalledWith({
				where: { id: "cat-1", userId: TEST_USER_ID },
			});
		});

		it("should throw NotFoundException if category not found", async () => {
			prisma.category.findFirst.mockResolvedValue(null);

			await expect(service.findOne("non-existent", TEST_USER_ID)).rejects.toThrow(
				NotFoundException,
			);
		});
	});

	describe("update", () => {
		it("should update a category", async () => {
			const dto: UpdateCategoryDto = {
				name: "Alimentação Atualizada",
				color: "#FFFF00",
			};

			const mockCategory = {
				id: "cat-1",
				userId: TEST_USER_ID,
				name: "Alimentação",
				type: "EXPENSE",
				color: "#FF5733",
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			const updatedCategory = { ...mockCategory, ...dto };

			prisma.category.findFirst.mockResolvedValue(mockCategory);
			prisma.category.update.mockResolvedValue(updatedCategory);

			const result = await service.update("cat-1", TEST_USER_ID, dto);

			expect(result).toEqual(updatedCategory);
			expect(prisma.category.update).toHaveBeenCalledWith({
				where: { id: "cat-1" },
				data: dto,
			});
		});

		it("should throw NotFoundException if category not found for update", async () => {
			prisma.category.findFirst.mockResolvedValue(null);

			await expect(
				service.update("non-existent", TEST_USER_ID, { name: "New Name" }),
			).rejects.toThrow(NotFoundException);
		});
	});

	describe("remove", () => {
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

			prisma.category.findFirst.mockResolvedValue(mockCategory);
			prisma.category.delete.mockResolvedValue(mockCategory);

			const result = await service.remove("cat-1", TEST_USER_ID);

			expect(result).toEqual(mockCategory);
			expect(prisma.category.delete).toHaveBeenCalledWith({
				where: { id: "cat-1" },
			});
		});

		it("should throw NotFoundException if category not found for deletion", async () => {
			prisma.category.findFirst.mockResolvedValue(null);

			await expect(service.remove("non-existent", TEST_USER_ID)).rejects.toThrow(
				NotFoundException,
			);
		});
	});
});
