import { Type, applyDecorators } from "@nestjs/common";
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from "@nestjs/swagger";
import { PaginatedDto } from "../dto/paginated.dto";

/**
 * Custom decorator for paginated responses in Swagger documentation
 * @param model The DTO class to be paginated
 * @returns Combined decorators for proper Swagger schema generation
 */
export const ApiPaginatedResponse = <TModel extends Type<unknown>>(
	model: TModel,
) => {
	return applyDecorators(
		ApiExtraModels(PaginatedDto, model),
		ApiOkResponse({
			schema: {
				title: `PaginatedResponseOf${model.name}`,
				allOf: [
					{ $ref: getSchemaPath(PaginatedDto) },
					{
						properties: {
							results: {
								type: "array",
								items: { $ref: getSchemaPath(model) },
							},
						},
					},
				],
			},
		}),
	);
};
