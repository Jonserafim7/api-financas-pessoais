import { ApiProperty } from "@nestjs/swagger";

export class CategoryReportItemDto {
	@ApiProperty({
		type: String,
		description: "Nome da categoria",
		example: "Alimentação",
	})
	categoryName: string;

	@ApiProperty({
		type: String,
		enum: ["INCOME", "EXPENSE"],
		description: "Tipo de transação",
		example: "EXPENSE",
	})
	type: string;

	@ApiProperty({
		type: String,
		description: "Total gasto/recebido na categoria",
		example: "1500.50",
	})
	total: string;

	@ApiProperty({
		type: Number,
		description: "Quantidade de transações",
		example: 15,
	})
	count: number;
}

export class CategoryReportDto {
	@ApiProperty({
		description: "Dados agrupados por categoria",
		type: [CategoryReportItemDto],
	})
	data: CategoryReportItemDto[];

	@ApiProperty({
		type: String,
		description: "Período analisado",
		example: "2024-10-01 a 2024-10-31",
	})
	period: string;
}
