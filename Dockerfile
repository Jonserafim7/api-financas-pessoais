# ==============================================================================
# DOCKERFILE SIMPLIFICADO - API FINANÇAS PESSOAIS
# Imagem single-stage para facilitar aprendizado e debugging
# ==============================================================================

FROM node:20-alpine
# Imagem base: Node.js 20 na versão Alpine (leve, ~70MB)

WORKDIR /app
# Define /app como diretório de trabalho dentro do container

# Copiar arquivos de dependências
COPY package*.json ./
COPY prisma ./prisma/
# Copia package.json, package-lock.json e pasta prisma/ (schema + migrations)

# Instalar todas as dependências
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

# Expor porta da aplicação
EXPOSE 3000
# Documenta que o container escuta na porta 3000

# Comando padrão (pode ser sobrescrito pelo docker-compose.yml)
CMD ["node", "dist/src/main.js"]
# Inicia a aplicação Node.js
# Migrations serão executadas pelo docker-compose command
