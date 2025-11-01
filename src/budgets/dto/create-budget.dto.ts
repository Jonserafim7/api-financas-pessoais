import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
	IsEnum,
	IsISO8601,
	IsNumber,
	IsOptional,
	IsString,
} from "class-validator";

export enum BudgetPeriod {
	WEEKLY = "WEEKLY",
	MONTHLY = "MONTHLY",
	YEARLY = "YEARLY",
}

export class CreateBudgetDto {
	@ApiProperty({
		description: "ID da categoria (opcional para orçamento geral)",
		example: "clyt5m3v90000jpf0z0z0z0z0",
		required: false,
	})
	@IsOptional()
	@IsString()
	categoryId?: string;

	@ApiProperty({
		description: "Valor do orçamento",
		example: 1000.0,
	})
	@Type(() => Number)
	@IsNumber()
	amount: number;

	@ApiProperty({
		description: "Período do orçamento",
		enum: BudgetPeriod,
		example: BudgetPeriod.MONTHLY,
	})
	@IsEnum(BudgetPeriod)
	period: BudgetPeriod;

	@ApiProperty({
		description: "Data de início do orçamento (ISO 8601)",
		example: "2024-10-31T00:00:00Z",
	})
	@IsISO8601()
	startDate: string;

	@ApiProperty({
		description: "Data de término do orçamento (ISO 8601, opcional)",
		example: "2025-10-31T00:00:00Z",
		required: false,
	})
	@IsOptional()
	@IsISO8601()
	endDate?: string;
}
