export type TransactionType = 'income' | 'expense' | 'transfer';
export type CategoryGroup = 'expense' | 'asset';
export interface Category { id: string; name: string; color: string; icon: string; group: CategoryGroup; isDefault?: boolean; monthlyTarget?: number; }
export interface Transaction { id: string; description: string; amount: number; type: TransactionType; categoryId: string; date: string; createdAt: string; notes?: string; }
export interface FinanceData { version: 1; categories: Category[]; transactions: Transaction[]; }
export const STORAGE_KEY = 'meu-dinheiro:v1';
export const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat_food', name: 'Alimentação', color: '#E06D53', icon: 'Utensils', group: 'expense', isDefault: true, monthlyTarget: 800 },
  { id: 'cat_housing', name: 'Moradia & Contas', color: '#4A69E2', icon: 'Home', group: 'expense', isDefault: true, monthlyTarget: 1200 },
  { id: 'cat_transport', name: 'Transporte', color: '#F3A638', icon: 'Car', group: 'expense', isDefault: true, monthlyTarget: 300 },
  { id: 'cat_leisure', name: 'Lazer & Cultura', color: '#B259D9', icon: 'Gamepad2', group: 'expense', isDefault: true, monthlyTarget: 400 },
  { id: 'cat_health', name: 'Saúde & Cuidados', color: '#2EB5A6', icon: 'Heart', group: 'expense', isDefault: true, monthlyTarget: 250 },
  { id: 'cat_reserve', name: 'Reserva de Emergência', color: '#163300', icon: 'ShieldCheck', group: 'asset', isDefault: true, monthlyTarget: 500 },
  { id: 'cat_invest', name: 'Investimentos', color: '#9FE870', icon: 'TrendingUp', group: 'asset', isDefault: true, monthlyTarget: 500 },
];
export const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: 't1', description: 'Salário Mensal', amount: 5000, type: 'income', categoryId: 'cat_food', date: '2026-10-05', createdAt: '2026-10-05T12:00:00.000Z' },
  { id: 't2', description: 'Compras de Mercado', amount: 350, type: 'expense', categoryId: 'cat_food', date: '2026-10-06', createdAt: '2026-10-06T12:00:00.000Z' },
  { id: 't3', description: 'Combustível Posto', amount: 120, type: 'expense', categoryId: 'cat_transport', date: '2026-10-08', createdAt: '2026-10-08T12:00:00.000Z' },
  { id: 't4', description: 'Aporte Reserva CDB', amount: 500, type: 'transfer', categoryId: 'cat_reserve', date: '2026-10-10', createdAt: '2026-10-10T12:00:00.000Z' },
];
export function seedData(): FinanceData { return { version: 1, categories: INITIAL_CATEGORIES.map(c => ({ ...c })), transactions: INITIAL_TRANSACTIONS.map(t => ({ ...t })) }; }
const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
export const currency = (value: number) => brl.format(value);
export const moneyText = (value: number, hidden = false) => hidden ? '••••' : currency(value);
export const cents = (value: number) => Math.round(value * 100);
export const validMoney = (value: number) => Number.isFinite(value) && Number.isSafeInteger(cents(value)) && Math.abs(value * 100 - cents(value)) < 0.00001;
export function parseMoney(input: string): number {
  const text = input.trim().replace(/^R\$\s*/, '').replace(/\s/g, '');
  let normalized: string;
  if (/^\d+(,\d{1,2})?$/.test(text)) normalized = text.replace(',', '.');
  else if (/^\d{1,3}(\.\d{3})+(,\d{1,2})?$/.test(text)) normalized = text.replace(/\./g, '').replace(',', '.');
  else if (/^\d+\.\d{1,2}$/.test(text)) normalized = text;
  else return NaN;
  const value = Number(normalized);
  return Number.isFinite(value) && Number.isSafeInteger(cents(value)) ? cents(value) / 100 : NaN;
}
export function sumAmounts(transactions: Transaction[], type: TransactionType, categoryId?: string) {
  return transactions.reduce((sum, t) => sum + (t.type === type && (!categoryId || t.categoryId === categoryId) ? cents(t.amount) : 0), 0) / 100;
}
export function getBalance(transactions: Transaction[]) { return transactions.reduce((sum, t) => sum + cents(t.amount) * (t.type === 'income' ? 1 : -1), 0) / 100; }
export function monthTransactions(transactions: Transaction[], month: string) { return transactions.filter(t => t.date.slice(0, 7) === month); }
export function categorySummary(category: Category, transactions: Transaction[]) {
  const amount = sumAmounts(transactions, category.group === 'asset' ? 'transfer' : 'expense', category.id);
  const target = category.monthlyTarget ?? 0;
  const remaining = (cents(target) - cents(amount)) / 100;
  const percent = cents(target) > 0 ? Math.round(cents(amount) / cents(target) * 100) : 0;
  const exceeded = category.group === 'expense' && remaining < 0;
  return { amount, target, remaining, percent, progress: exceeded ? 100 : Math.max(0, Math.min(100, percent)), exceeded };
}
export function localDate(date = new Date()): string { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; }
export function validDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  return year >= 1900 && year <= 9999 && localDate(new Date(year, month - 1, day)) === value;
}
export function shiftMonth(month: string, delta: number) { const [year, m] = month.split('-').map(Number); return localDate(new Date(year, m - 1 + delta, 1)).slice(0, 7); }
export function monthLabel(month: string) {
  const [year, m] = month.split('-').map(Number);
  const label = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(new Date(year, m - 1, 1)).replace(' de ', ' ');
  return label.charAt(0).toUpperCase() + label.slice(1);
}
export function dayLabel(value: string) {
  const today = new Date();
  if (value === localDate(today)) return 'Hoje';
  today.setDate(today.getDate() - 1);
  if (value === localDate(today)) return 'Ontem';
  const [year, month, day] = value.split('-').map(Number);
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long' }).format(new Date(year, month - 1, day));
}
export function validData(input: unknown): input is FinanceData {
  if (!input || typeof input !== 'object') return false;
  const data = input as FinanceData;
  if (data.version !== 1 || !Array.isArray(data.categories) || !Array.isArray(data.transactions)) return false;
  const ids = new Set<string>();
  for (const c of data.categories) {
    if (!c || typeof c.id !== 'string' || !c.id || ids.has(c.id) || typeof c.name !== 'string' || !c.name.trim() || typeof c.icon !== 'string' || typeof c.color !== 'string' || !/^#[\da-f]{6}$/i.test(c.color) || !['expense', 'asset'].includes(c.group) || (c.isDefault !== undefined && typeof c.isDefault !== 'boolean') || (c.monthlyTarget !== undefined && (!validMoney(c.monthlyTarget) || c.monthlyTarget < 0))) return false;
    ids.add(c.id);
  }
  const transactionIds = new Set<string>();
  for (const t of data.transactions) {
    if (!t || typeof t.id !== 'string' || !t.id || transactionIds.has(t.id) || typeof t.description !== 'string' || !validMoney(t.amount) || cents(t.amount) < 1 || !['income', 'expense', 'transfer'].includes(t.type) || !validDate(t.date) || typeof t.createdAt !== 'string' || !Number.isFinite(Date.parse(t.createdAt)) || (t.notes !== undefined && typeof t.notes !== 'string')) return false;
    const category = data.categories.find(c => c.id === t.categoryId);
    if (!category || (t.type === 'transfer' && category.group !== 'asset') || (t.type === 'expense' && category.group !== 'expense')) return false;
    transactionIds.add(t.id);
  }
  return true;
}
