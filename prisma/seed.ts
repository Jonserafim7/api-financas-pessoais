import dotenv from "dotenv";
import { PrismaClient } from "../generated/prisma/client";
import { auth } from "../src/lib/auth";

dotenv.config();

const prisma = new PrismaClient();

/**
 * Seed database with test users, categories, transactions, and budgets
 */
async function seed() {
	console.log("🌱 Starting database seed...");

	// Clear existing data (DANGER: only for development)
	await prisma.transaction.deleteMany();
	await prisma.budget.deleteMany();
	await prisma.category.deleteMany();
	await prisma.account.deleteMany();
	await prisma.user.deleteMany();

	// Create test users using Better Auth API (handles password hashing correctly)
	const testUsers = [
		{
			name: "João Silva",
			email: "joao@test.com",
			password: "password123",
		},
		{
			name: "Maria Santos",
			email: "maria@test.com",
			password: "password123",
		},
	];

	const createdUsers: any[] = [];

	for (const testUser of testUsers) {
		const response = await auth.api.signUpEmail({
			body: {
				name: testUser.name,
				email: testUser.email,
				password: testUser.password,
			},
		});
		// Get user from database to ensure it's created
		const user = await prisma.user.findUnique({
			where: { email: testUser.email },
		});
		if (user) {
			createdUsers.push(user);
		}
	}

	console.log("✅ Created test users");

	const user1Id = createdUsers[0].id;
	const user2Id = createdUsers[1].id;

	// Create categories for user1
	await prisma.category.createMany({
		data: [
			{
				userId: user1Id,
				name: "Alimentação",
				type: "EXPENSE",
				color: "#FF6B6B",
			},
			{
				userId: user1Id,
				name: "Transporte",
				type: "EXPENSE",
				color: "#4ECDC4",
			},
			{
				userId: user1Id,
				name: "Saúde",
				type: "EXPENSE",
				color: "#45B7D1",
			},
			{
				userId: user1Id,
				name: "Entretenimento",
				type: "EXPENSE",
				color: "#F7DC6F",
			},
			{
				userId: user1Id,
				name: "Salário",
				type: "INCOME",
				color: "#52C41A",
			},
			{
				userId: user1Id,
				name: "Freelance",
				type: "INCOME",
				color: "#13C2C2",
			},
		],
	});

	// Create categories for user2
	await prisma.category.createMany({
		data: [
			{
				userId: user2Id,
				name: "Alimentação",
				type: "EXPENSE",
				color: "#FF6B6B",
			},
			{
				userId: user2Id,
				name: "Moradia",
				type: "EXPENSE",
				color: "#A78BFA",
			},
			{
				userId: user2Id,
				name: "Educação",
				type: "EXPENSE",
				color: "#60A5FA",
			},
			{
				userId: user2Id,
				name: "Salário",
				type: "INCOME",
				color: "#52C41A",
			},
		],
	});

	console.log("✅ Created categories");

	// Get categories for transactions
	const user1Categories = await prisma.category.findMany({
		where: { userId: user1Id },
	});

	const user2Categories = await prisma.category.findMany({
		where: { userId: user2Id },
	});

	// Create transactions for user1 (last 3 months)
	const now = new Date();
	const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);

	const transactionsUser1: any[] = [];
	for (let i = 0; i < 20; i++) {
		const date = new Date(
			threeMonthsAgo.getTime() + Math.random() * (now.getTime() - threeMonthsAgo.getTime())
		);
		const isIncome = Math.random() > 0.8;
		const category = isIncome
			? user1Categories.find((c) => c.type === "INCOME")
			: user1Categories.find((c) => c.type === "EXPENSE");

		transactionsUser1.push({
			userId: user1Id,
			categoryId: category!.id,
			type: category!.type,
			amount: isIncome ? Math.random() * 5000 + 2000 : Math.random() * 500 + 50,
			description: isIncome ? "Renda do mês" : `Despesa categoria ${category!.name}`,
			date,
		});
	}

	await prisma.transaction.createMany({
		data: transactionsUser1,
	});

	// Create transactions for user2
	const transactionsUser2: any[] = [];
	for (let i = 0; i < 15; i++) {
		const date = new Date(
			threeMonthsAgo.getTime() + Math.random() * (now.getTime() - threeMonthsAgo.getTime())
		);
		const isIncome = Math.random() > 0.85;
		const category = isIncome
			? user2Categories.find((c) => c.type === "INCOME")
			: user2Categories.find((c) => c.type === "EXPENSE");

		transactionsUser2.push({
			userId: user2Id,
			categoryId: category!.id,
			type: category!.type,
			amount: isIncome ? Math.random() * 4000 + 3000 : Math.random() * 800 + 100,
			description: isIncome ? "Salário mensal" : `Despesa em ${category!.name}`,
			date,
		});
	}

	await prisma.transaction.createMany({
		data: transactionsUser2,
	});

	console.log("✅ Created transactions");

	// Create budgets for user1
	const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
	const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

	const foodCategory1 = user1Categories.find((c) => c.name === "Alimentação");
	const transportCategory1 = user1Categories.find((c) => c.name === "Transporte");

	await prisma.budget.createMany({
		data: [
			{
				userId: user1Id,
				categoryId: foodCategory1!.id,
				amount: 800,
				period: "MONTHLY",
				startDate: startOfMonth,
				endDate: endOfMonth,
			},
			{
				userId: user1Id,
				categoryId: transportCategory1!.id,
				amount: 500,
				period: "MONTHLY",
				startDate: startOfMonth,
				endDate: endOfMonth,
			},
			{
				userId: user1Id,
				categoryId: null, // Overall budget
				amount: 3000,
				period: "MONTHLY",
				startDate: startOfMonth,
				endDate: endOfMonth,
			},
		],
	});

	// Create budgets for user2
	const moradia = user2Categories.find((c) => c.name === "Moradia");

	await prisma.budget.createMany({
		data: [
			{
				userId: user2Id,
				categoryId: moradia!.id,
				amount: 1500,
				period: "MONTHLY",
				startDate: startOfMonth,
				endDate: endOfMonth,
			},
			{
				userId: user2Id,
				categoryId: null, // Overall budget
				amount: 3500,
				period: "MONTHLY",
				startDate: startOfMonth,
				endDate: endOfMonth,
			},
		],
	});

	console.log("✅ Created budgets");

	console.log("\n✨ Seed completed successfully!");
	console.log("\n📝 Test Credentials:");
	console.log("  User 1: joao@test.com / password123");
	console.log("  User 2: maria@test.com / password123");
}

seed()
	.catch((e) => {
		console.error("❌ Seed failed:", e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
