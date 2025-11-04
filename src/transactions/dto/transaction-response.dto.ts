import { ApiProperty } from "@nestjs/swagger";
import { CategoryResponseDto } from "../../categories/dto/category-response.dto";

export class TransactionResponseDto {
	@ApiProperty({
		type: String,
		description: "ID da transação",
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
		description: "ID da categoria",
		example: "clyt5m3v90000jpf0z0z0z0z0",
	})
	categoryId: string;

	@ApiProperty({
		type: String,
		description: "Valor da transação",
		example: "150.50",
	})
	amount: string;

	@ApiProperty({
		type: String,
		nullable: true,
		description: "Descrição da transação",
		example: "Compra de supermercado",
	})
	description: string | null;

	@ApiProperty({
		type: Date,
		description: "Data da transação",
		example: "2024-10-31T20:00:00Z",
	})
	date: Date;

	@ApiProperty({
		type: String,
		enum: ["INCOME", "EXPENSE"],
		description: "Tipo de transação",
		example: "EXPENSE",
	})
	type: string;

	@ApiProperty({
		type: () => CategoryResponseDto,
		description: "Categoria da transação",
	})
	category: CategoryResponseDto;

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
