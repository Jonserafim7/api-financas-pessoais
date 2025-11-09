import {
	BadRequestException,
	Injectable,
	Logger,
	NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import type { CreateCategoryDto } from "./dto/create-category.dto";
import type { UpdateCategoryDto } from "./dto/update-category.dto";

/**
 * Manages user expense/income categories with unique name constraint per user
 */
@Injectable()
export class CategoriesService {
	private readonly logger = new Logger(CategoriesService.name);

	constructor(private prisma: PrismaService) {}

	/**
	 * Create category with unique name validation
	 * @throws BadRequestException if name already exists for this user
	 */
	async create(userId: string, createCategoryDto: CreateCategoryDto) {
		this.logger.debug(
			`Creating category for userId: ${userId}, name: ${createCategoryDto.name}, type: ${createCategoryDto.type}`,
		);

		try {
			const category = await this.prisma.category.create({
				data: {
					userId,
					name: createCategoryDto.name,
					type: createCategoryDto.type,
					color: createCategoryDto.color || "#3B82F6",
				},
			});
			this.logger.debug(`Category created successfully: ${category.id}`);
			return category;
		} catch (error) {
			if (error.code === "P2002") {
				this.logger.warn(
					`Duplicate category name for userId: ${userId}, name: ${createCategoryDto.name}`,
				);
				throw new BadRequestException(
					"Categoria com este nome já existe para este usuário",
				);
			}
			this.logger.error(`Error creating category: ${error.message}`);
			throw error;
		}
	}

	/**
	 * List all user categories ordered by creation date
	 * @param type Optional filter by category type (INCOME or EXPENSE)
	 */
	async findAll(userId: string, type?: "INCOME" | "EXPENSE") {
		this.logger.debug(
			`Fetching categories for userId: ${userId}, type: ${type || "all"}`,
		);
		const categories = await this.prisma.category.findMany({
			where: {
				userId,
				...(type && { type }),
			},
			orderBy: { createdAt: "desc" },
		});
		this.logger.debug(
			`Found ${categories.length} categories for userId: ${userId}`,
		);
		return categories;
	}

	/**
	 * Get single category by ID
	 * @throws NotFoundException if not found
	 */
	async findOne(id: string, userId: string) {
		this.logger.debug(`Fetching category - id: ${id}, userId: ${userId}`);
		const category = await this.prisma.category.findFirst({
			where: { id, userId },
		});

		if (!category) {
			this.logger.warn(`Category not found - id: ${id}, userId: ${userId}`);
			throw new NotFoundException("Categoria não encontrada");
		}

		this.logger.debug(`Category found: ${category.id}`);
		return category;
	}

	/**
	 * Update category with unique name validation
	 * @throws BadRequestException if new name already exists or if category is system category
	 */
	async update(
		id: string,
		userId: string,
		updateCategoryDto: UpdateCategoryDto,
	) {
		this.logger.debug(`Updating category - id: ${id}, userId: ${userId}`);
		const category = await this.findOne(id, userId);

		if (category.isSystem) {
			this.logger.warn(
				`Attempt to update system category - id: ${id}, userId: ${userId}`,
			);
			throw new BadRequestException(
				"Categorias do sistema não podem ser modificadas",
			);
		}

		try {
			const updated = await this.prisma.category.update({
				where: { id },
				data: updateCategoryDto,
			});
			this.logger.debug(`Category updated successfully: ${id}`);
			return updated;
		} catch (error) {
			if (error.code === "P2002") {
				this.logger.warn(
					`Duplicate category name on update - id: ${id}, userId: ${userId}`,
				);
				throw new BadRequestException(
					"Categoria com este nome já existe para este usuário",
				);
			}
			this.logger.error(`Error updating category: ${error.message}`);
			throw error;
		}
	}

	/**
	 * Delete category and reassign transactions to "Não Categorizado"
	 * @throws BadRequestException if category is system category
	 */
	async remove(id: string, userId: string) {
		this.logger.debug(`Deleting category - id: ${id}, userId: ${userId}`);
		const category = await this.findOne(id, userId);

		if (category.isSystem) {
			this.logger.warn(
				`Attempt to delete system category - id: ${id}, userId: ${userId}`,
			);
			throw new BadRequestException(
				"Categorias do sistema não podem ser removidas",
			);
		}

		// Find the appropriate uncategorized category based on type
		this.logger.debug(
			`Finding uncategorized category for type: ${category.type}`,
		);
		const uncategorizedCategory = await this.prisma.category.findFirst({
			where: {
				userId,
				isSystem: true,
				type: category.type,
				name:
					category.type === "INCOME"
						? "Não Categorizado (Receita)"
						: "Não Categorizado (Despesa)",
			},
		});

		if (!uncategorizedCategory) {
			this.logger.error(
				`Uncategorized category not found for userId: ${userId}, type: ${category.type}`,
			);
			throw new BadRequestException(
				"Categoria de sistema para reatribuição não encontrada",
			);
		}

		// Reassign transactions to uncategorized category, then delete category
		this.logger.debug(
			`Reassigning transactions from category ${id} to ${uncategorizedCategory.id}`,
		);
		return await this.prisma.$transaction(async (tx) => {
			const reassigned = await tx.transaction.updateMany({
				where: { categoryId: id },
				data: { categoryId: uncategorizedCategory.id },
			});

			this.logger.debug(
				`Reassigned ${reassigned.count} transactions, deleting category: ${id}`,
			);

			const deleted = await tx.category.delete({
				where: { id },
			});

			this.logger.debug(`Category deleted successfully: ${id}`);
			return deleted;
		});
	}
}
