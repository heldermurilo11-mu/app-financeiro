# ESPECIFICAÇÃO DE PROJETO: APP DE CONTROLE FINANCEIRO PESSOAL

Este documento descreve a especificação técnica e funcional do aplicativo de controle financeiro pessoal.

---

## 1. VISÃO GERAL E OBJETIVO
Construir um aplicativo web de controle financeiro pessoal (*single-user*), otimizado primariamente para dispositivos móveis (*mobile-first*), com experiência de usuário intuitiva inspirada no aplicativo do **Nubank** e identidade visual baseada na paleta de cores da **Wise**.

O aplicativo deve priorizar ergonomia, agilidade no lançamento de dados e resposta imediata à pergunta: *"Quanto ainda posso gastar neste mês em cada categoria?"*.

---

## 2. STACK TECNOLÓGICA E BIBLIOTECAS
- **Framework:** React com TypeScript (Vite ou Next.js App Router).
- **Estilização:** Tailwind CSS.
- **Ícones:** `lucide-react`.
- **Persistência de Dados:** `localStorage` do navegador com inicialização automática de dados mockados (*seed*) caso esteja vazio.
- **Formatação de Moeda:** Padrão brasileiro BRL (`Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`).

---

## 3. DESIGN SYSTEM E IDENTIDADE VISUAL
O aplicativo deve fugir deliberadamente da estética de planilhas ou tabelas estáticas, assemelhando-se a um aplicativo bancário moderno.

### Paleta de Cores
- **Fundo da Aplicação:** `#F7F9F6` (cinza-claro neutro esverdeado)
- **Fundo de Cartões / Superfícies:** `#FFFFFF`
- **Cor Primária (Wise Forest Green):** `#163300`
- **Cor de Destaque / Acento (Wise Bright Lime):** `#9FE870`
- **Cor de Alerta / Estouro de Orçamento:** `rose-500` / `rose-50`
- **Cores de Texto:** `#0F172A` (títulos/números), `#64748B` (legendas/rótulos)

### Ergonomia e Formas
- **Bordas:** Super arredondadas (`rounded-3xl` para cards principais e `rounded-2xl` para cards secundários e botões).
- **Contêiner Central:** Limitado a `max-w-md mx-auto` com sombra sutil em telas de desktop para manter a proporção de smartphone.
- **Microinterações:** Efeito tátil de pressão em todos os botões (`active:scale-95 transition-all`).
- **Navegação:** Barra de navegação inferior (*Bottom Navigation Bar*) fixa com ícones e rótulos curtos.

---

## 4. MODELO DE DADOS (TypeScript)

```typescript
export type TransactionType = 'income' | 'expense' | 'transfer';
export type CategoryGroup = 'expense' | 'asset'; // 'expense' = Custo de vida | 'asset' = Reserva ou Investimento

export interface Category {
  id: string;
  name: string;              // Ex: "Alimentação", "Reserva de Emergência"
  color: string;             // Hex code ou classe Tailwind
  icon: string;              // Nome do ícone da biblioteca Lucide React
  group: CategoryGroup;      // Define o comportamento contábil
  isDefault?: boolean;       // Protege categorias nativas contra exclusão acidental
  monthlyTarget?: number;    // Para expense = Teto de gastos; Para asset = Meta de aporte
}

export interface Transaction {
  id: string;
  description: string;       // Ex: "Mercado Semanal", "Aporte CDB"
  amount: number;            // Ex: 154.50
  type: TransactionType;     // 'income', 'expense' ou 'transfer'
  categoryId: string;        // ID da categoria relacionada
  date: string;              // YYYY-MM-DD
  createdAt: string;         // ISO timestamp
  notes?: string;            // Observação opcional
}
```

### Dados Iniciais de Seed (Mock Data):
```typescript
export const INITIAL_CATEGORIES: Category[] = [
  // Categorias de Consumo (Custo de Vida)
  { id: 'cat_food', name: 'Alimentação', color: '#E06D53', icon: 'Utensils', group: 'expense', isDefault: true, monthlyTarget: 800 },
  { id: 'cat_housing', name: 'Moradia & Contas', color: '#4A69E2', icon: 'Home', group: 'expense', isDefault: true, monthlyTarget: 1200 },
  { id: 'cat_transport', name: 'Transporte', color: '#F3A638', icon: 'Car', group: 'expense', isDefault: true, monthlyTarget: 300 },
  { id: 'cat_leisure', name: 'Lazer & Cultura', color: '#B259D9', icon: 'Gamepad2', group: 'expense', isDefault: true, monthlyTarget: 400 },
  { id: 'cat_health', name: 'Saúde & Cuidados', color: '#2EB5A6', icon: 'Heart', group: 'expense', isDefault: true, monthlyTarget: 250 },

  // Categorias de Patrimônio e Reserva (Não contam como custo de vida)
  { id: 'cat_reserve', name: 'Reserva de Emergência', color: '#163300', icon: 'ShieldCheck', group: 'asset', isDefault: true, monthlyTarget: 500 },
  { id: 'cat_invest', name: 'Investimentos', color: '#9FE870', icon: 'TrendingUp', group: 'asset', isDefault: true, monthlyTarget: 500 }
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: 't1', description: 'Salário Mensal', amount: 5000, type: 'income', categoryId: 'cat_food', date: '2026-10-05', createdAt: new Date().toISOString() },
  { id: 't2', description: 'Compras de Mercado', amount: 350, type: 'expense', categoryId: 'cat_food', date: '2026-10-06', createdAt: new Date().toISOString() },
  { id: 't3', description: 'Combustível Posto', amount: 120, type: 'expense', categoryId: 'cat_transport', date: '2026-10-08', createdAt: new Date().toISOString() },
  { id: 't4', description: 'Aporte Reserva CDB', amount: 500, type: 'transfer', categoryId: 'cat_reserve', date: '2026-10-10', createdAt: new Date().toISOString() }
];
```

