# Meu Dinheiro — Controle Financeiro Pessoal

Aplicação web **mobile-first** de controle financeiro pessoal (*single-user*) em **BRL (R$)**, construída com **React**, **TypeScript**, **Tailwind CSS** e **Vite / Vinext** (`localStorage` + *seed* inicial automático para demonstração).

Projetada com foco em ergonomia de uso diário, agilidade no lançamento e resposta imediata à pergunta: *"Quanto ainda posso gastar neste mês em cada categoria?"*, separando consumo mensal de aportes patrimoniais.

---

## Principais Funcionalidades

- **Dashboard mensal (`Início`)**: saldo global acumulado, subtotais do mês (`+ Entradas` e `- Gastos`), navegação entre meses e alternância de privacidade (ocultar/exibir valores com persistência).
- **Orçamentos e Metas**:
  - Categorias de **despesa** (`expense`): teto mensal de consumo com barra de progresso e alerta visual ao exceder o limite.
  - Categorias de **patrimônio / reserva** (`asset`): aportes do tipo `transfer` contabilizados separadamente, reduzindo o saldo livre sem inflar o custo de vida.
- **Lançamento rápido**: modal *bottom-sheet* para entradas, gastos e aportes com validação monetária em centavos inteiros (sem erros de ponto flutuante).
- **Extrato por mês (`Extrato`)**: agrupamento cronológico por data (*Hoje*, *Ontem*, data formatada), edição de lançamentos e exclusão com ação *Desfazer*.
- **Gerenciador de categorias (`Categorias`)**: criação e edição de limites, metas, cores e ícones (`lucide-react`), com proteção contra exclusão de categorias nativas ou vinculadas a lançamentos.
- **Modo demonstração (*seed*) & persistência local**: dados iniciais de exemplo carregados apenas na primeira visita (`meu-dinheiro:v1` no `localStorage`), preservando listas limpas pelo usuário e validando integridade dos registros.

---

## Stack Tecnológica

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Sonner
- **Build & Dev Server**: Vite + Vinext (App Router)
- **Persistência**: `localStorage` do navegador (sincronização entre abas + fallback seguro)
- **Testes**: Node.js built-in test runner (`node --test`)

---

## Estrutura do Repositório

```text
.
├── README.md
├── docs/
│   └── especificacao-app-financeiro.md   # Especificação técnica, modelo de dados e regras de negócio
└── app/
    ├── app/                              # Entrypoint, layout e página principal (page.tsx)
    ├── components/finance/               # Dashboard, Statement, TransactionModal, CategoryManager, CategoryIcon
    ├── lib/                              # Regras financeiras em centavos (finance.ts), hooks e WebMCP
    ├── tests/                            # Testes unitários das regras de negócio (finance.test.mjs)
    └── README.md                         # Documentação técnica detalhada do pacote app/
```

---

## Como Executar Localmente

Pré-requisito: **Node.js 22.13+**

```powershell
cd app
npm install
npm run dev
```

Acesse `http://127.0.0.1:5173/` no navegador.

### Testes, Typecheck e Build

Dentro da pasta `app/`:

```powershell
npm test
npm run typecheck
npm run build
```

Para mais detalhes sobre arquitetura interna, chaves de armazenamento e regras de cálculo, consulte [app/README.md](app/README.md) e [docs/especificacao-app-financeiro.md](docs/especificacao-app-financeiro.md).
