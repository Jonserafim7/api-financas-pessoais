import { Controller, Get } from "@nestjs/common";
import { AllowAnonymous } from "@thallesp/nestjs-better-auth";
import type { AppService } from "./app.service";

@Controller()
export class AppController {
	constructor(private readonly appService: AppService) {}

	@Get("")
	@AllowAnonymous() // Allow anonymous access (no authentication required)
	getHello(): string {
		return this.appService.getHello();
	}
}
