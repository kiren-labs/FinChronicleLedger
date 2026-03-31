const test = require('node:test');
const assert = require('node:assert/strict');

const { loadService } = require('./helpers/load-service');

function createPayeeHarness(seed) {
  const payees = (seed && seed.payees) ? seed.payees.slice() : [];
  const entries = (seed && seed.entries) ? seed.entries.map(e => ({ ...e })) : [];

  const dbCalls = { savePayee: 0, deletePayee: 0, saveJournalEntry: 0 };

  const fcl = {
    DB: {
      getAllPayees: async () => payees,
      savePayee: async () => { dbCalls.savePayee += 1; },
      deletePayee: async () => { dbCalls.deletePayee += 1; },
      saveJournalEntry: async () => { dbCalls.saveJournalEntry += 1; },
    },
    Validators: {
      generateId: () => 'id-1',
      sanitizeHTML: (s) => String(s).replace(/</g, '&lt;').replace(/>/g, '&gt;'),
    },
    Ledger: {
      getEntryTotal: (entry) => entry._total,
    },
    State: {
      setPayees: (list) => { payees.length = 0; payees.push(...list); },
      getPayees: () => payees,
      addPayee: (p) => payees.push(p),
      updatePayee: (updated) => {
        const idx = payees.findIndex((p) => p.id === updated.id);
        if (idx !== -1) payees[idx] = updated;
      },
      removePayee: (id) => {
        const idx = payees.findIndex((p) => p.id === id);
        if (idx !== -1) payees.splice(idx, 1);
      },
      getEntries: () => entries,
      updateEntry: (updated) => {
        const idx = entries.findIndex((e) => e.id === updated.id);
        if (idx !== -1) entries[idx] = updated;
      },
    },
  };

  const loaded = loadService('js/application/payee-service.js', fcl);
  return { service: loaded.PayeeService, payees, entries, dbCalls };
}

test('createPayee creates a sanitized payee and saves it', async () => {
  const { service, payees, dbCalls } = createPayeeHarness();

  const res = await service.createPayee('  Coffee <Shop>  ', null);

  assert.equal(res.success, true);
  assert.equal(payees.length, 1);
  assert.equal(payees[0].name, 'Coffee &lt;Shop&gt;');
  assert.equal(dbCalls.savePayee, 1);
});

test('createPayee rejects duplicate names case-insensitively', async () => {
  const { service } = createPayeeHarness({
    payees: [{ id: 'p1', name: 'Amazon', defaultCategoryAccountId: null }],
  });

  const res = await service.createPayee('  amazon ', null);

  assert.equal(res.success, false);
  assert.match(res.errors[0], /already exists/i);
});

test('autocomplete prioritizes starts-with over contains and respects limit', () => {
  const { service } = createPayeeHarness({
    payees: [
      { id: '1', name: 'Amazon' },
      { id: '2', name: 'Amex' },
      { id: '3', name: 'Local Amazon Fresh' },
      { id: '4', name: 'Camera Store' },
    ],
  });

  const result = service.autocomplete('am', 2);

  assert.equal(result.length, 2);
  assert.equal(result[0].name, 'Amazon');
  assert.equal(result[1].name, 'Amex');
});

test('getPayeeSpending groups totals and sorts descending', () => {
  const { service } = createPayeeHarness({
    payees: [
      { id: 'p1', name: 'Store A' },
      { id: 'p2', name: 'Store B' },
    ],
    entries: [
      { id: 'e1', date: '2026-03-10', payeeId: 'p1', _total: 10 },
      { id: 'e2', date: '2026-03-12', payeeId: 'p2', _total: 25 },
      { id: 'e3', date: '2026-03-15', payeeId: 'p2', _total: 5 },
      { id: 'e4', date: '2026-02-15', payeeId: 'p1', _total: 99 },
    ],
  });

  const marchOnly = service.getPayeeSpending('2026-03');

  assert.equal(marchOnly.length, 2);
  assert.equal(marchOnly[0].payee.id, 'p2');
  assert.equal(marchOnly[0].total, 30);
  assert.equal(marchOnly[0].count, 2);
  assert.equal(marchOnly[1].payee.id, 'p1');
  assert.equal(marchOnly[1].total, 10);
});

test('deletePayee clears payeeId in linked entries before deleting payee', async () => {
  const { service, entries, dbCalls } = createPayeeHarness({
    payees: [{ id: 'p1', name: 'Vendor' }],
    entries: [
      { id: 'e1', payeeId: 'p1' },
      { id: 'e2', payeeId: null },
      { id: 'e3', payeeId: 'p1' },
    ],
  });

  const res = await service.deletePayee('p1');

  assert.equal(res.success, true);
  assert.equal(entries[0].payeeId, null);
  assert.equal(entries[2].payeeId, null);
  assert.equal(dbCalls.saveJournalEntry, 2);
  assert.equal(dbCalls.deletePayee, 1);
});

test('findOrCreate returns existing payee without creating duplicate', async () => {
  const { service, dbCalls } = createPayeeHarness({
    payees: [{ id: 'p1', name: 'Spotify' }],
  });

  const res = await service.findOrCreate('spotify', null);

  assert.equal(res.success, true);
  assert.equal(res.payee.id, 'p1');
  assert.equal(dbCalls.savePayee, 0);
});
