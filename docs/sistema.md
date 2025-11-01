# 📊 Sistema de Finanças Pessoais - Guia Completo

## 🎯 O que é este Sistema?

O **API Finanças Pessoais** é um aplicativo que ajuda você a **controlar e entender seu dinheiro**. Ele funciona como um caderno de contas digital onde você:

- 📝 **Registra** suas receitas e despesas
- 🏷️ **Organiza** suas movimentações em categorias
- 💰 **Define orçamentos** para controlar gastos
- 📈 **Analisa** seus dados financeiros com relatórios

### Para quem é?
- Pessoas que querem acompanhar seus gastos
- Quem quer entender para onde vai seu dinheiro
- Quem deseja planejar melhor seus gastos

---

## 🔄 Como os Dados Fluem no Sistema

### Diagrama Geral de Relacionamentos

```mermaid
erDiagram
    USER ||--o{ CATEGORY : "cria"
    USER ||--o{ TRANSACTION : "registra"
    USER ||--o{ BUDGET : "define"
    CATEGORY ||--o{ TRANSACTION : "categoriza"
    CATEGORY ||--o{ BUDGET : "limita"

    USER {
        string id PK
        string email
        string name
        datetime createdAt
    }

    CATEGORY {
        string id PK
        string userId FK
        string name
        enum type "INCOME|EXPENSE"
        string color
    }

    TRANSACTION {
        string id PK
        string userId FK
        string categoryId FK
        decimal amount
        string description
        datetime date
        enum type "INCOME|EXPENSE"
    }

    BUDGET {
        string id PK
        string userId FK
        string categoryId FK "opcional"
        decimal amount
        enum period "WEEKLY|MONTHLY|YEARLY"
        datetime startDate
    }
```

---

## 🔐 Fluxo de Autenticação

Antes de usar qualquer funcionalidade, você precisa se autenticar (fazer login):

```mermaid
sequenceDiagram
    actor User as 👤 Usuário
    participant API as 🔗 API
    participant DB as 💾 Banco de Dados

    User->>API: 1. Cadastro com email/senha
    API->>DB: Salva usuário
    DB-->>API: OK
    API-->>User: Sucesso - Use seu email/senha

    User->>API: 2. Login com email/senha
    API->>DB: Valida credenciais
    DB-->>API: Usuário válido
    API-->>User: Token de sessão ✅

    User->>API: 3. Todas as requisições<br/>(com token)
    API->>API: Valida token
    API->>DB: Busca dados do usuário
    DB-->>API: Retorna dados
    API-->>User: Resposta protegida
```

**Importante**: Todo acesso à API (exceto login/cadastro) requer o token de sessão.

---

## 🚀 Jornada Típica de um Usuário

Assim é o fluxo de como você usaria o sistema dia a dia:

```mermaid
flowchart TD
    A["1️⃣ Novo Usuário"]
    A -->|Cadastro| B["2️⃣ Cria Categorias<br/>Ex: Alimentação, Salário"]
    B -->|Organiza| C["3️⃣ Registra Transações<br/>Ex: Comprei no mercado"]
    C -->|Rastreia| D["4️⃣ Define Orçamentos<br/>Ex: Máx R$500 em alimentação"]
    D -->|Controla| E["5️⃣ Visualiza Relatórios<br/>Ex: Quanto gastei?"]
    E -->|Melhora| F["💡 Toma Decisões<br/>Financeiras Melhores"]

    C -->|Atualiza| C
    D -->|Ajusta| D
    E -->|Monitora| E
```

---

## 📚 Os 5 Pilares do Sistema

### 1. 🔑 **Autenticação (Auth)**
**O que faz**: Valida seu login e cria uma sessão segura

| Ação | O que acontece |
|------|---|
| **Cadastro** | Você cria uma conta com email e senha |
| **Login** | Você entra e recebe um token de acesso |
| **Proteção** | Todos os seus dados são privados |

---

### 2. 🏷️ **Categorias**
**O que faz**: Organiza suas receitas e despesas em grupos

