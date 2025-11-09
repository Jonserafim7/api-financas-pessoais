# 🐳 Guia Rápido - Docker & Docker Compose

Comandos essenciais para trabalhar com Docker neste projeto.

---

## 📦 Comandos Básicos (Docker Compose)

### Iniciar a aplicação
```bash
docker-compose up
```
- Builda as imagens (se necessário) e inicia os containers
- Mostra logs no terminal (modo interativo)
- Pressione `Ctrl+C` para parar

### Iniciar em background (modo detached)
```bash
docker-compose up -d
```
- Inicia os containers em background
- Terminal fica livre para outros comandos
- **Mais usado no dia a dia!**

### Parar os containers
```bash
docker-compose down
```
- Para e remove os containers
- ⚠️ **NÃO apaga** os volumes (dados do banco ficam salvos)

### Parar + Remover volumes (apaga dados)
```bash
docker-compose down -v
```
- Para containers + remove volumes
- ⚠️ **CUIDADO**: Apaga todos os dados do banco!

---

## 🔄 Rebuild & Restart

### Rebuildar imagens (após mudanças no código)
```bash
docker-compose build
```
- Reconstrói as imagens Docker
- Use sempre que modificar:
  - Código fonte (src/)
  - Dockerfile
  - package.json

### Rebuild + Start
```bash
docker-compose up --build
```
- Rebuilda as imagens E inicia os containers
- Útil após mudanças no código

### Rebuild forçado (ignora cache)
```bash
docker-compose build --no-cache
```
- Rebuilda tudo do zero
- Útil quando há problemas de cache

### Restart apenas um serviço
```bash
docker-compose restart api
docker-compose restart db
```

---

## 📊 Visualizar Logs

### Ver logs de todos os serviços
```bash
docker-compose logs
```

### Ver logs em tempo real (follow)
```bash
docker-compose logs -f
```
- Mostra logs conforme são gerados
- `Ctrl+C` para sair

### Logs de um serviço específico
```bash
docker-compose logs -f api
docker-compose logs -f db
```

### Ver últimas 50 linhas
```bash
docker-compose logs --tail=50 api
```

---

## 🔍 Inspeção & Debug

### Listar containers rodando
```bash
docker-compose ps
```
- Mostra status dos containers (Up/Exited)
- Mostra portas mapeadas

### Executar comandos dentro do container
```bash
docker-compose exec api sh
```
- Abre um shell dentro do container da API
- `exit` para sair

### Executar comandos pontuais
```bash
docker-compose exec api npm run test
docker-compose exec api npx prisma studio
docker-compose exec db psql -U docker -d controle-financas-db
```

---

## 🗄️ Gerenciamento de Volumes

### Listar volumes
```bash
docker volume ls
```

### Inspecionar volume
```bash
docker volume inspect api-financas-pessoais_postgres_data
```

### Remover volume específico (⚠️ apaga dados!)
```bash
docker volume rm api-financas-pessoais_postgres_data
```

### Remover todos os volumes não usados
```bash
docker volume prune
```

---

## 🧹 Limpeza & Manutenção

### Remover containers parados
```bash
docker container prune
```

### Remover imagens não usadas
```bash
docker image prune
```

### Limpeza completa (⚠️ cuidado!)
```bash
docker system prune -a --volumes
```
- Remove TUDO: containers, imagens, volumes, redes
- Use apenas se souber o que está fazendo!

---

## 📋 Workflow Típico de Desenvolvimento

### 1. Primeira vez rodando o projeto
```bash
# 1. Configurar variáveis de ambiente
cp .env.example .env
# Edite o .env com suas credenciais

# 2. Build + Start
docker-compose up --build -d

# 3. Ver logs para confirmar que subiu
docker-compose logs -f api
```

### 2. Após modificar código
```bash
# Rebuild + Restart
docker-compose up --build -d

# Ver logs
docker-compose logs -f api
```

### 3. Após modificar schema do Prisma
```bash
# Criar nova migration
npx prisma migrate dev --name "descricao_da_mudanca"

# Rebuild a aplicação
docker-compose up --build -d
```

### 4. Resetar banco de dados do zero
```bash
# Parar containers + remover volumes
docker-compose down -v

# Subir novamente (cria banco vazio)
docker-compose up -d

# Rodar seed (opcional)
docker-compose exec api npm run db:seed
```

### 5. Fim do dia de trabalho
```bash
# Parar containers (mantém dados)
docker-compose down
```

### 6. Próximo dia
```bash
# Iniciar containers
docker-compose up -d
```

---

## ⚠️ Troubleshooting

### Container não inicia (erro de porta ocupada)
```bash
# Verificar se porta 3000 ou 5432 está em uso
# Windows:
netstat -ano | findstr :3000
netstat -ano | findstr :5432

# Parar processo usando a porta OU mudar porta no docker-compose.yml
```

### Erro "database does not exist"
```bash
# Recrear volumes
docker-compose down -v
docker-compose up -d
```

### Mudanças no código não aparecem
```bash
# Rebuild sem cache
docker-compose build --no-cache
docker-compose up -d
```

### Ver logs de erro completos
```bash
docker-compose logs --tail=100 api
```

### Container reinicia constantemente
```bash
# Ver logs para identificar erro
docker-compose logs api

# Executar shell dentro do container para debug
docker-compose exec api sh
```

---

## 🎯 Comandos Mais Usados (Cola)

```bash
# Subir aplicação
docker-compose up -d

# Ver logs
docker-compose logs -f api

# Rebuild após mudanças
docker-compose up --build -d

# Parar aplicação
docker-compose down

# Resetar tudo
docker-compose down -v && docker-compose up --build -d

# Shell no container
docker-compose exec api sh

# Acessar PostgreSQL
docker-compose exec db psql -U docker -d controle-financas-db
```

---

## 📚 Recursos Adicionais

- [Docker Docs](https://docs.docker.com/)
- [Docker Compose Docs](https://docs.docker.com/compose/)
- [Docker Hub](https://hub.docker.com/) - Buscar imagens prontas
