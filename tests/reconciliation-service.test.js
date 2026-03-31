const test = require('node:test');
const assert = require('node:assert/strict');

const { loadService } = require('./helpers/load-service');

function createReconHarness(seed) {
  const reconciliations = (seed && seed.reconciliations) ? seed.reconciliations.slice() : [];
  const entries = (seed && seed.entries) ? seed.entries.slice() : [];

  let idCounter = 1;
  const dbCalls = { saveReconciliation: 0, deleteReconciliation: 0 };

  const fcl = {
    DB: {
      getAllReconciliations: async () => reconciliations,
      saveReconciliation: async () => { dbCalls.saveReconciliation += 1; },
      deleteReconciliation: async () => { dbCalls.deleteReconciliation += 1; },
    },
    Validators: {
      generateId: () => `r-${idCounter++}`,
      sanitizeHTML: (s) => String(s).replace(/</g, '&lt;').replace(/>/g, '&gt;'),
    },
    Accounting: {
      round2: (n) => Math.round(n * 100) / 100,
    },
    Ledger: {
      getEntryTotal: (entry) => {
        let total = 0;
        for (const line of entry.lines) total += (line.debit || 0) - (line.credit || 0);
        return Math.abs(total);
      },
    },
    PayeeService: {},
    State: {
      setReconciliations: (list) => { reconciliations.length = 0; reconciliations.push(...list); },
      getReconciliations: () => reconciliations,
      addReconciliation: (r) => reconciliations.push(r),
      updateReconciliation: (updated) => {
        const idx = reconciliations.findIndex((r) => r.id === updated.id);
        if (idx !== -1) reconciliations[idx] = updated;
      },
      removeReconciliation: (id) => {
        const idx = reconciliations.findIndex((r) => r.id === id);
        if (idx !== -1) reconciliations.splice(idx, 1);
      },
      getEntries: () => entries,
    },
  };

  const loaded = loadService('js/application/reconciliation-service.js', fcl);
  return { service: loaded.ReconciliationService, reconciliations, dbCalls };
}

test('startReconciliation validates month format', async () => {
  const { service } = createReconHarness();

  const result = await service.startReconciliation('acc-1', '2026/03', 1000);

  assert.equal(result.success, false);
  assert.match(result.errors[0], /yyyy-mm/i);
});

test('startReconciliation captures app transactions for account and month', async () => {
  const { service, reconciliations, dbCalls } = createReconHarness({
    entries: [
      {
        id: 'e1',
        date: '2026-03-01',
        lines: [{ accountId: 'acc-1', debit: 100, credit: 0 }],
      },
      {
        id: 'e2',
        date: '2026-03-11',
        lines: [{ accountId: 'acc-2', debit: 50, credit: 0 }],
      },
      {
        id: 'e3',
        date: '2026-02-11',
        lines: [{ accountId: 'acc-1', debit: 20, credit: 0 }],
      },
    ],
  });

  const result = await service.startReconciliation('acc-1', '2026-03', 1000);

  assert.equal(result.success, true);
  assert.equal(reconciliations.length, 1);
  assert.deepEqual(reconciliations[0].unmatchedAppTransactionIds, ['e1']);
  assert.equal(dbCalls.saveReconciliation, 1);
});

test('importBankStatement parses CSV and updates bank closing balance', async () => {
  const { service, reconciliations } = createReconHarness({
    reconciliations: [{
      id: 'r1',
      accountId: 'acc-1',
      month: '2026-03',
      openingBalance: 100,
      closingBalance: 0,
      bankClosingBalance: 0,
      difference: 0,
      status: 'draft',
      matchedTransactionIds: [],
      unmatchedAppTransactionIds: ['e1'],
      unmatchedBankTransactions: [],
    }],
  });

  const csv = [
    'Date,Description,Amount',
    '2026-03-01,Coffee,-10.50',
    '2026-03-05,Salary,1000.00',
  ].join('\n');

  const result = await service.importBankStatement('r1', csv);

  assert.equal(result.success, true);
  assert.equal(result.importedCount, 2);
  assert.equal(reconciliations[0].status, 'in-progress');
  assert.equal(reconciliations[0].bankClosingBalance, 1089.5);
});

test('autoMatch matches by same date and amount tolerance', async () => {
  const { service, reconciliations } = createReconHarness({
    reconciliations: [{
      id: 'r1',
      accountId: 'acc-1',
      month: '2026-03',
      openingBalance: 100,
      closingBalance: 0,
      bankClosingBalance: 90,
      difference: 0,
      status: 'in-progress',
      matchedTransactionIds: [],
      unmatchedAppTransactionIds: ['e1'],
      unmatchedBankTransactions: [
        { index: 0, date: '2026-03-01', description: 'Coffee', amount: -10, matched: false, matchedEntryId: null },
      ],
    }],
    entries: [{
      id: 'e1',
      date: '2026-03-01',
      lines: [
        { accountId: 'expense', debit: 10, credit: 0 },
        { accountId: 'acc-1', debit: 0, credit: 10 },
      ],
    }],
  });

  const result = await service.autoMatch('r1');

  assert.equal(result.success, true);
  assert.equal(result.matchCount, 1);
  assert.deepEqual(reconciliations[0].matchedTransactionIds, ['e1']);
  assert.equal(reconciliations[0].unmatchedAppTransactionIds.length, 0);
  assert.equal(reconciliations[0].unmatchedBankTransactions[0].matched, true);
});

test('manualMatch and unmatch update both bank and app unmatched sets', async () => {
  const { service, reconciliations } = createReconHarness({
    reconciliations: [{
      id: 'r1',
      accountId: 'acc-1',
      month: '2026-03',
      openingBalance: 100,
      closingBalance: 0,
      bankClosingBalance: 90,
      difference: 0,
      status: 'in-progress',
      matchedTransactionIds: [],
      unmatchedAppTransactionIds: ['e1'],
      unmatchedBankTransactions: [
        { index: 7, date: '2026-03-01', description: 'Coffee', amount: -10, matched: false, matchedEntryId: null },
      ],
    }],
    entries: [{
      id: 'e1',
      date: '2026-03-01',
      lines: [
        { accountId: 'expense', debit: 10, credit: 0 },
        { accountId: 'acc-1', debit: 0, credit: 10 },
      ],
    }],
  });

  const matched = await service.manualMatch('r1', 7, 'e1');
  assert.equal(matched.success, true);
  assert.equal(reconciliations[0].matchedTransactionIds.length, 1);
  assert.equal(reconciliations[0].unmatchedAppTransactionIds.length, 0);

  const unmatched = await service.unmatch('r1', 7);
  assert.equal(unmatched.success, true);
  assert.equal(reconciliations[0].matchedTransactionIds.length, 0);
  assert.equal(reconciliations[0].unmatchedAppTransactionIds.length, 1);
  assert.equal(reconciliations[0].unmatchedBankTransactions[0].matched, false);
});

test('completeReconciliation marks reconciliation as completed', async () => {
  const { service, reconciliations } = createReconHarness({
    reconciliations: [{
      id: 'r1',
      accountId: 'acc-1',
      month: '2026-03',
      openingBalance: 100,
      closingBalance: 100,
      bankClosingBalance: 100,
      difference: 0,
      status: 'in-progress',
      matchedTransactionIds: [],
      unmatchedAppTransactionIds: [],
      unmatchedBankTransactions: [],
      reconciledAt: null,
    }],
    entries: [],
  });

  const result = await service.completeReconciliation('r1');

  assert.equal(result.success, true);
  assert.equal(reconciliations[0].status, 'completed');
  assert.ok(reconciliations[0].reconciledAt);
});
