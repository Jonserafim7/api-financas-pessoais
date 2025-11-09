import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsOptional } from "class-validator";

export class FindAllCategoriesQueryDto {
	@ApiProperty({
		enum: ["INCOME", "EXPENSE"],
		description: "Filtrar categorias por tipo",
		required: false,
		example: "EXPENSE",
	})
	@IsOptional()
	@IsEnum(["INCOME", "EXPENSE"], {
		message: "Tipo deve ser INCOME ou EXPENSE",
	})
	type?: "INCOME" | "EXPENSE";
}
