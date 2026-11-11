import test from 'node:test';
import assert from 'node:assert/strict';
import { seedData, validData, getBalance, sumAmounts, monthTransactions, categorySummary, parseMoney, validDate, shiftMonth, localDate } from '../lib/finance.ts';

test('seed: saldo global, consumo mensal e aportes separados', () => {
  const data = seedData();
  assert.equal(validData(data), true);
  assert.equal(getBalance(data.transactions), 4030);
  const october = monthTransactions(data.transactions, '2026-10');
  assert.equal(sumAmounts(october, 'income'), 5000);
  assert.equal(sumAmounts(october, 'expense'), 470);
  assert.equal(sumAmounts(october, 'transfer'), 500);
  assert.equal(sumAmounts(monthTransactions(data.transactions, '2026-09'), 'expense'), 0);
  assert.equal(getBalance(data.transactions), 4030);
});
test('categorias: entradas não consomem limites e reserva atinge 100%', () => {
  const d = seedData();
  assert.equal(categorySummary(d.categories[0], d.transactions).remaining, 450);
  assert.equal(categorySummary(d.categories[2], d.transactions).remaining, 180);
  assert.equal(categorySummary(d.categories[5], d.transactions).percent, 100);
});
test('estouro preenche barra em 100%, inclusive com limite zero ou ausente', () => {
  const d = seedData();
  for (const monthlyTarget of [100, 0, undefined]) {
    const summary = categorySummary({ ...d.categories[0], monthlyTarget }, d.transactions);
    assert.equal(summary.exceeded, true);
    assert.equal(summary.progress, 100);
    assert.ok(Number.isFinite(summary.percent));
  }
});
test('aporte além da meta mostra percentual real e limita a barra', () => {
  const d = seedData();
  const summary = categorySummary({ ...d.categories[5], monthlyTarget: 250 }, d.transactions);
  assert.equal(summary.percent, 200);
  assert.equal(summary.progress, 100);
  assert.equal(summary.exceeded, false);
  assert.equal(categorySummary({ ...d.categories[5], monthlyTarget: 0 }, d.transactions).percent, 0);
});
test('moeda: BRL, centavos e rejeição de números malformados', () => {
  for (const [input, expected] of [['R$ 1.234,56',1234.56],['0,01',0.01],['154.50',154.5],['1.234',1234],['0',0]]) assert.equal(parseMoney(input), expected);
  for (const input of ['', '-1', '1,234', '1e3', 'NaN', 'Infinity', '1.2.3', '1,2,3']) assert.ok(Number.isNaN(parseMoney(input)));
});
test('somar centavos não introduz erro de ponto flutuante', () => {
  const transaction = seedData().transactions[0];
  assert.equal(getBalance([{ ...transaction, id: 'a', amount: 0.1 }, { ...transaction, id: 'b', amount: 0.2 }]), 0.3);
});
test('calendário valida datas e troca de ano sem conversão UTC', () => {
  assert.equal(validDate('2024-02-29'), true);
  for (const date of ['2026-02-29','2026-13-01','2026-04-31','01/10/2026']) assert.equal(validDate(date), false);
  assert.equal(shiftMonth('2026-12', 1), '2027-01');
  assert.equal(shiftMonth('2026-01', -1), '2025-12');
  assert.equal(localDate(new Date(2026,9,1)), '2026-10-01');
});
test('persistência rejeita dados inválidos sem aceitar vínculos órfãos', () => {
  for (const amount of [0.004, 0, -1, NaN, Infinity]) { const d = seedData(); d.transactions[0].amount = amount; assert.equal(validData(d), false); }
  for (const monthlyTarget of [0.004, -1, NaN, Infinity]) { const d = seedData(); d.categories[0].monthlyTarget = monthlyTarget; assert.equal(validData(d), false); }
  for (const categoryId of ['missing','cat_food']) { const d = seedData(); d.transactions[3].categoryId = categoryId; assert.equal(validData(d), false); }
  const duplicate = seedData(); duplicate.transactions.push({ ...duplicate.transactions[0] }); assert.equal(validData(duplicate), false);
  for (const value of [null, {}, {version: 2}, 'corrompido']) assert.equal(validData(value), false);
});
test('seed independente e listas vazias não devem reinicializar demonstração', () => {
  const first = seedData(); first.categories[0].name = 'Alterada';
  assert.equal(seedData().categories[0].name, 'Alimentação');
  assert.equal(validData({ version: 1, categories: [], transactions: [] }), true);
  const data = seedData(); data.categories[0].isDefault = false; assert.equal(validData(data), true);
});
