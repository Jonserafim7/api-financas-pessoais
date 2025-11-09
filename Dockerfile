# ==============================================================================
# STAGE 1: BUILD
# Estágio responsável por compilar o código TypeScript para JavaScript
# ==============================================================================
FROM node:20-alpine AS builder
# FROM: Define a imagem base (Node.js 20 na versão Alpine - apenas 70MB vs 1GB da versão completa)
# AS builder: Nomeia este estágio como "builder" para referência posterior

WORKDIR /app
# WORKDIR: Define o diretório de trabalho dentro do container (/app)
# Todos os comandos seguintes serão executados a partir deste diretório

# Copy package files
COPY package*.json ./
# COPY: Copia arquivos do host (seu computador) para o container
# package*.json: Copia package.json e package-lock.json
# ./: Destino é o diretório atual (/app)

COPY prisma ./prisma/
# Copia a pasta prisma/ com schema e migrations para o container

# Install all dependencies (including dev)
RUN npm ci
# RUN: Executa um comando dentro do container durante o build
# npm ci: Instala dependências exatamente como em package-lock.json
# Instala TODAS as dependências (incluindo devDependencies para compilar TypeScript)

# Copy source code
COPY . .
# Copia TODO o código fonte restante (src/, tsconfig.json, etc.)
# O arquivo .dockerignore controla o que é ignorado (node_modules, .git, etc.)

# Set dummy DATABASE_URL for Prisma generate (not used, just needed for config validation)
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy?schema=public"
# ENV: Define uma variável de ambiente dentro do container
# Prisma precisa de DATABASE_URL para validar a config, mas não conecta ao banco durante o build
# Este valor será sobrescrito no runtime pelo docker-compose.yml

# Generate Prisma Client and build application
RUN npx prisma generate && npm run build
# npx prisma generate: Gera o Prisma Client (tipos TypeScript + queries)
# &&: Executa o próximo comando apenas se o anterior tiver sucesso
# npm run build: Compila TypeScript para JavaScript em dist/

# ==============================================================================
# STAGE 2: PRODUCTION
# Estágio responsável por criar a imagem final otimizada (apenas com arquivos necessários)
# ==============================================================================
FROM node:20-alpine AS production
# Nova imagem limpa (não herda nada do stage builder, exceto o que copiarmos explicitamente)
# Resultado: imagem final muito menor (~200MB vs ~500MB se fosse stage único)

WORKDIR /app
# Define /app como diretório de trabalho na imagem de produção

# Copy package files and Prisma schema
COPY package*.json ./
COPY prisma ./prisma/
# Copia novamente package files e schema (não herdou do stage anterior)

# Install only production dependencies
RUN npm ci --omit=dev
# --omit=dev: Instala APENAS dependências de produção (exclui devDependencies)
# Economiza ~100MB removendo typescript, @types/*, ferramentas de build, etc.

# Set dummy DATABASE_URL for Prisma generate (will be overridden at runtime)
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy?schema=public"
# Mesma variável dummy necessária para gerar o Prisma Client neste stage
# Será substituída pela URL real definida no docker-compose.yml

# Generate Prisma Client in production environment
RUN npx prisma generate
# Gera o Prisma Client novamente na imagem de produção
# Necessário porque não copiamos node_modules do builder (para manter imagem limpa)

# Copy built application
COPY --from=builder /app/dist ./dist
# COPY --from=builder: Copia arquivos DO STAGE ANTERIOR (builder)
# Copia apenas o código JavaScript compilado (dist/), não o código TypeScript original

# Create entrypoint script directly in the image to avoid line ending issues
RUN printf '#!/bin/sh\nset -e\necho "Running database migrations..."\nnpx prisma migrate deploy\necho "Starting application..."\nexec node dist/src/main.js\n' > /usr/local/bin/docker-entrypoint.sh && \
    chmod +x /usr/local/bin/docker-entrypoint.sh
# printf: Cria um script shell dentro do container
# > /usr/local/bin/docker-entrypoint.sh: Salva o script neste caminho
# chmod +x: Torna o script executável
# O script executa migrations antes de iniciar a aplicação

# Expose port
EXPOSE 3000
# EXPOSE: Documenta que o container escuta na porta 3000
# ATENÇÃO: Não publica a porta automaticamente! O docker-compose.yml faz isso com "ports:"

# Run migrations and start application
ENTRYPOINT ["docker-entrypoint.sh"]
# ENTRYPOINT: Define o comando principal que será executado quando o container iniciar
# Executa o script criado acima (migrations + node dist/src/main.js)
