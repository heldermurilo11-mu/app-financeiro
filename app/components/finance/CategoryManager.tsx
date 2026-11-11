'use client';
import { useRef, useState, type FormEvent } from 'react';
import { Plus, Pencil, X, Trash2, LockKeyhole, Check } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { AlertDialog, AlertDialogContent, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Empty, EmptyTitle, EmptyDescription } from '@/components/ui/empty';
import { CategoryIcon, CATEGORY_ICONS } from './CategoryIcon';
import { cents, moneyText, parseMoney, type Category, type CategoryGroup, type Transaction } from '@/lib/finance';

const COLORS = ['#E06D53', '#4A69E2', '#F3A638', '#B259D9', '#2EB5A6', '#163300', '#9FE870', '#F43F5E'];
const ICON_LABELS = ['Alimentação', 'Moradia', 'Transporte', 'Lazer', 'Saúde', 'Reserva', 'Investimentos', 'Compras', 'Educação', 'Viagens', 'Animais', 'Trabalho', 'Presentes', 'Café', 'Carteira', 'Dinheiro'];
export function CategoryManager({ categories, transactions, hidden, onSave, onDelete }: { categories: Category[]; transactions: Transaction[]; hidden: boolean; onSave: (c: Category) => boolean; onDelete: (id: string) => boolean }) {
  const [group, setGroup] = useState<CategoryGroup>('expense');
  const [editor, setEditor] = useState<Category | 'new' | null>(null);
  const selected = categories.filter(c => c.group === group);
  const total = selected.reduce((sum, c) => sum + cents(c.monthlyTarget ?? 0), 0) / 100;
  return <section className="page-enter"><div className="view-heading"><div><p className="eyebrow">DO SEU JEITO</p><h1>Suas categorias</h1></div><span className="view-decoration"><Pencil size={21} strokeWidth={1.5} /></span></div>
    <Tabs value={group} onValueChange={value => setGroup(value as CategoryGroup)}><TabsList className="manager-tabs"><TabsTrigger value="expense">Consumo</TabsTrigger><TabsTrigger value="asset">Patrimônio / Reservas</TabsTrigger></TabsList>
      <p className="group-description">{group === 'expense' ? 'Defina quanto quer gastar em cada categoria.' : 'Defina quanto quer guardar todo mês.'}</p>
      <div className="category-total"><span>{group === 'expense' ? 'Limite mensal total' : 'Meta mensal total'}</span><strong>{moneyText(total, hidden)}</strong></div>
      {(['expense','asset'] as const).map(tab => <TabsContent key={tab} value={tab}><div className="manager-list">{categories.filter(c => c.group === tab).map(c => <button key={c.id} className="manager-row" onClick={() => setEditor(c)} aria-label={`Editar categoria ${c.name}`}><CategoryIcon name={c.icon} color={c.color} /><span className="manager-copy"><strong>{c.name}</strong><span>{tab === 'expense' ? 'Teto de gastos' : 'Meta de aporte'}{c.isDefault && <LockKeyhole size={11} aria-label="Categoria nativa" />}</span></span><span className="manager-value">{moneyText(c.monthlyTarget ?? 0, hidden)}<Pencil size={14} /></span></button>)}</div>{!categories.some(c => c.group === tab) && <Empty><EmptyTitle>Nenhuma categoria ainda</EmptyTitle><EmptyDescription>Crie sua primeira categoria para {tab === 'expense' ? 'organizar os gastos' : 'acompanhar os aportes'}.</EmptyDescription></Empty>}</TabsContent>)}
    </Tabs><button className="floating-add" onClick={() => setEditor('new')}><Plus size={20} />Nova categoria</button>
    {editor && <CategoryEditor key={editor === 'new' ? `new-${group}` : editor.id} category={editor === 'new' ? undefined : editor} initialGroup={group} used={editor !== 'new' && transactions.some(t => t.categoryId === editor.id)} onClose={() => setEditor(null)} onSave={onSave} onDelete={onDelete} />}
  </section>;
}

