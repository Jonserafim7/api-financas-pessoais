import { ApiProperty } from "@nestjs/swagger";

export class BudgetStatusItemDto {
	@ApiProperty({
		description: "Nome da categoria (ou 'Geral' para orçamento geral)",
		example: "Alimentação",
	})
	categoryName: string;

	@ApiProperty({
		description: "Limite do orçamento",
		example: "500.00",
	})
	budgetLimit: string;

	@ApiProperty({
		description: "Valor gasto até agora",
		example: "320.50",
	})
	spent: string;

	@ApiProperty({
		description: "Valor restante",
		example: "179.50",
	})
	remaining: string;

	@ApiProperty({
		description: "Percentual gasto (0-100)",
		example: 64,
	})
	percentageUsed: number;

	@ApiProperty({
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
		description: "Período analisado",
		example: "2024-10-01 a 2024-10-31",
	})
	period: string;
}
