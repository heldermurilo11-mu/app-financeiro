import { ArrowDownLeft, ShieldCheck, Plus, ReceiptText } from 'lucide-react';
import { Empty, EmptyTitle, EmptyDescription, EmptyMedia } from '@/components/ui/empty';
import { CategoryIcon } from './CategoryIcon';
import { dayLabel, moneyText, monthTransactions, sumAmounts, type Category, type Transaction } from '@/lib/finance';
export function Statement({ categories, transactions, month, hidden, onEdit, onAdd }: { categories: Category[]; transactions: Transaction[]; month: string; hidden: boolean; onEdit: (t: Transaction) => void; onAdd: () => void }) {
  const monthly = monthTransactions(transactions, month).sort((a,b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
  const days = [...new Set(monthly.map(t => t.date))];
  return <section className="page-enter"><div className="view-heading"><div><p className="eyebrow">CADA MOVIMENTO CONTA</p><h1>Seu extrato</h1></div><button className="icon-button add-button" aria-label="Novo lançamento" onClick={onAdd}><Plus size={21} /></button></div>
    <div className="statement-summary"><div><span>Entradas</span><strong className="positive">{moneyText(sumAmounts(monthly, 'income'), hidden)}</strong></div><div><span>Gastos</span><strong>{moneyText(sumAmounts(monthly, 'expense'), hidden)}</strong></div><div><span>Guardado</span><strong>{moneyText(sumAmounts(monthly, 'transfer'), hidden)}</strong></div></div>
    {!monthly.length && <Empty className="statement-empty"><EmptyMedia><ReceiptText size={38} strokeWidth={1.3} /></EmptyMedia><EmptyTitle>Nenhum lançamento neste mês</EmptyTitle><EmptyDescription>Adicione uma entrada, um gasto ou um aporte para começar.</EmptyDescription><button className="primary-button" onClick={onAdd}><Plus size={18} />Adicionar lançamento</button></Empty>}
    {days.map(day => <section key={day} className="statement-day"><h2>{dayLabel(day)}</h2><div className="statement-list">{monthly.filter(t => t.date === day).map(t => {
      const category = categories.find(c => c.id === t.categoryId);
      return <button className="transaction-row" key={t.id} onClick={() => onEdit(t)} aria-label={`Editar ${t.description}${hidden ? '' : `, ${moneyText(t.amount)}`}`}>
        {t.type === 'income' ? <span className="category-icon income-icon"><ArrowDownLeft size={20} /></span> : <CategoryIcon name={category?.icon ?? 'Wallet'} color={category?.color ?? '#163300'} />}
        <span className="transaction-copy"><strong>{t.description}</strong><span>{t.type === 'income' ? 'Entrada' : category?.name ?? 'Sem categoria'}{t.type === 'transfer' && <ShieldCheck size={12} />}</span></span>
        <span className={`transaction-value ${t.type}`}><strong>{hidden ? '••••' : `${t.type === 'income' ? '+' : '−'} ${moneyText(t.amount)}`}</strong><small>{t.type === 'transfer' ? 'Aporte' : 'Toque para editar'}</small></span>
      </button>;
    })}</div></section>)}
  </section>;
}
