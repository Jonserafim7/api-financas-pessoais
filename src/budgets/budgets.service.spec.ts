import { BadRequestException, NotFoundException } from "@nestjs/common";
import { Test, type TestingModule } from "@nestjs/testing";
import { PrismaService } from "../prisma.service";
import { createPrismaMock, type PrismaMock } from "../test/mocks/prisma.mock";
import { TEST_USER_ID } from "../test/mocks/session.mock";
import { BudgetsService } from "./budgets.service";
import {
	BudgetPeriod,
	type CreateBudgetDto,
} from "./dto/create-budget.dto";
import type { UpdateBudgetDto } from "./dto/update-budget.dto";

describe("BudgetsService", () => {
	let service: BudgetsService;
	let prisma: PrismaMock;

	beforeEach(async () => {
		prisma = createPrismaMock();

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				BudgetsService,
				{
					provide: PrismaService,
					useValue: prisma,
				},
			],
		}).compile();

		service = module.get<BudgetsService>(BudgetsService);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe("create", () => {
		it("should create a new budget with category", async () => {
			const dto: CreateBudgetDto = {
				categoryId: "cat-1",
				amount: 1000,
				period: BudgetPeriod.MONTHLY,
				startDate: "2024-01-01T00:00:00Z",
				endDate: "2024-12-31T23:59:59Z",
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

			const mockBudget = {
				id: "budget-1",
				userId: TEST_USER_ID,
				categoryId: dto.categoryId,
				amount: dto.amount,
				period: dto.period,
				startDate: new Date(dto.startDate),
				endDate: new Date(dto.endDate),
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			prisma.category.findFirst.mockResolvedValue(mockCategory);
			prisma.budget.create.mockResolvedValue(mockBudget);

			const result = await service.create(TEST_USER_ID, dto);

			expect(result).toEqual(mockBudget);
			expect(prisma.category.findFirst).toHaveBeenCalledWith({
				where: {
					id: dto.categoryId,
					userId: TEST_USER_ID,
				},
			});
			expect(prisma.budget.create).toHaveBeenCalledWith({
				data: {
					userId: TEST_USER_ID,
					categoryId: dto.categoryId,
					amount: dto.amount,
					period: dto.period,
					startDate: new Date(dto.startDate),
					endDate: new Date(dto.endDate),
				},
			});
		});

		it("should create a general budget without category", async () => {
			const dto: CreateBudgetDto = {
				amount: 5000,
				period: BudgetPeriod.MONTHLY,
				startDate: "2024-01-01T00:00:00Z",
			};

			const mockBudget = {
				id: "budget-2",
				userId: TEST_USER_ID,
				categoryId: null,
				amount: dto.amount,
				period: dto.period,
				startDate: new Date(dto.startDate),
				endDate: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			prisma.budget.create.mockResolvedValue(mockBudget);

			const result = await service.create(TEST_USER_ID, dto);

			expect(result).toEqual(mockBudget);
			expect(prisma.category.findFirst).not.toHaveBeenCalled();
			expect(prisma.budget.create).toHaveBeenCalledWith({
				data: {
					userId: TEST_USER_ID,
					categoryId: undefined,
					amount: dto.amount,
					period: dto.period,
					startDate: new Date(dto.startDate),
					endDate: null,
				},
			});
		});

		it("should throw BadRequestException if category not found", async () => {
			const dto: CreateBudgetDto = {
				categoryId: "non-existent",
				amount: 1000,
				period: BudgetPeriod.MONTHLY,
				startDate: "2024-01-01T00:00:00Z",
			};

			prisma.category.findFirst.mockResolvedValue(null);

			await expect(service.create(TEST_USER_ID, dto)).rejects.toThrow(
				BadRequestException,
			);
			expect(prisma.category.findFirst).toHaveBeenCalledWith({
				where: {
					id: dto.categoryId,
					userId: TEST_USER_ID,
				},
			});
			expect(prisma.budget.create).not.toHaveBeenCalled();
		});

		it("should throw BadRequestException if endDate is before startDate", async () => {
			const dto: CreateBudgetDto = {
				amount: 1000,
				period: BudgetPeriod.MONTHLY,
				startDate: "2024-12-31T00:00:00Z",
				endDate: "2024-01-01T00:00:00Z",
			};

			await expect(service.create(TEST_USER_ID, dto)).rejects.toThrow(
				BadRequestException,
			);
			expect(prisma.budget.create).not.toHaveBeenCalled();
		});

		it("should throw BadRequestException if endDate equals startDate", async () => {
			const dto: CreateBudgetDto = {
				amount: 1000,
				period: BudgetPeriod.MONTHLY,
				startDate: "2024-01-01T00:00:00Z",
				endDate: "2024-01-01T00:00:00Z",
			};

			await expect(service.create(TEST_USER_ID, dto)).rejects.toThrow(
				BadRequestException,
			);
			expect(prisma.budget.create).not.toHaveBeenCalled();
		});
	});

	describe("findAll", () => {
		it("should return all budgets for a user with categories", async () => {
			const mockBudgets = [
				{
					id: "budget-1",
					userId: TEST_USER_ID,
					categoryId: "cat-1",
					amount: 1000,
					period: BudgetPeriod.MONTHLY,
					startDate: new Date("2024-01-01"),
					endDate: new Date("2024-12-31"),
					createdAt: new Date(),
					updatedAt: new Date(),
					category: {
						id: "cat-1",
						userId: TEST_USER_ID,
						name: "Alimentação",
						type: "EXPENSE",
						color: "#FF5733",
						createdAt: new Date(),
						updatedAt: new Date(),
					},
				},
				{
					id: "budget-2",
					userId: TEST_USER_ID,
					categoryId: null,
					amount: 5000,
					period: BudgetPeriod.MONTHLY,
					startDate: new Date("2024-01-01"),
					endDate: null,
					createdAt: new Date(),
					updatedAt: new Date(),
					category: null,
				},
			];

			prisma.budget.findMany.mockResolvedValue(mockBudgets);

			const result = await service.findAll(TEST_USER_ID);

			expect(result).toEqual(mockBudgets);
			expect(prisma.budget.findMany).toHaveBeenCalledWith({
				where: { userId: TEST_USER_ID },
				orderBy: { createdAt: "desc" },
				include: { category: true },
			});
		});

		it("should return empty array if no budgets exist", async () => {
			prisma.budget.findMany.mockResolvedValue([]);

			const result = await service.findAll(TEST_USER_ID);

			expect(result).toEqual([]);
		});
	});

	describe("findOne", () => {
		it("should return a budget by id with category", async () => {
			const mockBudget = {
				id: "budget-1",
				userId: TEST_USER_ID,
				categoryId: "cat-1",
				amount: 1000,
				period: BudgetPeriod.MONTHLY,
				startDate: new Date("2024-01-01"),
				endDate: new Date("2024-12-31"),
				createdAt: new Date(),
				updatedAt: new Date(),
				category: {
					id: "cat-1",
					userId: TEST_USER_ID,
					name: "Alimentação",
					type: "EXPENSE",
					color: "#FF5733",
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			};

			prisma.budget.findFirst.mockResolvedValue(mockBudget);

			const result = await service.findOne("budget-1", TEST_USER_ID);

			expect(result).toEqual(mockBudget);
			expect(prisma.budget.findFirst).toHaveBeenCalledWith({
				where: { id: "budget-1", userId: TEST_USER_ID },
				include: { category: true },
			});
		});

		it("should throw NotFoundException if budget not found", async () => {
			prisma.budget.findFirst.mockResolvedValue(null);

			await expect(
				service.findOne("non-existent", TEST_USER_ID),
			).rejects.toThrow(NotFoundException);
		});
	});

	describe("update", () => {
		it("should update a budget", async () => {
			const dto: UpdateBudgetDto = {
				amount: 1500,
				period: BudgetPeriod.WEEKLY,
			};

			const mockBudget = {
				id: "budget-1",
				userId: TEST_USER_ID,
				categoryId: "cat-1",
				amount: 1000,
				period: BudgetPeriod.MONTHLY,
				startDate: new Date("2024-01-01"),
				endDate: new Date("2024-12-31"),
				createdAt: new Date(),
				updatedAt: new Date(),
				category: {
					id: "cat-1",
					userId: TEST_USER_ID,
					name: "Alimentação",
					type: "EXPENSE",
					color: "#FF5733",
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			};

			const updatedBudget = { ...mockBudget, ...dto };

			prisma.budget.findFirst.mockResolvedValue(mockBudget);
			prisma.budget.update.mockResolvedValue(updatedBudget);

			const result = await service.update("budget-1", TEST_USER_ID, dto);

			expect(result).toEqual(updatedBudget);
			expect(prisma.budget.update).toHaveBeenCalledWith({
				where: { id: "budget-1" },
				data: dto,
				include: { category: true },
			});
		});

		it("should update budget with new category", async () => {
			const dto: UpdateBudgetDto = {
				categoryId: "cat-2",
			};

			const mockBudget = {
				id: "budget-1",
				userId: TEST_USER_ID,
				categoryId: "cat-1",
				amount: 1000,
				period: BudgetPeriod.MONTHLY,
				startDate: new Date("2024-01-01"),
				endDate: new Date("2024-12-31"),
				createdAt: new Date(),
				updatedAt: new Date(),
				category: {
					id: "cat-1",
					userId: TEST_USER_ID,
					name: "Alimentação",
					type: "EXPENSE",
					color: "#FF5733",
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			};

			const newCategory = {
				id: "cat-2",
				userId: TEST_USER_ID,
				name: "Transporte",
				type: "EXPENSE",
				color: "#00FF00",
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			prisma.budget.findFirst.mockResolvedValue(mockBudget);
			prisma.category.findFirst.mockResolvedValue(newCategory);
			prisma.budget.update.mockResolvedValue({ ...mockBudget, ...dto });

			await service.update("budget-1", TEST_USER_ID, dto);

			expect(prisma.category.findFirst).toHaveBeenCalledWith({
				where: {
					id: dto.categoryId,
					userId: TEST_USER_ID,
				},
			});
		});

		it("should throw BadRequestException if new category not found", async () => {
			const dto: UpdateBudgetDto = {
				categoryId: "non-existent",
			};

			const mockBudget = {
				id: "budget-1",
				userId: TEST_USER_ID,
				categoryId: "cat-1",
				amount: 1000,
				period: BudgetPeriod.MONTHLY,
				startDate: new Date("2024-01-01"),
				endDate: new Date("2024-12-31"),
				createdAt: new Date(),
				updatedAt: new Date(),
				category: null,
			};

			prisma.budget.findFirst.mockResolvedValue(mockBudget);
			prisma.category.findFirst.mockResolvedValue(null);

			await expect(
				service.update("budget-1", TEST_USER_ID, dto),
			).rejects.toThrow(BadRequestException);
			expect(prisma.budget.update).not.toHaveBeenCalled();
		});

		it("should throw BadRequestException if new endDate is before startDate", async () => {
			const dto: UpdateBudgetDto = {
				startDate: "2024-12-31T00:00:00Z",
				endDate: "2024-01-01T00:00:00Z",
			};

			const mockBudget = {
				id: "budget-1",
				userId: TEST_USER_ID,
				categoryId: "cat-1",
				amount: 1000,
				period: BudgetPeriod.MONTHLY,
				startDate: new Date("2024-01-01"),
				endDate: new Date("2024-12-31"),
				createdAt: new Date(),
				updatedAt: new Date(),
				category: null,
			};

			prisma.budget.findFirst.mockResolvedValue(mockBudget);

			await expect(
				service.update("budget-1", TEST_USER_ID, dto),
			).rejects.toThrow(BadRequestException);
			expect(prisma.budget.update).not.toHaveBeenCalled();
		});

		it("should throw BadRequestException if new endDate is before existing startDate", async () => {
			const dto: UpdateBudgetDto = {
				endDate: "2023-12-31T00:00:00Z",
			};

			const mockBudget = {
				id: "budget-1",
				userId: TEST_USER_ID,
				categoryId: "cat-1",
				amount: 1000,
				period: BudgetPeriod.MONTHLY,
				startDate: new Date("2024-01-01"),
				endDate: new Date("2024-12-31"),
				createdAt: new Date(),
				updatedAt: new Date(),
				category: null,
			};

			prisma.budget.findFirst.mockResolvedValue(mockBudget);
			prisma.budget.findUnique.mockResolvedValue(mockBudget);

			await expect(
				service.update("budget-1", TEST_USER_ID, dto),
			).rejects.toThrow(BadRequestException);
			expect(prisma.budget.update).not.toHaveBeenCalled();
		});

		it("should throw NotFoundException if budget not found for update", async () => {
			prisma.budget.findFirst.mockResolvedValue(null);

			await expect(
				service.update("non-existent", TEST_USER_ID, { amount: 1500 }),
			).rejects.toThrow(NotFoundException);
			expect(prisma.budget.update).not.toHaveBeenCalled();
		});
	});

	describe("remove", () => {
		it("should delete a budget", async () => {
			const mockBudget = {
				id: "budget-1",
				userId: TEST_USER_ID,
				categoryId: "cat-1",
				amount: 1000,
				period: BudgetPeriod.MONTHLY,
				startDate: new Date("2024-01-01"),
				endDate: new Date("2024-12-31"),
				createdAt: new Date(),
				updatedAt: new Date(),
				category: null,
			};

			prisma.budget.findFirst.mockResolvedValue(mockBudget);
			prisma.budget.delete.mockResolvedValue(mockBudget);

			const result = await service.remove("budget-1", TEST_USER_ID);

			expect(result).toEqual(mockBudget);
			expect(prisma.budget.delete).toHaveBeenCalledWith({
				where: { id: "budget-1" },
			});
		});

		it("should throw NotFoundException if budget not found for deletion", async () => {
			prisma.budget.findFirst.mockResolvedValue(null);

			await expect(
				service.remove("non-existent", TEST_USER_ID),
			).rejects.toThrow(NotFoundException);
			expect(prisma.budget.delete).not.toHaveBeenCalled();
		});
	});
});

