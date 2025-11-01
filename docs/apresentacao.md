# Estrutura da Apresentação - 3 Pessoas (7 minutos)

## DIVISÃO DE RESPONSABILIDADES

**PESSOA 1 (Apresentador A)** - Intro + Arquitetura (2min 15s)
- Slides 1-3: Introdução, problema/solução, arquitetura geral

**PESSOA 2 (Apresentador B)** - Código + Demo (3min)
- Slides 4-6: Controllers, DTOs, Services
- Live Demo completa

**PESSOA 3 (Apresentador C)** - Banco + Conclusão (1min 45s)
- Slides 7-9: Banco de dados, diferenciais, conclusão

---

## SLIDES DETALHADOS

### PESSOA 1 - APRESENTADOR A

#### Slide 1: INTRO (30s)

**Visual:**
```
API de Finanças Pessoais
Sistema REST para gestão financeira completa

Tech Stack:
NestJS | PostgreSQL | Prisma | Better Auth
```

**Fala:**
"Boa tarde. Desenvolvemos uma API REST completa para controle de finanças pessoais. É um backend que gerencia categorias, transações, orçamentos e gera relatórios analíticos. Usamos NestJS como framework, PostgreSQL como banco, Prisma como ORM e Better Auth pra autenticação."

---

#### Slide 2: PROBLEMA & SOLUÇÃO (30s)

**Visual:**
```
PROBLEMA
Necessidade de controlar finanças pessoais

SOLUÇÃO - 4 Módulos Principais
✅ CATEGORIAS    → Organizar gastos/receitas
✅ TRANSAÇÕES    → Registrar movimentações
✅ ORÇAMENTOS    → Definir limites
✅ RELATÓRIOS    → Analisar tendências
```

**Fala:**
"Toda aplicação financeira precisa desses 4 pilares básicos. Nossa API implementa cada um como módulo independente e reutilizável, seguindo boas práticas de arquitetura."

---

#### Slide 3: ARQUITETURA (1min 15s)

**Visual:**
```
FLUXO DE REQUISIÇÃO

Cliente HTTP
    ↓
CONTROLLER ──→ Recebe request, valida auth
    ↓
DTO ────────→ Valida estrutura dos dados
    ↓
SERVICE ────→ Executa lógica de negócio
    ↓
PRISMA ─────→ Acessa banco PostgreSQL
    ↓
Resposta JSON

CONCEITOS:
• Controller = rotas HTTP
• DTO = validação automática
• Service = regras de negócio
• Prisma = queries ao banco
```

**Fala:**
"Seguimos arquitetura em camadas bem definida. Controllers recebem requisições HTTP e definem as rotas. DTOs validam automaticamente os dados de entrada. Services executam a lógica de negócio. E o Prisma faz a comunicação com PostgreSQL. Cada camada tem responsabilidade única, facilitando manutenção e testes. [PAUSA] Agora o [Nome B] vai mostrar como isso funciona no código."

---

### PESSOA 2 - APRESENTADOR B

#### Slide 4: CONTROLLER (45s)

**Visual:**
```typescript
@Post()
@ApiOperation({ summary: "Criar nova categoria" })
@ApiResponse({ status: 201, type: CategoryResponseDto })
async create(
  @Session() session: UserSession,      ← Usuário autenticado
  @Body() createCategoryDto: CreateCategoryDto,  ← Dados validados
) {
  return this.categoriesService.create(session.user.id, createCategoryDto);
}
```

**Pontos destacados:**
- `@Post()` = rota POST
- `@Session()` = auth automática
- `@ApiOperation` = documentação Swagger

**Fala:**
"Controllers usam decorators, esses símbolos de arroba, pra definir comportamento. O `@Post` cria uma rota POST. O `@Session` injeta o usuário autenticado automaticamente via Better Auth. O `@Body` valida os dados de entrada. E o `@ApiOperation` gera documentação Swagger automática."

**Arquivo:** `src/categories/categories.controller.ts:15-28`

