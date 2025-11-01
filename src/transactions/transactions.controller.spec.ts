import { BadRequestException, NotFoundException } from "@nestjs/common";
import { Test, type TestingModule } from "@nestjs/testing";
import { Decimal } from "@prisma/client/runtime/library";
import { createMockSession, TEST_USER_ID } from "../test/mocks/session.mock";
import {
	type CreateTransactionDto,
	TransactionType,
} from "./dto/create-transaction.dto";
import type { FilterTransactionDto } from "./dto/filter-transaction.dto";
import type { UpdateTransactionDto } from "./dto/update-transaction.dto";
import { TransactionsController } from "./transactions.controller";
import { TransactionsService } from "./transactions.service";

describe("TransactionsController", () => {
	let controller: TransactionsController;
	let service: TransactionsService;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [TransactionsController],
			providers: [
				{
					provide: TransactionsService,
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

		controller = module.get<TransactionsController>(TransactionsController);
		service = module.get<TransactionsService>(TransactionsService);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe("POST /transactions", () => {
		it("should create a new transaction", async () => {
			const dto: CreateTransactionDto = {
				categoryId: "cat-1",
				amount: 150.5,
				description: "Compra de supermercado",
				date: "2024-10-31T20:00:00Z",
				type: TransactionType.EXPENSE,
			};

			const mockTransaction = {
				id: "trans-1",
				userId: TEST_USER_ID,
				categoryId: dto.categoryId,
				amount: new Decimal(dto.amount),
				description: dto.description ?? null,
				date: new Date(dto.date),
				type: dto.type,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			jest
				.spyOn(service, "create")
				.mockResolvedValue(
					mockTransaction as unknown as Awaited<
						ReturnType<typeof service.create>
					>,
				);

			const session = createMockSession();
			const result = await controller.create(session, dto);

			expect(result).toEqual(mockTransaction);
			expect(service.create).toHaveBeenCalledWith(TEST_USER_ID, dto);
		});

		it("should return 400 if category not found", async () => {
			const dto: CreateTransactionDto = {
				categoryId: "non-existent",
				amount: 100,
				date: "2024-10-31T20:00:00Z",
				type: TransactionType.EXPENSE,
			};

			jest
				.spyOn(service, "create")
				.mockRejectedValue(new BadRequestException("Categoria não encontrada"));

			const session = createMockSession();

			await expect(controller.create(session, dto)).rejects.toThrow(
				BadRequestException,
			);
		});
	});

	describe("GET /transactions", () => {
		it("should return all transactions for user", async () => {
			const mockTransactions = [
				{
					id: "trans-1",
					userId: TEST_USER_ID,
					categoryId: "cat-1",
					amount: new Decimal(150.5),
					description: "Compra de supermercado",
					date: new Date("2024-10-31"),
					type: TransactionType.EXPENSE,
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
					mockTransactions as unknown as Awaited<
						ReturnType<typeof service.findAll>
					>,
				);

			const session = createMockSession();
			const filters: FilterTransactionDto = {};
			const result = await controller.findAll(session, filters);

			expect(result).toEqual(mockTransactions);
			expect(service.findAll).toHaveBeenCalledWith(TEST_USER_ID, filters);
		});

		it("should return transactions filtered by dateFrom", async () => {
			const filters: FilterTransactionDto = {
				dateFrom: "2024-10-01T00:00:00Z",
			};

			jest.spyOn(service, "findAll").mockResolvedValue([]);

			const session = createMockSession();
			await controller.findAll(session, filters);

			expect(service.findAll).toHaveBeenCalledWith(TEST_USER_ID, filters);
		});

		it("should return transactions filtered by dateTo", async () => {
			const filters: FilterTransactionDto = {
				dateTo: "2024-10-31T23:59:59Z",
			};

			jest.spyOn(service, "findAll").mockResolvedValue([]);

			const session = createMockSession();
			await controller.findAll(session, filters);

			expect(service.findAll).toHaveBeenCalledWith(TEST_USER_ID, filters);
		});

		it("should return transactions filtered by categoryId", async () => {
			const filters: FilterTransactionDto = {
				categoryId: "cat-1",
			};

			jest.spyOn(service, "findAll").mockResolvedValue([]);

			const session = createMockSession();
			await controller.findAll(session, filters);

			expect(service.findAll).toHaveBeenCalledWith(TEST_USER_ID, filters);
		});

		it("should return transactions filtered by type", async () => {
			const filters: FilterTransactionDto = {
				type: TransactionType.EXPENSE,
			};

			jest.spyOn(service, "findAll").mockResolvedValue([]);

			const session = createMockSession();
			await controller.findAll(session, filters);

			expect(service.findAll).toHaveBeenCalledWith(TEST_USER_ID, filters);
		});

		it("should return transactions with multiple filters", async () => {
			const filters: FilterTransactionDto = {
				dateFrom: "2024-10-01T00:00:00Z",
				dateTo: "2024-10-31T23:59:59Z",
				categoryId: "cat-1",
				type: TransactionType.EXPENSE,
			};

			jest.spyOn(service, "findAll").mockResolvedValue([]);

			const session = createMockSession();
			await controller.findAll(session, filters);

			expect(service.findAll).toHaveBeenCalledWith(TEST_USER_ID, filters);
		});
	});

	describe("GET /transactions/:id", () => {
		it("should return a transaction by id", async () => {
			const mockTransaction = {
				id: "trans-1",
				userId: TEST_USER_ID,
				categoryId: "cat-1",
				amount: new Decimal(150.5),
				description: "Compra de supermercado",
				date: new Date("2024-10-31"),
				type: TransactionType.EXPENSE,
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
					mockTransaction as unknown as Awaited<
						ReturnType<typeof service.findOne>
					>,
				);

			const session = createMockSession();
			const result = await controller.findOne("trans-1", session);

			expect(result).toEqual(mockTransaction);
			expect(service.findOne).toHaveBeenCalledWith("trans-1", TEST_USER_ID);
		});

		it("should return 404 if transaction not found", async () => {
			jest
				.spyOn(service, "findOne")
				.mockRejectedValue(new NotFoundException("Transação não encontrada"));

			const session = createMockSession();

			await expect(controller.findOne("non-existent", session)).rejects.toThrow(
				NotFoundException,
			);
		});
	});

	describe("PUT /transactions/:id", () => {
		it("should update a transaction", async () => {
			const dto: UpdateTransactionDto = {
				amount: 200,
				description: "Compra atualizada",
			};

			const mockTransaction = {
				id: "trans-1",
				userId: TEST_USER_ID,
				categoryId: "cat-1",
				amount: new Decimal(200),
				description: "Compra atualizada",
				date: new Date("2024-10-31"),
				type: TransactionType.EXPENSE,
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
					mockTransaction as unknown as Awaited<
						ReturnType<typeof service.update>
					>,
				);

			const session = createMockSession();
			const result = await controller.update("trans-1", session, dto);

			expect(result).toEqual(mockTransaction);
			expect(service.update).toHaveBeenCalledWith("trans-1", TEST_USER_ID, dto);
		});

		it("should return 404 if transaction not found", async () => {
			const dto: UpdateTransactionDto = {
				amount: 200,
			};

			jest
				.spyOn(service, "update")
				.mockRejectedValue(new NotFoundException("Transação não encontrada"));

			const session = createMockSession();

			await expect(
				controller.update("non-existent", session, dto),
			).rejects.toThrow(NotFoundException);
		});

		it("should return 400 if category not found when updating category", async () => {
			const dto: UpdateTransactionDto = {
				categoryId: "non-existent",
			};

			jest
				.spyOn(service, "update")
				.mockRejectedValue(new BadRequestException("Categoria não encontrada"));

			const session = createMockSession();

			await expect(controller.update("trans-1", session, dto)).rejects.toThrow(
				BadRequestException,
			);
		});
	});

	describe("DELETE /transactions/:id", () => {
		it("should delete a transaction", async () => {
			const mockTransaction = {
				id: "trans-1",
				userId: TEST_USER_ID,
				categoryId: "cat-1",
				amount: new Decimal(150.5),
				description: "Compra de supermercado",
				date: new Date("2024-10-31"),
				type: TransactionType.EXPENSE,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			jest
				.spyOn(service, "remove")
				.mockResolvedValue(
					mockTransaction as unknown as Awaited<
						ReturnType<typeof service.remove>
					>,
				);

			const session = createMockSession();
			const result = await controller.remove("trans-1", session);

			expect(result).toEqual(mockTransaction);
			expect(service.remove).toHaveBeenCalledWith("trans-1", TEST_USER_ID);
		});

		it("should return 404 if transaction not found", async () => {
			jest
				.spyOn(service, "remove")
				.mockRejectedValue(new NotFoundException("Transação não encontrada"));

			const session = createMockSession();

			await expect(controller.remove("non-existent", session)).rejects.toThrow(
				NotFoundException,
			);
		});
	});
});
