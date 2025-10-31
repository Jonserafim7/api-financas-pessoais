# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**API Finanças Pessoais** is a personal finance management REST API built with NestJS. It provides endpoints for managing categories, transactions, budgets, and generating financial reports. All endpoints require authentication via Better Auth (except `/api/auth/*`).

## Core Architecture

### Tech Stack
- **Framework**: NestJS 11 (TypeScript)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Better Auth with email/password + Expo plugin (mobile support)
- **Validation**: class-validator + class-transformer
- **Documentation**: Swagger/OpenAPI
- **Code Quality**: Biome (linting/formatting)

### Module Structure
Each feature is organized as an independent NestJS module with:
- **Controller**: HTTP endpoints with Swagger decorators
- **Service**: Business logic & Prisma queries
- **DTOs**: Request/response validation with `@IsXxx` decorators
- **Module**: Dependency injection container

Modules:
- `CategoriesModule`: CRUD for income/expense categories
- `TransactionsModule`: CRUD with date/category/type filters
- `BudgetsModule`: CRUD with period validation (WEEKLY/MONTHLY/YEARLY)
- `ReportsModule`: Analytics (summary, by-category, budget-status, trends)

### Database Design
- **User**: Core auth model from Better Auth
- **Category**: User's expense/income categories (unique per user per name)
- **Transaction**: Individual income/expense entries (Decimal amounts in BRL)
- **Budget**: Period-based budget limits (optional category, null = overall)

Cascade deletes on user removal. Indexes on userId, categoryId, date for query performance.

### Authentication & Authorization
- Better Auth instance in `src/lib/auth.ts` configured with Prisma adapter
- NestJS `AuthModule` from `@thallesp/nestjs-better-auth` provides:
  - Global `AuthGuard` protecting all routes by default
  - `@Session()` decorator extracts `UserSession` (user + session data)
  - `@AllowAnonymous()` and `@OptionalAuth()` decorators override guard
- All data queries automatically filtered by `session.user.id` (Row-Level Security)

## Common Commands

```bash
# Development
npm run start:dev          # Start with hot-reload
npm run build             # Build TypeScript to dist/

# Database
npx prisma migrate dev    # Create & apply migration interactively
npx prisma generate       # Regenerate Prisma Client
npx prisma db seed        # Run seed script (if created)

# Testing & Quality
npm run test              # Run Jest unit tests
npm run test:watch       # Watch mode for tests
npm run test:cov         # Coverage report
npm run test:e2e         # E2E tests
npm check                # Biome format + lint (auto-fix)

# Production
npm run build            # Compile to dist/
npm run start:prod       # Run compiled app (node dist/main)
```

## Development Workflow

### Adding a New Feature

1. **Update Prisma Schema** (`prisma/schema.prisma`)
   - Add/modify models
   - Run `npx prisma migrate dev --name "description"` to create migration

2. **Create Module Structure**
   - DTOs: `src/feature/dto/create-feature.dto.ts`, `update-feature.dto.ts`, `feature-response.dto.ts`
   - Service: `src/feature/feature.service.ts` (queries, business logic)
   - Controller: `src/feature/feature.controller.ts` (routes, Swagger docs)
   - Module: `src/feature/feature.module.ts` (imports PrismaService, exports service)

3. **Import Module** in `src/app.module.ts` imports array

4. **API Docs** automatically update on `/api` (Swagger UI)

### PrismaService Usage
All modules inject `PrismaService` (extends PrismaClient):
```typescript
constructor(private prisma: PrismaService) {}
// Use: this.prisma.modelName.method(...)
```

### DTO Validation Example
```typescript
import { IsString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Alimentação' })
  @IsString()
  name: string;

  @ApiProperty({ enum: ['INCOME', 'EXPENSE'] })
  @IsEnum(['INCOME', 'EXPENSE'])
  type: string;
}
```

### Swagger Decorators
Controllers use decorators for auto-documentation:
```typescript
@ApiTags('Categories')
@ApiBearerAuth()
@ApiOperation({ summary: 'Create new category' })
@ApiResponse({ status: 201, type: CategoryResponseDto })
```

## Key Patterns

### User-Scoped Queries
All queries must filter by `userId` to enforce multi-tenancy:
```typescript
const categories = await this.prisma.category.findMany({
  where: { userId }, // ← Always filter
  orderBy: { createdAt: 'desc' }
});
```

### DateTime Handling
- Accept ISO8601 strings in DTOs (`@IsISO8601()`)
- Convert to Date in service: `new Date(dtoDate)`
- Prisma stores as timestamptz in PostgreSQL

### Decimal Amounts
- Use `Decimal` type in schema: `amount Decimal @db.Decimal(12, 2)`
- Accept numbers in DTOs, Prisma handles conversion
- Return as strings in response DTOs for precision

### Error Handling
- `BadRequestException`: Invalid input or business logic violation
- `NotFoundException`: Resource not found for user
- Other NestJS HttpExceptions bubble up with proper status codes

## Biome Configuration

Linting/formatting via `biomejs/biome` 2.3.2:
```bash
npm run check    # Auto-fix format + lint issues
```

Configured in `.git/ignore` + likely `biome.json` (check project root).

## Environment Variables

Required in `.env`:
- `DATABASE_URL`: PostgreSQL connection string (used by Prisma & Better Auth)
- `PORT`: Server port (default 3000)

Better Auth reads DATABASE_URL from Prisma config (`prisma.config.ts`).

## Testing

Jest configured with TypeScript support (`ts-jest`). Test files: `*.spec.ts` in src/.

```bash
npm run test:watch      # Useful during development
npm run test -- --testPathPattern=categories  # Run specific module tests
```

## Build & Deployment

1. `npm run build` → Compiles to `dist/`
2. `npm run start:prod` → Runs `node dist/main`

All environment variables must be set in production. Prisma Client auto-generated in `generated/prisma/` (ensure `npx prisma generate` runs before deploy if not in postinstall hook).
