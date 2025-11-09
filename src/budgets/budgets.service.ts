import {
	BadRequestException,
	Injectable,
	Logger,
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
	private readonly logger = new Logger(BudgetsService.name);

	constructor(private prisma: PrismaService) {}

	/**
	 * Create budget with category and date validation
	 * @throws BadRequestException if category not found or endDate invalid
	 */
	async create(userId: string, createBudgetDto: CreateBudgetDto) {
		this.logger.debug(
			`Creating budget for userId: ${userId}, categoryId: ${createBudgetDto.categoryId || "overall"}, amount: ${createBudgetDto.amount}, period: ${createBudgetDto.period}, startDate: ${createBudgetDto.startDate}, endDate: ${createBudgetDto.endDate || "null"}`,
		);

		// Ensure category belongs to user (optional)
		if (createBudgetDto.categoryId) {
			const category = await this.prisma.category.findFirst({
				where: {
					id: createBudgetDto.categoryId,
					userId,
				},
			});

			if (!category) {
				this.logger.warn(
					`Category not found for budget - userId: ${userId}, categoryId: ${createBudgetDto.categoryId}`,
				);
				throw new BadRequestException("Categoria não encontrada");
			}
		}

		// Ensure period validity: endDate must be after startDate
		const startDate = new Date(createBudgetDto.startDate);
		const endDate = createBudgetDto.endDate
			? new Date(createBudgetDto.endDate)
			: null;

		if (endDate && endDate <= startDate) {
			this.logger.warn(
				`Invalid date range for budget - userId: ${userId}, startDate: ${startDate}, endDate: ${endDate}`,
			);
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

		this.logger.debug(`Budget created successfully: ${budget.id}`);
		return budget;
	}

	/**
	 * List all user budgets with category details
	 */
	async findAll(userId: string) {
		this.logger.debug(`Fetching all budgets for userId: ${userId}`);

		const budgets = await this.prisma.budget.findMany({
			where: { userId },
			orderBy: { createdAt: "desc" },
			include: { category: true },
		});

		this.logger.debug(`Found ${budgets.length} budgets for userId: ${userId}`);
		return budgets;
	}

	/**
	 * Get single budget by ID
	 * @throws NotFoundException if not found
	 */
	async findOne(id: string, userId: string) {
		this.logger.debug(`Fetching budget - id: ${id}, userId: ${userId}`);

		const budget = await this.prisma.budget.findFirst({
			where: { id, userId },
			include: { category: true },
		});

		if (!budget) {
			this.logger.warn(`Budget not found - id: ${id}, userId: ${userId}`);
			throw new NotFoundException("Orçamento não encontrado");
		}

		this.logger.debug(`Budget found: ${budget.id}`);
		return budget;
	}

	/**
	 * Update budget with date and category validation
	 * @throws BadRequestException if date/category validation fails
	 */
	async update(id: string, userId: string, updateBudgetDto: UpdateBudgetDto) {
		this.logger.debug(`Updating budget - id: ${id}, userId: ${userId}`);

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
				this.logger.warn(
					`Category not found on budget update - id: ${id}, userId: ${userId}, categoryId: ${updateBudgetDto.categoryId}`,
				);
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
					this.logger.warn(
						`Invalid date range on budget update - id: ${id}, userId: ${userId}, endDate: ${data.endDate}, current startDate: ${current.startDate}`,
					);
					throw new BadRequestException(
						"Data de término deve ser posterior à data de início",
					);
				}
			} else if (data.endDate <= data.startDate) {
				this.logger.warn(
					`Invalid date range on budget update - id: ${id}, userId: ${userId}, startDate: ${data.startDate}, endDate: ${data.endDate}`,
				);
				throw new BadRequestException(
					"Data de término deve ser posterior à data de início",
				);
			}
		}

		const updated = await this.prisma.budget.update({
			where: { id },
			data,
			include: { category: true },
		});

		this.logger.debug(`Budget updated successfully: ${id}`);
		return updated;
	}

	/**
	 * Delete budget
	 */
	async remove(id: string, userId: string) {
		this.logger.debug(`Deleting budget - id: ${id}, userId: ${userId}`);

		await this.findOne(id, userId);

		const deleted = await this.prisma.budget.delete({
			where: { id },
		});

		this.logger.debug(`Budget deleted successfully: ${id}`);
		return deleted;
	}
}
