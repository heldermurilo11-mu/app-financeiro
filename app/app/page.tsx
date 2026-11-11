'use client';
import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Eye, EyeOff, House, ArrowLeftRight, Shapes } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { Dashboard } from '@/components/finance/Dashboard';
import { Statement } from '@/components/finance/Statement';
import { CategoryManager } from '@/components/finance/CategoryManager';
import { TransactionModal } from '@/components/finance/TransactionModal';
import { Skeleton } from '@/components/ui/skeleton';
import { useFinance } from '@/lib/use-finance';
import { useWebMcp } from '@/lib/use-webmcp';
import { monthLabel, shiftMonth, type Category, type Transaction, type TransactionType } from '@/lib/finance';

type View = 'home' | 'statement' | 'categories';
export default function Home() {
  const finance = useFinance();
  const { data, ready, error } = finance;
  const [month, setMonth] = useState('2026-10');
  const [hidden, setHidden] = useState(false);
  const [privacyReady, setPrivacyReady] = useState(false);
  const [view, setView] = useState<View>('home');
  const [modal, setModal] = useState<{ type: TransactionType; transaction?: Transaction } | null>(null);
  useEffect(() => { try { setHidden(localStorage.getItem('meu-dinheiro:privacy') === 'hidden'); } catch { /* Values remain visible when preferences are unavailable. */ } setPrivacyReady(true); }, []);
  const togglePrivacy = () => { const next = !hidden; setHidden(next); try { localStorage.setItem('meu-dinheiro:privacy', next ? 'hidden' : 'visible'); } catch { /* Privacy still works for this session. */ } };
  const navigate = (next: View) => { setView(next); window.scrollTo({ top: 0, behavior: 'instant' }); };
  const add = (type: TransactionType) => { if (ready) setModal({ type }); };
  useWebMcp({ data, month, hidden, ready, startTransaction: add });
  const saveTransaction = (t: Transaction) => { const saved = finance.saveTransaction(t); if (saved) { setMonth(t.date.slice(0,7)); toast.success(modal?.transaction ? 'Lançamento atualizado' : 'Lançamento salvo'); } return saved; };
  const deleteTransaction = (id: string) => { const previous = data.transactions.find(t => t.id === id); const saved = finance.deleteTransaction(id); if (saved) toast.success('Lançamento excluído', { duration: 10000, action: previous ? { label: 'Desfazer', onClick: () => { if (finance.saveTransaction(previous)) toast.success('Lançamento restaurado'); } } : undefined }); return saved; };
  const saveCategory = (c: Category) => { const saved = finance.saveCategory(c); if (saved) toast.success('Categoria salva'); return saved; };
  const deleteCategory = (id: string) => { const previous = data.categories.find(c => c.id === id); const saved = finance.deleteCategory(id); if (saved) toast.success('Categoria excluída', { duration: 10000, action: previous ? { label: 'Desfazer', onClick: () => { if (finance.saveCategory(previous)) toast.success('Categoria restaurada'); } } : undefined }); return saved; };
  if (!ready || !privacyReady) return <main className="app-shell mx-auto max-w-md"><header className="app-header"><div className="brand"><span className="brand-mark">m<span>.</span></span><span>meu dinheiro</span></div></header><div className="app-content" role="status" aria-label="Carregando seus dados"><Skeleton className="mt-8 h-60 rounded-3xl" /><Skeleton className="mt-8 h-24 rounded-3xl" /><Skeleton className="mt-8 h-60 rounded-3xl" /><span className="sr-only">Carregando seus dados</span></div></main>;
  if (!finance.loaded) return <main className="app-shell mx-auto max-w-md"><header className="app-header"><div className="brand"><span className="brand-mark">m<span>.</span></span><span>meu dinheiro</span></div></header><div className="app-content"><p className="storage-error" role="alert">{error}</p><button className="primary-button" onClick={() => window.location.reload()}>Tentar carregar novamente</button></div></main>;
  return <main className="app-shell mx-auto max-w-md">
    <header className="app-header"><div className="brand"><span className="brand-mark">m<span>.</span></span><span>meu dinheiro</span></div><button className="icon-button" onClick={togglePrivacy} aria-label={hidden ? 'Mostrar valores' : 'Ocultar valores'} aria-pressed={hidden}>{hidden ? <EyeOff size={21} /> : <Eye size={21} />}</button></header>
    <div className="month-selector"><button className="icon-button" aria-label="Mês anterior" onClick={() => setMonth(shiftMonth(month, -1))}><ChevronLeft size={19} /></button><span>{monthLabel(month)}</span><button className="icon-button" aria-label="Próximo mês" onClick={() => setMonth(shiftMonth(month, 1))}><ChevronRight size={19} /></button></div>
    <div className="app-content">{error && <p role="alert" className="storage-error">{error}</p>}
      {view === 'home' && <Dashboard categories={data.categories} transactions={data.transactions} month={month} hidden={hidden} onAdd={add} onCategories={() => navigate('categories')} />}
      {view === 'statement' && <Statement categories={data.categories} transactions={data.transactions} month={month} hidden={hidden} onEdit={t => setModal({ type: t.type, transaction: t })} onAdd={() => add('expense')} />}
      {view === 'categories' && <CategoryManager categories={data.categories} transactions={data.transactions} hidden={hidden} onSave={saveCategory} onDelete={deleteCategory} />}
    </div>
    <nav className="bottom-nav" aria-label="Navegação principal">{([{ id: 'home', label: 'Início', Icon: House }, { id: 'statement', label: 'Extrato', Icon: ArrowLeftRight }, { id: 'categories', label: 'Categorias', Icon: Shapes }] as const).map(({ id, label, Icon }) => <button key={id} onClick={() => navigate(id)} className={view === id ? 'active' : ''} aria-current={view === id ? 'page' : undefined}><Icon size={21} /><span>{label}</span></button>)}</nav>
    {modal && <TransactionModal key={modal.transaction?.id ?? modal.type} initialType={modal.type} transaction={modal.transaction} categories={data.categories} onClose={() => setModal(null)} onSave={saveTransaction} onDelete={deleteTransaction} />}
    <Toaster position="top-center" richColors toastOptions={{ style: { fontFamily: 'inherit' } }} />
  </main>;
}

