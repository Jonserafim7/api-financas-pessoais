import {
	BadRequestException,
	Injectable,
	NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import type { CreateBudgetDto } from "./dto/create-budget.dto";
import type { UpdateBudgetDto } from "./dto/update-budget.dto";

/**
 * Manages budget limits with period-based spending tracking
 */
@Injectable()
export class BudgetsService {
	constructor(private prisma: PrismaService) {}

	/**
	 * Create budget with category and date validation
	 * @throws BadRequestException if category not found or endDate invalid
	 */
	async create(userId: string, createBudgetDto: CreateBudgetDto) {
		// Ensure category belongs to user (optional)
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

		// Ensure period validity: endDate must be after startDate
		const startDate = new Date(createBudgetDto.startDate);
		const endDate = createBudgetDto.endDate
			? new Date(createBudgetDto.endDate)
			: null;

		if (endDate && endDate <= startDate) {
			throw new BadRequestException(
				"Data de término deve ser posterior à data de início",
			);
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

	/**
	 * List all user budgets with category details
	 */
	async findAll(userId: string) {
		return this.prisma.budget.findMany({
			where: { userId },
			orderBy: { createdAt: "desc" },
			include: { category: true },
		});
	}

	/**
	 * Get single budget by ID
	 * @throws NotFoundException if not found
	 */
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

	/**
	 * Update budget with date and category validation
	 * @throws BadRequestException if date/category validation fails
	 */
	async update(id: string, userId: string, updateBudgetDto: UpdateBudgetDto) {
		await this.findOne(id, userId);

		// Validate category ownership if changing category
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

		// biome-ignore lint/suspicious/noExplicitAny: permite construção dinâmica do objeto data com propriedades condicionais
		const data: any = { ...updateBudgetDto };

		if (data.startDate) {
			data.startDate = new Date(data.startDate);
		}

		if (data.endDate) {
			data.endDate = new Date(data.endDate);

			// Validate period: endDate must be after startDate (whether new or existing)
			if (!data.startDate) {
				const current = await this.prisma.budget.findUnique({
					where: { id },
				});
				if (current && data.endDate <= current.startDate) {
					throw new BadRequestException(
						"Data de término deve ser posterior à data de início",
					);
				}
			} else if (data.endDate <= data.startDate) {
				throw new BadRequestException(
					"Data de término deve ser posterior à data de início",
				);
			}
		}

		return await this.prisma.budget.update({
			where: { id },
			data,
			include: { category: true },
		});
	}

	/**
	 * Delete budget
	 */
	async remove(id: string, userId: string) {
		await this.findOne(id, userId);

		return await this.prisma.budget.delete({
			where: { id },
		});
	}
}
