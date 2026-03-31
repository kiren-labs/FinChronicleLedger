const test = require('node:test');
const assert = require('node:assert/strict');

const { loadService } = require('./helpers/load-service');

function createGoalHarness(seed) {
  const goals = (seed && seed.goals) ? seed.goals.slice() : [];
  const contributions = (seed && seed.contributions) ? seed.contributions.slice() : [];

  const dbCalls = {
    saveGoal: 0,
    deleteGoal: 0,
    saveContribution: 0,
    deleteContribution: 0,
    deleteContributionsByGoal: 0,
  };

  let idCounter = 1;

  const fcl = {
    DB: {
      getAllGoals: async () => goals,
      getAllContributions: async () => contributions,
      saveGoal: async () => { dbCalls.saveGoal += 1; },
      deleteGoal: async () => { dbCalls.deleteGoal += 1; },
      saveContribution: async () => { dbCalls.saveContribution += 1; },
      deleteContribution: async () => { dbCalls.deleteContribution += 1; },
      deleteContributionsByGoal: async () => { dbCalls.deleteContributionsByGoal += 1; },
    },
    Validators: {
      generateId: () => `id-${idCounter++}`,
      sanitizeHTML: (s) => String(s),
      validateAmount: (n) => {
        const value = typeof n === 'string' ? Number(n) : n;
        if (!Number.isFinite(value) || value <= 0) {
          return { valid: false, error: 'Amount must be greater than zero', value };
        }
        return { valid: true, error: null, value };
      },
      validateDate: (d) => {
        if (!d || !/^\d{4}-\d{2}-\d{2}$/.test(d)) {
          return { valid: false, error: 'Invalid date format' };
        }
        return { valid: true, error: null };
      },
    },
    Accounting: {
      round2: (n) => Math.round(n * 100) / 100,
    },
    State: {
      setGoals: (list) => { goals.length = 0; goals.push(...list); },
      getGoals: () => goals,
      addGoal: (g) => goals.push(g),
      updateGoal: (updated) => {
        const idx = goals.findIndex((g) => g.id === updated.id);
        if (idx !== -1) goals[idx] = updated;
      },
      removeGoal: (id) => {
        const idx = goals.findIndex((g) => g.id === id);
        if (idx !== -1) goals.splice(idx, 1);
      },
      setContributions: (list) => { contributions.length = 0; contributions.push(...list); },
      getContributions: () => contributions,
      addContribution: (c) => contributions.push(c),
      removeContribution: (id) => {
        const idx = contributions.findIndex((c) => c.id === id);
        if (idx !== -1) contributions.splice(idx, 1);
      },
    },
  };

  const loaded = loadService('js/application/goal-service.js', fcl);
  return { service: loaded.GoalService, goals, contributions, dbCalls };
}

test('createGoal validates input and creates an active goal', async () => {
  const { service, goals, dbCalls } = createGoalHarness();

  const result = await service.createGoal({
    name: 'Emergency Fund',
    targetAmount: 1000,
    targetDate: '2026-12-31',
  });

  assert.equal(result.success, true);
  assert.equal(goals.length, 1);
  assert.equal(goals[0].status, 'active');
  assert.equal(goals[0].targetAmount, 1000);
  assert.equal(dbCalls.saveGoal, 1);
});

test('createGoal rejects invalid target amount', async () => {
  const { service } = createGoalHarness();

  const result = await service.createGoal({
    name: 'Invalid Goal',
    targetAmount: 0,
  });

  assert.equal(result.success, false);
  assert.match(result.errors[0], /amount/i);
});

test('addContribution updates progress and auto-completes at 100%', async () => {
  const { service, goals, dbCalls } = createGoalHarness({
    goals: [{
      id: 'g1',
      name: 'Laptop',
      targetAmount: 500,
      targetDate: '2026-12-31',
      linkedAccountId: null,
      status: 'active',
      milestones: [],
      createdAt: new Date().toISOString(),
      completedAt: null,
    }],
  });

  const addResult = await service.addContribution('g1', {
    date: '2026-03-10',
    amount: 500,
    notes: 'One-time deposit',
  });

  assert.equal(addResult.success, true);
  const progress = service.getGoalProgress('g1');
  assert.equal(progress.percentage, 100);
  assert.equal(progress.isComplete, true);
  assert.equal(goals[0].status, 'completed');
  assert.ok((goals[0].milestones || []).length >= 1);
  assert.ok(dbCalls.saveGoal >= 1);
});

test('updateGoal rejects invalid status values', async () => {
  const { service } = createGoalHarness({
    goals: [{ id: 'g1', name: 'Trip', targetAmount: 300, status: 'active', milestones: [] }],
  });

  const result = await service.updateGoal('g1', { status: 'archived' });

  assert.equal(result.success, false);
  assert.match(result.errors[0], /invalid goal status/i);
});

test('deleteGoal cascades to contributions and removes goal', async () => {
  const { service, goals, contributions, dbCalls } = createGoalHarness({
    goals: [{ id: 'g1', name: 'Trip', targetAmount: 300, status: 'active', milestones: [] }],
    contributions: [
      { id: 'c1', goalId: 'g1', amount: 100 },
      { id: 'c2', goalId: 'g1', amount: 50 },
      { id: 'c3', goalId: 'g2', amount: 20 },
    ],
  });

  const result = await service.deleteGoal('g1');

  assert.equal(result.success, true);
  assert.equal(goals.length, 0);
  assert.equal(contributions.length, 1);
  assert.equal(contributions[0].id, 'c3');
  assert.equal(dbCalls.deleteContributionsByGoal, 1);
  assert.equal(dbCalls.deleteGoal, 1);
});
