import { Test, type TestingModule } from "@nestjs/testing";
import { createMockSession, TEST_USER_ID } from "../test/mocks/session.mock";
import { ReportsController } from "./reports.controller";
import { ReportsService } from "./reports.service";

describe("ReportsController", () => {
	let controller: ReportsController;
	let service: ReportsService;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [ReportsController],
			providers: [
				{
					provide: ReportsService,
					useValue: {
						getSummary: jest.fn(),
						getByCategory: jest.fn(),
						getBudgetStatus: jest.fn(),
						getTrends: jest.fn(),
					},
				},
			],
		}).compile();

		controller = module.get<ReportsController>(ReportsController);
		service = module.get<ReportsService>(ReportsService);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe("GET /reports/summary", () => {
		it("should return summary report without date filters", async () => {
			const mockSummary = {
				totalIncome: "3000.00",
				totalExpense: "1500.00",
				balance: "1500.00",
				period: "Todas as datas",
			};

			jest.spyOn(service, "getSummary").mockResolvedValue(mockSummary);

			const session = createMockSession();
			const result = await controller.getSummary(session);

			expect(result).toEqual(mockSummary);
			expect(service.getSummary).toHaveBeenCalledWith(
				TEST_USER_ID,
				undefined,
				undefined,
			);
		});

		it("should return summary report with dateFrom", async () => {
			const mockSummary = {
				totalIncome: "3000.00",
				totalExpense: "1500.00",
				balance: "1500.00",
				period: "2024-10-01 a hoje",
			};

			jest.spyOn(service, "getSummary").mockResolvedValue(mockSummary);

			const session = createMockSession();
			const dateFrom = "2024-10-01T00:00:00Z";
			const result = await controller.getSummary(session, dateFrom);

			expect(result).toEqual(mockSummary);
			expect(service.getSummary).toHaveBeenCalledWith(
				TEST_USER_ID,
				new Date(dateFrom),
				undefined,
			);
		});

		it("should return summary report with dateTo", async () => {
			const mockSummary = {
				totalIncome: "3000.00",
				totalExpense: "1500.00",
				balance: "1500.00",
				period: "indefinido a 2024-10-31",
			};

			jest.spyOn(service, "getSummary").mockResolvedValue(mockSummary);

			const session = createMockSession();
			const dateTo = "2024-10-31T23:59:59Z";
			const result = await controller.getSummary(session, undefined, dateTo);

			expect(result).toEqual(mockSummary);
			expect(service.getSummary).toHaveBeenCalledWith(
				TEST_USER_ID,
				undefined,
				new Date(dateTo),
			);
		});

		it("should return summary report with both date filters", async () => {
			const mockSummary = {
				totalIncome: "3000.00",
				totalExpense: "1500.00",
				balance: "1500.00",
				period: "2024-10-01 a 2024-10-31",
			};

			jest.spyOn(service, "getSummary").mockResolvedValue(mockSummary);

			const session = createMockSession();
			const dateFrom = "2024-10-01T00:00:00Z";
			const dateTo = "2024-10-31T23:59:59Z";
			const result = await controller.getSummary(session, dateFrom, dateTo);

			expect(result).toEqual(mockSummary);
			expect(service.getSummary).toHaveBeenCalledWith(
				TEST_USER_ID,
				new Date(dateFrom),
				new Date(dateTo),
			);
		});
	});

	describe("GET /reports/by-category", () => {
		it("should return category report without date filters", async () => {
			const mockCategoryReport = {
				data: [
					{
						categoryName: "Alimentação",
						type: "EXPENSE",
						total: "500.00",
						count: 3,
					},
					{
						categoryName: "Salário",
						type: "INCOME",
						total: "3000.00",
						count: 1,
					},
				],
				period: "Todas as datas",
			};

			jest.spyOn(service, "getByCategory").mockResolvedValue(mockCategoryReport);

			const session = createMockSession();
			const result = await controller.getByCategory(session);

			expect(result).toEqual(mockCategoryReport);
			expect(service.getByCategory).toHaveBeenCalledWith(
				TEST_USER_ID,
				undefined,
				undefined,
			);
		});

		it("should return category report with dateFrom", async () => {
			const mockCategoryReport = {
				data: [],
				period: "2024-10-01 a hoje",
			};

			jest.spyOn(service, "getByCategory").mockResolvedValue(mockCategoryReport);

			const session = createMockSession();
			const dateFrom = "2024-10-01T00:00:00Z";
			const result = await controller.getByCategory(session, dateFrom);

			expect(result).toEqual(mockCategoryReport);
			expect(service.getByCategory).toHaveBeenCalledWith(
				TEST_USER_ID,
				new Date(dateFrom),
				undefined,
			);
		});

		it("should return category report with dateTo", async () => {
			const mockCategoryReport = {
				data: [],
				period: "indefinido a 2024-10-31",
			};

			jest.spyOn(service, "getByCategory").mockResolvedValue(mockCategoryReport);

			const session = createMockSession();
			const dateTo = "2024-10-31T23:59:59Z";
			const result = await controller.getByCategory(
				session,
				undefined,
				dateTo,
			);

			expect(result).toEqual(mockCategoryReport);
			expect(service.getByCategory).toHaveBeenCalledWith(
				TEST_USER_ID,
				undefined,
				new Date(dateTo),
			);
		});

		it("should return category report with both date filters", async () => {
			const mockCategoryReport = {
				data: [],
				period: "2024-10-01 a 2024-10-31",
			};

			jest.spyOn(service, "getByCategory").mockResolvedValue(mockCategoryReport);

			const session = createMockSession();
			const dateFrom = "2024-10-01T00:00:00Z";
			const dateTo = "2024-10-31T23:59:59Z";
			const result = await controller.getByCategory(
				session,
				dateFrom,
				dateTo,
			);

			expect(result).toEqual(mockCategoryReport);
			expect(service.getByCategory).toHaveBeenCalledWith(
				TEST_USER_ID,
				new Date(dateFrom),
				new Date(dateTo),
			);
		});
	});

	describe("GET /reports/budget-status", () => {
		it("should return budget status report without date filters", async () => {
			const mockBudgetStatusReport = {
				data: [
					{
						categoryName: "Alimentação",
						budgetLimit: "1000.00",
						spent: "500.00",
						remaining: "500.00",
						percentageUsed: 50,
						status: "ok" as const,
					},
				],
				period: "Todas as datas",
			};

			jest
				.spyOn(service, "getBudgetStatus")
				.mockResolvedValue(mockBudgetStatusReport);

			const session = createMockSession();
			const result = await controller.getBudgetStatus(session);

			expect(result).toEqual(mockBudgetStatusReport);
			expect(service.getBudgetStatus).toHaveBeenCalledWith(
				TEST_USER_ID,
				undefined,
				undefined,
			);
		});

		it("should return budget status report with dateFrom", async () => {
			const mockBudgetStatusReport = {
				data: [],
				period: "2024-10-01 a hoje",
			};

			jest
				.spyOn(service, "getBudgetStatus")
				.mockResolvedValue(mockBudgetStatusReport);

			const session = createMockSession();
			const dateFrom = "2024-10-01T00:00:00Z";
			const result = await controller.getBudgetStatus(session, dateFrom);

			expect(result).toEqual(mockBudgetStatusReport);
			expect(service.getBudgetStatus).toHaveBeenCalledWith(
				TEST_USER_ID,
				new Date(dateFrom),
				undefined,
			);
		});

		it("should return budget status report with dateTo", async () => {
			const mockBudgetStatusReport = {
				data: [],
				period: "indefinido a 2024-10-31",
			};

			jest
				.spyOn(service, "getBudgetStatus")
				.mockResolvedValue(mockBudgetStatusReport);

			const session = createMockSession();
			const dateTo = "2024-10-31T23:59:59Z";
			const result = await controller.getBudgetStatus(
				session,
				undefined,
				dateTo,
			);

			expect(result).toEqual(mockBudgetStatusReport);
			expect(service.getBudgetStatus).toHaveBeenCalledWith(
				TEST_USER_ID,
				undefined,
				new Date(dateTo),
			);
		});

		it("should return budget status report with both date filters", async () => {
			const mockBudgetStatusReport = {
				data: [],
				period: "2024-10-01 a 2024-10-31",
			};

			jest
				.spyOn(service, "getBudgetStatus")
				.mockResolvedValue(mockBudgetStatusReport);

			const session = createMockSession();
			const dateFrom = "2024-10-01T00:00:00Z";
			const dateTo = "2024-10-31T23:59:59Z";
			const result = await controller.getBudgetStatus(
				session,
				dateFrom,
				dateTo,
			);

			expect(result).toEqual(mockBudgetStatusReport);
			expect(service.getBudgetStatus).toHaveBeenCalledWith(
				TEST_USER_ID,
				new Date(dateFrom),
				new Date(dateTo),
			);
		});
	});

	describe("GET /reports/trends", () => {
		it("should return trends report with default months", async () => {
			const mockTrendsReport = {
				data: [
					{
						month: "2024-05",
						income: "3000.00",
						expense: "1500.00",
						balance: "1500.00",
					},
					{
						month: "2024-06",
						income: "3200.00",
						expense: "1600.00",
						balance: "1600.00",
					},
				],
				months: 6,
			};

			jest.spyOn(service, "getTrends").mockResolvedValue(mockTrendsReport);

			const session = createMockSession();
			const result = await controller.getTrends(session);

			expect(result).toEqual(mockTrendsReport);
			expect(service.getTrends).toHaveBeenCalledWith(TEST_USER_ID, 6);
		});

		it("should return trends report with custom months", async () => {
			const mockTrendsReport = {
				data: [
					{
						month: "2024-01",
						income: "3000.00",
						expense: "1500.00",
						balance: "1500.00",
					},
				],
				months: 12,
			};

			jest.spyOn(service, "getTrends").mockResolvedValue(mockTrendsReport);

			const session = createMockSession();
			const result = await controller.getTrends(session, "12");

			expect(result).toEqual(mockTrendsReport);
			expect(service.getTrends).toHaveBeenCalledWith(TEST_USER_ID, 12);
		});

		it("should handle non-numeric months parameter", async () => {
			const mockTrendsReport = {
				data: [],
				months: 6,
			};

			jest.spyOn(service, "getTrends").mockResolvedValue(mockTrendsReport);

			const session = createMockSession();
			const result = await controller.getTrends(session, undefined);

			expect(result).toEqual(mockTrendsReport);
			expect(service.getTrends).toHaveBeenCalledWith(TEST_USER_ID, 6);
		});
	});
});

