import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
	IsEnum,
	IsISO8601,
	IsNumber,
	IsOptional,
	IsString,
	Max,
	Min,
} from "class-validator";
import { TransactionType } from "./create-transaction.dto";

/**
 * DTO for transaction list filtering with validated date ranges
 */
export class FilterTransactionDto {
	@ApiProperty({
		type: String,
		description: "Data inicial (ISO 8601)",
		example: "2024-10-31T00:00:00Z",
		required: false,
	})
	@IsOptional()
	@IsISO8601()
	dateFrom?: string;

	@ApiProperty({
		type: String,
		description: "Data final (ISO 8601)",
		example: "2024-10-31T23:59:59Z",
		required: false,
	})
	@IsOptional()
	@IsISO8601()
	dateTo?: string;

	@ApiProperty({
		type: String,
		description: "Filtrar por categoria",
		example: "clyt5m3v90000jpf0z0z0z0z0",
		required: false,
	})
	@IsOptional()
	@IsString()
	categoryId?: string;

	@ApiProperty({
		description: "Filtrar por tipo",
		enum: TransactionType,
		required: false,
	})
	@IsOptional()
	@IsEnum(TransactionType)
	type?: TransactionType;

	@ApiProperty({
		description: "Número de itens por página",
		example: 20,
		required: false,
		default: 20,
		minimum: 1,
		maximum: 100,
	})
	@IsOptional()
	@Type(() => Number)
	@IsNumber()
	@Min(1)
	@Max(100)
	limit?: number = 20;

	@ApiProperty({
		description: "Número de itens a pular",
		example: 0,
		required: false,
		default: 0,
		minimum: 0,
	})
	@IsOptional()
	@Type(() => Number)
	@IsNumber()
	@Min(0)
	offset?: number = 0;
}
