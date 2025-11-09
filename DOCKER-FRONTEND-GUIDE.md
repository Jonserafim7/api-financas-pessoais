# 🚀 Guia: Adicionar Frontend React ao Docker Compose

Este guia mostra como adicionar um projeto frontend React ao seu `docker-compose.yml` existente, permitindo rodar **banco de dados + API + frontend** em containers Docker.

---

## 📊 Visão Geral

Existem **duas abordagens principais** para rodar frontend React com Docker:

| Abordagem | Quando Usar | Tamanho | Hot Reload |
|-----------|-------------|---------|------------|
| **Desenvolvimento** | Trabalho local diário | ~500MB | ✅ Sim |
| **Produção (Nginx)** | Deploy em servidores | ~20MB | ❌ Não |

**Recomendação:** Use ambas! Modo dev para desenvolver, modo produção para testar build final.

---

## 📁 Estrutura de Pastas Recomendada

Reorganize seu projeto assim:

```
api-financas-pessoais/          (raiz do repositório)
├── backend/                     ⬅️ Mova toda a API atual para cá
│   ├── src/
│   ├── prisma/
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   └── ...
├── frontend/                    ⬅️ Crie projeto React aqui
│   ├── src/
│   ├── public/
│   ├── Dockerfile               (produção com Nginx)
│   ├── Dockerfile.dev          (desenvolvimento com hot reload)
│   ├── nginx.conf              (config do Nginx)
│   ├── package.json
│   ├── vite.config.ts          (ou react-scripts)
│   └── ...
├── docker-compose.yml          ⬅️ Na raiz, orquestra tudo
├── DOCKER-GUIDE.md
└── .env
```

### Passo a Passo para Reorganizar

```bash
# 1. Criar pasta backend e mover arquivos da API
mkdir backend
mv src prisma package.json package-lock.json tsconfig.json nest-cli.json Dockerfile backend/
mv .dockerignore backend/

# 2. Criar projeto React na pasta frontend
npx create-vite@latest frontend -- --template react-ts
# OU
npx create-react-app frontend --template typescript

# 3. Ajustar docker-compose.yml para apontar para ./backend
```

---

## 🐳 Opção 1: Modo Desenvolvimento (Hot Reload)

Ideal para desenvolvimento local. Mudanças no código aparecem instantaneamente no navegador.

### 1. Criar `frontend/Dockerfile.dev`

```dockerfile
# ==============================================================================
# DOCKERFILE PARA DESENVOLVIMENTO - REACT
# Hot reload habilitado, ideal para desenvolvimento local
# ==============================================================================
FROM node:20-alpine

WORKDIR /app

# Instalar dependências
COPY package*.json ./
RUN npm ci

# Copiar código fonte
COPY . .

# Expor porta do servidor de desenvolvimento
EXPOSE 5173
# 5173 = Vite (padrão)
# 3000 = Create React App (se usar CRA, mude para 3000)

# Iniciar servidor de desenvolvimento
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
# --host 0.0.0.0 permite acessar de fora do container
# Necessário para acessar via localhost no navegador
```

### 2. Configurar `frontend/vite.config.ts` (se usar Vite)

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Permite acesso externo
    port: 5173,
    watch: {
      usePolling: true // Necessário para hot reload funcionar no Docker
    }
  }
})
```

### 3. Atualizar `docker-compose.yml` (na raiz)

```yaml
# ==============================================================================
# DOCKER COMPOSE - BANCO + API + FRONTEND (MODO DEV)
# ==============================================================================

