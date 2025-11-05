import {
	BadRequestException,
	Injectable,
	Logger,
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
	private readonly logger = new Logger(TransactionsService.name);

	constructor(private prisma: PrismaService) {}

	/**
	 * Create transaction with category ownership validation
	 * @throws BadRequestException if category not found or doesn't belong to user
	 */
	async create(userId: string, createTransactionDto: CreateTransactionDto) {
		this.logger.debug(
			`Creating transaction for userId: ${userId}, type: ${createTransactionDto.type}, amount: ${createTransactionDto.amount}, categoryId: ${createTransactionDto.categoryId}, description: ${createTransactionDto.description}`,
		);

		// Ensure category belongs to user before creating transaction
		const category = await this.prisma.category.findFirst({
			where: {
				id: createTransactionDto.categoryId,
				userId,
			},
		});

		if (!category) {
			this.logger.warn(
				`Category not found for transaction - userId: ${userId}, categoryId: ${createTransactionDto.categoryId}`,
			);
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
		include: { category: true },
	});

	this.logger.debug(`Transaction created successfully: ${transaction.id}`);
	return transaction;
	}

	/**
	 * List transactions with optional filters (date range, category, type)
	 */
	async findAll(userId: string, filters?: FilterTransactionDto) {
		this.logger.debug(
			`Fetching transactions for userId: ${userId}, filters: ${JSON.stringify(filters || {})}`,
		);

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

		const transactions = await this.prisma.transaction.findMany({
			where,
			orderBy: { date: "desc" },
			include: { category: true },
		});

		this.logger.debug(
			`Found ${transactions.length} transactions for userId: ${userId}`,
		);
		return transactions;
	}

	/**
	 * Get single transaction with category details
	 * @throws NotFoundException if not found
	 */
	async findOne(id: string, userId: string) {
		this.logger.debug(
			`Fetching transaction - id: ${id}, userId: ${userId}`,
		);

		const transaction = await this.prisma.transaction.findFirst({
			where: { id, userId },
			include: { category: true },
		});

		if (!transaction) {
			this.logger.warn(
				`Transaction not found - id: ${id}, userId: ${userId}`,
			);
			throw new NotFoundException("Transação não encontrada");
		}

		this.logger.debug(`Transaction found: ${transaction.id}`);
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
		this.logger.debug(
			`Updating transaction - id: ${id}, userId: ${userId}`,
		);

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
				this.logger.warn(
					`Category not found on update - id: ${id}, userId: ${userId}, categoryId: ${updateTransactionDto.categoryId}`,
				);
				throw new BadRequestException("Categoria não encontrada");
			}
		}

		// biome-ignore lint/suspicious/noExplicitAny: necessário para permitir mutação do tipo date de string para Date
		const data: any = { ...updateTransactionDto };
		if (data.date) {
			data.date = new Date(data.date);
		}

		const updated = await this.prisma.transaction.update({
			where: { id },
			data,
			include: { category: true },
		});

		this.logger.debug(`Transaction updated successfully: ${id}`);
		return updated;
	}

	/**
	 * Delete transaction
	 */
	async remove(id: string, userId: string) {
		this.logger.debug(
			`Deleting transaction - id: ${id}, userId: ${userId}`,
		);

		await this.findOne(id, userId);

		const deleted = await this.prisma.transaction.delete({
			where: { id },
		});

		this.logger.debug(`Transaction deleted successfully: ${id}`);
		return deleted;
	}
}
