import { Controller, Get, Post, Body, Param, Put, Delete, Query } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from "@nestjs/swagger";
import { Session, UserSession } from "@thallesp/nestjs-better-auth";
import { TransactionsService } from "./transactions.service";
import { CreateTransactionDto } from "./dto/create-transaction.dto";
import { UpdateTransactionDto } from "./dto/update-transaction.dto";
import { TransactionResponseDto } from "./dto/transaction-response.dto";

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
		return this.transactionsService.create(session.user.id, createTransactionDto);
	}

	@Get()
	@ApiOperation({ summary: "Listar transações do usuário com filtros opcionais" })
	@ApiQuery({ name: "dateFrom", required: false, description: "Data inicial (ISO 8601)" })
	@ApiQuery({ name: "dateTo", required: false, description: "Data final (ISO 8601)" })
	@ApiQuery({ name: "categoryId", required: false, description: "Filtrar por categoria" })
	@ApiQuery({ name: "type", required: false, description: "Filtrar por tipo (INCOME/EXPENSE)" })
	@ApiResponse({
		status: 200,
		description: "Lista de transações",
		type: [TransactionResponseDto],
	})
	async findAll(
		@Session() session: UserSession,
		@Query("dateFrom") dateFrom?: string,
		@Query("dateTo") dateTo?: string,
		@Query("categoryId") categoryId?: string,
		@Query("type") type?: string,
	) {
		const filters = {
			dateFrom: dateFrom ? new Date(dateFrom) : undefined,
			dateTo: dateTo ? new Date(dateTo) : undefined,
			categoryId,
			type,
		};

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
		return this.transactionsService.update(id, session.user.id, updateTransactionDto);
	}

	@Delete(":id")
	@ApiOperation({ summary: "Deletar transação" })
	@ApiResponse({ status: 200, description: "Transação deletada com sucesso" })
	@ApiResponse({ status: 404, description: "Transação não encontrada" })
	async remove(@Param("id") id: string, @Session() session: UserSession) {
		return this.transactionsService.remove(id, session.user.id);
	}
}