---

## 5. REGRAS DE NEGÓCIO E LÓGICA DE CÁLCULO

1. **Saldo Disponível em Conta:**
   Reflete o dinheiro líquido disponível no momento:
   $$\text{Saldo} = \sum (\text{income}) - \sum (\text{expense}) - \sum (\text{transfer})$$

2. **Custo de Vida do Mês:**
   Apenas saídas de consumo do mês selecionado são somadas:
   $$\text{Total Gasto} = \sum (\text{expense do mês})$$
   *(Importante: Transações do tipo `transfer` NÃO somam ao custo de vida).*

3. **Disponível por Categoria de Despesa (`group === 'expense'`):**
   $$\text{Restante} = \text{monthlyTarget} - \sum (\text{gastos da categoria no mês})$$
   - Se $\text{Restante} \ge 0$: A barra de progresso preenche em verde escuro (`#163300`) indicando consumo saudável.
   - Se $\text{Restante} < 0$: A barra preenche em 100% com cor de alerta (`rose-500`) e exibe o rótulo de valor excedido.

4. **Progresso de Aporte em Metas (`group === 'asset'`):**
   $$\text{Atingimento (\%)} = \left(\frac{\sum \text{transfer da categoria no mês}}{\text{monthlyTarget}}\right) \times 100$$
   - A barra preenche em verde lima elétrico (`#9FE870`).

---

## 6. ARQUITETURA DE TELAS E FLUXOS

### 1. Dashboard Principal (Home)
- **Cabeçalho:** Seletor de mês/ano navegável (`< Outubro 2026 >`) e botão com ícone de olho (`Eye` / `EyeOff`) para ocultar ou revelar valores confidenciais.
- **Card de Saldo (Wise Style):** Fundo verde floresta `#163300`, texto principal em branco e acentos em `#9FE870`. Exibe:
  - Saldo livre atual.
  - Subtotais do mês: `+ Entradas` e `- Gastos`.
- **Ações Rápidas (3 botões táteis circulares/pílulas):**
  - `+ Entrada` (ícone verde de recebimento).
  - `+ Gasto` (ícone vermelho de saída).
  - `+ Guardar` (ícone de escudo/cofrinho para aportes/reservas).
- **Seção "Quanto ainda posso gastar":**
  - Lista de categorias de consumo com: ícone circular, nome, total gasto vs. limite mensal, valor restante e barra de progresso visual.
- **Seção "Metas Guardadas":**
  - Card dedicado às categorias de patrimônio (`asset`), exibindo o progresso percentual acumulado em direção à meta mensal de economia.
- **Bottom Navigation Bar:** Barra fixa no rodapé com 3 abas principais: *Início*, *Extrato* e *Categorias*.

### 2. Bottom Sheet / Modal de Lançamento Rápido
- Abre ao tocar em qualquer um dos botões de ação rápida (`+ Entrada`, `+ Gasto`, `+ Guardar`).
- **Campo de Valor Gigante:** Focado automaticamente com teclado numérico (ex: `R$ 0,00`).
- **Seletor de Categoria:** Grid ou carrossel com ícones e nomes. Se o usuário clicou em "+ Guardar", filtra automaticamente apenas categorias do tipo `asset`.
- **Data e Descrição:** Campo de data com padrão "Hoje" e descrição curta opcional.
- **Botão de Confirmação:** Botão verde escuro de largura total fixo na base inferior.

### 3. Tela de Gerenciamento de Categorias
- Alternador em abas: **Despesas de Consumo** e **Patrimônio / Reservas**.
- Lista com todas as categorias cadastradas, permitindo editar o teto de gastos ou meta mensal (`monthlyTarget`).
- Botão flutuante para **Criar Nova Categoria**:
  - Campos: Nome da Categoria, Tipo (`expense` ou `asset`), Meta Mensal em R$, seletor de Cor e seletor de Ícone Lucide.

### 4. Tela de Extrato (Transações)
- Filtro por mês.
- Agrupamento das transações por data (ex: "Hoje", "Ontem", "05 de Outubro").
- Cada linha exibe: ícone da categoria, descrição, valor com cor indicativa (+ verde, - preto/cinza, transferências em verde escuro) e opção de excluir/editar ao clicar.

---

## 7. DIRETRIZES DE ARQUITETURA E CÓDIGO
- Mantenha a arquitetura limpa, modular e componentizada (ex: `Dashboard.tsx`, `TransactionModal.tsx`, `CategoryManager.tsx`, `Statement.tsx`).
- Garanta que todas as alterações sejam salvas automaticamente no `localStorage`.
- Verifique a responsividade estrita para telas de 360px a 430px de largura (típicas de smartphones).