services:
  # ============================================================================
  # SERVIÇO: DATABASE (PostgreSQL)
  # ============================================================================
  db:
    image: postgres:16-alpine
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: docker
      POSTGRES_PASSWORD: docker
      POSTGRES_DB: controle-financas-db
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U docker -d controle-financas-db"]
      interval: 10s
      timeout: 5s
      retries: 5

  # ============================================================================
  # SERVIÇO: API BACKEND (NestJS)
  # ============================================================================
  api:
    build:
      context: ./backend          # ⬅️ MUDOU! Agora aponta para pasta backend
      dockerfile: Dockerfile
      target: production
    ports:
      - "3000:3000"
    depends_on:
      db:
        condition: service_healthy
    environment:
      DATABASE_URL: postgresql://docker:docker@db:5432/controle-financas-db?schema=public
      BETTER_AUTH_SECRET: ${BETTER_AUTH_SECRET}
      BETTER_AUTH_URL: ${BETTER_AUTH_URL:-http://localhost:3000}
      PORT: 3000
    restart: unless-stopped

  # ============================================================================
  # SERVIÇO: FRONTEND (React) - MODO DESENVOLVIMENTO
  # Container roda npm run dev com hot reload
  # ============================================================================
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev  # Usa Dockerfile específico para dev

    ports:
      - "5173:5173"                # Porta do Vite
      # OU "3001:3000" se usar Create React App

    volumes:
      - ./frontend/src:/app/src    # ⭐ HOT RELOAD - Mapeia src/
      # Mudanças em arquivos .tsx/.ts aparecem instantaneamente

      - ./frontend/public:/app/public  # Mapeia public/

      - /app/node_modules          # ⚠️ CRÍTICO!
      # Previne que node_modules do host sobrescreva do container
      # Sem isso, hot reload quebra

    environment:
      - VITE_API_URL=http://localhost:3000
      # URL da API backend (do ponto de vista do navegador)
      # Frontend chama API via localhost porque navegador está no host

    depends_on:
      - api
      # Inicia frontend depois da API (opcional)

    stdin_open: true               # Necessário para React/Vite
    tty: true                      # Necessário para React/Vite

volumes:
  postgres_data:
    # Volume persistente para dados do PostgreSQL
```

### 4. Configurar variáveis de ambiente

Crie `frontend/.env.development`:

```env
VITE_API_URL=http://localhost:3000
```

Crie `frontend/.env.production`:

```env
VITE_API_URL=http://localhost:3000
```

### 5. Usar variáveis no código React

```typescript
// frontend/src/config/api.ts
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// frontend/src/services/categories.ts
import { API_URL } from '../config/api';

export async function getCategories() {
  const response = await fetch(`${API_URL}/api/categories`);
  return response.json();
}
```

### 6. Rodar modo desenvolvimento

```bash
# Subir todos os serviços
docker-compose up -d

# Ver logs do frontend
docker-compose logs -f frontend

# Acessar aplicação
# Frontend: http://localhost:5173
# API: http://localhost:3000/api
# Swagger: http://localhost:3000/api
```

---

## 🐳 Opção 2: Modo Produção (Nginx)

Ideal para deploy em servidores. Gera build otimizado servido por Nginx.

### 1. Criar `frontend/Dockerfile` (produção)

```dockerfile
# ==============================================================================
# MULTI-STAGE BUILD - REACT PRODUCTION
# Stage 1: Build da aplicação React
# Stage 2: Servir arquivos estáticos com Nginx
# ==============================================================================

# ==============================================================================
# STAGE 1: BUILD
# Compila React para HTML/CSS/JS otimizados
# ==============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Instalar dependências
COPY package*.json ./
RUN npm ci

# Copiar código fonte
COPY . .

# Build de produção
RUN npm run build
# Vite: Gera arquivos em dist/
# CRA: Gera arquivos em build/
# Output: HTML minificado + CSS + JS com hash (cache busting)

# ==============================================================================
# STAGE 2: PRODUCTION (NGINX)
# Serve arquivos estáticos com servidor web leve
# ==============================================================================
FROM nginx:alpine
# Nginx Alpine = apenas ~20MB (vs ~500MB do Node.js)

# Copiar arquivos buildados do stage anterior
COPY --from=builder /app/dist /usr/share/nginx/html
# Se usar Create React App, mude para:
# COPY --from=builder /app/build /usr/share/nginx/html

# Copiar configuração customizada do Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expor porta padrão do Nginx
EXPOSE 80

# Nginx já inicia automaticamente (CMD padrão da imagem)
```

### 2. Criar `frontend/nginx.conf`

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # ===========================================================================
    # CONFIGURAÇÃO PARA SPA (Single Page Application)
    # Todas as rotas redirecionam para index.html
    # ===========================================================================
    location / {
        try_files $uri $uri/ /index.html;
        # Exemplo: /categorias não existe no servidor
        # → Nginx retorna index.html
        # → React Router lê /categorias e renderiza componente correto
    }

    # ===========================================================================
    # PROXY REVERSO PARA API (OPCIONAL)
    # Útil para evitar problemas de CORS em produção
    # ===========================================================================
    location /api {
        proxy_pass http://api:3000;
        # Requisições para /api/* são enviadas para container "api"
        # Exemplo: http://localhost/api/categories → http://api:3000/api/categories

        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # ===========================================================================
    # CACHE PARA ASSETS ESTÁTICOS
    # Melhora performance e reduz tráfego de rede
    # ===========================================================================
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        # Navegador armazena esses arquivos por 1 ano
        # Hashes no nome (app.a1b2c3.js) garantem que mudanças forçam novo download
    }

    # ===========================================================================
    # GZIP COMPRESSION
    # Reduz tamanho dos arquivos transferidos
    # ===========================================================================
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
}
```

### 3. Atualizar `docker-compose.yml` para produção

```yaml
services:
  db:
    # ... (mesmo código anterior)

  api:
    # ... (mesmo código anterior)

  # ============================================================================
  # SERVIÇO: FRONTEND (React) - MODO PRODUÇÃO
  # Build estático servido por Nginx
  # ============================================================================
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile       # ⬅️ Usa Dockerfile de produção (não .dev)

    ports:
      - "80:80"                    # Porta 80 = acessa via http://localhost

    depends_on:
      - api

    restart: unless-stopped

volumes:
  postgres_data:
```

### 4. Rodar modo produção

```bash
# Build da imagem de produção
docker-compose build frontend

# Subir todos os serviços
docker-compose up -d

# Acessar aplicação
# Frontend: http://localhost (porta 80)
# API: http://localhost:3000/api
```

---

## 🎯 Opção 3: Melhor dos Dois Mundos (Profiles)

Use **profiles** para ter ambos os modos no mesmo `docker-compose.yml`:

```yaml
services:
  db:
    # ... (sempre ativo)

  api:
    # ... (sempre ativo)

  # ============================================================================
  # FRONTEND DESENVOLVIMENTO (ativa com --profile dev)
  # ============================================================================
  frontend-dev:
    profiles: ["dev"]              # ⬅️ Só ativa com flag --profile dev
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
    ports:
      - "5173:5173"
    volumes:
      - ./frontend/src:/app/src
      - ./frontend/public:/app/public
      - /app/node_modules
    environment:
      - VITE_API_URL=http://localhost:3000
    depends_on:
      - api
    stdin_open: true
    tty: true

  # ============================================================================
  # FRONTEND PRODUÇÃO (ativa com --profile prod)
  # ============================================================================
  frontend-prod:
    profiles: ["prod"]             # ⬅️ Só ativa com flag --profile prod
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "80:80"
    depends_on:
      - api
    restart: unless-stopped

volumes:
  postgres_data:
```

### Comandos com profiles

```bash
# Modo desenvolvimento (db + api + frontend-dev)
docker-compose --profile dev up -d

# Modo produção (db + api + frontend-prod)
docker-compose --profile prod up -d

# Sem profile = só db + api (útil para testar backend isolado)
docker-compose up -d

# Ver logs do frontend dev
docker-compose --profile dev logs -f frontend-dev

# Rebuild apenas frontend produção
docker-compose --profile prod up -d --build frontend-prod
```

---

## 🔧 Configuração de CORS no Backend

Para permitir que o frontend acesse a API, configure CORS no NestJS:

### Atualizar `backend/src/main.ts`

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Habilitar CORS
  app.enableCors({
    origin: [
      'http://localhost:5173',      // Vite dev
      'http://localhost:3001',      // CRA dev (se usar)
      'http://localhost',           // Nginx produção
      'http://localhost:80',        // Nginx produção (explícito)
    ],
    credentials: true,
  });

  await app.listen(3000);
}
bootstrap();
```

**Nota:** Se usar proxy reverso do Nginx (`location /api`), não precisa de CORS porque frontend e API ficam no mesmo domínio.

---

## 📊 Comparação Detalhada das Abordagens

| Aspecto | Desenvolvimento | Produção (Nginx) |
|---------|-----------------|------------------|
| **Tamanho da imagem** | ~500MB | ~20MB (96% menor!) |
| **Tempo de build** | ~2 minutos | ~3 minutos |
| **Hot reload** | ✅ Sim (instantâneo) | ❌ Não (precisa rebuild) |
| **Performance** | ⚠️ Lento (dev server) | ✅ Muito rápido (Nginx) |
| **Source maps** | ✅ Visíveis no browser | ❌ Minificado (seguro) |
| **Cache** | ❌ Não | ✅ Headers de cache otimizados |
| **Gzip** | ❌ Não | ✅ Compressão automática |
| **Uso ideal** | Desenvolvimento local | Deploy em servidores |
| **CORS** | Precisa configurar | Opcional (proxy reverso) |

---

## 📋 Workflows Completos

### Workflow 1: Primeiro Setup com Frontend

```bash
# 1. Reorganizar estrutura de pastas
mkdir backend frontend
mv src prisma package.json backend/
# ... mover outros arquivos da API

