import { ApiProperty } from "@nestjs/swagger";

export class SummaryReportDto {
	@ApiProperty({
		description: "Total de receitas no período",
		example: "5000.00",
	})
	totalIncome: string;

	@ApiProperty({
		description: "Total de despesas no período",
		example: "2000.00",
	})
	totalExpense: string;

	@ApiProperty({
		description: "Saldo (receitas - despesas)",
		example: "3000.00",
	})
	balance: string;

	@ApiProperty({
		description: "Período analisado",
		example: "2024-10-01 a 2024-10-31",
	})
	period: string;
}
