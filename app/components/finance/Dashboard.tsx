import { ArrowDownLeft, ArrowUpRight, ShieldCheck, Sparkles, Check, Wallet } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Empty, EmptyTitle, EmptyDescription } from '@/components/ui/empty';
import { CategoryIcon } from './CategoryIcon';
import { categorySummary, getBalance, moneyText, monthTransactions, sumAmounts, type Category, type Transaction, type TransactionType } from '@/lib/finance';
export function Dashboard({ categories, transactions, month, hidden, onAdd, onCategories }: { categories: Category[]; transactions: Transaction[]; month: string; hidden: boolean; onAdd: (type: TransactionType) => void; onCategories: () => void }) {
  const monthly = monthTransactions(transactions, month);
  const expenses = categories.filter(c => c.group === 'expense');
  const assets = categories.filter(c => c.group === 'asset');
  const money = (value: number) => moneyText(value, hidden);
  return <div className="page-enter">
    <section className="balance-card" aria-label="Resumo financeiro">
      <div className="balance-caption"><span><span className="balance-dot" /> SALDO LIVRE</span><Wallet size={20} strokeWidth={1.5} aria-hidden="true" /></div>
      <p className="balance-value">{money(getBalance(transactions))}</p><p className="balance-note">Disponível em conta</p>
      <div className="balance-totals"><div><span><ArrowDownLeft size={16} /> Entradas do mês</span><strong>{hidden ? '••••' : `+ ${money(sumAmounts(monthly, 'income'))}`}</strong></div><div><span><ArrowUpRight size={16} /> Gastos do mês</span><strong>{hidden ? '••••' : `− ${money(sumAmounts(monthly, 'expense'))}`}</strong></div></div>
    </section>
    <div className="quick-actions" aria-label="Novo lançamento"><button onClick={() => onAdd('income')}><span className="quick-icon income"><ArrowDownLeft size={23} /></span><span>+ Entrada</span></button><button onClick={() => onAdd('expense')}><span className="quick-icon expense"><ArrowUpRight size={23} /></span><span>+ Gasto</span></button><button onClick={() => onAdd('transfer')}><span className="quick-icon saving"><ShieldCheck size={23} /></span><span>+ Guardar</span></button></div>
    <section className="budget-section" aria-labelledby="budget-title"><div className="section-heading"><div><p className="eyebrow">SEUS ORÇAMENTOS</p><h2 id="budget-title">Quanto ainda<br />posso gastar?</h2></div><button className="text-button" onClick={onCategories}>Ajustar limites</button></div>
      <div className="budget-list">{expenses.map(category => {
        const { amount, target, remaining, progress, exceeded } = categorySummary(category, monthly);
        return <article key={category.id} className={`budget-card ${exceeded ? 'budget-exceeded' : ''}`}><div className="budget-row"><CategoryIcon name={category.icon} color={category.color} /><div className="budget-name"><h3>{category.name}</h3><p>{money(amount)} <span>de {money(target)}</span></p></div></div><div className="budget-bottom"><Progress aria-hidden={hidden} value={progress} aria-label={`Orçamento de ${category.name}`} className={`budget-progress ${exceeded ? 'is-exceeded' : ''}`} /><span className={exceeded ? 'remaining exceeded' : 'remaining'}><strong>{money(Math.abs(remaining))}</strong><small>{exceeded ? 'excedidos' : 'restantes'}</small></span></div></article>;
      })}</div>{!expenses.length && <Empty><EmptyTitle>Seu primeiro orçamento</EmptyTitle><EmptyDescription>Crie uma categoria para acompanhar seus gastos.</EmptyDescription><button className="primary-button" onClick={onCategories}>Criar categoria</button></Empty>}
    </section>
    <section className="goals-section" aria-labelledby="goals-title"><div className="section-heading"><div><p className="eyebrow">UM PASSO DE CADA VEZ</p><h2 id="goals-title">Metas guardadas</h2></div><Sparkles size={24} className="goals-spark" aria-hidden="true" /></div><div className="goals-card">{assets.map(category => {
      const { amount, target, percent, progress } = categorySummary(category, monthly);
      return <article className="goal" key={category.id}><div className="goal-heading"><CategoryIcon name={category.icon} color={category.color} /><div><h3>{category.name}</h3><p>{money(amount)} <span>de {money(target)}</span></p></div><span className="goal-percent">{hidden ? '••' : target ? `${percent}%` : '—'}{target > 0 && percent >= 100 && !hidden && <Check size={13} />}</span></div><Progress aria-hidden={hidden} value={progress} className="goal-progress" aria-label={`Meta de ${category.name}`} /></article>;
    })}{!assets.length && <p className="muted">Crie uma meta em Categorias para começar a guardar.</p>}</div><div className="savings-note"><ShieldCheck size={16} /><span>{money(sumAmounts(monthly, 'transfer'))} guardados neste mês</span></div></section>
  </div>;
}

