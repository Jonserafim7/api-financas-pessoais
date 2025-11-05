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
	ApiExtraModels,
	ApiOperation,
	ApiParam,
	ApiQuery,
	ApiResponse,
	ApiTags,
} from "@nestjs/swagger";
import { Session, type UserSession } from "@thallesp/nestjs-better-auth";
import { CategoryResponseDto } from "../categories/dto/category-response.dto";
import { CreateTransactionDto } from "./dto/create-transaction.dto";
import { FilterTransactionDto } from "./dto/filter-transaction.dto";
import { TransactionResponseDto } from "./dto/transaction-response.dto";
import { UpdateTransactionDto } from "./dto/update-transaction.dto";
import { TransactionsService } from "./transactions.service";

@Controller("transactions")
@ApiTags("Transactions")
@ApiBearerAuth()
@ApiExtraModels(CategoryResponseDto)
export class TransactionsController {
	private readonly logger = new Logger(TransactionsController.name);

	constructor(private readonly transactionsService: TransactionsService) {}

	@Post()
	@ApiOperation({ summary: "Criar nova transação" })
	@ApiResponse({
		status: 201,
		description: "Transação criada com sucesso",
		type: TransactionResponseDto,
	})
	@ApiResponse({ status: 400, description: "Categoria não encontrada" })
	async create(
		@Session() session: UserSession,
		@Body() createTransactionDto: CreateTransactionDto,
	) {
		this.logger.debug(
			`POST /transactions - userId: ${session.user.id}, type: ${createTransactionDto.type}, amount: ${createTransactionDto.amount}, categoryId: ${createTransactionDto.categoryId}`,
		);
		return this.transactionsService.create(
			session.user.id,
			createTransactionDto,
		);
	}

	@Get()
	@ApiOperation({
		summary: "Listar transações do usuário com filtros opcionais",
	})
	@ApiQuery({
		name: "dateFrom",
		required: false,
		description: "Data inicial (ISO 8601)",
		type: String,
	})
	@ApiQuery({
		name: "dateTo",
		required: false,
		description: "Data final (ISO 8601)",
		type: String,
	})
	@ApiQuery({
		name: "categoryId",
		required: false,
		description: "Filtrar por categoria",
		type: String,
	})
	@ApiQuery({
		name: "type",
		required: false,
		description: "Filtrar por tipo",
		enum: ["INCOME", "EXPENSE"],
	})
	@ApiResponse({
		status: 200,
		description: "Lista de transações",
		type: [TransactionResponseDto],
	})
	@ApiResponse({
		status: 400,
		description: "Datas inválidas (ISO 8601 required)",
	})
	async findAll(
		@Session() session: UserSession,
		@Query() filters: FilterTransactionDto,
	) {
		const filterStr = Object.entries(filters || {})
			.filter(([_, v]) => v !== undefined)
			.map(([k, v]) => `${k}=${v}`)
			.join(", ");
		this.logger.debug(
			`GET /transactions - userId: ${session.user.id}${filterStr ? `, filters: ${filterStr}` : ""}`,
		);
		return this.transactionsService.findAll(session.user.id, filters);
	}

	@Get(":id")
	@ApiOperation({ summary: "Obter transação por ID" })
	@ApiParam({
		name: "id",
		description: "ID da transação",
		type: String,
	})
	@ApiResponse({
		status: 200,
		description: "Transação encontrada",
		type: TransactionResponseDto,
	})
	@ApiResponse({ status: 404, description: "Transação não encontrada" })
	async findOne(@Param("id") id: string, @Session() session: UserSession) {
		this.logger.debug(
			`GET /transactions/${id} - userId: ${session.user.id}`,
		);
		return this.transactionsService.findOne(id, session.user.id);
	}

	@Put(":id")
	@ApiOperation({ summary: "Atualizar transação" })
	@ApiParam({
		name: "id",
		description: "ID da transação",
		type: String,
	})
	@ApiResponse({
		status: 200,
		description: "Transação atualizada com sucesso",
		type: TransactionResponseDto,
	})
	@ApiResponse({ status: 404, description: "Transação não encontrada" })
	@ApiResponse({ status: 400, description: "Categoria não encontrada" })
	async update(
		@Param("id") id: string,
		@Session() session: UserSession,
		@Body() updateTransactionDto: UpdateTransactionDto,
	) {
		this.logger.debug(
			`PUT /transactions/${id} - userId: ${session.user.id}, fields: ${Object.keys(updateTransactionDto).join(", ")}`,
		);
		return this.transactionsService.update(
			id,
			session.user.id,
			updateTransactionDto,
		);
	}

	@Delete(":id")
	@ApiOperation({ summary: "Deletar transação" })
	@ApiParam({
		name: "id",
		description: "ID da transação",
		type: String,
	})
	@ApiResponse({ status: 200, description: "Transação deletada com sucesso" })
	@ApiResponse({ status: 404, description: "Transação não encontrada" })
	async remove(@Param("id") id: string, @Session() session: UserSession) {
		this.logger.debug(
			`DELETE /transactions/${id} - userId: ${session.user.id}`,
		);
		return this.transactionsService.remove(id, session.user.id);
	}
}