# 2. Criar projeto React
cd frontend
npm create vite@latest . -- --template react-ts
cd ..

# 3. Criar Dockerfiles no frontend/
# Copiar conteúdo dos exemplos acima

# 4. Atualizar docker-compose.yml
# Adicionar serviço frontend

# 5. Configurar variáveis de ambiente
echo "VITE_API_URL=http://localhost:3000" > frontend/.env.development

# 6. Subir em modo dev
docker-compose --profile dev up --build -d

# 7. Acessar
# Frontend: http://localhost:5173
# API: http://localhost:3000/api
```

### Workflow 2: Desenvolvimento Diário

```bash
# Subir ambiente (dev)
docker-compose --profile dev up -d

# Ver logs
docker-compose --profile dev logs -f frontend-dev

# Fazer mudanças no código
# → Hot reload automático (não precisa rebuild!)

# Se mudou dependências (package.json)
docker-compose --profile dev up --build -d frontend-dev

# Parar ao fim do dia
docker-compose down
```

### Workflow 3: Testar Build de Produção

```bash
# Build de produção
docker-compose --profile prod build frontend-prod

# Subir em modo produção
docker-compose --profile prod up -d

# Acessar http://localhost

# Ver tamanho da imagem
docker images | grep frontend

# Parar
docker-compose --profile prod down
```

### Workflow 4: Deploy para Servidor

```bash
# 1. Build local
docker-compose --profile prod build

