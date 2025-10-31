import { ApiProperty } from "@nestjs/swagger";

export class CategoryResponseDto {
	@ApiProperty({
		description: "ID da categoria",
		example: "clyt5m3v90000jpf0z0z0z0z0",
	})
	id: string;

	@ApiProperty({
		description: "Nome da categoria",
		example: "Alimentação",
	})
	name: string;

	@ApiProperty({
		description: "Tipo de categoria",
		example: "EXPENSE",
	})
	type: string;

	@ApiProperty({
		description: "Cor da categoria",
		example: "#FF5733",
	})
	color: string;

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
