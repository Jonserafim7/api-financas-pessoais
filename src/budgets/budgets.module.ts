import { Module } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { BudgetsController } from "./budgets.controller";
import { BudgetsService } from "./budgets.service";

@Module({
	controllers: [BudgetsController],
	providers: [BudgetsService, PrismaService],
	exports: [BudgetsService],
})
export class BudgetsModule {}
