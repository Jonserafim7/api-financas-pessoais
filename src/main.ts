import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
	const app = await NestFactory.create(AppModule, {
		// Don't worry, the library will automatically re-add the default body parsers.
		bodyParser: false,
	});
	await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
