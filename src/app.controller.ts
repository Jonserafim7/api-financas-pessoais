/** biome-ignore-all lint/style/useImportType: NestJS needs the service declaration, else we get dependency injection errors */
import { Controller, Get } from "@nestjs/common";
import { AllowAnonymous } from "@thallesp/nestjs-better-auth";

import { AppService } from "./app.service";

@Controller()
export class AppController {
	constructor(private readonly appService: AppService) {}

	@Get("")
	@AllowAnonymous() // Allow anonymous access (no authentication required)
	getHello(): string {
		return this.appService.getHello();
	}
}
