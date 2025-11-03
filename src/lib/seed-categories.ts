import type { TransactionType } from "../../generated/prisma/client";
import { PrismaClient } from "../../generated/prisma/client";

/**
 * System categories that should not be deleted or modified by users
 */
export const SYSTEM_CATEGORIES = [
	{
		name: "Não Categorizado (Receita)",
		type: "INCOME" as TransactionType,
		color: "#6B7280",
		isSystem: true,
	},
	{
		name: "Não Categorizado (Despesa)",
		type: "EXPENSE" as TransactionType,
		color: "#6B7280",
		isSystem: true,
	},
];

/**
 * Default user categories created on signup
 */
export const DEFAULT_CATEGORIES = [
	// Income categories
	{
		name: "Salário",
		type: "INCOME" as TransactionType,
		color: "#10B981",
		isSystem: false,
	},
	{
		name: "Freelance",
		type: "INCOME" as TransactionType,
		color: "#059669",
		isSystem: false,
	},
	{
		name: "Investimentos",
		type: "INCOME" as TransactionType,
		color: "#3B82F6",
		isSystem: false,
	},
	{
		name: "Presentes",
		type: "INCOME" as TransactionType,
		color: "#8B5CF6",
		isSystem: false,
	},
	// Expense categories
	{
		name: "Alimentação",
		type: "EXPENSE" as TransactionType,
		color: "#EF4444",
		isSystem: false,
	},
	{
		name: "Moradia",
		type: "EXPENSE" as TransactionType,
		color: "#F59E0B",
		isSystem: false,
	},
	{
		name: "Transporte",
		type: "EXPENSE" as TransactionType,
		color: "#14B8A6",
		isSystem: false,
	},
	{
		name: "Lazer",
		type: "EXPENSE" as TransactionType,
		color: "#EC4899",
		isSystem: false,
	},
	{
		name: "Contas",
		type: "EXPENSE" as TransactionType,
		color: "#F97316",
		isSystem: false,
	},
	{
		name: "Outros",
		type: "EXPENSE" as TransactionType,
		color: "#6366F1",
		isSystem: false,
	},
];

/**
 * Seed user categories on signup
 * Creates both system and default categories for new user
 *
 * @param userId - The newly created user ID
 * @param prisma - Prisma client instance
 * @throws Will log error but not throw - signup should not fail if seeding fails
 */
export async function seedUserCategories(
	userId: string,
	prisma: PrismaClient,
): Promise<void> {
	try {
		const allCategories = [...SYSTEM_CATEGORIES, ...DEFAULT_CATEGORIES];

		await prisma.category.createMany({
			data: allCategories.map((cat) => ({
				userId,
				name: cat.name,
				type: cat.type,
				color: cat.color,
				isSystem: cat.isSystem,
			})),
		});

		console.log(`✓ Seeded ${allCategories.length} categories for user ${userId}`);
	} catch (error) {
		console.error(`✗ Failed to seed categories for user ${userId}:`, error);
		// Don't throw - signup should not fail due to category seeding
	}
}
