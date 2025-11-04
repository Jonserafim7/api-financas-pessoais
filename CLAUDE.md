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

### TypeScript Imports in Controllers

**CRITICAL**: Always use regular imports (not `import type`) for DTOs in controllers:

```typescript
// ✅ CORRECT: Regular import (class available at runtime)
import { CreateCategoryDto } from "./dto/create-category.dto";

// ❌ WRONG: Type-only import (erased at runtime, breaks validation)
import type { CreateCategoryDto } from "./dto/create-category.dto";
```

**Why**: NestJS's `ValidationPipe` needs the actual DTO class at runtime to:
1. Instantiate the DTO
2. Read validation decorators (`@IsString()`, `@IsEnum()`, etc.)
3. Apply validation rules

Type-only imports are erased during TypeScript compilation, causing validation to fail with errors like "property X should not exist".

**When to use `type` imports**: Only for types/interfaces that are never used as values (e.g., `type UserSession`).

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

## JSDoc & Comments

### Style Guidelines
- **Concise**: Brief descriptions, no redundancy
- **Purpose-focused**: Explain "why", not obvious "what"
- **Business logic only**: Skip comments on straightforward code

### JSDoc Conventions

**Class-level JSDoc** (explain service/class purpose):
```typescript
/**
 * Manages user expense/income categories with unique name constraint per user
 */
@Injectable()
export class CategoriesService {
```

**Method-level JSDoc** (describe what method does + exceptions):
```typescript
/**
 * Create category with unique name validation
 * @throws BadRequestException if name already exists for this user
 */
async create(userId: string, createCategoryDto: CreateCategoryDto) {
```

**Helper/Private method JSDoc**:
```typescript
/**
 * Format date range for report display
 * @private
 */
private getPeriodString(dateFrom?: Date, dateTo?: Date): string {
```

### Inline Comments

Use only for non-obvious business logic:

```typescript
// Validate category ownership if category is being changed
if (updateTransactionDto.categoryId) {
  const category = await this.prisma.category.findFirst(...)
}

// Status: exceeded (>=100%), warning (>=80%), ok (<80%)
let status: "ok" | "warning" | "exceeded" = "ok";
```

**Don't comment obvious code**:
```typescript
// ❌ AVOID: Redundant
const categories = await this.prisma.category.findMany();  // Get all categories

// ✅ GOOD: Only business logic
// Initialize all months with zero values (ensures complete data for empty months)
const monthlyData = new Map<string, { income: number; expense: number }>();
```

### Where Comments Exist

- **Services** (`src/*/**.service.ts`): Class docs + method JSDoc + business logic comments
- **Config files** (`src/main.ts`, `src/lib/auth.ts`): Explanatory comments for setup
- **Controllers, DTOs**: Use `@ApiProperty` + `@ApiOperation` instead (Swagger docs)
- **Tests**: Minimal comments (test names are self-documenting)

## Biome Configuration

Linting/formatting via `biomejs/biome` 2.3.2:
```bash
npm run check    # Auto-fix format + lint issues
```

Configured in `.git/ignore` + likely `biome.json` (check project root).

## Database Seeding

Populate database with test data (users, categories, transactions, budgets):

```bash
npm run db:seed
```

### Test Credentials
After seeding, use these credentials to test the API:
- **User 1**: `joao@test.com` / `password123`
- **User 2**: `maria@test.com` / `password123`

Each user has:
- 4-6 expense/income categories
- 15-20 sample transactions (last 3 months)
- 2-3 monthly budgets (category-specific + overall)

**Note**: Seed script clears all data before seeding. Use only in development.

## Environment Variables

Required in `.env` (copy from `.env.example`):

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string for Prisma & Better Auth (`postgresql://user:password@host:port/db?schema=public`) |
| `BETTER_AUTH_SECRET` | ✅ | Secret key for signing Better Auth tokens. Generate random: `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | ✅ | Base URL of your application (`http://localhost:3000` in dev, production URL in prod) |
| `PORT` | ❌ | Server port (default: 3000) |

**Setup**:
```bash
cp .env.example .env
# Edit .env with your values
```

**Note**: Better Auth reads `DATABASE_URL` from Prisma config (`prisma.config.ts`).

## Testing

Jest configured with TypeScript support (`ts-jest`). Test files: `*.spec.ts` in src/.

```bash
npm run test:watch      # Useful during development
npm run test -- --testPathPattern=categories  # Run specific module tests
```

## Testing Strategy

### Test Types & Locations
- **Unit Tests** (`*.service.spec.ts`): Service logic, mocked Prisma
- **Integration Tests** (`*.controller.spec.ts`): Controller endpoints, mocked Service
- **E2E Tests** (`test/*.e2e-spec.ts`): Full app instance, real routes, auth requirements

### Running Tests
```bash
npm test              # Unit + integration (src/**/*.spec.ts)
npm run test:e2e      # E2E tests (test/**/*.e2e-spec.ts)
npm test -- --watch   # Watch mode
npm test -- --coverage # Coverage report
```

### Test Setup Patterns

**Unit Tests (Service):**
```typescript
import { createPrismaMock } from "../test/mocks/prisma.mock";
const prisma = createPrismaMock();
const module = await Test.createTestingModule({
  providers: [ServiceClass, { provide: PrismaService, useValue: prisma }],
}).compile();
```

**Integration Tests (Controller):**
```typescript
const module = await Test.createTestingModule({
  controllers: [ControllerClass],
  providers: [{
    provide: ServiceClass,
    useValue: { method1: jest.fn(), method2: jest.fn() }
  }],
}).compile();
```

**E2E Tests:**
```typescript
const module = await Test.createTestingModule({
  imports: [AppModule], // Full app with real connections
}).compile();
app = module.createNestApplication();
await app.init();
```

### Mocks Location
- `src/test/mocks/prisma.mock.ts` - Mock Prisma methods
- `src/test/mocks/session.mock.ts` - Mock Better Auth session (includes TEST_USER_ID)

### Jest Configuration (package.json)
Critical for better-auth compatibility:
```json
"transformIgnorePatterns": [
  "node_modules/(?!(better-auth|@better-auth|@thallesp|jose|@noble|@panva)/)"
]
```
Same config also in `test/jest-e2e.json`.

### Test Coverage
- Categories: 11 unit + 7 integration + 3 E2E = 21 tests ✅
- Transactions, Budgets, Reports: Follow same pattern

## Build & Deployment

1. `npm run build` → Compiles to `dist/`
2. `npm run start:prod` → Runs `node dist/main`

All environment variables must be set in production. Prisma Client auto-generated in `generated/prisma/` (ensure `npx prisma generate` runs before deploy if not in postinstall hook).
