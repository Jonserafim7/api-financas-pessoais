import { ApiProperty } from "@nestjs/swagger";

export class CategoryResponseDto {
	@ApiProperty({
		type: String,
		description: "ID da categoria",
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
		description: "Nome da categoria",
		example: "Alimentação",
	})
	name: string;

	@ApiProperty({
		type: String,
		enum: ["INCOME", "EXPENSE"],
		description: "Tipo de categoria",
		example: "EXPENSE",
	})
	type: string;

	@ApiProperty({
		type: String,
		description: "Cor da categoria",
		example: "#FF5733",
	})
	color: string;

	@ApiProperty({
		type: Boolean,
		description: "Indica se é uma categoria do sistema",
		example: false,
	})
	isSystem: boolean;

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
