# 🎓 Docker Explicado - Entendendo Tudo do Zero

Este guia explica **cada conceito** usado na containerização desta API. Se você nunca mexeu com Docker, comece aqui!

---

## 📚 Índice

1. [O que é Docker e por que usar](#o-que-é-docker)
2. [Estrutura dos Arquivos](#estrutura-dos-arquivos)
3. [Dockerfile Linha por Linha](#dockerfile-linha-por-linha)
4. [Docker Compose Explicado](#docker-compose-explicado)
5. [Fluxo Completo de Execução](#fluxo-completo)
6. [Conceitos-Chave](#conceitos-chave)
7. [Troubleshooting](#troubleshooting)
8. [FAQ](#faq)

---

## O que é Docker?

### Definição Simples

Docker permite empacotar sua aplicação com **tudo** que ela precisa (Node.js, bibliotecas, código) em um **container** - uma espécie de "caixa isolada" que roda da mesma forma em qualquer máquina.

### Analogia do Mundo Real

Imagine que você cozinha um prato em casa e quer que seu amigo coma exatamente o mesmo:

- **Sem Docker**: Você manda a receita e ele precisa ter os mesmos ingredientes, fogão igual, panelas iguais
- **Com Docker**: Você manda a comida já pronta em uma marmita (container) - só aquecer e comer

### Por que Docker Resolve Seu Problema?

**★ Insight ─────────────────────────────────────**
**Benefícios para o trabalho do professor:**
1. **Portabilidade**: Ele não precisa instalar Node.js, PostgreSQL, nem nada - só Docker Desktop
2. **Isolamento**: Cada container é independente (API não interfere no banco, nem no sistema do professor)
3. **Reprodutibilidade**: `docker-compose up` garante que tudo suba sempre da mesma forma, sem "na minha máquina funciona"
**─────────────────────────────────────────────────**

---

## Estrutura dos Arquivos

```
api-financas-pessoais/
├── Dockerfile              # "Receita" para criar imagem da API
├── docker-compose.yaml     # Orquestrador (sobe API + Banco juntos)
├── .dockerignore          # O que NÃO enviar pro container
├── scripts/
│   └── docker-entrypoint.sh  # Script que roda antes da API (migrations)
└── ... (resto do código)
```

### O que cada arquivo faz?

| Arquivo | Função | Analogia |
|---------|--------|----------|
| `Dockerfile` | Receita para criar a imagem da API | Receita de bolo (ingredientes + passos) |
| `docker-compose.yaml` | Coordena múltiplos containers | Maestro regendo orquestra |
| `.dockerignore` | Arquivos a ignorar no build | .gitignore do Docker |
| `entrypoint.sh` | Script de inicialização | "Pré-aquecimento do forno" |

---

## Dockerfile Linha por Linha

### O que é Multi-Stage Build?

**★ Insight ─────────────────────────────────────**
**Multi-stage build** é como cozinhar: você usa panelas, ingredientes, liquidificador (stage builder), mas no prato final (stage production) só vai a comida pronta.

**Resultado**: Imagem 70% menor! Sem TypeScript compiler, sem dev dependencies, sem testes.
**─────────────────────────────────────────────────**

### Stage 1: Builder (Construção)

```dockerfile
FROM node:20-alpine AS builder
```

**O que faz:** Cria um container temporário com Node.js versão 20.

**Por que Alpine?** É uma versão Linux ultra-leve (5MB vs 900MB do Ubuntu). Node Alpine = 40MB vs 300MB do Node normal.

---

```dockerfile
WORKDIR /app
```

**O que faz:** Define `/app` como diretório de trabalho (todos os comandos seguintes rodam lá).

**Equivalente:** `cd /app` no terminal.

---

```dockerfile
COPY package*.json ./
```

**O que faz:** Copia APENAS `package.json` e `package-lock.json` para `/app`.

**Por que copiar package.json ANTES do resto?** Truque de otimização! Explicação:

1. Docker funciona com **layers** (camadas)
2. Cada comando (`COPY`, `RUN`) cria uma layer
3. Docker **cacheia** layers que não mudaram
4. Se você mudar `src/main.ts` mas package.json continuar igual, Docker reutiliza a layer do `npm ci` (economiza 2-3 minutos!)

**Ordem importa:**
```dockerfile
# ❌ ERRADO: Sempre reinstala deps
COPY . .
RUN npm ci

# ✅ CORRETO: Só reinstala se package.json mudar
COPY package*.json ./
RUN npm ci
COPY . .
```

---

```dockerfile
RUN npm ci
```

**O que faz:** Instala dependências.

**`npm ci` vs `npm install`:**
- `npm ci`: Limpa node_modules, instala exatamente o que está no lock file (determinístico)
- `npm install`: Pode atualizar versões se package.json permitir (não-determinístico)

**Para Docker, sempre use `npm ci`!**

---

```dockerfile
COPY . .
```

**O que faz:** Copia TODO o código fonte para `/app`.

**Por que agora?** Porque já instalamos as deps (que estão cacheadas). Mudanças no código não forçam reinstalação.

---

```dockerfile
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy?schema=public"
```

**O que faz:** Define variável de ambiente TEMPORÁRIA só para o build.

**Por que URL "dummy"?** O `prisma.config.ts` carrega dotenv e exige `DATABASE_URL`. Mas no build não conectamos no banco de verdade, só geramos código TypeScript. Então passamos uma URL fake.

---

```dockerfile
RUN npx prisma generate
```

**O que faz:** Gera o Prisma Client (código TypeScript gerado automaticamente baseado no `schema.prisma`).

**Onde fica?** Em `/app/generated/prisma` (ou `node_modules/.prisma` dependendo da config).

---

```dockerfile
RUN npm run build
```

**O que faz:** Compila TypeScript → JavaScript.

**Resultado:** Cria pasta `dist/` com código compilado (`dist/src/main.js`, `dist/src/app.module.js`, etc).

---

### Stage 2: Production (Imagem Final)

```dockerfile
FROM node:20-alpine AS production
```

**IMPORTANTE:** Começamos do ZERO! Não herdamos nada do stage builder (sem código fonte, sem dev dependencies).

---

```dockerfile
COPY package*.json ./
RUN npm ci --omit=dev
```

**`--omit=dev`:** Instala APENAS dependências de `dependencies`, ignora `devDependencies`.

**Não instala:** Jest, TypeScript, @types/*, Biome, etc.

**Resultado:** node_modules 60% menor + mais seguro (menos superfície de ataque).

---

```dockerfile
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
```

**`--from=builder`:** Copia do stage anterior (builder).

**Por que copiar Prisma?** Porque geramos no builder, mas precisamos em produção. Não podemos gerar de novo (não temos devDependencies).

---

```dockerfile
COPY --from=builder /app/dist ./dist
```

**O que faz:** Copia código compilado do builder.

**Note:** NÃO copiamos código TypeScript (`src/`), apenas JavaScript compilado (`dist/`).

---

```dockerfile
RUN echo -e '#!/bin/sh\n\
set -e\n\
echo "🔄 Running database migrations..."\n\
npx prisma migrate deploy\n\
echo "🚀 Starting application..."\n\
exec "$@"' > /usr/local/bin/docker-entrypoint.sh && \
    chmod +x /usr/local/bin/docker-entrypoint.sh
```

**O que faz:** Cria script que roda ANTES da aplicação iniciar.

**Breakdown:**
1. `echo -e '...'` → Escreve conteúdo
2. `> /usr/local/bin/docker-entrypoint.sh` → Salva no arquivo
3. `chmod +x` → Torna executável

**Por que criar inline (em vez de COPY script externo)?** Scripts externos tinham problemas de **line endings** (Windows usa CRLF `\r\n`, Linux usa LF `\n`). Criar inline garante formato Linux correto.

**O que o script faz:**
```bash
#!/bin/sh                      # Usa shell sh
set -e                         # Para se qualquer comando falhar
npx prisma migrate deploy      # Aplica migrations pendentes
exec "$@"                      # Executa comando passado (node dist/src/main)
```

---

```dockerfile
EXPOSE 3000
```

**O que faz:** Documenta que o container escuta na porta 3000.

**ATENÇÃO:** Isso é só documentação! Não abre porta de verdade. Quem mapeia portas é o `docker-compose.yaml` (`ports: - "3000:3000"`).

---

```dockerfile
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "dist/src/main"]
```

**ENTRYPOINT vs CMD:**

| Comando | Função | Pode sobrescrever? |
|---------|--------|-------------------|
| `ENTRYPOINT` | Sempre executa | Difícil (precisa --entrypoint) |
| `CMD` | Argumentos padrão | Fácil (docker run imagem outro-comando) |

**Juntos:** `docker-entrypoint.sh node dist/src/main`

**Fluxo:**
1. Container inicia
2. Executa `docker-entrypoint.sh`
3. Script roda migrations
4. Script executa `node dist/src/main` (via `exec "$@"`)
5. API sobe

---

## Docker Compose Explicado

### O que é Docker Compose?

**Docker:** Gerencia 1 container por vez.
**Docker Compose:** Orquestra múltiplos containers (banco + API + frontend).

### Arquivo docker-compose.yaml

```yaml
services:
```

**Services:** Lista de containers a criar. Cada serviço = 1 container.

---

### Serviço: PostgreSQL

```yaml
  controle-financas-pg:
    image: bitnami/postgresql
```

**image:** Usa imagem pronta do Docker Hub (não precisa de Dockerfile).

**Por que Bitnami?** Imagem oficial PostgreSQL exige configuração manual. Bitnami já vem pronta (variáveis de ambiente simples).

---

```yaml
    ports:
      - 5432:5432
```

**Mapeamento de portas:** `HOST:CONTAINER`

- `5432` (esquerda): Porta no seu PC
- `5432` (direita): Porta dentro do container

**Resultado:** `localhost:5432` no seu PC → porta 5432 do container.

---

```yaml
    environment:
      - POSTGRESQL_USERNAME=docker
      - POSTGRESQL_PASSWORD=docker
      - POSTGRESQL_DATABASE=controle-financas-db
```

**Variáveis de ambiente:** Configuram PostgreSQL sem precisar editar arquivos.

Equivalente a:
```bash
export POSTGRESQL_USERNAME=docker
```

---

```yaml
    volumes:
      - postgres_data:/bitnami/postgresql
```

**Volumes:** Persistem dados mesmo se container for deletado.

**Sintaxe:** `VOLUME_NAME:PATH_NO_CONTAINER`

**★ Insight ─────────────────────────────────────**
**Sem volume:** `docker-compose down` → dados do banco somem!
**Com volume:** Dados ficam em `/var/lib/docker/volumes/postgres_data` e persistem.

Para apagar: `docker-compose down -v` (CUIDADO: perde todos os dados!)
**─────────────────────────────────────────────────**

---

```yaml
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U docker -d controle-financas-db"]
      interval: 10s
      timeout: 5s
      retries: 5
```

**Healthcheck:** Docker testa periodicamente se container está saudável.

**Breakdown:**
- `test`: Comando a rodar (`pg_isready` verifica se PostgreSQL aceita conexões)
- `interval: 10s`: Testa a cada 10 segundos
- `timeout: 5s`: Se demorar >5s, falhou
- `retries: 5`: Marca como unhealthy após 5 falhas consecutivas

**Por que isso importa?** API espera banco estar "healthy" antes de subir (veja `depends_on` abaixo).

---

### Serviço: API

```yaml
  api:
    build:
      context: .
      dockerfile: Dockerfile
      target: production
```

**build vs image:**
- `image`: Usa imagem pronta (como PostgreSQL)
- `build`: Constrói imagem a partir do Dockerfile

**Parâmetros:**
- `context: .`: Diretório raiz para o build (onde está package.json, src/, etc)
- `dockerfile: Dockerfile`: Arquivo a usar (padrão, mas poderia ser Dockerfile.dev)
- `target: production`: Stage do multi-stage build a usar (pula o builder)

---

```yaml
    ports:
      - "3000:3000"
```

Mapeia porta 3000 do PC → 3000 do container.

**Acessa API:** `http://localhost:3000`

---

```yaml
    depends_on:
      controle-financas-pg:
        condition: service_healthy
```

**depends_on:** Define ordem de inicialização.

**★ Insight ─────────────────────────────────────**
**Sem condition:** Docker apenas inicia banco ANTES da API (mas não espera estar pronto)
**Com condition: service_healthy:** Docker espera banco passar no healthcheck

**Resultado:** API só sobe quando PostgreSQL estiver aceitando conexões (evita crashes)
**─────────────────────────────────────────────────**

---

```yaml
    environment:
      - DATABASE_URL=postgresql://docker:docker@controle-financas-pg:5432/controle-financas-db?schema=public
```

**IMPORTANTE:** Note o hostname `controle-financas-pg` (nome do serviço), NÃO `localhost`!

**Por que?**

No Docker Compose, containers se comunicam por **DNS interno**:

```
┌─────────────────┐      Rede Docker      ┌──────────────────┐
│   api container │ ───────────────────→  │ postgres         │
│ resolve "contr..│                       │ container        │
│ ole-financas-pg"│                       │ IP: 172.18.0.2   │
└─────────────────┘                       └──────────────────┘
```

Se usasse `localhost`, tentaria conectar em si mesmo (não tem PostgreSQL lá).

---

```yaml
    restart: unless-stopped
```

**Política de restart:**
- `no`: Nunca reinicia
- `always`: Sempre reinicia (até se você parar manualmente)
- `unless-stopped`: Reinicia automaticamente, exceto se você parou com `docker stop`
- `on-failure`: Só reinicia se crashar

---

```yaml
volumes:
  postgres_data:
```

**Declaração de volume:** Cria volume gerenciado pelo Docker.

**Onde fica?**
- Linux: `/var/lib/docker/volumes/api-financas-pessoais_postgres_data/_data`
- Windows: `\\wsl$\docker-desktop-data\data\docker\volumes\...`
- Mac: `/var/lib/docker/volumes/...`

---

## Fluxo Completo

### O que acontece quando você roda `docker-compose up -d`?

```
1. Docker lê docker-compose.yaml

2. Cria rede interna (ex: api-financas-pessoais_default)
   └─ Permite containers se comunicarem por nome

3. Cria volume postgres_data (se não existir)

4. Inicia serviço controle-financas-pg:
   ├─ Baixa imagem bitnami/postgresql (se não tiver)
   ├─ Cria container
   ├─ Monta volume postgres_data
   ├─ Define variáveis de ambiente
   ├─ Inicia PostgreSQL
   └─ Espera passar no healthcheck (pg_isready)
      └─ Tenta a cada 10s, até 5 tentativas
      └─ Marca como "healthy"

5. Builda imagem da API (se não existir):
   ├─ Executa Dockerfile stage builder
   │  ├─ npm ci (instala deps)
   │  ├─ npx prisma generate
   │  └─ npm run build
   ├─ Executa Dockerfile stage production
   │  ├─ npm ci --omit=dev
   │  ├─ Copia Prisma Client do builder
   │  ├─ Copia dist/ do builder
   │  └─ Cria entrypoint script
   └─ Salva imagem (api-financas-pessoais-api)

6. Inicia serviço api:
   ├─ Aguarda controle-financas-pg ficar healthy ✅
   ├─ Cria container
   ├─ Define variáveis de ambiente
   ├─ Executa docker-entrypoint.sh:
   │  ├─ npx prisma migrate deploy (aplica migrations)
   │  └─ node dist/src/main (inicia NestJS)
   └─ API escutando na porta 3000

7. Pronto! 🎉
   ├─ API: http://localhost:3000
   ├─ Swagger: http://localhost:3000/api
   └─ PostgreSQL: localhost:5432
```

---

## Conceitos-Chave

### 1. Imagem vs Container

**Analogia:**
- **Imagem** = Receita de bolo / Classe em OOP
- **Container** = Bolo assado / Objeto instanciado

```bash
docker build     # Cria imagem (receita)
docker run       # Cria container (bolo) a partir da imagem
```

**Você pode ter:**
- 1 imagem → Infinitos containers (como 1 receita → vários bolos)
- Containers são descartáveis, imagens são imutáveis

**Exemplo:**
```bash
# Criar imagem
docker build -t minha-api .

# Criar 3 containers da mesma imagem
docker run -p 3000:3000 minha-api
docker run -p 3001:3000 minha-api
docker run -p 3002:3000 minha-api
```

---

### 2. Layers e Cache

Cada linha do Dockerfile cria uma **layer** (camada imutável).

**★ Insight ─────────────────────────────────────**
Docker cacheia layers que não mudaram. Se você alterar uma layer, TODAS as seguintes são recriadas.

**Ordem importa:**
```dockerfile
# ❌ RUIM: Qualquer mudança no código → reinstala deps
COPY . .                    # Layer 1 (muda sempre)
RUN npm ci                  # Layer 2 (sempre recriada)

# ✅ BOM: Mudança no código → não reinstala deps
COPY package.json .         # Layer 1 (só muda se package.json mudar)
RUN npm ci                  # Layer 2 (cacheada se Layer 1 não mudou)
COPY . .                    # Layer 3 (muda sempre, mas deps já instaladas)
```
**─────────────────────────────────────────────────**

**Visualizando:**
```bash
docker history minha-imagem
```

---

### 3. Networking no Docker Compose

Containers na mesma rede podem se comunicar **por nome do serviço**.

**Exemplo:**

```yaml
services:
  api:
    # ...
  banco:
    # ...
```

Dentro do container `api`:
```bash
ping banco          # ✅ Funciona! Resolve para IP do container banco
ping localhost      # ❌ Só acessa o próprio container api
ping 192.168.1.10   # ❌ Rede do host, não da rede Docker
```

**DNS interno:**
```
api container → resolve "banco" → 172.18.0.3 (IP do banco container)
```

---

### 4. Volumes: Dados Persistentes

**Tipos de volumes:**

| Tipo | Sintaxe | Uso |
|------|---------|-----|
| Named Volume | `postgres_data:/var/lib/postgresql` | Dados persistentes gerenciados pelo Docker |
| Bind Mount | `./src:/app/src` | Mapeia pasta do host (hot-reload em dev) |
| Anonymous Volume | `/app/node_modules` | Temporário, deletado com container |

**Named Volume (produção):**
```yaml
volumes:
  - postgres_data:/bitnami/postgresql
```

**Bind Mount (desenvolvimento):**
```yaml
volumes:
  - ./src:/app/src  # Mudanças no código refletem imediatamente
```

**Comandos úteis:**
```bash
docker volume ls                  # Listar volumes
docker volume inspect postgres_data  # Ver onde fica
docker volume rm postgres_data    # Deletar (CUIDADO!)
```

---

### 5. .dockerignore

Funciona como `.gitignore`, mas para Docker.

**Sem .dockerignore:**
```dockerfile
COPY . .    # Copia TUDO (300MB de node_modules, .git, dist, etc)
```

**Com .dockerignore:**
```
node_modules
dist
.env
.git
```

```dockerfile
COPY . .    # Copia só código fonte (~5MB)
```

**Resultado:** Build 60x mais rápido + imagem menor.

---

## Troubleshooting

### 🔴 API não inicia

**Sintoma:**
```bash
docker-compose ps
# api-1  Restarting
```

**Diagnóstico:**
```bash
docker-compose logs api
```

**Causas comuns:**
1. **Erro no código:** Crash ao iniciar
2. **Migrations falharam:** Banco não está acessível
3. **Porta em uso:** Outra coisa rodando na 3000

**Soluções:**
```bash
# Ver erro exato
docker-compose logs api --tail=50

# Rebuildar do zero
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Testar comando manualmente
docker-compose run --rm api node dist/src/main
```

---

### 🔴 Erro de conexão com banco

**Sintoma:**
```
Error: connect ECONNREFUSED controle-financas-pg:5432
```

**Causas:**
1. Banco não subiu (healthcheck falhou)
2. Hostname errado (localhost em vez de nome do serviço)
3. Credenciais erradas

**Verificação:**
```bash
# 1. Banco está healthy?
docker-compose ps
# controle-financas-pg-1  Up (healthy)

# 2. Consegue conectar?
docker-compose exec api ping controle-financas-pg

# 3. PostgreSQL está aceitando conexões?
docker-compose exec controle-financas-pg psql -U docker -d controle-financas-db -c "SELECT 1;"
```

---

### 🔴 Migrations não aplicadas

**Sintoma:**
```
PrismaClientValidationError: Table 'user' does not exist
```

**Causa:** Entrypoint não rodou migrations.

**Solução:**
```bash
# Aplicar manualmente
docker-compose exec api npx prisma migrate deploy

# Verificar migrations aplicadas
docker-compose exec api npx prisma migrate status
```

---

### 🔴 Mudanças no código não aparecem

**Causa:** Você editou código, mas não rebuilou imagem.

**Solução:**
```bash
# Rebuildar API
docker-compose up -d --build api

# Ou parar tudo e rebuildar
docker-compose down
docker-compose up -d --build
```

**★ Insight ─────────────────────────────────────**
**Produção:** Código está DENTRO da imagem (precisa rebuild)
**Desenvolvimento:** Usar bind mount para hot-reload:

```yaml
api:
  volumes:
    - ./src:/app/src    # Mudanças refletem imediatamente
    - ./dist:/app/dist  # Precisa recompilar (npm run build)
```
**─────────────────────────────────────────────────**

---

### 🔴 Porta já em uso

**Sintoma:**
```
Error: bind 0.0.0.0:3000: address already in use
```

**Causa:** Outra coisa rodando na porta 3000 (NestJS local, outro container).

**Soluções:**

**1. Matar processo:**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :3000
kill -9 <PID>
```

**2. Mudar porta no docker-compose:**
```yaml
ports:
  - "3001:3000"  # Acessa API em localhost:3001
```

---

### 🔴 Volume com dados corrompidos

**Sintoma:**
```
PostgreSQL: data directory not empty
```

**Solução:**
```bash
# CUIDADO: Apaga TODOS os dados
docker-compose down -v
docker volume prune
docker-compose up -d
```

---

## FAQ

### ❓ Por que `dist/src/main` e não `dist/main`?

NestJS compila mantendo estrutura de pastas:
```
src/main.ts          →  dist/src/main.js
src/app.module.ts    →  dist/src/app.module.js
```

Se seu `tsconfig.json` tivesse `"outDir": "dist"` sem preservar estrutura, seria `dist/main.js`.

---

### ❓ Por que Alpine Linux?

Comparação de tamanhos:

| Imagem | Tamanho |
|--------|---------|
| `node:20` (Debian) | ~900 MB |
| `node:20-slim` | ~300 MB |
| `node:20-alpine` | ~40 MB |

**Alpine = 95% menor!**

**Desvantagem:** Algumas bibliotecas nativas (com código C++) podem não funcionar. Para este projeto, funciona perfeitamente.

---

### ❓ Posso rodar sem Docker?

Sim! Mas precisa:

1. Instalar Node.js 20
2. Instalar PostgreSQL 16
3. Configurar banco (criar user, database)
4. Editar .env com credenciais
5. `npm install`
6. `npx prisma migrate deploy`
7. `npm run build`
8. `npm run start:prod`

**Com Docker:**
```bash
docker-compose up -d
```

Você escolhe. 😉

---

### ❓ Como debugar dentro do container?

```bash
# Entrar no container
docker-compose exec api sh

# Dentro do container:
ls -la /app
cat /app/package.json
node --version
npx prisma migrate status
```

---

### ❓ Docker Compose vs Kubernetes?

| Ferramenta | Uso | Complexidade |
|------------|-----|--------------|
| Docker Compose | Dev local, projetos pequenos | Baixa (1 arquivo YAML) |
| Kubernetes | Produção, clusters, alta disponibilidade | Alta (vários YAMLs, conceitos avançados) |

**Para o trabalho do professor:** Docker Compose é perfeito.

---

### ❓ Preciso commitar imagens no Git?

**❌ NÃO!** Imagens são grandes (500MB+).

**Commitar:**
- ✅ Dockerfile
- ✅ docker-compose.yaml
- ✅ .dockerignore

**Não commitar:**
- ❌ Imagens Docker
- ❌ Volumes

Quem clonar o repo faz:
```bash
docker-compose up -d  # Builda imagens automaticamente
```

---

## 🎯 Próximo Passo: Frontend React

Quando for adicionar frontend, o conceito é IDÊNTICO:

### 1. Criar Dockerfile do frontend

```dockerfile
# Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build    # Gera pasta dist/ com HTML/CSS/JS

# Production: Nginx serve arquivos estáticos
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
```

### 2. Adicionar ao docker-compose.yaml

```yaml
services:
  # ... (postgres e api continuam)

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "80:80"
    depends_on:
      - api
```

### 3. Configurar CORS no backend

```typescript
// src/main.ts
app.enableCors({
  origin: ['http://localhost:80', 'http://localhost'],
  credentials: true,
});
```

### 4. Configurar variáveis no frontend

```bash
# frontend/.env
VITE_API_URL=http://localhost:3000
```

```typescript
// src/config.ts
export const API_URL = import.meta.env.VITE_API_URL;
```

### 5. Iniciar tudo

```bash
docker-compose up -d --build
```

**Resultado:**
- Frontend: http://localhost
- Backend: http://localhost:3000
- PostgreSQL: localhost:5432

**BACK + FRONT + DB em containers!** 🎉

---

## 📚 Recursos para Aprender Mais

### Documentação Oficial
- [Docker Docs](https://docs.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/)
- [Dockerfile Best Practices](https://docs.docker.com/develop/dev-best-practices/)

### Tutoriais Recomendados
- [Docker para Iniciantes (freeCodeCamp)](https://www.youtube.com/watch?v=fqMOX6JJhGo)
- [NestJS + Docker](https://docs.nestjs.com/recipes/prisma#docker)
- [Prisma Docker Guide](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-docker)

### Conceitos Avançados
- Multi-stage builds
- Healthchecks
- Docker networks
- Volume management
- Docker BuildKit

---

## ✅ Checklist para o Professor

Quando entregar, garanta que:

- [ ] `.env` está configurado (ou tem .env.example)
- [ ] Dockerfile existe e está funcional
- [ ] docker-compose.yaml orquestra todos os serviços
- [ ] README.md explica como rodar (`docker-compose up -d`)
- [ ] Migrations estão criadas (`prisma/migrations/`)
- [ ] `.dockerignore` está configurado
- [ ] Aplicação roda completamente com um comando

**Comando para testar:**
```bash
# Limpar tudo
docker-compose down -v

# Subir do zero
docker-compose up -d

# Verificar status
docker-compose ps
# Deve mostrar api e postgres como "Up (healthy)"

# Testar API
curl http://localhost:3000/public
# Deve retornar "Hello World!"
```

**Se tudo funcionar, está 100% pronto para entregar!** 🚀

---

**Dúvidas?** Releia as seções específicas. Este guia cobre TUDO que foi implementado.