function CategoryEditor({ category, initialGroup, used, onClose, onSave, onDelete }: { category?: Category; initialGroup: CategoryGroup; used: boolean; onClose: () => void; onSave: (c: Category) => boolean; onDelete: (id: string) => boolean }) {
  const [name, setName] = useState(category?.name ?? '');
  const [group, setGroup] = useState(category?.group ?? initialGroup);
  const [target, setTarget] = useState((category?.monthlyTarget ?? 0).toFixed(2).replace('.', ','));
  const [color, setColor] = useState(category?.color ?? COLORS[0]);
  const [icon, setIcon] = useState(category?.icon ?? 'ShoppingBag');
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const opener = useRef<HTMLElement | null>(typeof document === 'undefined' ? null : document.activeElement as HTMLElement);
  const deleteOpener = useRef<HTMLElement | null>(null);
  const restoreFocus = () => { const target = opener.current?.isConnected ? opener.current : document.querySelector<HTMLElement>('.floating-add'); target?.focus(); };
  const locked = Boolean(category && (category.isDefault || used));
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) { setError('Informe o nome da categoria.'); return; }
    const monthlyTarget = parseMoney(target);
    if (!Number.isFinite(monthlyTarget) || monthlyTarget < 0) { setError('Informe um valor válido para a meta, por exemplo 500,00.'); return; }
    const next: Category = { id: category?.id ?? crypto.randomUUID(), name: name.trim(), group, color, icon, monthlyTarget, ...(category?.isDefault !== undefined ? { isDefault: category.isDefault } : {}) };
    if (onSave(next)) onClose(); else setError('Não foi possível salvar. Verifique o armazenamento do navegador e tente novamente.');
  };
  return <><Sheet open onOpenChange={open => { if (!open) onClose(); }}><SheetContent side="bottom" className="finance-sheet" showCloseButton={false} onCloseAutoFocus={e => { e.preventDefault(); restoreFocus(); }}><div className="sheet-grip" /><div className="sheet-heading"><SheetTitle>{category ? 'Editar categoria' : 'Nova categoria'}</SheetTitle><button className="icon-button" aria-label="Fechar categoria" onClick={onClose}><X size={20} /></button></div><SheetDescription className="sr-only">Personalize o nome, o tipo, a meta, a cor e o ícone da categoria.</SheetDescription>
    <form className="sheet-form" onSubmit={submit}><div className="sheet-scroll"><label htmlFor="category-name" className="field-label first-field">Nome da categoria</label><input className="form-input" id="category-name" value={name} onChange={e => setName(e.target.value)} maxLength={60} placeholder="Ex.: educação" autoComplete="off" />
      <fieldset className="category-fieldset"><legend>Tipo</legend><RadioGroup className="group-picker" value={group} onValueChange={value => setGroup(value as CategoryGroup)} disabled={locked} aria-label="Tipo de categoria"><label className={group === 'expense' ? 'selected' : ''}><RadioGroupItem value="expense" aria-label="Despesa de consumo" />Consumo</label><label className={group === 'asset' ? 'selected' : ''}><RadioGroupItem value="asset" aria-label="Patrimônio ou reserva" />Patrimônio</label></RadioGroup>{locked && <p className="form-hint">{category?.isDefault ? 'O tipo das categorias nativas é protegido.' : 'O tipo não pode mudar enquanto houver lançamentos nesta categoria.'}</p>}</fieldset>
      <label htmlFor="category-target" className="field-label">{group === 'expense' ? 'Teto de gastos mensal' : 'Meta de aporte mensal'}<span>R$</span></label><input className="form-input" id="category-target" type="text" inputMode="decimal" value={target} onChange={e => setTarget(e.target.value)} maxLength={17} /><p className="form-hint">{group === 'expense' ? 'O app avisa quando você ultrapassa esse valor.' : 'Aportes contam como dinheiro guardado.'}</p>
      <fieldset className="category-fieldset"><legend>Cor</legend><RadioGroup className="color-picker" value={color} onValueChange={setColor} aria-label="Cor da categoria">{[...new Set([...COLORS, color])].map(c => <label key={c} style={{ backgroundColor: c }} className={`color-option ${color === c ? 'selected' : ''}`}><RadioGroupItem className="sr-only" value={c} aria-label={`Cor ${c}`} />{color === c && <Check size={19} color={c === '#9FE870' || c === '#F3A638' ? '#163300' : 'white'} />}</label>)}</RadioGroup></fieldset>
      <fieldset className="category-fieldset"><legend>Ícone</legend><RadioGroup className="icon-picker" value={icon} onValueChange={setIcon} aria-label="Ícone da categoria">{Object.keys(CATEGORY_ICONS).map((key, index) => <label className={`icon-option ${icon === key ? 'selected' : ''}`} key={key} title={ICON_LABELS[index]}><RadioGroupItem value={key} className="sr-only" aria-label={ICON_LABELS[index]} /><CategoryIcon name={key} color={color} /></label>)}</RadioGroup></fieldset>
      {category?.isDefault && <p className="form-hint protected-hint"><LockKeyhole size={14} />Categoria nativa: pode ser personalizada, mas não excluída.</p>}{used && !category?.isDefault && <p className="form-hint">Para excluir esta categoria, primeiro altere ou exclua seus lançamentos.</p>}{error && <p className="form-error" role="alert">{error}</p>}
    </div><div className="sheet-actions"><button type="submit" className="primary-button">{category ? 'Salvar categoria' : 'Criar categoria'}</button>{category && !locked && <button className="delete-button" type="button" onClick={() => { deleteOpener.current = document.activeElement as HTMLElement; setConfirmDelete(true); }}><Trash2 size={17} />Excluir categoria</button>}</div></form></SheetContent></Sheet>
    <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}><AlertDialogContent className="finance-confirm" onCloseAutoFocus={e => { e.preventDefault(); if (deleteOpener.current?.isConnected) deleteOpener.current.focus(); else restoreFocus(); }}><AlertDialogTitle>Excluir esta categoria?</AlertDialogTitle><AlertDialogDescription>A categoria “{name}” será removida.</AlertDialogDescription><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction variant="destructive" onClick={() => { if (category && onDelete(category.id)) onClose(); else setError('Não foi possível excluir esta categoria.'); }}>Excluir categoria</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></>;
}