---

#### Slide 5: DTO COM VALIDAÇÃO (45s)

**Visual:**
```typescript
export class CreateCategoryDto {
  @ApiProperty({ example: "Alimentação" })
  @IsString()                    ← Valida tipo string
  name: string;

  @ApiProperty({ enum: CategoryType })
  @IsEnum(CategoryType)          ← Valida enum
  type: CategoryType;  // INCOME ou EXPENSE

  @IsOptional()
  @IsString()
  color?: string;
}
```

**Fala:**
"DTOs são classes que validam dados de forma declarativa. Se o cliente enviar um número no campo name, a API rejeita automaticamente antes de chegar no Service. Isso garante segurança e previne bugs. Todo campo tem seu tipo e regras de validação definidas."

**Arquivo:** `src/categories/dto/create-category.dto.ts:9-33`

---

#### Slide 6: SERVICE - LÓGICA DE NEGÓCIO (30s)

**Visual:**
```typescript
// Exemplo: Calcular status do orçamento
const percentageUsed = (spent / budgetAmount) * 100;

let status: "ok" | "warning" | "exceeded" = "ok";
if (percentageUsed >= 100) {
  status = "exceeded";      // Gastou tudo ou mais
} else if (percentageUsed >= 80) {
  status = "warning";       // Próximo do limite
}
// Retorna no relatório para o cliente
```

**Fala:**
"Services concentram as regras de negócio. Neste exemplo, calculamos o status do orçamento: 'ok' se usou menos de 80%, 'warning' entre 80 e 100%, e 'exceeded' se estourou. Essa informação vai pro relatório que o frontend consome."

**Arquivo:** `src/reports/reports.service.ts:136-142`

---

#### Slide 7: LIVE DEMO (1min)

**Visual:** Swagger UI - `http://localhost:3000/api`

**Ações:**

**1. Autenticar (15s)**
```json
POST /api/auth/sign-in/email
{
  "email": "joao@test.com",
  "password": "password123"
}
```
→ Copiar token
→ Clicar "Authorize", colar token

**2. Criar Categoria (15s)**
```json
POST /api/categories
{
  "name": "Café",
  "type": "EXPENSE"
}
```
→ Mostrar response com ID

**3. Criar Transação (15s)**
```json
POST /api/transactions
{
  "categoryId": "clxxx...",
  "amount": 15.50,
  "date": "2025-10-31",
  "type": "EXPENSE"
}
```

**4. Relatório de Tendências (15s)** ⭐
```
GET /api/reports/trends?months=3
```
→ Mostrar JSON com evolução mensal

**Fala:**
"Vou mostrar a API funcionando. [FAZ LOGIN] Primeiro autenticamos com usuário de teste. [COPIA TOKEN, AUTORIZA] Agora estou autenticado. [CRIA CATEGORIA] Criando categoria 'Café' como despesa. [CRIA TRANSAÇÃO] Registrando um gasto de R$15,50. [CHAMA RELATÓRIO] E aqui o relatório de tendências que mostra a evolução de receitas e despesas dos últimos 3 meses, mês a mês. Esses dados alimentam gráficos no frontend. [PAUSA] Agora o [Nome C] fala sobre o banco de dados."

---

### PESSOA 3 - APRESENTADOR C

#### Slide 8: BANCO DE DADOS (45s)

**Visual:**
```
ESTRUTURA RELACIONAL

User (usuário)
 ├─→ Category (categorias: Alimentação, Transporte...)
 ├─→ Transaction (movimentações com valor, data)
 └─→ Budget (limites de gasto: mensal, semanal, anual)

REGRAS:
• Cada User tem dados isolados (multi-tenant)
• Transaction sempre pertence a uma Category
• Budget pode ser geral ou por categoria específica
• Cascade delete: se User é removido, tudo é deletado
```

