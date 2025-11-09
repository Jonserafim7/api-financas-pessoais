# 🐳 Guia Docker - API Finanças Pessoais

## ✅ Status Atual

**Backend + Banco de Dados containerizados e funcionando!**

- ✅ PostgreSQL rodando em container
- ✅ API NestJS rodando em container
- ✅ Migrations executadas automaticamente
- ✅ Multi-stage build otimizado
- ✅ Healthchecks configurados
- ✅ Volume persistente para o banco

## 🚀 Como Usar

### Iniciar todos os containers

```bash
docker-compose up -d
```

### Verificar status

```bash
docker-compose ps
```

### Ver logs

```bash
# Todos os serviços
docker-compose logs -f

# Apenas API
docker-compose logs -f api

# Apenas banco
docker-compose logs -f controle-financas-pg
```

### Parar containers

```bash
docker-compose down
```

### Rebuild após mudanças no código

```bash
docker-compose up -d --build api
```

## 🌐 Endpoints Disponíveis

- **API**: http://localhost:3000
- **Swagger Docs**: http://localhost:3000/api
- **PostgreSQL**: localhost:5432 (user: docker, password: docker)

## 📦 Arquitetura dos Containers

### Container do PostgreSQL

```yaml
controle-financas-pg:
  - Imagem: bitnami/postgresql
  - Porta: 5432
  - Database: controle-financas-db
  - Healthcheck: pg_isready
  - Volume: postgres_data (dados persistem)
```

### Container da API

```yaml
api:
  - Build: Multi-stage (builder + production)
  - Porta: 3000
  - Migrations: Automáticas no startup
  - Restart: always
  - Depende: PostgreSQL (healthy)
```

## 🔧 Comandos Úteis

### Executar comandos Prisma

```bash
# Criar nova migration
docker-compose exec api npx prisma migrate dev --name nome_migration

# Ver schema do banco
docker-compose exec api npx prisma studio

# Gerar Prisma Client
docker-compose exec api npx prisma generate
```

### Acessar shell dos containers

```bash
# API
docker-compose exec api sh

# PostgreSQL
docker-compose exec controle-financas-pg bash
```

### Conectar ao PostgreSQL

```bash
docker-compose exec controle-financas-pg psql -U docker -d controle-financas-db
```

### Limpar tudo e recomeçar

```bash
# Remove containers e volumes (APAGA DADOS DO BANCO!)
docker-compose down -v

# Rebuild do zero
docker-compose build --no-cache
docker-compose up -d
```

## 📝 Estrutura de Arquivos Docker

```
.
├── Dockerfile              # Multi-stage build da API
├── docker-compose.yaml     # Orquestração dos containers
├── .dockerignore          # Arquivos ignorados no build
└── scripts/
    └── docker-entrypoint.sh  # Script de inicialização
```

### Dockerfile

O Dockerfile usa **multi-stage build** para otimização:

1. **Stage Builder**: Instala deps, gera Prisma Client, compila TypeScript
2. **Stage Production**: Imagem final leve apenas com código compilado e deps de produção

### docker-compose.yaml

Define 2 serviços:
- `controle-financas-pg`: Banco PostgreSQL
- `api`: Backend NestJS

Conectados via rede interna do Docker, com healthchecks e restart automático.

## 🎯 Próximo Passo: Adicionar Frontend React

### 1. Criar projeto React (se não tiver)

```bash
# Com Vite (recomendado)
npm create vite@latest frontend -- --template react

# Ou com Create React App
npx create-react-app frontend
```

### 2. Criar Dockerfile para o frontend

Crie `frontend/Dockerfile`:

```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Build para produção
RUN npm run build

# Stage 2: Servir com nginx
FROM nginx:alpine

# Copiar build para nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Configuração customizada do nginx (opcional)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### 3. Criar nginx.conf (opcional)

Crie `frontend/nginx.conf`:

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy para API (se quiser usar /api no frontend)
    location /api {
        proxy_pass http://api:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 4. Adicionar frontend ao docker-compose.yaml

```yaml
services:
  controle-financas-pg:
    # ... (mantém como está)

  api:
    # ... (mantém como está)

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "80:80"
    depends_on:
      - api
    environment:
      - VITE_API_URL=http://localhost:3000
    restart: unless-stopped
```

### 5. Configurar CORS no backend

Edite `src/main.ts`:

```typescript
app.enableCors({
  origin: ['http://localhost:80', 'http://localhost', 'http://localhost:3000'],
  credentials: true,
});
```

### 6. Iniciar tudo

```bash
docker-compose up -d --build
```

Acesse:
- Frontend: http://localhost
- Backend: http://localhost:3000
- Swagger: http://localhost:3000/api

## 🐛 Troubleshooting

### API não inicia

```bash
# Ver logs detalhados
docker-compose logs api

# Rebuildar
docker-compose build --no-cache api
docker-compose up -d
```

### Erro de conexão com banco

```bash
# Verificar health do postgres
docker-compose ps

# Reiniciar banco
docker-compose restart controle-financas-pg
```

### Migrations não aplicadas

```bash
# Aplicar manualmente
docker-compose exec api npx prisma migrate deploy
```

### Volumes cheios ou corrompidos

```bash
# CUIDADO: Remove TODOS os dados
docker-compose down -v
docker volume prune
docker-compose up -d
```

## 📚 Recursos

- [Docker Compose Docs](https://docs.docker.com/compose/)
- [NestJS Docker Guide](https://docs.nestjs.com/recipes/prisma#docker)
- [Prisma Docker Deployment](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-docker)
- [Multi-stage Builds](https://docs.docker.com/build/building/multi-stage/)

## 🎓 Para Entregar ao Professor

Seu projeto agora roda completamente em containers:

```bash
# Clone o projeto
git clone <seu-repo>

# Entre no diretório
cd api-financas-pessoais

# Configure .env (copie de .env.example)
cp .env.example .env

# Inicie tudo
docker-compose up -d

# Acesse http://localhost:3000/api para ver a documentação
```

**Pronto!** Backend + Banco rodando 100% em Docker. Quando adicionar o frontend React, será **BACK+FRONT+DB** completo em containers! 🎉