**Exemplos de categorias:**
- 💵 **Receitas**: Salário, Freelance, Investimentos
- 💸 **Despesas**: Alimentação, Transporte, Lazer, Moradia

```mermaid
flowchart LR
    A["Categoria: Alimentação<br/>(cor azul)"]
    A --> B["Transação 1:<br/>Mercado R$150"]
    A --> C["Transação 2:<br/>Restaurante R$80"]
    A --> D["Budget:<br/>Máx R$500/mês"]
```

**Operações:**
- ✅ Criar, editar, deletar categorias
- ✅ Cada categoria tem um tipo (receita ou despesa)
- ✅ Você pode colorir para melhor visualização

---

### 3. 💰 **Transações**
**O que faz**: Registra cada movimento de dinheiro (entrada ou saída)

**Exemplo prático:**
```
Data: 15 de outubro
Categoria: Alimentação
Tipo: Despesa
Valor: R$ 150,00
Descrição: Compras no mercado
```

```mermaid
flowchart TD
    A["RECEITA"]
    B["Seu salário"]
    C["Freelance"]
    D["Investimento"]

    E["DESPESA"]
    F["Alimentação"]
    G["Transporte"]
    H["Moradia"]

    A --> B
    A --> C
    A --> D
    E --> F
    E --> G
    E --> H

    style A fill:#90EE90
    style E fill:#FFB6C6
```

**Operações:**
- ✅ Registrar novas transações
- ✅ Filtrar por data, categoria ou tipo
- ✅ Editar ou deletar transações antigas
- ✅ Visualizar histórico

---

### 4. 💸 **Orçamentos (Budgets)**
**O que faz**: Define limites de gastos para ajudar você a controlar

**Exemplos:**
- "Máximo R$500 em alimentação por mês"
- "Máximo R$200 em lazer por semana"
- "Máximo R$3000 total de despesas por mês"

```mermaid
flowchart LR
    A["ORÇAMENTO"]
    B["Período"]
    C["Semanal / Mensal / Anual"]
    D["Categoria"]
    E["Específica ou Total?"]
    F["Limite"]
    G["Quanto você quer gastar?"]

    A --> B --> C
    A --> D --> E
    A --> F --> G
```

**Tipos:**
- 🎯 **Por categoria**: Limite para uma categoria específica
- 🌍 **Geral**: Limite total de gastos

---

### 5. 📊 **Relatórios (Reports)**
**O que faz**: Analisa seus dados e mostra insights

**4 tipos de relatórios:**

#### a) **Resumo Geral**
```
Período: 1 a 31 de outubro
├─ Total de Receitas: R$ 5.000
├─ Total de Despesas: R$ 2.500
└─ Saldo: R$ 2.500 (positivo ✅)
```

#### b) **Gastos por Categoria**
```
Alimentação:     R$ 800  [████░░░░░] 35%
Transporte:      R$ 400  [██░░░░░░░] 15%
Lazer:           R$ 500  [███░░░░░░] 20%
Moradia:         R$ 800  [████░░░░░] 30%
```

#### c) **Status do Orçamento**
```
Alimentação (Budget: R$500)
├─ Gasto: R$800
└─ Status: ⚠️ EXCEDIDO (160%)

Transporte (Budget: R$300)
├─ Gasto: R$250
└─ Status: ✅ OK (83%)
```

#### d) **Tendências Mensais**
```
Mês        Receitas    Despesas    Saldo
Oct/24     R$5000      R$2500      R$2500  📈
Sep/24     R$5000      R$2300      R$2700  📈
Aug/24     R$4800      R$2600      R$2200  📉
```

---

## 🔀 Fluxo Completo de Dados

Veja como os dados se movem pelo sistema:

