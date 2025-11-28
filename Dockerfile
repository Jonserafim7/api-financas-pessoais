# ==============================================================================
# DOCKERFILE DE PRODUÇÃO - API FINANÇAS PESSOAIS
# Multi-stage build: Builder → Production
# ==============================================================================

# ------------------------------------------------------------------------------
# STAGE 1: BUILDER
# Compila TypeScript e gera Prisma Client
# ------------------------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./
COPY prisma ./prisma/
# Copia package.json, package-lock.json e pasta prisma/ (schema + migrations)

# Instalar TODAS as dependências
RUN npm ci
# npm ci: Instala dependências exatamente como em package-lock.json
# Inclui devDependencies (necessárias para compilar TypeScript)

# Copiar código fonte
COPY . .
# Copia todo o código fonte (src/, tsconfig.json, etc.)
# .dockerignore define o que será ignorado (node_modules, .git, etc.)

# Configurar DATABASE_URL dummy para Prisma generate
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy?schema=public"
# Prisma precisa desta variável para validar a config (será substituída no runtime)

# Gerar Prisma Client e compilar aplicação
RUN npx prisma generate && npm run build
# 1. Gera Prisma Client (tipos TypeScript + queries)
# 2. Compila TypeScript para JavaScript em dist/

# ------------------------------------------------------------------------------
# STAGE 2: PRODUCTION
# Imagem final otimizada com apenas dependências de produção
# ------------------------------------------------------------------------------
FROM node:20-alpine AS production

WORKDIR /app

# Criar usuário não-root para segurança
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
# Evita rodar a aplicação como root (boa prática de segurança)

# Copiar arquivos de dependências
COPY package*.json ./
COPY prisma ./prisma/
# Necessário para npm install e para executar migrations no runtime

# Instalar apenas dependências de produção
RUN npm ci --omit=dev
# --omit=dev: Ignora devDependencies, reduzindo tamanho da imagem
# Inclui dependências necessárias para runtime (Better Auth, Prisma, etc.)

# Copiar código compilado do stage builder
COPY --from=builder /app/dist ./dist
# Copia APENAS os arquivos JavaScript compilados

# Copiar Prisma Client gerado do stage builder
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
# Prisma Client é gerado no build time, precisa ser copiado para runtime

# Mudar ownership dos arquivos para usuário não-root
RUN chown -R nodejs:nodejs /app
# Garante que o usuário nodejs tem permissão para ler os arquivos

# Trocar para usuário não-root
USER nodejs
# Todas as operações a partir daqui rodam com usuário nodejs (não root)

# Expor porta da aplicação
EXPOSE 3000
# Documenta que o container escuta na porta 3000

# Comando padrão (pode ser sobrescrito pelo docker-compose.yml)
CMD ["node", "dist/src/main.js"]
# Inicia a aplicação Node.js
# Migrations serão executadas pelo docker-compose command
