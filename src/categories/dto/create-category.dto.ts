import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsOptional, IsString } from "class-validator";

export enum CategoryType {
	INCOME = "INCOME",
	EXPENSE = "EXPENSE",
}

export class CreateCategoryDto {
	@ApiProperty({
		type: String,
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
		type: String,
		description: "Cor da categoria (hexadecimal)",
		example: "#FF5733",
		required: false,
	})
	@IsOptional()
	@IsString()
	color?: string;
}
