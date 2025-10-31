import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { CreateTransactionDto } from "./dto/create-transaction.dto";
import { UpdateTransactionDto } from "./dto/update-transaction.dto";

@Injectable()
export class TransactionsService {
	constructor(private prisma: PrismaService) {}

	async create(userId: string, createTransactionDto: CreateTransactionDto) {
		// Verify category exists and belongs to user
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

	async findAll(
		userId: string,
		filters?: {
			dateFrom?: Date;
			dateTo?: Date;
			categoryId?: string;
			type?: string;
		},
	) {
		const where: any = { userId };

		if (filters?.dateFrom || filters?.dateTo) {
			where.date = {};
			if (filters.dateFrom) where.date.gte = filters.dateFrom;
			if (filters.dateTo) where.date.lte = filters.dateTo;
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

	async update(id: string, userId: string, updateTransactionDto: UpdateTransactionDto) {
		await this.findOne(id, userId);

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

	async remove(id: string, userId: string) {
		await this.findOne(id, userId);

		return await this.prisma.transaction.delete({
			where: { id },
		});
	}
}
