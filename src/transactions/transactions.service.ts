import {
	BadRequestException,
	Injectable,
	NotFoundException,
} from "@nestjs/common";
import type { Prisma } from "../../generated/prisma/client";
import { PrismaService } from "../prisma.service";
import type { CreateTransactionDto } from "./dto/create-transaction.dto";
import type { FilterTransactionDto } from "./dto/filter-transaction.dto";
import type { UpdateTransactionDto } from "./dto/update-transaction.dto";

/**
 * Manages user income/expense transactions with category validation
 */
@Injectable()
export class TransactionsService {
	constructor(private prisma: PrismaService) {}

	/**
	 * Create transaction with category ownership validation
	 * @throws BadRequestException if category not found or doesn't belong to user
	 */
	async create(userId: string, createTransactionDto: CreateTransactionDto) {
		// Ensure category belongs to user before creating transaction
		const category = await this.prisma.category.findFirst({
			where: {
				id: createTransactionDto.categoryId,
				userId,
			},
		});

		if (!category) {
			throw new BadRequestException("Categoria não encontrada");
		}

		const transaction = await this.prisma.transaction.create({
			data: {
				userId,
				categoryId: createTransactionDto.categoryId,
				amount: createTransactionDto.amount,
				description: createTransactionDto.description,
				date: new Date(createTransactionDto.date),
				type: createTransactionDto.type,
			},
		});

		return transaction;
	}

	/**
	 * List transactions with optional filters (date range, category, type)
	 */
	async findAll(userId: string, filters?: FilterTransactionDto) {
		const where: Prisma.TransactionWhereInput = { userId };

		if (filters?.dateFrom || filters?.dateTo) {
			where.date = {};
			if (filters.dateFrom) where.date.gte = new Date(filters.dateFrom);
			if (filters.dateTo) where.date.lte = new Date(filters.dateTo);
		}

		if (filters?.categoryId) {
			where.categoryId = filters.categoryId;
		}

		if (filters?.type) {
			where.type = filters.type;
		}

		return this.prisma.transaction.findMany({
			where,
			orderBy: { date: "desc" },
			include: { category: true },
		});
	}

	/**
	 * Get single transaction with category details
	 * @throws NotFoundException if not found
	 */
	async findOne(id: string, userId: string) {
		const transaction = await this.prisma.transaction.findFirst({
			where: { id, userId },
			include: { category: true },
		});

		if (!transaction) {
			throw new NotFoundException("Transação não encontrada");
		}

		return transaction;
	}

	/**
	 * Update transaction with optional category change
	 * @throws BadRequestException if new category doesn't belong to user
	 */
	async update(
		id: string,
		userId: string,
		updateTransactionDto: UpdateTransactionDto,
	) {
		await this.findOne(id, userId);

		// Validate category ownership if category is being changed
		if (updateTransactionDto.categoryId) {
			const category = await this.prisma.category.findFirst({
				where: {
					id: updateTransactionDto.categoryId,
					userId,
				},
			});

			if (!category) {
				throw new BadRequestException("Categoria não encontrada");
			}
		}

		// biome-ignore lint/suspicious/noExplicitAny: necessário para permitir mutação do tipo date de string para Date
		const data: any = { ...updateTransactionDto };
		if (data.date) {
			data.date = new Date(data.date);
		}

		return await this.prisma.transaction.update({
			where: { id },
			data,
			include: { category: true },
		});
	}

	/**
	 * Delete transaction
	 */
	async remove(id: string, userId: string) {
		await this.findOne(id, userId);

		return await this.prisma.transaction.delete({
			where: { id },
		});
	}
}
