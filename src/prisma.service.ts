import { Injectable, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "../generated/prisma/client";

/**
 * Prisma database client service that connects on module initialization
 * Provides single instance for dependency injection across application
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
	/**
	 * Connect to database when NestJS module initializes
	 */
	async onModuleInit() {
		await this.$connect();
	}
}
