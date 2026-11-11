'use client';
import { useEffect, useRef } from 'react';
import { getBalance, monthTransactions, sumAmounts, type FinanceData, type TransactionType } from './finance';
interface ToolDefinition { name: string; title: string; description: string; inputSchema: object; annotations: { readOnlyHint: boolean }; execute: (input: unknown) => unknown; }
interface ModelContext { registerTool: (tool: ToolDefinition, options: { signal: AbortSignal }) => void | Promise<void>; }
export function useWebMcp({ data, month, hidden, ready, startTransaction }: { data: FinanceData; month: string; hidden: boolean; ready: boolean; startTransaction: (type: TransactionType) => void }) {
  const latest = useRef({ data, month, hidden, ready, startTransaction });
  latest.current = { data, month, hidden, ready, startTransaction };
  useEffect(() => {
    const context = (document as Document & { modelContext?: ModelContext }).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const register = (tool: ToolDefinition) => {
      try { void Promise.resolve(context.registerTool(tool, { signal: lifecycle.signal })).catch(() => {}); } catch { /* Unsupported browser integrations never block the app. */ }
    };
    register({ name: 'read_financial_summary', title: 'Consultar resumo financeiro', description: 'Retorna o saldo global e os totais do mês selecionado. Respeita a opção de ocultar valores.', inputSchema: { type: 'object', properties: {}, additionalProperties: false }, annotations: { readOnlyHint: true }, execute: (input) => {
      if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).length) throw new Error('Envie um objeto vazio.');
      const state = latest.current;
      if (!state.ready) throw new Error('Os dados ainda estão sendo carregados.');
      if (state.hidden) return { month: state.month, valuesHidden: true };
      const transactions = monthTransactions(state.data.transactions, state.month);
      return { month: state.month, currency: 'BRL', balance: getBalance(state.data.transactions), income: sumAmounts(transactions, 'income'), expenses: sumAmounts(transactions, 'expense'), savings: sumAmounts(transactions, 'transfer') };
    } });
    register({ name: 'start_transaction_entry', title: 'Abrir lançamento', description: 'Abre o formulário de entrada, gasto ou aporte. O usuário revisa e confirma o lançamento no formulário.', inputSchema: { type: 'object', properties: { type: { type: 'string', enum: ['income', 'expense', 'transfer'] } }, required: ['type'], additionalProperties: false }, annotations: { readOnlyHint: false }, execute: (input) => {
      if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Informe o tipo do lançamento.');
      const args = input as Record<string, unknown>;
      if (Object.keys(args).some(key => key !== 'type') || !['income', 'expense', 'transfer'].includes(args.type as string)) throw new Error('Tipo inválido. Use income, expense ou transfer.');
      if (!latest.current.ready) throw new Error('Os dados ainda estão sendo carregados.');
      latest.current.startTransaction(args.type as TransactionType);
      return { status: 'form_opened', type: args.type, saved: false };
    } });
    return () => lifecycle.abort();
  }, []);
}
