import { BadRequestException, NotFoundException } from "@nestjs/common";
import { Test, type TestingModule } from "@nestjs/testing";
import { PrismaService } from "../prisma.service";
import { createPrismaMock, type PrismaMock } from "../test/mocks/prisma.mock";
import { TEST_USER_ID } from "../test/mocks/session.mock";
import {
	TransactionType,
	type CreateTransactionDto,
} from "./dto/create-transaction.dto";
import type { FilterTransactionDto } from "./dto/filter-transaction.dto";
import type { UpdateTransactionDto } from "./dto/update-transaction.dto";
import { TransactionsService } from "./transactions.service";

describe("TransactionsService", () => {
	let service: TransactionsService;
	let prisma: PrismaMock;

	beforeEach(async () => {
		prisma = createPrismaMock();

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				TransactionsService,
				{
					provide: PrismaService,
					useValue: prisma,
				},
			],
		}).compile();

		service = module.get<TransactionsService>(TransactionsService);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe("create", () => {
		it("should create a new transaction", async () => {
			const dto: CreateTransactionDto = {
				categoryId: "cat-1",
				amount: 150.5,
				description: "Compra de supermercado",
				date: "2024-10-31T20:00:00Z",
				type: TransactionType.EXPENSE,
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

			const mockTransaction = {
				id: "trans-1",
				userId: TEST_USER_ID,
				categoryId: dto.categoryId,
				amount: dto.amount,
				description: dto.description,
				date: new Date(dto.date),
				type: dto.type,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			prisma.category.findFirst.mockResolvedValue(mockCategory);
			prisma.transaction.create.mockResolvedValue(mockTransaction);

			const result = await service.create(TEST_USER_ID, dto);

			expect(result).toEqual(mockTransaction);
			expect(prisma.category.findFirst).toHaveBeenCalledWith({
				where: {
					id: dto.categoryId,
					userId: TEST_USER_ID,
				},
			});
			expect(prisma.transaction.create).toHaveBeenCalledWith({
				data: {
					userId: TEST_USER_ID,
					categoryId: dto.categoryId,
					amount: dto.amount,
					description: dto.description,
					date: new Date(dto.date),
					type: dto.type,
				},
			});
		});

		it("should create a transaction without description", async () => {
			const dto: CreateTransactionDto = {
				categoryId: "cat-1",
				amount: 100,
				date: "2024-10-31T20:00:00Z",
				type: TransactionType.INCOME,
			};

			const mockCategory = {
				id: "cat-1",
				userId: TEST_USER_ID,
				name: "Salário",
				type: "INCOME",
				color: "#00FF00",
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			const mockTransaction = {
				id: "trans-2",
				userId: TEST_USER_ID,
				categoryId: dto.categoryId,
				amount: dto.amount,
				description: undefined,
				date: new Date(dto.date),
				type: dto.type,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			prisma.category.findFirst.mockResolvedValue(mockCategory);
			prisma.transaction.create.mockResolvedValue(mockTransaction);

			const result = await service.create(TEST_USER_ID, dto);

			expect(result).toEqual(mockTransaction);
		});

		it("should throw BadRequestException if category not found", async () => {
			const dto: CreateTransactionDto = {
				categoryId: "non-existent",
				amount: 100,
				date: "2024-10-31T20:00:00Z",
				type: TransactionType.EXPENSE,
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
			expect(prisma.transaction.create).not.toHaveBeenCalled();
		});

		it("should throw BadRequestException if category belongs to another user", async () => {
			const dto: CreateTransactionDto = {
				categoryId: "cat-1",
				amount: 100,
				date: "2024-10-31T20:00:00Z",
				type: TransactionType.EXPENSE,
			};

			prisma.category.findFirst.mockResolvedValue(null);

			await expect(service.create(TEST_USER_ID, dto)).rejects.toThrow(
				BadRequestException,
			);
			expect(prisma.transaction.create).not.toHaveBeenCalled();
		});
	});

	describe("findAll", () => {
		it("should return all transactions for a user", async () => {
			const mockTransactions = [
				{
					id: "trans-1",
					userId: TEST_USER_ID,
					categoryId: "cat-1",
					amount: 150.5,
					description: "Compra de supermercado",
					date: new Date("2024-10-31"),
					type: TransactionType.EXPENSE,
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
					id: "trans-2",
					userId: TEST_USER_ID,
					categoryId: "cat-2",
					amount: 3000,
					description: "Salário mensal",
					date: new Date("2024-10-01"),
					type: TransactionType.INCOME,
					createdAt: new Date(),
					updatedAt: new Date(),
					category: {
						id: "cat-2",
						userId: TEST_USER_ID,
						name: "Salário",
						type: "INCOME",
						color: "#00FF00",
						createdAt: new Date(),
						updatedAt: new Date(),
					},
				},
			];

			prisma.transaction.findMany.mockResolvedValue(mockTransactions);

			const result = await service.findAll(TEST_USER_ID);

			expect(result).toEqual(mockTransactions);
			expect(prisma.transaction.findMany).toHaveBeenCalledWith({
				where: { userId: TEST_USER_ID },
				orderBy: { date: "desc" },
				include: { category: true },
			});
		});

		it("should filter transactions by dateFrom", async () => {
			const filters: FilterTransactionDto = {
				dateFrom: "2024-10-01T00:00:00Z",
			};

			prisma.transaction.findMany.mockResolvedValue([]);

			await service.findAll(TEST_USER_ID, filters);

			expect(prisma.transaction.findMany).toHaveBeenCalledWith({
				where: {
					userId: TEST_USER_ID,
					date: {
						gte: new Date(filters.dateFrom),
					},
				},
				orderBy: { date: "desc" },
				include: { category: true },
			});
		});

		it("should filter transactions by dateTo", async () => {
			const filters: FilterTransactionDto = {
				dateTo: "2024-10-31T23:59:59Z",
			};

			prisma.transaction.findMany.mockResolvedValue([]);

			await service.findAll(TEST_USER_ID, filters);

			expect(prisma.transaction.findMany).toHaveBeenCalledWith({
				where: {
					userId: TEST_USER_ID,
					date: {
						lte: new Date(filters.dateTo),
					},
				},
				orderBy: { date: "desc" },
				include: { category: true },
			});
		});

		it("should filter transactions by date range", async () => {
			const filters: FilterTransactionDto = {
				dateFrom: "2024-10-01T00:00:00Z",
				dateTo: "2024-10-31T23:59:59Z",
			};

			prisma.transaction.findMany.mockResolvedValue([]);

			await service.findAll(TEST_USER_ID, filters);

			expect(prisma.transaction.findMany).toHaveBeenCalledWith({
				where: {
					userId: TEST_USER_ID,
					date: {
						gte: new Date(filters.dateFrom),
						lte: new Date(filters.dateTo),
					},
				},
				orderBy: { date: "desc" },
				include: { category: true },
			});
		});

		it("should filter transactions by categoryId", async () => {
			const filters: FilterTransactionDto = {
				categoryId: "cat-1",
			};

			prisma.transaction.findMany.mockResolvedValue([]);

			await service.findAll(TEST_USER_ID, filters);

			expect(prisma.transaction.findMany).toHaveBeenCalledWith({
				where: {
					userId: TEST_USER_ID,
					categoryId: "cat-1",
				},
				orderBy: { date: "desc" },
				include: { category: true },
			});
		});

		it("should filter transactions by type", async () => {
			const filters: FilterTransactionDto = {
				type: TransactionType.EXPENSE,
			};

			prisma.transaction.findMany.mockResolvedValue([]);

			await service.findAll(TEST_USER_ID, filters);

			expect(prisma.transaction.findMany).toHaveBeenCalledWith({
				where: {
					userId: TEST_USER_ID,
					type: TransactionType.EXPENSE,
				},
				orderBy: { date: "desc" },
				include: { category: true },
			});
		});

		it("should apply multiple filters combined", async () => {
			const filters: FilterTransactionDto = {
				dateFrom: "2024-10-01T00:00:00Z",
				dateTo: "2024-10-31T23:59:59Z",
				categoryId: "cat-1",
				type: TransactionType.EXPENSE,
			};

			prisma.transaction.findMany.mockResolvedValue([]);

			await service.findAll(TEST_USER_ID, filters);

			expect(prisma.transaction.findMany).toHaveBeenCalledWith({
				where: {
					userId: TEST_USER_ID,
					date: {
						gte: new Date(filters.dateFrom),
						lte: new Date(filters.dateTo),
					},
					categoryId: "cat-1",
					type: TransactionType.EXPENSE,
				},
				orderBy: { date: "desc" },
				include: { category: true },
			});
		});

		it("should return empty array if no transactions exist", async () => {
			prisma.transaction.findMany.mockResolvedValue([]);

			const result = await service.findAll(TEST_USER_ID);

			expect(result).toEqual([]);
		});
	});

	describe("findOne", () => {
		it("should return a transaction by id", async () => {
			const mockTransaction = {
				id: "trans-1",
				userId: TEST_USER_ID,
				categoryId: "cat-1",
				amount: 150.5,
				description: "Compra de supermercado",
				date: new Date("2024-10-31"),
				type: TransactionType.EXPENSE,
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

			prisma.transaction.findFirst.mockResolvedValue(mockTransaction);

			const result = await service.findOne("trans-1", TEST_USER_ID);

			expect(result).toEqual(mockTransaction);
			expect(prisma.transaction.findFirst).toHaveBeenCalledWith({
				where: { id: "trans-1", userId: TEST_USER_ID },
				include: { category: true },
			});
		});

		it("should throw NotFoundException if transaction not found", async () => {
			prisma.transaction.findFirst.mockResolvedValue(null);

			await expect(
				service.findOne("non-existent", TEST_USER_ID),
			).rejects.toThrow(NotFoundException);
		});
	});

	describe("update", () => {
		it("should update a transaction", async () => {
			const dto: UpdateTransactionDto = {
				amount: 200,
				description: "Compra atualizada",
			};

			const mockTransaction = {
				id: "trans-1",
				userId: TEST_USER_ID,
				categoryId: "cat-1",
				amount: 150.5,
				description: "Compra de supermercado",
				date: new Date("2024-10-31"),
				type: TransactionType.EXPENSE,
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

			const updatedTransaction = { ...mockTransaction, ...dto };

			prisma.transaction.findFirst.mockResolvedValue(mockTransaction);
			prisma.transaction.update.mockResolvedValue(updatedTransaction);

			const result = await service.update("trans-1", TEST_USER_ID, dto);

			expect(result).toEqual(updatedTransaction);
			expect(prisma.transaction.update).toHaveBeenCalledWith({
				where: { id: "trans-1" },
				data: dto,
				include: { category: true },
			});
		});

		it("should update transaction with new category", async () => {
			const dto: UpdateTransactionDto = {
				categoryId: "cat-2",
			};

			const mockTransaction = {
				id: "trans-1",
				userId: TEST_USER_ID,
				categoryId: "cat-1",
				amount: 150.5,
				description: "Compra de supermercado",
				date: new Date("2024-10-31"),
				type: TransactionType.EXPENSE,
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

			prisma.transaction.findFirst.mockResolvedValue(mockTransaction);
			prisma.category.findFirst.mockResolvedValue(newCategory);
			prisma.transaction.update.mockResolvedValue({
				...mockTransaction,
				...dto,
			});

			await service.update("trans-1", TEST_USER_ID, dto);

			expect(prisma.category.findFirst).toHaveBeenCalledWith({
				where: {
					id: dto.categoryId,
					userId: TEST_USER_ID,
				},
			});
		});

		it("should update transaction date", async () => {
			const dto: UpdateTransactionDto = {
				date: "2024-11-01T20:00:00Z",
			};

			const mockTransaction = {
				id: "trans-1",
				userId: TEST_USER_ID,
				categoryId: "cat-1",
				amount: 150.5,
				description: "Compra de supermercado",
				date: new Date("2024-10-31"),
				type: TransactionType.EXPENSE,
				createdAt: new Date(),
				updatedAt: new Date(),
				category: null,
			};

			prisma.transaction.findFirst.mockResolvedValue(mockTransaction);
			prisma.transaction.update.mockResolvedValue({
				...mockTransaction,
				date: new Date(dto.date),
			});

			await service.update("trans-1", TEST_USER_ID, dto);

			expect(prisma.transaction.update).toHaveBeenCalledWith({
				where: { id: "trans-1" },
				data: { date: new Date(dto.date) },
				include: { category: true },
			});
		});

		it("should throw BadRequestException if new category not found", async () => {
			const dto: UpdateTransactionDto = {
				categoryId: "non-existent",
			};

			const mockTransaction = {
				id: "trans-1",
				userId: TEST_USER_ID,
				categoryId: "cat-1",
				amount: 150.5,
				description: "Compra de supermercado",
				date: new Date("2024-10-31"),
				type: TransactionType.EXPENSE,
				createdAt: new Date(),
				updatedAt: new Date(),
				category: null,
			};

			prisma.transaction.findFirst.mockResolvedValue(mockTransaction);
			prisma.category.findFirst.mockResolvedValue(null);

			await expect(
				service.update("trans-1", TEST_USER_ID, dto),
			).rejects.toThrow(BadRequestException);
			expect(prisma.transaction.update).not.toHaveBeenCalled();
		});

		it("should throw NotFoundException if transaction not found for update", async () => {
			prisma.transaction.findFirst.mockResolvedValue(null);

			await expect(
				service.update("non-existent", TEST_USER_ID, { amount: 200 }),
			).rejects.toThrow(NotFoundException);
			expect(prisma.transaction.update).not.toHaveBeenCalled();
		});
	});

	describe("remove", () => {
		it("should delete a transaction", async () => {
			const mockTransaction = {
				id: "trans-1",
				userId: TEST_USER_ID,
				categoryId: "cat-1",
				amount: 150.5,
				description: "Compra de supermercado",
				date: new Date("2024-10-31"),
				type: TransactionType.EXPENSE,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			prisma.transaction.findFirst.mockResolvedValue(mockTransaction);
			prisma.transaction.delete.mockResolvedValue(mockTransaction);

			const result = await service.remove("trans-1", TEST_USER_ID);

			expect(result).toEqual(mockTransaction);
			expect(prisma.transaction.delete).toHaveBeenCalledWith({
				where: { id: "trans-1" },
			});
		});

		it("should throw NotFoundException if transaction not found for deletion", async () => {
			prisma.transaction.findFirst.mockResolvedValue(null);

			await expect(
				service.remove("non-existent", TEST_USER_ID),
			).rejects.toThrow(NotFoundException);
			expect(prisma.transaction.delete).not.toHaveBeenCalled();
		});
	});
});

