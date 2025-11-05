import { Controller, Get, Logger, Query } from "@nestjs/common";
import {
	ApiBearerAuth,
	ApiExtraModels,
	ApiOperation,
	ApiQuery,
	ApiResponse,
	ApiTags,
} from "@nestjs/swagger";
import { Session, type UserSession } from "@thallesp/nestjs-better-auth";
import {
	BudgetStatusItemDto,
	BudgetStatusReportDto,
} from "./dto/budget-status-report.dto";
import {
	CategoryReportDto,
	CategoryReportItemDto,
} from "./dto/category-report.dto";
import { SummaryReportDto } from "./dto/summary-report.dto";
import { TrendMonthDto, TrendsReportDto } from "./dto/trends-report.dto";
import { ReportsService } from "./reports.service";

@Controller("reports")
@ApiTags("Reports")
@ApiBearerAuth()
@ApiExtraModels(CategoryReportItemDto, BudgetStatusItemDto, TrendMonthDto)
export class ReportsController {
	private readonly logger = new Logger(ReportsController.name);

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
		this.logger.debug(
			`GET /reports/summary - userId: ${session.user.id}, dateFrom: ${dateFrom || "undefined"}, dateTo: ${dateTo || "undefined"}`,
		);
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
		this.logger.debug(
			`GET /reports/by-category - userId: ${session.user.id}, dateFrom: ${dateFrom || "undefined"}, dateTo: ${dateTo || "undefined"}`,
		);
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
		this.logger.debug(
			`GET /reports/budget-status - userId: ${session.user.id}, dateFrom: ${dateFrom || "undefined"}, dateTo: ${dateTo || "undefined"}`,
		);
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
		this.logger.debug(
			`GET /reports/trends - userId: ${session.user.id}, months: ${monthsNum}`,
		);
		return this.reportsService.getTrends(session.user.id, monthsNum);
	}
}
