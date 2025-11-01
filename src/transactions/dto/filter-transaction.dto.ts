import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsISO8601, IsOptional, IsString } from "class-validator";
import { TransactionType } from "./create-transaction.dto";

/**
 * DTO for transaction list filtering with validated date ranges
 */
export class FilterTransactionDto {
	@ApiProperty({
		description: "Data inicial (ISO 8601)",
		example: "2024-10-31T00:00:00Z",
		required: false,
	})
	@IsOptional()
	@IsISO8601()
	dateFrom?: string;

	@ApiProperty({
		description: "Data final (ISO 8601)",
		example: "2024-10-31T23:59:59Z",
		required: false,
	})
	@IsOptional()
	@IsISO8601()
	dateTo?: string;

	@ApiProperty({
		description: "Filtrar por categoria",
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
}
