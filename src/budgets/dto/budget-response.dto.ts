import { ApiProperty } from "@nestjs/swagger";

export class BudgetResponseDto {
	@ApiProperty({
		type: String,
		description: "ID do orçamento",
		example: "clyt5m3v90000jpf0z0z0z0z0",
	})
	id: string;

	@ApiProperty({
		type: String,
		description: "ID do usuário",
		example: "user_123",
	})
	userId: string;

	@ApiProperty({
		type: String,
		description: "ID da categoria (null para orçamento geral)",
		example: "clyt5m3v90000jpf0z0z0z0z0",
		nullable: true,
	})
	categoryId: string | null;

	@ApiProperty({
		type: String,
		description: "Valor do orçamento",
		example: "1000.00",
	})
	amount: string;

	@ApiProperty({
		type: String,
		enum: ["WEEKLY", "MONTHLY", "YEARLY"],
		description: "Período do orçamento",
		example: "MONTHLY",
	})
	period: string;

	@ApiProperty({
		type: Date,
		description: "Data de início",
		example: "2024-10-31T00:00:00Z",
	})
	startDate: Date;

	@ApiProperty({
		type: Date,
		description: "Data de término",
		example: "2025-10-31T00:00:00Z",
		nullable: true,
	})
	endDate: Date | null;

	@ApiProperty({
		type: Date,
		description: "Data de criação",
		example: "2024-10-31T20:00:00Z",
	})
	createdAt: Date;

	@ApiProperty({
		type: Date,
		description: "Data de atualização",
		example: "2024-10-31T20:00:00Z",
	})
	updatedAt: Date;
}
