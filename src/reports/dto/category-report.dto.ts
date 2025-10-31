import { ApiProperty } from "@nestjs/swagger";

export class CategoryReportItemDto {
	@ApiProperty({
		description: "Nome da categoria",
		example: "Alimentação",
	})
	categoryName: string;

	@ApiProperty({
		description: "Tipo de transação",
		example: "EXPENSE",
	})
	type: string;

	@ApiProperty({
		description: "Total gasto/recebido na categoria",
		example: "1500.50",
	})
	total: string;

	@ApiProperty({
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
		description: "Período analisado",
		example: "2024-10-01 a 2024-10-31",
	})
	period: string;
}
