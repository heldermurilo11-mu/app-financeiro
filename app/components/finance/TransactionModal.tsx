'use client';
import { useRef, useState, type FormEvent } from 'react';
import { X, Trash2, Check } from 'lucide-react';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { AlertDialog, AlertDialogContent, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { CategoryIcon } from './CategoryIcon';
import { localDate, parseMoney, validDate, type Category, type Transaction, type TransactionType } from '@/lib/finance';

const LABELS = { income: 'Nova entrada', expense: 'Novo gasto', transfer: 'Guardar dinheiro' };
export function TransactionModal({ initialType, transaction, categories, onClose, onSave, onDelete }: { initialType: TransactionType; transaction?: Transaction; categories: Category[]; onClose: () => void; onSave: (t: Transaction) => boolean; onDelete: (id: string) => boolean }) {
  const [type, setType] = useState(initialType);
  const eligible = categories.filter(c => type === 'transfer' ? c.group === 'asset' : type === 'expense' ? c.group === 'expense' : true);
  const [categoryId, setCategoryId] = useState(transaction?.categoryId ?? eligible[0]?.id ?? '');
  const [amount, setAmount] = useState(transaction?.amount.toFixed(2).replace('.', ',') ?? '');
  const [date, setDate] = useState(transaction?.date ?? localDate());
  const [description, setDescription] = useState(transaction?.description ?? '');
  const [notes, setNotes] = useState(transaction?.notes ?? '');
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const amountRef = useRef<HTMLInputElement>(null);
  const opener = useRef<HTMLElement | null>(typeof document === 'undefined' ? null : document.activeElement as HTMLElement);
  const deleteOpener = useRef<HTMLElement | null>(null);
  const restoreFocus = () => { const target = opener.current?.isConnected ? opener.current : document.querySelector<HTMLElement>('.bottom-nav .active'); target?.focus(); };
  const changeType = (value: string) => {
    const next = value as TransactionType;
    setType(next);
    const nextEligible = categories.filter(c => next === 'transfer' ? c.group === 'asset' : next === 'expense' ? c.group === 'expense' : true);
    if (!nextEligible.some(c => c.id === categoryId)) setCategoryId(nextEligible[0]?.id ?? '');
    setError('');
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const value = parseMoney(amount);
    if (!Number.isFinite(value) || value <= 0) { setError('Informe um valor maior que zero, por exemplo 35,90.'); amountRef.current?.focus(); return; }
    const category = eligible.find(c => c.id === categoryId);
    if (!category) { setError('Selecione uma categoria. Você pode criar uma na aba Categorias.'); return; }
    if (!validDate(date)) { setError('Informe uma data válida.'); return; }
    const next: Transaction = { id: transaction?.id ?? crypto.randomUUID(), amount: value, type, categoryId, date, description: description.trim() || (type === 'income' ? 'Entrada' : type === 'transfer' ? `Aporte em ${category.name}` : category.name), createdAt: transaction?.createdAt ?? new Date().toISOString(), ...(notes.trim() ? { notes: notes.trim() } : {}) };
    if (onSave(next)) onClose(); else setError('Não foi possível salvar. Seu lançamento continua aqui para tentar novamente.');
  };
  return <><Sheet open onOpenChange={open => { if (!open) onClose(); }}><SheetContent side="bottom" showCloseButton={false} className="finance-sheet" onCloseAutoFocus={e => { e.preventDefault(); restoreFocus(); }} onOpenAutoFocus={e => { e.preventDefault(); amountRef.current?.focus(); }}>
    <div className="sheet-grip" /><div className="sheet-heading"><SheetTitle>{transaction ? 'Editar lançamento' : LABELS[type]}</SheetTitle><button className="icon-button" aria-label="Fechar lançamento" onClick={onClose}><X size={20} /></button></div><SheetDescription className="sr-only">Informe o valor, a categoria e a data do lançamento.</SheetDescription>
    <form onSubmit={submit} className="sheet-form"><div className="sheet-scroll">
      <Tabs value={type} onValueChange={changeType}><TabsList className="type-tabs"><TabsTrigger value="income">Entrada</TabsTrigger><TabsTrigger value="expense">Gasto</TabsTrigger><TabsTrigger value="transfer">Guardar</TabsTrigger></TabsList></Tabs>
      <label className="amount-label" htmlFor="transaction-amount">Valor do lançamento</label><div className="amount-field"><span>R$</span><input id="transaction-amount" ref={amountRef} type="text" inputMode="decimal" placeholder="0,00" value={amount} onChange={e => setAmount(e.target.value)} maxLength={17} autoComplete="off" aria-describedby={error ? 'transaction-error' : undefined} /></div>
      <fieldset className="category-fieldset"><legend>Categoria</legend><RadioGroup value={categoryId} onValueChange={setCategoryId} className="category-picker" aria-label="Categoria do lançamento">{eligible.map(c => <label className={`category-option ${categoryId === c.id ? 'selected' : ''}`} key={c.id}><RadioGroupItem value={c.id} className="sr-only" aria-label={c.name} /><CategoryIcon name={c.icon} color={c.color} /><span>{c.name}</span>{categoryId === c.id && <Check size={12} className="option-check" />}</label>)}</RadioGroup>{!eligible.length && <p className="form-hint">Crie uma categoria {type === 'transfer' ? 'de patrimônio' : 'de consumo'} antes de lançar.</p>}</fieldset>
      <label className="field-label" htmlFor="transaction-description">Descrição <span>opcional</span></label><input className="form-input" id="transaction-description" placeholder={type === 'income' ? 'Ex.: salário mensal' : type === 'transfer' ? 'Ex.: aporte na reserva' : 'Ex.: mercado da semana'} value={description} onChange={e => setDescription(e.target.value)} maxLength={100} />
      <label className="field-label" htmlFor="transaction-date">Data <span>{date === localDate() ? 'Hoje' : ''}</span></label><input className="form-input" type="date" id="transaction-date" value={date} min="1900-01-01" max="9999-12-31" onChange={e => setDate(e.target.value)} />
      <label className="field-label" htmlFor="transaction-notes">Observação <span>opcional</span></label><textarea className="form-input" id="transaction-notes" rows={2} placeholder="Algo que você queira lembrar" maxLength={500} value={notes} onChange={e => setNotes(e.target.value)} />
      {error && <p className="form-error" id="transaction-error" role="alert">{error}</p>}
    </div><div className="sheet-actions"><button className="primary-button" type="submit">{transaction ? 'Salvar alterações' : type === 'transfer' ? 'Confirmar aporte' : 'Confirmar lançamento'}</button>{transaction && <button className="delete-button" type="button" onClick={() => { deleteOpener.current = document.activeElement as HTMLElement; setConfirmDelete(true); }}><Trash2 size={17} />Excluir lançamento</button>}</div></form>
  </SheetContent></Sheet><AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}><AlertDialogContent className="finance-confirm" onCloseAutoFocus={e => { e.preventDefault(); if (deleteOpener.current?.isConnected) deleteOpener.current.focus(); else restoreFocus(); }}><AlertDialogTitle>Excluir este lançamento?</AlertDialogTitle><AlertDialogDescription>O valor será removido do extrato e os saldos serão recalculados.</AlertDialogDescription><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction variant="destructive" onClick={() => { if (transaction && onDelete(transaction.id)) onClose(); else setError('Não foi possível excluir. Tente novamente.'); }}>Excluir lançamento</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></>;
}