**Fala:**
"A estrutura do banco é relacional e simples. Cada usuário tem suas próprias categorias, transações e orçamentos totalmente isolados. Transações sempre pertencem a uma categoria. Orçamentos podem ser gerais ou específicos por categoria. Se um usuário for deletado, todos os dados relacionados são removidos automaticamente."

**Arquivo:** `prisma/schema.prisma`

---

#### Slide 9: DIFERENCIAIS (40s)

**Visual:**
```
PRINCIPAIS DESTAQUES

✅ Autenticação robusta (Better Auth)
✅ Validação automática (class-validator)
✅ Documentação interativa (Swagger)
✅ Multi-tenant seguro (dados isolados)
✅ Relatórios analíticos
   • Resumo financeiro
   • Gastos por categoria
   • Status de orçamentos
   • Tendências mensais
✅ Testes automatizados (21 testes)
✅ TypeScript 100%
```

**Fala:**
"Os principais diferenciais: autenticação segura com Better Auth, validação automática que impede dados inválidos, documentação viva no Swagger, isolamento total de dados entre usuários, e relatórios prontos pra consumo. Tudo escrito em TypeScript com testes automatizados."

---

#### Slide 10: CONCLUSÃO (20s)

**Visual:**
```
CONCLUSÃO

✓ API REST completa e pronta para produção
✓ Arquitetura modular e escalável
✓ Integrável com qualquer frontend
  (React, Vue, React Native, Angular...)

STACK:
NestJS • PostgreSQL • Prisma • Better Auth
TypeScript • Swagger • Jest
```

**Fala:**
"Em resumo: desenvolvemos uma API REST completa, com arquitetura modular que facilita manutenção e expansão. Pode ser integrada com qualquer frontend web ou mobile. Obrigado."

---

## PREPARAÇÃO PRÉ-APRESENTAÇÃO

### Técnica
- [ ] Rodar `npm run start:dev` 5min antes
- [ ] Abrir `http://localhost:3000/api` em aba isolada
- [ ] Ter JSONs prontos em arquivo .txt pra copiar
- [ ] Testar sequência completa da demo 2x
- [ ] Limpar histórico do Swagger (F5) antes de começar

### Divisão de Tarefas
- **A**: Controla slides 1-3
- **B**: Controla slides 4-7 + executa demo (fica no teclado)
- **C**: Controla slides 8-10

### Transições Suaves
- A → B: "Agora o [Nome] mostra o código"
- B → C: "Agora [Nome] explica o banco de dados"
- Evitar pausas longas

### Backup (se demo falhar)
- Ter screenshots dos responses prontos
- B diz: "Por questão de tempo, vou mostrar o resultado" [mostra print]

---

## TIMING ENSAIADO

| Apresentador | Slides | Tempo |
|--------------|--------|-------|
| A | 1-3 | 2min 15s |
| B | 4-7 | 3min |
| C | 8-10 | 1min 45s |
| **TOTAL** | | **7min** |

---

## DICAS FINAIS

**Para todos:**
- Falar olhando pra plateia, não pro slide
- Voz clara, ritmo moderado
- Se um atrasar, próximo compensa acelerando

**Para B (quem faz demo):**
- Narrar enquanto executa: "Estou criando categoria..."
- Se travar, não entrar em pânico
- Ter mental map: login → categoria → transação → relatório

**Slides:**
- Fonte mínima 18pt
- Código max 10 linhas
- Destacar palavras-chave em cor diferente

---

## CHECKLIST FINAL

**30 minutos antes:**
- [ ] Servidor rodando (`npm run start:dev`)
- [ ] Swagger aberto e testado
- [ ] JSONs salvos pra copiar
- [ ] Slides carregados
- [ ] Divisão de apresentadores definida

**5 minutos antes:**
- [ ] Testar login no Swagger
- [ ] Fechar abas desnecessárias
- [ ] Aumentar zoom do navegador (125%)
- [ ] Configurar tela (se possível)

**Durante:**
- [ ] Cronômetro visível pra controlar tempo
- [ ] Água disponível
- [ ] Backup plan pronto
