import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Post,
	Put,
} from "@nestjs/common";
import {
	ApiBearerAuth,
	ApiOperation,
	ApiResponse,
	ApiTags,
} from "@nestjs/swagger";
import { Session, type UserSession } from "@thallesp/nestjs-better-auth";
import { BudgetsService } from "./budgets.service";
import { BudgetResponseDto } from "./dto/budget-response.dto";
import type { CreateBudgetDto } from "./dto/create-budget.dto";
import type { UpdateBudgetDto } from "./dto/update-budget.dto";

@Controller("budgets")
@ApiTags("Budgets")
@ApiBearerAuth()
export class BudgetsController {
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
		return this.budgetsService.findAll(session.user.id);
	}

	@Get(":id")
	@ApiOperation({ summary: "Obter orçamento por ID" })
	@ApiResponse({
		status: 200,
		description: "Orçamento encontrado",
		type: BudgetResponseDto,
	})
	@ApiResponse({ status: 404, description: "Orçamento não encontrado" })
	async findOne(@Param("id") id: string, @Session() session: UserSession) {
		return this.budgetsService.findOne(id, session.user.id);
	}

	@Put(":id")
	@ApiOperation({ summary: "Atualizar orçamento" })
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
		return this.budgetsService.update(id, session.user.id, updateBudgetDto);
	}

	@Delete(":id")
	@ApiOperation({ summary: "Deletar orçamento" })
	@ApiResponse({ status: 200, description: "Orçamento deletado com sucesso" })
	@ApiResponse({ status: 404, description: "Orçamento não encontrado" })
	async remove(@Param("id") id: string, @Session() session: UserSession) {
		return this.budgetsService.remove(id, session.user.id);
	}
}
