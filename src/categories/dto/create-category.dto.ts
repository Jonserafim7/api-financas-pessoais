import { IsString, IsEnum, IsOptional } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export enum CategoryType {
	INCOME = "INCOME",
	EXPENSE = "EXPENSE",
}

export class CreateCategoryDto {
	@ApiProperty({
		description: "Nome da categoria",
		example: "Alimentação",
	})
	@IsString()
	name: string;

	@ApiProperty({
		description: "Tipo de categoria",
		enum: CategoryType,
		example: CategoryType.EXPENSE,
	})
	@IsEnum(CategoryType)
	type: CategoryType;

	@ApiProperty({
		description: "Cor da categoria (hexadecimal)",
		example: "#FF5733",
		required: false,
	})
	@IsOptional()
	@IsString()
	color?: string;
}
