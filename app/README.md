# Meu dinheiro

Aplicativo pessoal, em português, com React, TypeScript, Tailwind CSS e Lucide. Usa App Router via Vinext, com Vite no desenvolvimento e na compilação.

## Executar

Requer Node.js 22.13 ou superior.

```powershell
npm ci
npm run dev
```

Abra http://127.0.0.1:5173/ no navegador.

## Verificar e compilar

```powershell
npm test
npm run typecheck
npm run build
```

Para servir a compilação de produção localmente, execute `npm start` e use a URL informada no terminal.

## Funcionalidades

- Início com saldo global, seletor de mês, subtotais mensais, limites de consumo e metas de aporte.
- Lançamento rápido de entrada, gasto ou aporte, com valor em BRL, categoria, data, descrição e observação.
- Extrato por mês, agrupado por data, com edição, exclusão confirmada e opção de desfazer.
- Categorias de consumo e patrimônio, com edição de limite/meta, nome, cor e ícone.
- Proteção contra exclusão de categorias nativas e categorias que têm lançamentos. O tipo dessas categorias também é protegido.
- Valores ocultáveis, com preferência preservada entre visitas e proteção durante o carregamento.
- Layout central de até 448 px e navegação inferior fixa; validado em 360, 390 e 430 px.

## Dados e cálculos

Os dados ficam exclusivamente no localStorage do navegador, na chave `meu-dinheiro:v1`. A preferência de privacidade usa `meu-dinheiro:privacy`.

Na primeira visita são inseridas as sete categorias e os quatro lançamentos de outubro de 2026 da especificação. Uma lista salva vazia permanece vazia. Conteúdo inválido nunca é substituído automaticamente. Falhas de armazenamento preservam o formulário para uma nova tentativa.

O saldo soma todo o histórico: entradas menos despesas e aportes. Os subtotais, gastos por categoria e metas consideram apenas o mês selecionado. Transferências reduzem o saldo e aumentam as metas patrimoniais, sem aumentar o custo de vida. Cálculos monetários usam centavos inteiros. No seed, o saldo é R$ 4.030,00, os gastos são R$ 470,00 e os aportes R$ 500,00.

Os dados não sincronizam entre dispositivos ou navegadores. Limpar o armazenamento do navegador remove os registros. Publicar em outro domínio também cria um armazenamento independente.

## Organização

- `app/page.tsx`: navegação, privacidade e coordenação dos fluxos.
- `components/finance/`: Dashboard, Statement, TransactionModal, CategoryManager e CategoryIcon.
- `lib/finance.ts`: tipos, dados iniciais, moeda, datas, validação e cálculos.
- `lib/use-finance.ts`: leitura, validação, gravação e sincronização entre abas do mesmo navegador.
- `lib/use-webmcp.ts`: integração opcional com navegadores que suportam WebMCP, para consultar resumo e abrir o formulário sem gravar automaticamente.
- `tests/finance.test.mjs`: nove testes das regras financeiras e casos de borda.
