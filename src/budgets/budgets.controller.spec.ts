import { BadRequestException, NotFoundException } from "@nestjs/common";
import { Test, type TestingModule } from "@nestjs/testing";
import { Decimal } from "@prisma/client/runtime/library";
import { createMockSession, TEST_USER_ID } from "../test/mocks/session.mock";
import { TransactionType } from "../transactions/dto/create-transaction.dto";
import { BudgetsController } from "./budgets.controller";
import { BudgetsService } from "./budgets.service";
import { BudgetPeriod, type CreateBudgetDto } from "./dto/create-budget.dto";
import type { UpdateBudgetDto } from "./dto/update-budget.dto";

describe("BudgetsController", () => {
	let controller: BudgetsController;
	let service: BudgetsService;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [BudgetsController],
			providers: [
				{
					provide: BudgetsService,
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

		controller = module.get<BudgetsController>(BudgetsController);
		service = module.get<BudgetsService>(BudgetsService);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe("POST /budgets", () => {
		it("should create a new budget", async () => {
			const dto: CreateBudgetDto = {
				categoryId: "cat-1",
				amount: 1000,
				period: BudgetPeriod.MONTHLY,
				startDate: "2024-01-01T00:00:00Z",
				endDate: "2024-12-31T23:59:59Z",
			};

			const mockBudget = {
				id: "budget-1",
				userId: TEST_USER_ID,
				categoryId: dto.categoryId as string,
				amount: new Decimal(dto.amount),
				period: dto.period,
				startDate: new Date(dto.startDate),
				endDate: dto.endDate ? new Date(dto.endDate) : null,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			jest
				.spyOn(service, "create")
				.mockResolvedValue(
					mockBudget as unknown as Awaited<ReturnType<typeof service.create>>,
				);

			const session = createMockSession();
			const result = await controller.create(session, dto);

			expect(result).toEqual(mockBudget);
			expect(service.create).toHaveBeenCalledWith(TEST_USER_ID, dto);
		});

		it("should return 400 if category not found", async () => {
			const dto: CreateBudgetDto = {
				categoryId: "non-existent",
				amount: 1000,
				period: BudgetPeriod.MONTHLY,
				startDate: "2024-01-01T00:00:00Z",
			};

			jest
				.spyOn(service, "create")
				.mockRejectedValue(new BadRequestException("Categoria não encontrada"));

			const session = createMockSession();

			await expect(controller.create(session, dto)).rejects.toThrow(
				BadRequestException,
			);
		});

		it("should return 400 if endDate is before startDate", async () => {
			const dto: CreateBudgetDto = {
				amount: 1000,
				period: BudgetPeriod.MONTHLY,
				startDate: "2024-12-31T00:00:00Z",
				endDate: "2024-01-01T00:00:00Z",
			};

			jest
				.spyOn(service, "create")
				.mockRejectedValue(
					new BadRequestException(
						"Data de término deve ser posterior à data de início",
					),
				);

			const session = createMockSession();

			await expect(controller.create(session, dto)).rejects.toThrow(
				BadRequestException,
			);
		});

		it("should create budget with zero amount", async () => {
			const dto: CreateBudgetDto = {
				amount: 0,
				period: BudgetPeriod.MONTHLY,
				startDate: "2024-01-01T00:00:00Z",
			};

			const mockBudget = {
				id: "budget-zero",
				userId: TEST_USER_ID,
				categoryId: null,
				amount: new Decimal(0),
				period: dto.period,
				startDate: new Date(dto.startDate),
				endDate: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			jest
				.spyOn(service, "create")
				.mockResolvedValue(
					mockBudget as unknown as Awaited<ReturnType<typeof service.create>>,
				);

			const session = createMockSession();
			const result = await controller.create(session, dto);

			expect(result).toEqual(mockBudget);
			expect(service.create).toHaveBeenCalledWith(TEST_USER_ID, dto);
		});

		it("should create budget with very large amount", async () => {
			const dto: CreateBudgetDto = {
				amount: 999999999.99,
				period: BudgetPeriod.YEARLY,
				startDate: "2024-01-01T00:00:00Z",
			};

			const mockBudget = {
				id: "budget-large",
				userId: TEST_USER_ID,
				categoryId: null,
				amount: new Decimal(999999999.99),
				period: dto.period,
				startDate: new Date(dto.startDate),
				endDate: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			jest
				.spyOn(service, "create")
				.mockResolvedValue(
					mockBudget as unknown as Awaited<ReturnType<typeof service.create>>,
				);

			const session = createMockSession();
			const result = await controller.create(session, dto);

			expect(result).toEqual(mockBudget);
			expect(service.create).toHaveBeenCalledWith(TEST_USER_ID, dto);
		});
	});

	describe("GET /budgets", () => {
		it("should return all budgets for user", async () => {
			const mockBudgets = [
				{
					id: "budget-1",
					userId: TEST_USER_ID,
					categoryId: "cat-1",
					amount: new Decimal(1000),
					period: BudgetPeriod.MONTHLY,
					startDate: new Date("2024-01-01"),
					endDate: new Date("2024-12-31"),
					createdAt: new Date(),
					updatedAt: new Date(),
					category: {
						id: "cat-1",
						userId: TEST_USER_ID,
						name: "Alimentação",
						type: TransactionType.EXPENSE,
						color: "#FF5733",
						createdAt: new Date(),
						updatedAt: new Date(),
					},
				},
			];

			jest
				.spyOn(service, "findAll")
				.mockResolvedValue(
					mockBudgets as unknown as Awaited<ReturnType<typeof service.findAll>>,
				);

			const session = createMockSession();
			const result = await controller.findAll(session);

			expect(result).toEqual(mockBudgets);
			expect(service.findAll).toHaveBeenCalledWith(TEST_USER_ID);
		});

		it("should return empty array if no budgets exist", async () => {
			jest.spyOn(service, "findAll").mockResolvedValue([]);

			const session = createMockSession();
			const result = await controller.findAll(session);

			expect(result).toEqual([]);
			expect(service.findAll).toHaveBeenCalledWith(TEST_USER_ID);
		});
	});

	describe("GET /budgets/:id", () => {
		it("should return a budget by id", async () => {
			const mockBudget = {
				id: "budget-1",
				userId: TEST_USER_ID,
				categoryId: "cat-1",
				amount: new Decimal(1000),
				period: BudgetPeriod.MONTHLY,
				startDate: new Date("2024-01-01"),
				endDate: new Date("2024-12-31"),
				createdAt: new Date(),
				updatedAt: new Date(),
				category: {
					id: "cat-1",
					userId: TEST_USER_ID,
					name: "Alimentação",
					type: TransactionType.EXPENSE,
					color: "#FF5733",
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			};

			jest
				.spyOn(service, "findOne")
				.mockResolvedValue(
					mockBudget as unknown as Awaited<ReturnType<typeof service.findOne>>,
				);

			const session = createMockSession();
			const result = await controller.findOne("budget-1", session);

			expect(result).toEqual(mockBudget);
			expect(service.findOne).toHaveBeenCalledWith("budget-1", TEST_USER_ID);
		});

		it("should return 404 if budget not found", async () => {
			jest
				.spyOn(service, "findOne")
				.mockRejectedValue(new NotFoundException("Orçamento não encontrado"));

			const session = createMockSession();

			await expect(controller.findOne("non-existent", session)).rejects.toThrow(
				NotFoundException,
			);
		});
	});

	describe("PUT /budgets/:id", () => {
		it("should update a budget", async () => {
			const dto: UpdateBudgetDto = {
				amount: 1500,
				period: BudgetPeriod.WEEKLY,
			};

			const mockBudget = {
				id: "budget-1",
				userId: TEST_USER_ID,
				categoryId: "cat-1",
				amount: new Decimal(1500),
				period: BudgetPeriod.WEEKLY,
				startDate: new Date("2024-01-01"),
				endDate: new Date("2024-12-31"),
				createdAt: new Date(),
				updatedAt: new Date(),
				category: {
					id: "cat-1",
					userId: TEST_USER_ID,
					name: "Alimentação",
					type: TransactionType.EXPENSE,
					color: "#FF5733",
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			};

			jest
				.spyOn(service, "update")
				.mockResolvedValue(
					mockBudget as unknown as Awaited<ReturnType<typeof service.update>>,
				);

			const session = createMockSession();
			const result = await controller.update("budget-1", session, dto);

			expect(result).toEqual(mockBudget);
			expect(service.update).toHaveBeenCalledWith(
				"budget-1",
				TEST_USER_ID,
				dto,
			);
		});

		it("should return 404 if budget not found", async () => {
			const dto: UpdateBudgetDto = {
				amount: 1500,
			};

			jest
				.spyOn(service, "update")
				.mockRejectedValue(new NotFoundException("Orçamento não encontrado"));

			const session = createMockSession();

			await expect(
				controller.update("non-existent", session, dto),
			).rejects.toThrow(NotFoundException);
		});

		it("should return 400 if category not found when updating category", async () => {
			const dto: UpdateBudgetDto = {
				categoryId: "non-existent",
			};

			jest
				.spyOn(service, "update")
				.mockRejectedValue(new BadRequestException("Categoria não encontrada"));

			const session = createMockSession();

			await expect(controller.update("budget-1", session, dto)).rejects.toThrow(
				BadRequestException,
			);
		});

		it("should return 400 if updating dates with invalid range", async () => {
			const dto: UpdateBudgetDto = {
				startDate: "2024-12-31T00:00:00Z",
				endDate: "2024-01-01T00:00:00Z",
			};

			jest
				.spyOn(service, "update")
				.mockRejectedValue(
					new BadRequestException(
						"Data de término deve ser posterior à data de início",
					),
				);

			const session = createMockSession();

			await expect(controller.update("budget-1", session, dto)).rejects.toThrow(
				BadRequestException,
			);
		});

		it("should update budget with zero amount", async () => {
			const dto: UpdateBudgetDto = {
				amount: 0,
			};

			const mockBudget = {
				id: "budget-1",
				userId: TEST_USER_ID,
				categoryId: "cat-1",
				amount: new Decimal(0),
				period: BudgetPeriod.MONTHLY,
				startDate: new Date("2024-01-01"),
				endDate: new Date("2024-12-31"),
				createdAt: new Date(),
				updatedAt: new Date(),
				category: {
					id: "cat-1",
					userId: TEST_USER_ID,
					name: "Alimentação",
					type: TransactionType.EXPENSE,
					color: "#FF5733",
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			};

			jest
				.spyOn(service, "update")
				.mockResolvedValue(
					mockBudget as unknown as Awaited<ReturnType<typeof service.update>>,
				);

			const session = createMockSession();
			const result = await controller.update("budget-1", session, dto);

			expect(result).toEqual(mockBudget);
			expect(service.update).toHaveBeenCalledWith(
				"budget-1",
				TEST_USER_ID,
				dto,
			);
		});
	});

	describe("DELETE /budgets/:id", () => {
		it("should delete a budget", async () => {
			const mockBudget = {
				id: "budget-1",
				userId: TEST_USER_ID,
				categoryId: "cat-1",
				amount: new Decimal(1000),
				period: BudgetPeriod.MONTHLY,
				startDate: new Date("2024-01-01"),
				endDate: new Date("2024-12-31"),
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			jest
				.spyOn(service, "remove")
				.mockResolvedValue(
					mockBudget as unknown as Awaited<ReturnType<typeof service.remove>>,
				);

			const session = createMockSession();
			const result = await controller.remove("budget-1", session);

			expect(result).toEqual(mockBudget);
			expect(service.remove).toHaveBeenCalledWith("budget-1", TEST_USER_ID);
		});

		it("should return 404 if budget not found", async () => {
			jest
				.spyOn(service, "remove")
				.mockRejectedValue(new NotFoundException("Orçamento não encontrado"));

			const session = createMockSession();

			await expect(controller.remove("non-existent", session)).rejects.toThrow(
				NotFoundException,
			);
		});
	});
});
