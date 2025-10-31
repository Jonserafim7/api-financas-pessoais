import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";

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
				throw new BadRequestException("Categoria com este nome já existe para este usuário");
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
	 * @throws BadRequestException if new name already exists
	 */
	async update(id: string, userId: string, updateCategoryDto: UpdateCategoryDto) {
		await this.findOne(id, userId);

		try {
			return await this.prisma.category.update({
				where: { id },
				data: updateCategoryDto,
			});
		} catch (error) {
			if (error.code === "P2002") {
				throw new BadRequestException("Categoria com este nome já existe para este usuário");
			}
			throw error;
		}
	}

	/**
	 * Delete category (cascades to transactions)
	 */
	async remove(id: string, userId: string) {
		await this.findOne(id, userId);

		return await this.prisma.category.delete({
			where: { id },
		});
	}
}
