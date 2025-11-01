import { Test, type TestingModule } from "@nestjs/testing";
import { PrismaService } from "../prisma.service";
import { createPrismaMock, type PrismaMock } from "../test/mocks/prisma.mock";
import { TEST_USER_ID } from "../test/mocks/session.mock";
import { ReportsService } from "./reports.service";

describe("ReportsService", () => {
	let service: ReportsService;
	let prisma: PrismaMock;

	beforeEach(async () => {
		prisma = createPrismaMock();

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				ReportsService,
				{
					provide: PrismaService,
					useValue: prisma,
				},
			],
		}).compile();

		service = module.get<ReportsService>(ReportsService);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe("getSummary", () => {
		it("should calculate total income, expense and balance", async () => {
			const mockTransactions = [
				{
					id: "trans-1",
					userId: TEST_USER_ID,
					categoryId: "cat-1",
					amount: 3000,
					description: "Salário",
					date: new Date("2024-10-01"),
					type: "INCOME",
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: "trans-2",
					userId: TEST_USER_ID,
					categoryId: "cat-2",
					amount: 150.5,
					description: "Supermercado",
					date: new Date("2024-10-15"),
					type: "EXPENSE",
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: "trans-3",
					userId: TEST_USER_ID,
					categoryId: "cat-2",
					amount: 200,
					description: "Transporte",
					date: new Date("2024-10-20"),
					type: "EXPENSE",
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			];

			prisma.transaction.findMany.mockResolvedValue(mockTransactions);

			const result = await service.getSummary(TEST_USER_ID);

			expect(result).toEqual({
				totalIncome: "3000.00",
				totalExpense: "350.50",
				balance: "2649.50",
				period: "Todas as datas",
			});
			expect(prisma.transaction.findMany).toHaveBeenCalledWith({
				where: { userId: TEST_USER_ID },
			});
		});

		it("should calculate summary with date filters", async () => {
			const dateFrom = new Date("2024-10-01");
			const dateTo = new Date("2024-10-31");

			const mockTransactions = [
				{
					id: "trans-1",
					userId: TEST_USER_ID,
					categoryId: "cat-1",
					amount: 3000,
					description: "Salário",
					date: new Date("2024-10-01"),
					type: "INCOME",
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			];

			prisma.transaction.findMany.mockResolvedValue(mockTransactions);

			const result = await service.getSummary(TEST_USER_ID, dateFrom, dateTo);

			expect(result).toEqual({
				totalIncome: "3000.00",
				totalExpense: "0.00",
				balance: "3000.00",
				period: "2024-10-01 a 2024-10-31",
			});
			expect(prisma.transaction.findMany).toHaveBeenCalledWith({
				where: {
					userId: TEST_USER_ID,
					date: {
						gte: dateFrom,
						lte: dateTo,
					},
				},
			});
		});

		it("should return zeros when no transactions exist", async () => {
			prisma.transaction.findMany.mockResolvedValue([]);

			const result = await service.getSummary(TEST_USER_ID);

			expect(result).toEqual({
				totalIncome: "0.00",
				totalExpense: "0.00",
				balance: "0.00",
				period: "Todas as datas",
			});
		});

		it("should handle only dateFrom filter", async () => {
			const dateFrom = new Date("2024-10-01");

			prisma.transaction.findMany.mockResolvedValue([]);

			const result = await service.getSummary(TEST_USER_ID, dateFrom);

			expect(result.period).toBe("2024-10-01 a hoje");
			expect(prisma.transaction.findMany).toHaveBeenCalledWith({
				where: {
					userId: TEST_USER_ID,
					date: {
						gte: dateFrom,
					},
				},
			});
		});

		it("should handle only dateTo filter", async () => {
			const dateTo = new Date("2024-10-31");

			prisma.transaction.findMany.mockResolvedValue([]);

			const result = await service.getSummary(TEST_USER_ID, undefined, dateTo);

			expect(result.period).toBe("indefinido a 2024-10-31");
			expect(prisma.transaction.findMany).toHaveBeenCalledWith({
				where: {
					userId: TEST_USER_ID,
					date: {
						lte: dateTo,
					},
				},
			});
		});
	});

	describe("getByCategory", () => {
		it("should aggregate spending by category and type", async () => {
			const mockTransactions = [
				{
					id: "trans-1",
					userId: TEST_USER_ID,
					categoryId: "cat-1",
					amount: 100,
					date: new Date("2024-10-15"),
					type: "EXPENSE",
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
					categoryId: "cat-1",
					amount: 150,
					date: new Date("2024-10-20"),
					type: "EXPENSE",
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
					id: "trans-3",
					userId: TEST_USER_ID,
					categoryId: "cat-2",
					amount: 3000,
					date: new Date("2024-10-01"),
					type: "INCOME",
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

			const result = await service.getByCategory(TEST_USER_ID);

			expect(result.period).toBe("Todas as datas");
			expect(result.data).toHaveLength(2);
			expect(result.data).toContainEqual({
				categoryName: "Alimentação",
				type: "EXPENSE",
				total: "250.00",
				count: 2,
			});
			expect(result.data).toContainEqual({
				categoryName: "Salário",
				type: "INCOME",
				total: "3000.00",
				count: 1,
			});
		});

		it("should handle multiple categories with same name but different types", async () => {
			const mockTransactions = [
				{
					id: "trans-1",
					userId: TEST_USER_ID,
					categoryId: "cat-1",
					amount: 100,
					date: new Date("2024-10-15"),
					type: "EXPENSE",
					category: {
						id: "cat-1",
						userId: TEST_USER_ID,
						name: "Investimentos",
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
					amount: 200,
					date: new Date("2024-10-20"),
					type: "INCOME",
					category: {
						id: "cat-2",
						userId: TEST_USER_ID,
						name: "Investimentos",
						type: "INCOME",
						color: "#00FF00",
						createdAt: new Date(),
						updatedAt: new Date(),
					},
				},
			];

			prisma.transaction.findMany.mockResolvedValue(mockTransactions);

			const result = await service.getByCategory(TEST_USER_ID);

			expect(result.data).toHaveLength(2);
			expect(result.data).toContainEqual({
				categoryName: "Investimentos",
				type: "EXPENSE",
				total: "100.00",
				count: 1,
			});
			expect(result.data).toContainEqual({
				categoryName: "Investimentos",
				type: "INCOME",
				total: "200.00",
				count: 1,
			});
		});

		it("should return empty data when no transactions exist", async () => {
			prisma.transaction.findMany.mockResolvedValue([]);

			const result = await service.getByCategory(TEST_USER_ID);

			expect(result).toEqual({
				data: [],
				period: "Todas as datas",
			});
		});

		it("should apply date filters", async () => {
			const dateFrom = new Date("2024-10-01");
			const dateTo = new Date("2024-10-31");

			prisma.transaction.findMany.mockResolvedValue([]);

			await service.getByCategory(TEST_USER_ID, dateFrom, dateTo);

			expect(prisma.transaction.findMany).toHaveBeenCalledWith({
				where: {
					userId: TEST_USER_ID,
					date: {
						gte: dateFrom,
						lte: dateTo,
					},
				},
				include: { category: true },
				orderBy: { category: { name: "asc" } },
			});
		});
	});

	describe("getBudgetStatus", () => {
		it("should compare spending vs budget limits with ok status", async () => {
			const mockBudgets = [
				{
					id: "budget-1",
					userId: TEST_USER_ID,
					categoryId: "cat-1",
					amount: 1000,
					period: "MONTHLY",
					startDate: new Date("2024-10-01"),
					endDate: new Date("2024-10-31"),
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
			];

			const mockTransactions = [
				{
					id: "trans-1",
					userId: TEST_USER_ID,
					categoryId: "cat-1",
					amount: 500,
					date: new Date("2024-10-15"),
					type: "EXPENSE",
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			];

			prisma.budget.findMany.mockResolvedValue(mockBudgets);
			prisma.transaction.findMany.mockResolvedValue(mockTransactions);

			const result = await service.getBudgetStatus(TEST_USER_ID);

			expect(result.period).toBe("Todas as datas");
			expect(result.data).toHaveLength(1);
			expect(result.data[0]).toEqual({
				categoryName: "Alimentação",
				budgetLimit: "1000.00",
				spent: "500.00",
				remaining: "500.00",
				percentageUsed: 50,
				status: "ok",
			});
		});

		it("should set warning status when spent >= 80%", async () => {
			const mockBudgets = [
				{
					id: "budget-1",
					userId: TEST_USER_ID,
					categoryId: "cat-1",
					amount: 1000,
					period: "MONTHLY",
					startDate: new Date("2024-10-01"),
					endDate: new Date("2024-10-31"),
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
			];

			const mockTransactions = [
				{
					id: "trans-1",
					userId: TEST_USER_ID,
					categoryId: "cat-1",
					amount: 850,
					date: new Date("2024-10-15"),
					type: "EXPENSE",
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			];

			prisma.budget.findMany.mockResolvedValue(mockBudgets);
			prisma.transaction.findMany.mockResolvedValue(mockTransactions);

			const result = await service.getBudgetStatus(TEST_USER_ID);

			expect(result.data[0].status).toBe("warning");
			expect(result.data[0].percentageUsed).toBe(85);
		});

		it("should set exceeded status when spent >= 100%", async () => {
			const mockBudgets = [
				{
					id: "budget-1",
					userId: TEST_USER_ID,
					categoryId: "cat-1",
					amount: 1000,
					period: "MONTHLY",
					startDate: new Date("2024-10-01"),
					endDate: new Date("2024-10-31"),
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
			];

			const mockTransactions = [
				{
					id: "trans-1",
					userId: TEST_USER_ID,
					categoryId: "cat-1",
					amount: 1200,
					date: new Date("2024-10-15"),
					type: "EXPENSE",
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			];

			prisma.budget.findMany.mockResolvedValue(mockBudgets);
			prisma.transaction.findMany.mockResolvedValue(mockTransactions);

			const result = await service.getBudgetStatus(TEST_USER_ID);

			expect(result.data[0].status).toBe("exceeded");
			expect(result.data[0].percentageUsed).toBe(120);
			expect(result.data[0].remaining).toBe("-200.00");
		});

		it("should handle general budget (no category)", async () => {
			const mockBudgets = [
				{
					id: "budget-1",
					userId: TEST_USER_ID,
					categoryId: null,
					amount: 5000,
					period: "MONTHLY",
					startDate: new Date("2024-10-01"),
					endDate: new Date("2024-10-31"),
					createdAt: new Date(),
					updatedAt: new Date(),
					category: null,
				},
			];

			const mockTransactions = [
				{
					id: "trans-1",
					userId: TEST_USER_ID,
					categoryId: "cat-1",
					amount: 1000,
					date: new Date("2024-10-15"),
					type: "EXPENSE",
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: "trans-2",
					userId: TEST_USER_ID,
					categoryId: "cat-2",
					amount: 500,
					date: new Date("2024-10-20"),
					type: "EXPENSE",
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: "trans-3",
					userId: TEST_USER_ID,
					categoryId: "cat-3",
					amount: 2000,
					date: new Date("2024-10-25"),
					type: "INCOME",
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			];

			prisma.budget.findMany.mockResolvedValue(mockBudgets);
			prisma.transaction.findMany.mockResolvedValue(mockTransactions);

			const result = await service.getBudgetStatus(TEST_USER_ID);

			expect(result.data[0]).toEqual({
				categoryName: "Geral",
				budgetLimit: "5000.00",
				spent: "1500.00",
				remaining: "3500.00",
				percentageUsed: 30,
				status: "ok",
			});
		});

		it("should return empty data when no budgets exist", async () => {
			prisma.budget.findMany.mockResolvedValue([]);
			prisma.transaction.findMany.mockResolvedValue([]);

			const result = await service.getBudgetStatus(TEST_USER_ID);

			expect(result).toEqual({
				data: [],
				period: "Todas as datas",
			});
		});

		it("should apply date filters", async () => {
			const dateFrom = new Date("2024-10-01");
			const dateTo = new Date("2024-10-31");

			prisma.budget.findMany.mockResolvedValue([]);
			prisma.transaction.findMany.mockResolvedValue([]);

			await service.getBudgetStatus(TEST_USER_ID, dateFrom, dateTo);

			expect(prisma.transaction.findMany).toHaveBeenCalledWith({
				where: {
					userId: TEST_USER_ID,
					date: {
						gte: dateFrom,
						lte: dateTo,
					},
				},
			});
		});
	});

	describe("getTrends", () => {
		it("should generate monthly trends for default 6 months", async () => {
			prisma.transaction.findMany.mockResolvedValue([]);

			const result = await service.getTrends(TEST_USER_ID);

			expect(result.months).toBe(6);
			expect(result.data.length).toBeGreaterThanOrEqual(6);
			expect(result.data[0]).toHaveProperty("month");
			expect(result.data[0]).toHaveProperty("income");
			expect(result.data[0]).toHaveProperty("expense");
			expect(result.data[0]).toHaveProperty("balance");
		});

		it("should generate monthly trends for custom month count", async () => {
			prisma.transaction.findMany.mockResolvedValue([]);

			const result = await service.getTrends(TEST_USER_ID, 12);

			expect(result.months).toBe(12);
			expect(result.data.length).toBeGreaterThanOrEqual(12);
		});

		it("should initialize all months with zero values", async () => {
			prisma.transaction.findMany.mockResolvedValue([]);

			const result = await service.getTrends(TEST_USER_ID, 3);

			expect(result.data.length).toBeGreaterThanOrEqual(3);
			const zeroMonths = result.data.filter(
				(monthData) =>
					monthData.income === "0.00" &&
					monthData.expense === "0.00" &&
					monthData.balance === "0.00",
			);
			expect(zeroMonths.length).toBeGreaterThanOrEqual(3);
		});

		it("should aggregate transactions by month", async () => {
			const testDate = new Date("2024-10-15T12:00:00Z");
			const testMonth = "2024-10";

			const mockTransactions = [
				{
					id: "trans-1",
					userId: TEST_USER_ID,
					categoryId: "cat-1",
					amount: 3000,
					date: testDate,
					type: "INCOME",
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: "trans-2",
					userId: TEST_USER_ID,
					categoryId: "cat-2",
					amount: 500,
					date: testDate,
					type: "EXPENSE",
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: "trans-3",
					userId: TEST_USER_ID,
					categoryId: "cat-2",
					amount: 300,
					date: testDate,
					type: "EXPENSE",
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			];

			prisma.transaction.findMany.mockResolvedValue(mockTransactions);

			const result = await service.getTrends(TEST_USER_ID, 6);

			const testMonthData = result.data.find((d) => d.month === testMonth);
			expect(testMonthData).toBeDefined();
			expect(testMonthData?.income).toBe("3000.00");
			expect(testMonthData?.expense).toBe("800.00");
			expect(testMonthData?.balance).toBe("2200.00");
		});

		it("should return sorted data by month", async () => {
			prisma.transaction.findMany.mockResolvedValue([]);

			const result = await service.getTrends(TEST_USER_ID, 3);

			for (let i = 1; i < result.data.length; i++) {
				expect(result.data[i - 1].month <= result.data[i].month).toBe(true);
			}
		});
	});
});
