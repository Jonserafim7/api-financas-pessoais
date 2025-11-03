import {
	BadRequestException,
	Injectable,
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
	constructor(private prisma: PrismaService) {}

	/**
	 * Create category with unique name validation
	 * @throws BadRequestException if name already exists for this user
	 */
	async create(userId: string, createCategoryDto: CreateCategoryDto) {
		try {
			const category = await this.prisma.category.create({
				data: {
					userId,
					name: createCategoryDto.name,
					type: createCategoryDto.type,
					color: createCategoryDto.color || "#3B82F6",
				},
			});
			return category;
		} catch (error) {
			if (error.code === "P2002") {
				throw new BadRequestException(
					"Categoria com este nome já existe para este usuário",
				);
			}
			throw error;
		}
	}

	/**
	 * List all user categories ordered by creation date
	 */
	async findAll(userId: string) {
		return this.prisma.category.findMany({
			where: { userId },
			orderBy: { createdAt: "desc" },
		});
	}

	/**
	 * Get single category by ID
	 * @throws NotFoundException if not found
	 */
	async findOne(id: string, userId: string) {
		const category = await this.prisma.category.findFirst({
			where: { id, userId },
		});

		if (!category) {
			throw new NotFoundException("Categoria não encontrada");
		}

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
		const category = await this.findOne(id, userId);

		if (category.isSystem) {
			throw new BadRequestException(
				"Categorias do sistema não podem ser modificadas",
			);
		}

		try {
			return await this.prisma.category.update({
				where: { id },
				data: updateCategoryDto,
			});
		} catch (error) {
			if (error.code === "P2002") {
				throw new BadRequestException(
					"Categoria com este nome já existe para este usuário",
				);
			}
			throw error;
		}
	}

	/**
	 * Delete category and reassign transactions to "Não Categorizado"
	 * @throws BadRequestException if category is system category
	 */
	async remove(id: string, userId: string) {
		const category = await this.findOne(id, userId);

		if (category.isSystem) {
			throw new BadRequestException(
				"Categorias do sistema não podem ser removidas",
			);
		}

		// Find the appropriate uncategorized category based on type
		const uncategorizedCategory = await this.prisma.category.findFirst({
			where: {
				userId,
				isSystem: true,
				type: category.type,
				name: category.type === "INCOME"
					? "Não Categorizado (Receita)"
					: "Não Categorizado (Despesa)",
			},
		});

		if (!uncategorizedCategory) {
			throw new BadRequestException(
				"Categoria de sistema para reatribuição não encontrada",
			);
		}

		// Reassign transactions to uncategorized category, then delete category
		return await this.prisma.$transaction(async (tx) => {
			await tx.transaction.updateMany({
				where: { categoryId: id },
				data: { categoryId: uncategorizedCategory.id },
			});

			return await tx.category.delete({
				where: { id },
			});
		});
	}
}