# 2. Salvar imagens
docker save -o api.tar api-financas-pessoais-api
docker save -o frontend.tar api-financas-pessoais-frontend-prod

# 3. Transferir para servidor
scp api.tar frontend.tar usuario@servidor:/path/

# 4. No servidor
docker load -i api.tar
docker load -i frontend.tar
docker-compose --profile prod up -d
```

---

## 🐛 Troubleshooting

### Hot reload não funciona

**Problema:** Mudanças no código não aparecem no navegador

**Soluções:**

```yaml
# 1. Adicionar usePolling no vite.config.ts
server: {
  watch: {
    usePolling: true
  }
}

# 2. Verificar volumes no docker-compose.yml
volumes:
  - ./frontend/src:/app/src
  - /app/node_modules  # ⬅️ Necessário!

# 3. Rebuild do container
docker-compose --profile dev up --build -d frontend-dev
```

### Erro de CORS

**Problema:** Console do browser mostra erro de CORS

**Solução 1 - Configurar CORS no backend:**
```typescript
// backend/src/main.ts
app.enableCors({
  origin: 'http://localhost:5173',
  credentials: true,
});
```

**Solução 2 - Usar proxy do Nginx (produção):**
```nginx
# frontend/nginx.conf
location /api {
  proxy_pass http://api:3000;
}
```

### Frontend não acessa API

**Problema:** Requisições para API falham

**Verificar:**

```bash
# 1. API está rodando?
curl http://localhost:3000/api

# 2. URL correta no frontend?
echo $VITE_API_URL

# 3. Container frontend enxerga container API?
docker-compose exec frontend-dev ping api

# 4. CORS configurado no backend?
# Ver seção de CORS acima
```

### Build de produção falha

**Problema:** `docker-compose build frontend` falha

**Verificar:**

```bash
# 1. Build funciona localmente?
cd frontend
npm run build

# 2. Caminho correto no Dockerfile?
# Vite usa /app/dist
# CRA usa /app/build

# 3. Ver logs completos
docker-compose build --no-cache frontend-prod
```

### Porta já em uso

**Problema:** `Bind for 0.0.0.0:5173 failed: port is already allocated`

**Soluções:**

```bash
# 1. Mudar porta no docker-compose.yml
ports:
  - "5174:5173"  # Host:Container

# 2. Matar processo na porta
# Windows:
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Linux/Mac:
lsof -ti:5173 | xargs kill -9
```

---

## 📚 Recursos Adicionais

- [Docker Multi-Stage Builds](https://docs.docker.com/build/building/multi-stage/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Vite Docker Guide](https://vitejs.dev/guide/static-deploy.html#docker)
- [React + Docker Best Practices](https://mherman.org/blog/dockerizing-a-react-app/)
- [Docker Compose Profiles](https://docs.docker.com/compose/profiles/)

---

## 🎉 Resumo

Agora você sabe como:

✅ Adicionar frontend React ao Docker Compose
✅ Configurar hot reload em containers Docker
✅ Criar builds de produção otimizados com Nginx
✅ Usar profiles para alternar entre dev e prod
✅ Configurar CORS e comunicação entre containers
✅ Troubleshoot problemas comuns

Escolha a abordagem que faz mais sentido para seu caso de uso e mãos à obra! 🚀
