import { NestFactory } from "@nestjs/core";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";

async function bootstrap() {
	const app = await NestFactory.create(AppModule, {
		// Don't worry, the library will automatically re-add the default body parsers.
		bodyParser: false,
	});

	const config = new DocumentBuilder()
		.setTitle("API Finanças Pessoais")
		.setDescription("API de controle de finanças pessoais com categorias, transações, orçamentos e relatórios")
		.setVersion("1.0")
		.addBearerAuth()
		.build();

	const document = SwaggerModule.createDocument(app, config);
	SwaggerModule.setup("api", app, document);

	await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
