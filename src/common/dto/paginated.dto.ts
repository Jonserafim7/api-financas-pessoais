import { ApiProperty } from "@nestjs/swagger";

/**
 * Generic pagination wrapper for list responses
 */
export class PaginatedDto<TData> {
	@ApiProperty({
		description: "Total number of items",
		example: 100,
	})
	total: number;

	@ApiProperty({
		description: "Number of items per page",
		example: 20,
	})
	limit: number;

	@ApiProperty({
		description: "Number of items to skip",
		example: 0,
	})
	offset: number;

	results: TData[];
}
