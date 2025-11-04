import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Post,
	Put,
	Query,
} from "@nestjs/common";
import {
	ApiBearerAuth,
	ApiOperation,
	ApiResponse,
	ApiTags,
} from "@nestjs/swagger";
import { Session, type UserSession } from "@thallesp/nestjs-better-auth";
import { CreateTransactionDto } from "./dto/create-transaction.dto";
import { FilterTransactionDto } from "./dto/filter-transaction.dto";
import { TransactionResponseDto } from "./dto/transaction-response.dto";
import { UpdateTransactionDto } from "./dto/update-transaction.dto";
import { TransactionsService } from "./transactions.service";

@Controller("transactions")
@ApiTags("Transactions")
@ApiBearerAuth()
export class TransactionsController {
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
		return this.transactionsService.create(
			session.user.id,
			createTransactionDto,
		);
	}

	@Get()
	@ApiOperation({
		summary: "Listar transações do usuário com filtros opcionais",
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
		return this.transactionsService.findAll(session.user.id, filters);
	}

	@Get(":id")
	@ApiOperation({ summary: "Obter transação por ID" })
	@ApiResponse({
		status: 200,
		description: "Transação encontrada",
		type: TransactionResponseDto,
	})
	@ApiResponse({ status: 404, description: "Transação não encontrada" })
	async findOne(@Param("id") id: string, @Session() session: UserSession) {
		return this.transactionsService.findOne(id, session.user.id);
	}

	@Put(":id")
	@ApiOperation({ summary: "Atualizar transação" })
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
		return this.transactionsService.update(
			id,
			session.user.id,
			updateTransactionDto,
		);
	}

	@Delete(":id")
	@ApiOperation({ summary: "Deletar transação" })
	@ApiResponse({ status: 200, description: "Transação deletada com sucesso" })
	@ApiResponse({ status: 404, description: "Transação não encontrada" })
	async remove(@Param("id") id: string, @Session() session: UserSession) {
		return this.transactionsService.remove(id, session.user.id);
	}
}
