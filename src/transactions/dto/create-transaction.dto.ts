import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
	IsEnum,
	IsISO8601,
	IsNumber,
	IsOptional,
	IsString,
} from "class-validator";

export enum TransactionType {
	INCOME = "INCOME",
	EXPENSE = "EXPENSE",
}

export class CreateTransactionDto {
	@ApiProperty({
		type: String,
		description: "ID da categoria",
		example: "clyt5m3v90000jpf0z0z0z0z0",
	})
	@IsString()
	categoryId: string;

	@ApiProperty({
		type: Number,
		description: "Valor da transação",
		example: 150.5,
	})
	@Type(() => Number)
	@IsNumber()
	amount: number;

	@ApiProperty({
		type: String,
		description: "Descrição da transação",
		example: "Compra de supermercado",
		required: false,
	})
	@IsOptional()
	@IsString()
	description?: string;

	@ApiProperty({
		type: String,
		description: "Data da transação (ISO 8601)",
		example: "2024-10-31T20:00:00Z",
	})
	@IsISO8601()
	date: string;

	@ApiProperty({
		description: "Tipo de transação",
		enum: TransactionType,
		example: TransactionType.EXPENSE,
	})
	@IsEnum(TransactionType)
	type: TransactionType;
}
