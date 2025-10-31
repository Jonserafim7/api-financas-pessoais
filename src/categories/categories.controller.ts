import { Controller, Get, Post, Body, Param, Put, Delete } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from "@nestjs/swagger";
import { Session, UserSession } from "@thallesp/nestjs-better-auth";
import { CategoriesService } from "./categories.service";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";
import { CategoryResponseDto } from "./dto/category-response.dto";

@Controller("categories")
@ApiTags("Categories")
@ApiBearerAuth()
export class CategoriesController {
	constructor(private readonly categoriesService: CategoriesService) {}

	@Post()
	@ApiOperation({ summary: "Criar nova categoria" })
	@ApiResponse({
		status: 201,
		description: "Categoria criada com sucesso",
		type: CategoryResponseDto,
	})
	@ApiResponse({ status: 400, description: "Categoria com este nome já existe" })
	async create(
		@Session() session: UserSession,
		@Body() createCategoryDto: CreateCategoryDto,
	) {
		return this.categoriesService.create(session.user.id, createCategoryDto);
	}

	@Get()
	@ApiOperation({ summary: "Listar todas as categorias do usuário" })
	@ApiResponse({
		status: 200,
		description: "Lista de categorias",
		type: [CategoryResponseDto],
	})
	async findAll(@Session() session: UserSession) {
		return this.categoriesService.findAll(session.user.id);
	}

	@Get(":id")
	@ApiOperation({ summary: "Obter categoria por ID" })
	@ApiResponse({
		status: 200,
		description: "Categoria encontrada",
		type: CategoryResponseDto,
	})
	@ApiResponse({ status: 404, description: "Categoria não encontrada" })
	async findOne(@Param("id") id: string, @Session() session: UserSession) {
		return this.categoriesService.findOne(id, session.user.id);
	}

	@Put(":id")
	@ApiOperation({ summary: "Atualizar categoria" })
	@ApiResponse({
		status: 200,
		description: "Categoria atualizada com sucesso",
		type: CategoryResponseDto,
	})
	@ApiResponse({ status: 404, description: "Categoria não encontrada" })
	@ApiResponse({ status: 400, description: "Categoria com este nome já existe" })
	async update(
		@Param("id") id: string,
		@Session() session: UserSession,
		@Body() updateCategoryDto: UpdateCategoryDto,
	) {
		return this.categoriesService.update(id, session.user.id, updateCategoryDto);
	}

	@Delete(":id")
	@ApiOperation({ summary: "Deletar categoria" })
	@ApiResponse({ status: 200, description: "Categoria deletada com sucesso" })
	@ApiResponse({ status: 404, description: "Categoria não encontrada" })
	async remove(@Param("id") id: string, @Session() session: UserSession) {
		return this.categoriesService.remove(id, session.user.id);
	}
}