```mermaid
flowchart TD
    A["👤 Login do Usuário"]
    B["📋 Cria Categorias<br/>Alimentação, Salário..."]
    C["💰 Registra Transação<br/>Comprei comida R$50"]
    D["🏷️ Sistema Valida"]
    E["💾 Salva no Banco"]
    F["📊 Gera Relatório"]
    G["📈 Mostra Análise<br/>Quanto gastei em alimentação?"]
    H["💡 Usuário Toma Decisão<br/>Preciso reduzir gastos"]

    A --> B
    B --> C
    C --> D
    D --> E
    E --> F
    F --> G
    G --> H
    H -->|Próxima transação| C

    style A fill:#FFE4B5
    style B fill:#E0E4FF
    style C fill:#FFE4E1
    style F fill:#E1FFE0
    style G fill:#FFF0E0
```

---

## 📱 Exemplo Prático: Seu Primeiro Mês

### Semana 1: Configuração
```
1. Você se cadastra com email e senha ✅
2. Cria suas categorias:
   - Salário (receita)
   - Alimentação (despesa)
   - Transporte (despesa)
   - Lazer (despesa)
3. Define um orçamento:
   - Máximo R$1000 em despesas por semana
```

### Semana 2-4: Uso Diário
```
📅 05/10 - Recebeu salário
   └─ Registra: Receita R$3000 (categoria Salário)

📅 06/10 - Comprou comida
   └─ Registra: Despesa R$150 (categoria Alimentação)

📅 07/10 - Pagou passagem
   └─ Registra: Despesa R$80 (categoria Transporte)

📅 15/10 - Saiu com amigos
   └─ Registra: Despesa R$200 (categoria Lazer)
```

### Fim do Mês: Análise
```
✅ Você acessa os relatórios e vê:
   - Total de receitas: R$3000
   - Total de despesas: R$1200
   - Saldo positivo: R$1800
   - Categoria com maior gasto: Alimentação (45%)
   - Orçamento: Dentro dos limites ✅
```

---

## 🎮 Como Usar Cada Funcionalidade

### 1️⃣ Gerenciar Categorias

```mermaid
flowchart LR
    A["CATEGORIAS"]
    B["➕ Criar"]
    C["📝 Editar"]
    D["🗑️ Deletar"]
    E["👀 Visualizar"]

    A --> B
    A --> C
    A --> D
    A --> E
```

**Passo a passo:**
1. Defina um nome (ex: "Alimentação")
2. Escolha o tipo (receita ou despesa)
3. Opcionalmente, escolha uma cor
4. Salve

---

### 2️⃣ Registrar Transações

```mermaid
flowchart LR
    A["TRANSAÇÕES"]
    B["➕ Nova"]
    C["Escolhe Categoria"]
    D["Define Valor"]
    E["Adiciona Data"]
    F["Escreve Descrição"]
    G["Salva"]

    B --> C --> D --> E --> F --> G
```

**Informações necessárias:**
- Categoria (ex: Alimentação)
- Valor (ex: R$50,00)
- Data (ex: 05/10/2024)
- Descrição (opcional, ex: "Mercado")

---

### 3️⃣ Definir Orçamentos

```mermaid
flowchart LR
    A["ORÇAMENTOS"]
    B["➕ Novo"]
    C["Escolhe Período<br/>Semanal/Mensal"]
    D["Define Categoria<br/>ou Total"]
    E["Define Limite"]
    F["Salva"]

    B --> C --> D --> E --> F
```

**Exemplo:**
- Período: Mensal
- Categoria: Alimentação
- Limite: R$500

---

### 4️⃣ Visualizar Relatórios

```mermaid
flowchart LR
    A["RELATÓRIOS"]
    B["📋 Resumo"]
    C["📊 Por Categoria"]
    D["⚖️ Status Orçamento"]
    E["📈 Tendências"]

    A --> B
    A --> C
    A --> D
    A --> E
```

**Você pode:**
- Filtrar por data
- Ver análises automáticas
- Identificar padrões de gasto

---

## 💡 Dicas e Boas Práticas

### ✅ Faça Isso:
1. **Registre transações regularmente** - Quanto mais atual, melhor a análise
2. **Use categorias bem definidas** - Facilita filtrar depois
3. **Defina orçamentos realistas** - Baseado no seu histórico
4. **Revise relatórios mensalmente** - Entenda seus padrões
5. **Use cores nas categorias** - Melhor visualização

