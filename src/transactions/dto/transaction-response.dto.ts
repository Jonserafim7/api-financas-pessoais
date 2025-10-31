import { ApiProperty } from "@nestjs/swagger";

export class TransactionResponseDto {
	@ApiProperty({
		description: "ID da transação",
		example: "clyt5m3v90000jpf0z0z0z0z0",
	})
	id: string;

	@ApiProperty({
		description: "ID do usuário",
		example: "user_123",
	})
	userId: string;

	@ApiProperty({
		description: "ID da categoria",
		example: "clyt5m3v90000jpf0z0z0z0z0",
	})
	categoryId: string;

	@ApiProperty({
		description: "Valor da transação",
		example: "150.50",
	})
	amount: string;

	@ApiProperty({
		description: "Descrição da transação",
		example: "Compra de supermercado",
	})
	description: string | null;

	@ApiProperty({
		description: "Data da transação",
		example: "2024-10-31T20:00:00Z",
	})
	date: Date;

	@ApiProperty({
		description: "Tipo de transação",
		example: "EXPENSE",
	})
	type: string;

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
