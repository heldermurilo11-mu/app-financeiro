'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { seedData, STORAGE_KEY, validData, type Category, type FinanceData, type Transaction } from './finance';

export function useFinance() {
  const [data, setData] = useState(seedData);
  const current = useRef(data);
  const writable = useRef(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const restored: unknown = stored === null ? seedData() : JSON.parse(stored);
      if (!validData(restored)) throw new Error('invalid');
      if (stored === null) localStorage.setItem(STORAGE_KEY, JSON.stringify(restored));
      current.current = restored;
      setData(restored);
      writable.current = true;
    } catch {
      setError('Não foi possível carregar os dados salvos. Os dados existentes foram preservados. Verifique o armazenamento do navegador e recarregue a página.');
    }
    setReady(true);
    const sync = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY || event.newValue === null) return;
      try {
        const next: unknown = JSON.parse(event.newValue);
        if (!validData(next)) return;
        current.current = next;
        setData(next);
      } catch { /* Preserve current data when another tab writes invalid content. */ }
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  const commit = useCallback((next: FinanceData): boolean => {
    if (!writable.current || !validData(next)) return false;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      current.current = next;
      setData(next);
      setError('');
      return true;
    } catch {
      setError('Não foi possível salvar. Libere espaço ou permita o armazenamento no navegador e tente novamente.');
      return false;
    }
  }, []);

  const saveTransaction = useCallback((transaction: Transaction) => {
    const previous = current.current;
    const exists = previous.transactions.some(t => t.id === transaction.id);
    return commit({ ...previous, transactions: exists ? previous.transactions.map(t => t.id === transaction.id ? transaction : t) : [...previous.transactions, transaction] });
  }, [commit]);
  const deleteTransaction = useCallback((id: string) => commit({ ...current.current, transactions: current.current.transactions.filter(t => t.id !== id) }), [commit]);
  const saveCategory = useCallback((category: Category) => {
    const previous = current.current;
    const existing = previous.categories.find(c => c.id === category.id);
    if (existing && (existing.isDefault !== category.isDefault || (existing.group !== category.group && (existing.isDefault || previous.transactions.some(t => t.categoryId === category.id))))) return false;
    return commit({ ...previous, categories: existing ? previous.categories.map(c => c.id === category.id ? category : c) : [...previous.categories, category] });
  }, [commit]);
  const deleteCategory = useCallback((id: string) => {
    const previous = current.current;
    const category = previous.categories.find(c => c.id === id);
    if (!category || category.isDefault || previous.transactions.some(t => t.categoryId === id)) return false;
    return commit({ ...previous, categories: previous.categories.filter(c => c.id !== id) });
  }, [commit]);
  return { data, ready, loaded: writable.current, error, saveTransaction, deleteTransaction, saveCategory, deleteCategory };
}
