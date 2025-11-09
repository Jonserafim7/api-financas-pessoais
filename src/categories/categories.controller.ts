import {
	Body,
	Controller,
	Delete,
	Get,
	Logger,
	Param,
	Post,
	Put,
	Query,
} from "@nestjs/common";
import {
	ApiBearerAuth,
	ApiOperation,
	ApiParam,
	ApiQuery,
	ApiResponse,
	ApiTags,
} from "@nestjs/swagger";
import { Session, type UserSession } from "@thallesp/nestjs-better-auth";
import { CategoriesService } from "./categories.service";
import { CategoryResponseDto } from "./dto/category-response.dto";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { FindAllCategoriesQueryDto } from "./dto/find-all-categories-query.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";

@Controller("categories")
@ApiTags("Categories")
@ApiBearerAuth()
export class CategoriesController {
	private readonly logger = new Logger(CategoriesController.name);

	constructor(private readonly categoriesService: CategoriesService) {}

	@Post()
	@ApiOperation({ summary: "Criar nova categoria" })
	@ApiResponse({
		status: 201,
		description: "Categoria criada com sucesso",
		type: CategoryResponseDto,
	})
	@ApiResponse({
		status: 400,
		description: "Categoria com este nome já existe",
	})
	async create(
		@Session() session: UserSession,
		@Body() createCategoryDto: CreateCategoryDto,
	) {
		this.logger.debug(
			`POST /categories - userId: ${session.user.id}, name: ${createCategoryDto.name}`,
		);
		return this.categoriesService.create(session.user.id, createCategoryDto);
	}

	@Get()
	@ApiOperation({ summary: "Listar todas as categorias do usuário" })
	@ApiQuery({
		name: "type",
		enum: ["INCOME", "EXPENSE"],
		required: false,
		description: "Filtrar categorias por tipo",
	})
	@ApiResponse({
		status: 200,
		description: "Lista de categorias",
		type: [CategoryResponseDto],
	})
	async findAll(
		@Session() session: UserSession,
		@Query() query: FindAllCategoriesQueryDto,
	) {
		this.logger.debug(
			`GET /categories - userId: ${session.user.id}, type: ${query.type || "all"}`,
		);
		return this.categoriesService.findAll(session.user.id, query.type);
	}

	@Get(":id")
	@ApiOperation({ summary: "Obter categoria por ID" })
	@ApiParam({
		name: "id",
		description: "ID da categoria",
		type: String,
	})
	@ApiResponse({
		status: 200,
		description: "Categoria encontrada",
		type: CategoryResponseDto,
	})
	@ApiResponse({ status: 404, description: "Categoria não encontrada" })
	async findOne(@Param("id") id: string, @Session() session: UserSession) {
		this.logger.debug(`GET /categories/${id} - userId: ${session.user.id}`);
		return this.categoriesService.findOne(id, session.user.id);
	}

	@Put(":id")
	@ApiOperation({ summary: "Atualizar categoria" })
	@ApiParam({
		name: "id",
		description: "ID da categoria",
		type: String,
	})
	@ApiResponse({
		status: 200,
		description: "Categoria atualizada com sucesso",
		type: CategoryResponseDto,
	})
	@ApiResponse({ status: 404, description: "Categoria não encontrada" })
	@ApiResponse({
		status: 400,
		description: "Categoria com este nome já existe",
	})
	async update(
		@Param("id") id: string,
		@Session() session: UserSession,
		@Body() updateCategoryDto: UpdateCategoryDto,
	) {
		this.logger.debug(
			`PUT /categories/${id} - userId: ${session.user.id}, fields: ${Object.keys(updateCategoryDto).join(", ")}`,
		);
		return this.categoriesService.update(
			id,
			session.user.id,
			updateCategoryDto,
		);
	}

	@Delete(":id")
	@ApiOperation({ summary: "Deletar categoria" })
	@ApiParam({
		name: "id",
		description: "ID da categoria",
		type: String,
	})
	@ApiResponse({ status: 200, description: "Categoria deletada com sucesso" })
	@ApiResponse({ status: 404, description: "Categoria não encontrada" })
	async remove(@Param("id") id: string, @Session() session: UserSession) {
		this.logger.debug(`DELETE /categories/${id} - userId: ${session.user.id}`);
		return this.categoriesService.remove(id, session.user.id);
	}
}
