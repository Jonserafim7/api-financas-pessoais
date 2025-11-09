import {
	Body,
	Controller,
	Delete,
	Get,
	Logger,
	Param,
	Post,
	Put,
} from "@nestjs/common";
import {
	ApiBearerAuth,
	ApiOperation,
	ApiParam,
	ApiResponse,
	ApiTags,
} from "@nestjs/swagger";
import { Session, type UserSession } from "@thallesp/nestjs-better-auth";
import { BudgetsService } from "./budgets.service";
import { BudgetResponseDto } from "./dto/budget-response.dto";
import { CreateBudgetDto } from "./dto/create-budget.dto";
import { UpdateBudgetDto } from "./dto/update-budget.dto";

@Controller("budgets")
@ApiTags("Budgets")
@ApiBearerAuth()
export class BudgetsController {
	private readonly logger = new Logger(BudgetsController.name);

	constructor(private readonly budgetsService: BudgetsService) {}

	@Post()
	@ApiOperation({ summary: "Criar novo orçamento" })
	@ApiResponse({
		status: 201,
		description: "Orçamento criado com sucesso",
		type: BudgetResponseDto,
	})
	@ApiResponse({ status: 400, description: "Validação falhou" })
	async create(
		@Session() session: UserSession,
		@Body() createBudgetDto: CreateBudgetDto,
	) {
		this.logger.debug(
			`POST /budgets - userId: ${session.user.id}, period: ${createBudgetDto.period}, amount: ${createBudgetDto.amount}, categoryId: ${createBudgetDto.categoryId || "overall"}`,
		);
		return this.budgetsService.create(session.user.id, createBudgetDto);
	}

	@Get()
	@ApiOperation({ summary: "Listar todos os orçamentos do usuário" })
	@ApiResponse({
		status: 200,
		description: "Lista de orçamentos",
		type: [BudgetResponseDto],
	})
	async findAll(@Session() session: UserSession) {
		this.logger.debug(`GET /budgets - userId: ${session.user.id}`);
		return this.budgetsService.findAll(session.user.id);
	}

	@Get(":id")
	@ApiOperation({ summary: "Obter orçamento por ID" })
	@ApiParam({
		name: "id",
		description: "ID do orçamento",
		type: String,
	})
	@ApiResponse({
		status: 200,
		description: "Orçamento encontrado",
		type: BudgetResponseDto,
	})
	@ApiResponse({ status: 404, description: "Orçamento não encontrado" })
	async findOne(@Param("id") id: string, @Session() session: UserSession) {
		this.logger.debug(`GET /budgets/${id} - userId: ${session.user.id}`);
		return this.budgetsService.findOne(id, session.user.id);
	}

	@Put(":id")
	@ApiOperation({ summary: "Atualizar orçamento" })
	@ApiParam({
		name: "id",
		description: "ID do orçamento",
		type: String,
	})
	@ApiResponse({
		status: 200,
		description: "Orçamento atualizado com sucesso",
		type: BudgetResponseDto,
	})
	@ApiResponse({ status: 404, description: "Orçamento não encontrado" })
	@ApiResponse({ status: 400, description: "Validação falhou" })
	async update(
		@Param("id") id: string,
		@Session() session: UserSession,
		@Body() updateBudgetDto: UpdateBudgetDto,
	) {
		this.logger.debug(
			`PUT /budgets/${id} - userId: ${session.user.id}, fields: ${Object.keys(updateBudgetDto).join(", ")}`,
		);
		return this.budgetsService.update(id, session.user.id, updateBudgetDto);
	}

	@Delete(":id")
	@ApiOperation({ summary: "Deletar orçamento" })
	@ApiParam({
		name: "id",
		description: "ID do orçamento",
		type: String,
	})
	@ApiResponse({ status: 200, description: "Orçamento deletado com sucesso" })
	@ApiResponse({ status: 404, description: "Orçamento não encontrado" })
	async remove(@Param("id") id: string, @Session() session: UserSession) {
		this.logger.debug(`DELETE /budgets/${id} - userId: ${session.user.id}`);
		return this.budgetsService.remove(id, session.user.id);
	}
}
