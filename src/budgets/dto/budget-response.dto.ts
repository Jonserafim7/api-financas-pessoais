import { ApiProperty } from "@nestjs/swagger";

export class BudgetResponseDto {
	@ApiProperty({
		description: "ID do orçamento",
		example: "clyt5m3v90000jpf0z0z0z0z0",
	})
	id: string;

	@ApiProperty({
		description: "ID do usuário",
		example: "user_123",
	})
	userId: string;

	@ApiProperty({
		description: "ID da categoria (null para orçamento geral)",
		example: "clyt5m3v90000jpf0z0z0z0z0",
		nullable: true,
	})
	categoryId: string | null;

	@ApiProperty({
		description: "Valor do orçamento",
		example: "1000.00",
	})
	amount: string;

	@ApiProperty({
		description: "Período do orçamento",
		example: "MONTHLY",
	})
	period: string;

	@ApiProperty({
		description: "Data de início",
		example: "2024-10-31T00:00:00Z",
	})
	startDate: Date;

	@ApiProperty({
		description: "Data de término",
		example: "2025-10-31T00:00:00Z",
		nullable: true,
	})
	endDate: Date | null;

	@ApiProperty({
		description: "Data de criação",
		example: "2024-10-31T20:00:00Z",
	})
	createdAt: Date;

	@ApiProperty({
		description: "Data de atualização",
		example: "2024-10-31T20:00:00Z",
	})
	updatedAt: Date;
}