### ❌ Evite Isso:
1. **Não deixe transações registrar-se sozinhas** - Sempre confirme valores
2. **Não crie categorias demais** - Máximo 10-15 é ideal
3. **Não ignore alertas de orçamento ultrapassado** - Ajuste gastos
4. **Não confunda tipos** - Receita ≠ Despesa

---

## 🔍 Entendendo os Dados

### Tipos de Transação

| Tipo | Significado | Exemplos |
|------|---|---|
| **INCOME** | Dinheiro ENTRANDO | Salário, Freelance, Venda, Investimento |
| **EXPENSE** | Dinheiro SAINDO | Compras, Contas, Lazer |

### Períodos de Orçamento

| Período | Significa | Útil Para |
|---------|-----------|-----------|
| **WEEKLY** | 7 dias | Controle semanal, gastos diários |
| **MONTHLY** | 30 dias | Maioria dos gastos e planejamento |
| **YEARLY** | 365 dias | Despesas anuais, metas longas |

---

## 📡 Arquitetura do Sistema

Como tudo funciona "por trás das cortinas":

```mermaid
flowchart TD
    A["📱 Seu Dispositivo<br/>(Celular/Web)"]
    B["🔐 Autenticação<br/>(Login)"]
    C["🔗 API NestJS<br/>(Processamento)"]
    D["💾 PostgreSQL<br/>(Banco de Dados)"]

    A -->|1. Envia dados| B
    B -->|2. Valida| C
    C -->|3. Salva| D
    D -->|4. Confirma| C
    C -->|5. Retorna| A

    style A fill:#FFE4B5
    style B fill:#FFB6C1
    style C fill:#B0E0E6
    style D fill:#98FB98
```

**Componentes:**
- **API**: Recebe suas requisições e processa
- **Banco de Dados**: Armazena todos os seus dados
- **Autenticação**: Garante que apenas você acessa seus dados

---

## 🚨 Perguntas Frequentes

### P: Meus dados são seguros?
**R**: Sim! Cada usuário só vê seus próprios dados. Senhas são protegidas.

### P: Posso usar no celular?
**R**: Sim! O sistema suporta aplicativos mobile via tecnologia Expo.

### P: E se eu deletar uma categoria?
**R**: Suas transações continuam registradas, mas sem categoria. Você pode ver todas as transações antes de deletar.

### P: Como filtrar transações?
**R**: Você pode filtrar por:
- Data (de/até)
- Categoria
- Tipo (receita/despesa)

### P: Os orçamentos são obrigatórios?
**R**: Não! São opcionais. Use apenas se quiser controlar limites.

---

## 📞 Próximos Passos

1. **Faça login** e crie suas categorias
2. **Registre suas transações** dos últimos meses
3. **Defina orçamentos** realistas
4. **Acompanhe os relatórios** mensalmente
5. **Ajuste seus hábitos** baseado nos insights

---

## 📖 Resumo Visual Completo

```mermaid
graph TB
    subgraph Sistema["🏗️ SISTEMA DE FINANÇAS"]
        subgraph Dados["💾 Dados"]
            U["Usuario"]
            C["Categorias"]
            T["Transações"]
            B["Orçamentos"]
        end

        subgraph Operacoes["⚙️ Operações"]
            A["Autenticação"]
            R["Relatórios"]
            F["Filtros"]
        end

        subgraph Beneficios["💡 Benefícios"]
            P["Planejamento"]
            I["Insights"]
            C2["Controle"]
        end
    end

    Dados --> Operacoes
    Operacoes --> Beneficios

    style Sistema fill:#E8F5E9
    style Dados fill:#BBDEFB
    style Operacoes fill:#FFE0B2
    style Beneficios fill:#F8BBD0
```

---

**Desenvolvido com ❤️ para ajudar você a dominar suas finanças!**
