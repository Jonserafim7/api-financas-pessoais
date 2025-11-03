import { ApiProperty } from "@nestjs/swagger";

export class TrendMonthDto {
	@ApiProperty({
		type: String,
		description: "Mês no formato YYYY-MM",
		example: "2024-10",
	})
	month: string;

	@ApiProperty({
		type: String,
		description: "Total de receitas no mês",
		example: "5000.00",
	})
	income: string;

	@ApiProperty({
		type: String,
		description: "Total de despesas no mês",
		example: "2000.00",
	})
	expense: string;

	@ApiProperty({
		type: String,
		description: "Saldo do mês",
		example: "3000.00",
	})
	balance: string;
}

export class TrendsReportDto {
	@ApiProperty({
		description: "Tendência mensal",
		type: [TrendMonthDto],
	})
	data: TrendMonthDto[];

	@ApiProperty({
		type: Number,
		description: "Quantidade de meses inclusos",
		example: 6,
	})
	months: number;
}
