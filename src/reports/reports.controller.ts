import { Controller, Get, Query } from "@nestjs/common";
import {
	ApiBearerAuth,
	ApiOperation,
	ApiQuery,
	ApiResponse,
	ApiTags,
} from "@nestjs/swagger";
import { Session, type UserSession } from "@thallesp/nestjs-better-auth";
import { BudgetStatusReportDto } from "./dto/budget-status-report.dto";
import { CategoryReportDto } from "./dto/category-report.dto";
import { SummaryReportDto } from "./dto/summary-report.dto";
import { TrendsReportDto } from "./dto/trends-report.dto";
import { ReportsService } from "./reports.service";

@Controller("reports")
@ApiTags("Reports")
@ApiBearerAuth()
export class ReportsController {
	constructor(private readonly reportsService: ReportsService) {}

	@Get("summary")
	@ApiOperation({ summary: "Obter resumo de receitas e despesas" })
	@ApiQuery({
		name: "dateFrom",
		required: false,
		description: "Data inicial (ISO 8601)",
	})
	@ApiQuery({
		name: "dateTo",
		required: false,
		description: "Data final (ISO 8601)",
	})
	@ApiResponse({
		status: 200,
		description: "Resumo de finanças",
		type: SummaryReportDto,
	})
	async getSummary(
		@Session() session: UserSession,
		@Query("dateFrom") dateFrom?: string,
		@Query("dateTo") dateTo?: string,
	) {
		return this.reportsService.getSummary(
			session.user.id,
			dateFrom ? new Date(dateFrom) : undefined,
			dateTo ? new Date(dateTo) : undefined,
		);
	}

	@Get("by-category")
	@ApiOperation({ summary: "Obter gastos agrupados por categoria" })
	@ApiQuery({
		name: "dateFrom",
		required: false,
		description: "Data inicial (ISO 8601)",
	})
	@ApiQuery({
		name: "dateTo",
		required: false,
		description: "Data final (ISO 8601)",
	})
	@ApiResponse({
		status: 200,
		description: "Gastos por categoria",
		type: CategoryReportDto,
	})
	async getByCategory(
		@Session() session: UserSession,
		@Query("dateFrom") dateFrom?: string,
		@Query("dateTo") dateTo?: string,
	) {
		return this.reportsService.getByCategory(
			session.user.id,
			dateFrom ? new Date(dateFrom) : undefined,
			dateTo ? new Date(dateTo) : undefined,
		);
	}

	@Get("budget-status")
	@ApiOperation({ summary: "Obter status dos orçamentos vs gastos reais" })
	@ApiQuery({
		name: "dateFrom",
		required: false,
		description: "Data inicial (ISO 8601)",
	})
	@ApiQuery({
		name: "dateTo",
		required: false,
		description: "Data final (ISO 8601)",
	})
	@ApiResponse({
		status: 200,
		description: "Status dos orçamentos",
		type: BudgetStatusReportDto,
	})
	async getBudgetStatus(
		@Session() session: UserSession,
		@Query("dateFrom") dateFrom?: string,
		@Query("dateTo") dateTo?: string,
	) {
		return this.reportsService.getBudgetStatus(
			session.user.id,
			dateFrom ? new Date(dateFrom) : undefined,
			dateTo ? new Date(dateTo) : undefined,
		);
	}

	@Get("trends")
	@ApiOperation({ summary: "Obter tendência mensal de receitas e despesas" })
	@ApiQuery({
		name: "months",
		required: false,
		description: "Quantidade de meses a análisar (padrão: 6)",
	})
	@ApiResponse({
		status: 200,
		description: "Tendência mensal",
		type: TrendsReportDto,
	})
	async getTrends(
		@Session() session: UserSession,
		@Query("months") months?: string,
	) {
		const monthsNum = months ? parseInt(months, 10) : 6;
		return this.reportsService.getTrends(session.user.id, monthsNum);
	}
}
