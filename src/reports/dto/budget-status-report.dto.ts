import { ApiProperty } from "@nestjs/swagger";

export class BudgetStatusItemDto {
	@ApiProperty({
		type: String,
		description: "Nome da categoria (ou 'Geral' para orçamento geral)",
		example: "Alimentação",
	})
	categoryName: string;

	@ApiProperty({
		type: String,
		description: "Limite do orçamento",
		example: "500.00",
	})
	budgetLimit: string;

	@ApiProperty({
		type: String,
		description: "Valor gasto até agora",
		example: "320.50",
	})
	spent: string;

	@ApiProperty({
		type: String,
		description: "Valor restante",
		example: "179.50",
	})
	remaining: string;

	@ApiProperty({
		type: Number,
		description: "Percentual gasto (0-100)",
		example: 64,
	})
	percentageUsed: number;

	@ApiProperty({
		type: String,
		enum: ["ok", "warning", "exceeded"],
		description: "Status do orçamento (ok, warning, exceeded)",
		example: "ok",
	})
	status: "ok" | "warning" | "exceeded";
}

export class BudgetStatusReportDto {
	@ApiProperty({
		description: "Status dos orçamentos",
		type: [BudgetStatusItemDto],
	})
	data: BudgetStatusItemDto[];

	@ApiProperty({
		type: String,
		description: "Período analisado",
		example: "2024-10-01 a 2024-10-31",
	})
	period: string;
}
