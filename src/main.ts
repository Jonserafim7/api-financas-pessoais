import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";

/**
 * Initialize NestJS application with Swagger documentation
 */
async function bootstrap() {
	const app = await NestFactory.create(AppModule, {
		// Better Auth requires custom body parser handling (will be re-added by middleware)
		bodyParser: false,
	});

	// Enable global validation pipe for DTOs
	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true,
			forbidNonWhitelisted: true,
			transform: true,
			transformOptions: {
				enableImplicitConversion: true,
			},
		}),
	);

	// Configure Swagger/OpenAPI documentation with Bearer token authentication
	const config = new DocumentBuilder()
		.setTitle("API Finanças Pessoais")
		.setDescription(
			"API de controle de finanças pessoais com categorias, transações, orçamentos e relatórios",
		)
		.setVersion("1.0")
		.addBearerAuth()
		.build();

	const document = SwaggerModule.createDocument(app, config);
	// Expose Swagger UI at /api and OpenAPI JSON at /api-json
	SwaggerModule.setup("api", app, document, {
		jsonDocumentUrl: "api-json",
	});

	// Enable CORS to allow requests from frontend (development and production)
	app.enableCors({
		origin: [
			"http://localhost:5173", // Vite dev server (frontend dev)
			"http://localhost:3001", // Create React App (alternative, if needed)
			"http://localhost", // Nginx production
			"http://localhost:80", // Nginx production (explicit)
		],
		credentials: true, // Allow cookies and auth headers
	});

	await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
