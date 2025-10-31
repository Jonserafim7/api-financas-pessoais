import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { SummaryReportDto } from "./dto/summary-report.dto";
import { CategoryReportDto } from "./dto/category-report.dto";
import { BudgetStatusReportDto, BudgetStatusItemDto } from "./dto/budget-status-report.dto";
import { TrendsReportDto } from "./dto/trends-report.dto";

/**
 * Generates financial analytics and reports for spending analysis
 */
@Injectable()
export class ReportsService {
	constructor(private prisma: PrismaService) {}

	/**
	 * Calculate total income, expense, and balance for period
	 */
	async getSummary(userId: string, dateFrom?: Date, dateTo?: Date): Promise<SummaryReportDto> {
		const where: any = { userId };

		if (dateFrom || dateTo) {
			where.date = {};
			if (dateFrom) where.date.gte = dateFrom;
			if (dateTo) where.date.lte = dateTo;
		}

		const transactions = await this.prisma.transaction.findMany({
			where,
		});

		const totalIncome = transactions
			.filter((t) => t.type === "INCOME")
			.reduce((sum, t) => sum + Number(t.amount), 0);

		const totalExpense = transactions
			.filter((t) => t.type === "EXPENSE")
			.reduce((sum, t) => sum + Number(t.amount), 0);

		const balance = totalIncome - totalExpense;

		const periodStr = this.getPeriodString(dateFrom, dateTo);

		return {
			totalIncome: totalIncome.toFixed(2),
			totalExpense: totalExpense.toFixed(2),
			balance: balance.toFixed(2),
			period: periodStr,
		};
	}

	/**
	 * Aggregate spending by category and type (income/expense)
	 */
	async getByCategory(userId: string, dateFrom?: Date, dateTo?: Date): Promise<CategoryReportDto> {
		const where: any = { userId };

		if (dateFrom || dateTo) {
			where.date = {};
			if (dateFrom) where.date.gte = dateFrom;
			if (dateTo) where.date.lte = dateTo;
		}

		const transactions = await this.prisma.transaction.findMany({
			where,
			include: { category: true },
			orderBy: { category: { name: "asc" } },
		});

		// Group transactions by category name and type
		const grouped = new Map<string, { total: number; count: number; type: string }>();

		for (const transaction of transactions) {
			const key = `${transaction.category.name}-${transaction.type}`;
			const current = grouped.get(key) || { total: 0, count: 0, type: transaction.type };
			current.total += Number(transaction.amount);
			current.count++;
			grouped.set(key, current);
		}

		const data = Array.from(grouped.entries()).map(([key, value]) => ({
			categoryName: key.split("-")[0],
			type: value.type,
			total: value.total.toFixed(2),
			count: value.count,
		}));

		const periodStr = this.getPeriodString(dateFrom, dateTo);

		return {
			data,
			period: periodStr,
		};
	}

	/**
	 * Compare actual spending vs budget limits with status indicators
	 */
	async getBudgetStatus(userId: string, dateFrom?: Date, dateTo?: Date): Promise<BudgetStatusReportDto> {
		const budgets = await this.prisma.budget.findMany({
			where: { userId },
			include: { category: true },
		});

		const transactionWhere: any = { userId };

		if (dateFrom || dateTo) {
			transactionWhere.date = {};
			if (dateFrom) transactionWhere.date.gte = dateFrom;
			if (dateTo) transactionWhere.date.lte = dateTo;
		}

		const transactions = await this.prisma.transaction.findMany({
			where: transactionWhere,
		});

		const data: BudgetStatusItemDto[] = budgets.map((budget) => {
			// Calculate spent amount: sum of expenses for this budget (category or overall)
			let spent = 0;

			if (budget.categoryId) {
				// Category-specific budget: sum expenses for this category only
				spent = transactions
					.filter((t) => t.categoryId === budget.categoryId && t.type === "EXPENSE")
					.reduce((sum, t) => sum + Number(t.amount), 0);
			} else {
				// Overall budget: sum all expenses
				spent = transactions
					.filter((t) => t.type === "EXPENSE")
					.reduce((sum, t) => sum + Number(t.amount), 0);
			}

			const budgetAmount = Number(budget.amount);
			const remaining = budgetAmount - spent;
			const percentageUsed = (spent / budgetAmount) * 100;

			// Status: exceeded (>=100%), warning (>=80%), ok (<80%)
			let status: "ok" | "warning" | "exceeded" = "ok";
			if (percentageUsed >= 100) {
				status = "exceeded";
			} else if (percentageUsed >= 80) {
				status = "warning";
			}

			return {
				categoryName: budget.category?.name || "Geral",
				budgetLimit: budgetAmount.toFixed(2),
				spent: spent.toFixed(2),
				remaining: remaining.toFixed(2),
				percentageUsed: Math.round(percentageUsed),
				status,
			};
		});

		const periodStr = this.getPeriodString(dateFrom, dateTo);

		return {
			data,
			period: periodStr,
		};
	}

	/**
	 * Calculate monthly income/expense trends for last N months
	 */
	async getTrends(userId: string, months: number = 6): Promise<TrendsReportDto> {
		const endDate = new Date();
		const startDate = new Date();
		startDate.setMonth(startDate.getMonth() - months + 1);
		startDate.setDate(1);
		startDate.setHours(0, 0, 0, 0);

		const transactions = await this.prisma.transaction.findMany({
			where: {
				userId,
				date: {
					gte: startDate,
					lte: endDate,
				},
			},
		});

		const monthlyData = new Map<string, { income: number; expense: number }>();

		// Initialize all months with zero values (ensures complete data even for months with no transactions)
		for (let i = 0; i < months; i++) {
			const date = new Date();
			date.setMonth(date.getMonth() - months + 1 + i);
			const monthKey = date.toISOString().slice(0, 7);
			monthlyData.set(monthKey, { income: 0, expense: 0 });
		}

		// Aggregate transactions by month and type
		for (const transaction of transactions) {
			const monthKey = transaction.date.toISOString().slice(0, 7);
			const current = monthlyData.get(monthKey) || { income: 0, expense: 0 };

			if (transaction.type === "INCOME") {
				current.income += Number(transaction.amount);
			} else {
				current.expense += Number(transaction.amount);
			}

			monthlyData.set(monthKey, current);
		}

		const data = Array.from(monthlyData.entries())
			.sort()
			.map(([month, values]) => ({
				month,
				income: values.income.toFixed(2),
				expense: values.expense.toFixed(2),
				balance: (values.income - values.expense).toFixed(2),
			}));

		return {
			data,
			months,
		};
	}

	/**
	 * Format date range for report display
	 * @private
	 */
	private getPeriodString(dateFrom?: Date, dateTo?: Date): string {
		if (!dateFrom && !dateTo) {
			return "Todas as datas";
		}

		const fromStr = dateFrom ? dateFrom.toISOString().split("T")[0] : "indefinido";
		const toStr = dateTo ? dateTo.toISOString().split("T")[0] : "hoje";

		return `${fromStr} a ${toStr}`;
	}
}
