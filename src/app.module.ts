import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "@thallesp/nestjs-better-auth";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { auth } from "./lib/auth";
import { CategoriesModule } from "./categories/categories.module";
import { TransactionsModule } from "./transactions/transactions.module";
import { BudgetsModule } from "./budgets/budgets.module";
import { ReportsModule } from "./reports/reports.module";

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
		}),
		AuthModule.forRoot({ auth }),
		CategoriesModule,
		TransactionsModule,
		BudgetsModule,
		ReportsModule,
	],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule {}
