# API Finanças Pessoais

A personal finance management REST API built with NestJS. Track income, expenses, budgets, and generate financial reports with multi-user support.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Running with Docker](#running-with-docker)
- [API Documentation](#api-documentation)
- [Testing with Postman](#testing-with-postman)
- [Available Scripts](#available-scripts)
- [Authentication](#authentication)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Common Issues](#common-issues)
- [Documentation](#documentation)
- [License](#license)

## Features

- **Categories**: Organize income/expense transactions (custom categories per user)
- **Transactions**: Record income and expense entries with dates, amounts, and categories
- **Budgets**: Set spending limits by category or overall (weekly/monthly/yearly periods)
- **Reports**: Analyze spending with summary, category breakdown, budget status, and trends
- **Authentication**: Email/password auth via Better Auth with secure session management
- **Multi-tenant**: Each user sees only their own data (automatic row-level security)
- **API Docs**: Interactive Swagger/OpenAPI documentation

## Tech Stack

- **Framework**: NestJS 11 (TypeScript)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Better Auth (email/password + Expo mobile plugin)
- **Validation**: class-validator, class-transformer
- **Documentation**: Swagger/OpenAPI
- **Code Quality**: Biome (linting/formatting)
- **Testing**: Jest (unit, integration, E2E)

## Prerequisites

- **Node.js**: v18 or higher
- **PostgreSQL**: v12 or higher
- **npm**: v9 or higher

## Quick Start

### 1. Clone Repository

```bash
git clone <repository-url>
cd api-financas-pessoais
npm install
```

### 2. Setup Environment

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Database (PostgreSQL)
DATABASE_URL="postgresql://user:password@localhost:5432/financas_db?schema=public"

# Better Auth (generate random secret for production)
BETTER_AUTH_SECRET="random_secret_key_here"
BETTER_AUTH_URL="http://localhost:3000"

# Server
PORT=3000
```

### 3. Database Setup

Create PostgreSQL database and run migrations:

```bash
npx prisma migrate dev
```

### 4. Seed Test Data

Populate database with test users, categories, transactions, and budgets:

```bash
npm run db:seed
```

**Test Credentials**:
- `joao@test.com` / `password123`
- `maria@test.com` / `password123`

### 5. Run Development Server

```bash
npm run start:dev
```

Server starts at `http://localhost:3000`

## Running with Docker

### Prerequisites
- Docker & Docker Compose installed

### 1. Clone & Setup Environment

```bash
git clone <repository-url>
cd api-financas-pessoais
cp .env.example .env
```

Edit `.env` with required variables (see [Environment Variables](#environment-variables)).

### 2. Start Application

```bash
# Build images and start containers (PostgreSQL + API)
docker-compose up

# Or run in detached mode (background)
docker-compose up -d
```

The API will automatically:
- Start PostgreSQL database
- Run migrations (`prisma migrate deploy`)
- Start NestJS application

Access API at `http://localhost:3000`

### 3. Seed Test Data (Optional)

```bash
# Run seed script inside the container
docker-compose exec api npm run db:seed
```

**Test Credentials**: `joao@test.com` / `password123` or `maria@test.com` / `password123`

### Useful Commands

```bash
docker-compose logs -f api      # View API logs
docker-compose logs -f db       # View database logs
docker-compose down             # Stop containers
docker-compose down -v          # Stop & remove volumes (deletes data)
docker-compose build --no-cache # Rebuild images from scratch
```

## API Documentation

### Interactive Swagger UI
```
http://localhost:3000/api
```

### OpenAPI JSON Spec
```
http://localhost:3000/api-json
```

All endpoints (except `/api/auth/*`) require authentication via Bearer token or session cookie.

## Testing with Postman

### 1. Sign In

```
POST http://localhost:3000/api/auth/sign-in/email
Headers: Origin: http://localhost:3000, Content-Type: application/json

{
  "email": "joao@test.com",
  "password": "password123"
}
```

### 2. Access Protected Endpoints

After sign-in, session cookies are automatically included. Example:

```
GET http://localhost:3000/categories
```

### 3. Common Endpoints

```
GET    /categories              - List user's categories
POST   /categories              - Create category
PUT    /categories/:id          - Update category
DELETE /categories/:id          - Delete category

GET    /transactions            - List transactions (with filters)
POST   /transactions            - Create transaction
PUT    /transactions/:id        - Update transaction
DELETE /transactions/:id        - Delete transaction

GET    /budgets                 - List budgets
POST   /budgets                 - Create budget
PUT    /budgets/:id             - Update budget
DELETE /budgets/:id             - Delete budget

GET    /reports/summary         - Income/expense summary
GET    /reports/by-category     - Spending by category
GET    /reports/budget-status   - Budget vs actual
GET    /reports/trends          - Monthly trends (last 6 months)
```

## Available Scripts

```bash
# Development
npm run start:dev       # Start with hot-reload
npm run build          # Build TypeScript to dist/

# Database
npx prisma migrate dev # Create & apply migration
npx prisma generate   # Regenerate Prisma client
npm run db:seed       # Populate database with test data

# Testing & Quality
npm test              # Run unit & integration tests
npm test:watch        # Watch mode
npm test:cov          # Coverage report
npm run test:e2e      # E2E tests
npm run check         # Format & lint with Biome (auto-fix)

# Production
npm run build         # Compile to dist/
npm run start:prod    # Run compiled app
```

## Authentication

Better Auth secures all endpoints (except auth routes) by:
- Validating session tokens from cookies
- Using `@Session()` decorator to inject authenticated user data
- Automatically filtering queries by `session.user.id`

**Important for Postman/API testing**:
- Add `Origin: http://localhost:3000` header to requests (CSRF protection)
- Cookies from sign-in are automatically sent to protected endpoints

## Project Structure

```
src/
├── categories/         # Categories module (CRUD)
├── transactions/       # Transactions module (CRUD with filtering)
├── budgets/           # Budgets module (CRUD with validation)
├── reports/           # Analytics & reports
├── lib/
│   └── auth.ts        # Better Auth configuration
├── app.module.ts      # Main app module
├── app.controller.ts  # App routes
├── main.ts            # Bootstrap & Swagger setup
└── prisma.service.ts  # Database client

prisma/
├── schema.prisma      # Data model definitions
└── seed.ts            # Database seeding script

test/
├── *.e2e-spec.ts      # E2E tests
└── jest-e2e.json      # E2E Jest config
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | ✅ | - | PostgreSQL connection string (`postgresql://user:password@host:port/db?schema=public`) |
| `BETTER_AUTH_SECRET` | ✅ | - | Secret key for signing Better Auth tokens (generate random value in production) |
| `BETTER_AUTH_URL` | ✅ | - | Base URL of your application (used for auth redirects) |
| `PORT` | ❌ | 3000 | Server port where API listens |

**Setup**: Copy `.env.example` to `.env` and fill in your values (see Quick Start step 2)

## Development Workflow

### Adding a New Feature

1. **Update Prisma Schema** (`prisma/schema.prisma`)
   ```bash
   npx prisma migrate dev --name "description"
   ```

2. **Create Module** (`src/feature/`)
   - `feature.controller.ts` - Routes & Swagger docs
   - `feature.service.ts` - Business logic
   - `feature.module.ts` - DI container
   - `dto/` - Request/response validation

3. **Import Module** in `src/app.module.ts`

4. **Write Tests**
   - Unit: `feature.service.spec.ts`
   - Integration: `feature.controller.spec.ts`
   - E2E: `test/feature.e2e-spec.ts`

5. **API Docs Update** Automatically via Swagger decorators

## Testing

```bash
# Run all tests
npm test

# Watch mode (great for development)
npm test -- --watch

# Specific module
npm test -- --testPathPattern=categories

# Coverage report
npm test -- --coverage

# E2E tests
npm run test:e2e
```

**Test Structure**:
- **Unit Tests** (`*.service.spec.ts`): Service logic with mocked Prisma
- **Integration Tests** (`*.controller.spec.ts`): Controller endpoints with mocked services
- **E2E Tests** (`test/*.e2e-spec.ts`): Full app instance with real database

## Common Issues

### "Missing or null Origin" Error (Postman)
Add `Origin: http://localhost:3000` header to requests (Better Auth CSRF protection).

### "Invalid password hash" Error
Use the test credentials from `npm run db:seed` (passwords hashed with Better Auth's algorithm).

### Database Connection Failed
- Verify PostgreSQL is running
- Check `DATABASE_URL` in `.env` is correct
- Ensure database exists: `createdb financas_db`

## Documentation

For detailed architecture, patterns, and guidelines, see `CLAUDE.md`:
- Module structure & patterns
- Authentication flow
- Database design
- Testing strategy
- Common commands

## License

UNLICENSED
