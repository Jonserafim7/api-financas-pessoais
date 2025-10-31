import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { CreateBudgetDto } from "./dto/create-budget.dto";
import { UpdateBudgetDto } from "./dto/update-budget.dto";

@Injectable()
export class BudgetsService {
	constructor(private prisma: PrismaService) {}

	async create(userId: string, createBudgetDto: CreateBudgetDto) {
		// Verify category exists if provided
		if (createBudgetDto.categoryId) {
			const category = await this.prisma.category.findFirst({
				where: {
					id: createBudgetDto.categoryId,
					userId,
				},
			});

			if (!category) {
				throw new BadRequestException("Categoria não encontrada");
			}
		}

		// Validate dates
		const startDate = new Date(createBudgetDto.startDate);
		const endDate = createBudgetDto.endDate ? new Date(createBudgetDto.endDate) : null;

		if (endDate && endDate <= startDate) {
			throw new BadRequestException("Data de término deve ser posterior à data de início");
		}

		const budget = await this.prisma.budget.create({
			data: {
				userId,
				categoryId: createBudgetDto.categoryId,
				amount: createBudgetDto.amount,
				period: createBudgetDto.period,
				startDate,
				endDate,
			},
		});

		return budget;
	}

	async findAll(userId: string) {
		return this.prisma.budget.findMany({
			where: { userId },
			orderBy: { createdAt: "desc" },
			include: { category: true },
		});
	}

	async findOne(id: string, userId: string) {
		const budget = await this.prisma.budget.findFirst({
			where: { id, userId },
			include: { category: true },
		});

		if (!budget) {
			throw new NotFoundException("Orçamento não encontrado");
		}

		return budget;
	}

	async update(id: string, userId: string, updateBudgetDto: UpdateBudgetDto) {
		await this.findOne(id, userId);

		if (updateBudgetDto.categoryId) {
			const category = await this.prisma.category.findFirst({
				where: {
					id: updateBudgetDto.categoryId,
					userId,
				},
			});

			if (!category) {
				throw new BadRequestException("Categoria não encontrada");
			}
		}

		const data: any = { ...updateBudgetDto };

		if (data.startDate) {
			data.startDate = new Date(data.startDate);
		}

		if (data.endDate) {
			data.endDate = new Date(data.endDate);

			// Get current startDate if not being updated
			if (!data.startDate) {
				const current = await this.prisma.budget.findUnique({
					where: { id },
				});
				if (current && data.endDate <= current.startDate) {
					throw new BadRequestException("Data de término deve ser posterior à data de início");
				}
			} else if (data.endDate <= data.startDate) {
				throw new BadRequestException("Data de término deve ser posterior à data de início");
			}
		}

		return await this.prisma.budget.update({
			where: { id },
			data,
			include: { category: true },
		});
	}

	async remove(id: string, userId: string) {
		await this.findOne(id, userId);

		return await this.prisma.budget.delete({
			where: { id },
		});
	}
}
