/**
 * FinChronicleLedger — Application: Goal Service
 * Financial goal CRUD, contributions, progress tracking, milestones.
 */
(function (global) {
    'use strict';

    var DB = function () { return global.FCL.DB; };
    var State = function () { return global.FCL.State; };
    var Validators = function () { return global.FCL.Validators; };
    var Accounting = function () { return global.FCL.Accounting; };

    var GoalStatus = { ACTIVE: 'active', PAUSED: 'paused', COMPLETED: 'completed' };
    var MILESTONE_THRESHOLDS = [25, 50, 75, 100];

    // =====================================================================
    // Initialization
    // =====================================================================

    async function loadAll() {
        var goals = await DB().getAllGoals();
        State().setGoals(goals);
        var contributions = await DB().getAllContributions();
        State().setContributions(contributions);
    }

    // =====================================================================
    // Queries
    // =====================================================================

    function getAllGoals() {
        return State().getGoals();
    }

    function getGoalById(id) {
        return State().getGoals().find(function (g) { return g.id === id; });
    }

    function getActiveGoals() {
        return State().getGoals().filter(function (g) {
            return g.status === GoalStatus.ACTIVE;
        });
    }

    function getContributionsForGoal(goalId) {
        return State().getContributions().filter(function (c) {
            return c.goalId === goalId;
        });
    }

    /**
     * Calculate progress data for a goal.
     */
    function getGoalProgress(goalId) {
        var goal = getGoalById(goalId);
        if (!goal) return null;

        var contributions = getContributionsForGoal(goalId);
        var currentAmount = contributions.reduce(function (sum, c) {
            return sum + c.amount;
        }, 0);
        currentAmount = Accounting().round2(currentAmount);

        var percentage = goal.targetAmount > 0
            ? Math.min(100, Accounting().round2((currentAmount / goal.targetAmount) * 100))
            : 0;

        // Calculate pace — monthly needed to reach target by targetDate
        var monthlyNeeded = 0;
        var remaining = Accounting().round2(goal.targetAmount - currentAmount);
        if (remaining > 0 && goal.targetDate) {
            var today = new Date();
            var target = new Date(goal.targetDate + 'T00:00:00');
            var monthsLeft = ((target.getFullYear() - today.getFullYear()) * 12) +
                (target.getMonth() - today.getMonth());
            if (monthsLeft <= 0) monthsLeft = 1;
            monthlyNeeded = Accounting().round2(remaining / monthsLeft);
        }

        // Current monthly pace (average over active months)
        var currentPace = 0;
        if (contributions.length > 0) {
            var sorted = contributions.slice().sort(function (a, b) {
                return a.date < b.date ? -1 : a.date > b.date ? 1 : 0;
            });
            var firstDate = new Date(sorted[0].date + 'T00:00:00');
            var now = new Date();
            var activeMonths = ((now.getFullYear() - firstDate.getFullYear()) * 12) +
                (now.getMonth() - firstDate.getMonth());
            if (activeMonths < 1) activeMonths = 1;
            currentPace = Accounting().round2(currentAmount / activeMonths);
        }

        // Reached milestones
        var reachedMilestones = (goal.milestones || []).slice();

        return {
            goalId: goalId,
            currentAmount: currentAmount,
            targetAmount: goal.targetAmount,
            remaining: remaining,
            percentage: percentage,
            monthlyNeeded: monthlyNeeded,
            currentPace: currentPace,
            reachedMilestones: reachedMilestones,
            contributionCount: contributions.length,
            isComplete: percentage >= 100,
        };
    }

    /**
     * Get a summary of all goals' progress.
     */
    function getAllGoalsSummary() {
        return State().getGoals().map(function (g) {
            var progress = getGoalProgress(g.id);
            return Object.assign({}, g, { progress: progress });
        });
    }

    // =====================================================================
    // Mutations
    // =====================================================================

    async function createGoal(params) {
        var name = (params.name || '').trim();
        if (name.length < 1 || name.length > 100) {
            return { success: false, errors: ['Goal name must be 1–100 characters'] };
        }

        var amountResult = Validators().validateAmount(params.targetAmount);
        if (!amountResult.valid) {
            return { success: false, errors: [amountResult.error] };
        }

        var goal = {
            id: Validators().generateId(),
            name: Validators().sanitizeHTML(name),
            targetAmount: amountResult.value,
            targetDate: params.targetDate || null,
            linkedAccountId: params.linkedAccountId || null,
            status: GoalStatus.ACTIVE,
            milestones: [],
            createdAt: new Date().toISOString(),
            completedAt: null,
        };

        await DB().saveGoal(goal);
        State().addGoal(goal);
        return { success: true, goal: goal };
    }

    async function updateGoal(id, updates) {
        var goal = getGoalById(id);
        if (!goal) return { success: false, errors: ['Goal not found'] };

        var updated = Object.assign({}, goal);

        if (updates.name != null) {
            var cleanName = updates.name.trim();
            if (cleanName.length < 1 || cleanName.length > 100) {
                return { success: false, errors: ['Goal name must be 1–100 characters'] };
            }
            updated.name = Validators().sanitizeHTML(cleanName);
        }
        if (updates.targetAmount != null) {
            var amtResult = Validators().validateAmount(updates.targetAmount);
            if (!amtResult.valid) return { success: false, errors: [amtResult.error] };
            updated.targetAmount = amtResult.value;
        }
        if (updates.targetDate !== undefined) {
            updated.targetDate = updates.targetDate || null;
        }
        if (updates.linkedAccountId !== undefined) {
            updated.linkedAccountId = updates.linkedAccountId || null;
        }
        if (updates.status != null) {
            if ([GoalStatus.ACTIVE, GoalStatus.PAUSED, GoalStatus.COMPLETED].indexOf(updates.status) === -1) {
                return { success: false, errors: ['Invalid goal status'] };
            }
            updated.status = updates.status;
            if (updates.status === GoalStatus.COMPLETED && !updated.completedAt) {
                updated.completedAt = new Date().toISOString();
            }
        }

        await DB().saveGoal(updated);
        State().updateGoal(updated);
        return { success: true, goal: updated };
    }

    async function deleteGoal(id) {
        var goal = getGoalById(id);
        if (!goal) return { success: false, errors: ['Goal not found'] };

        // Cascade delete contributions
        await DB().deleteContributionsByGoal(id);
        var contributions = State().getContributions().filter(function (c) {
            return c.goalId === id;
        });
        for (var i = 0; i < contributions.length; i++) {
            State().removeContribution(contributions[i].id);
        }

        await DB().deleteGoal(id);
        State().removeGoal(id);
        return { success: true };
    }

    // =====================================================================
    // Contributions
    // =====================================================================

    async function addContribution(goalId, params) {
        var goal = getGoalById(goalId);
        if (!goal) return { success: false, errors: ['Goal not found'] };

        var amountResult = Validators().validateAmount(params.amount);
        if (!amountResult.valid) {
            return { success: false, errors: [amountResult.error] };
        }

        var dateResult = Validators().validateDate(params.date);
        if (!dateResult.valid) {
            return { success: false, errors: [dateResult.error] };
        }

        var contribution = {
            id: Validators().generateId(),
            goalId: goalId,
            date: params.date,
            amount: amountResult.value,
            transactionId: params.transactionId || null,
            notes: Validators().sanitizeHTML(String(params.notes || '')),
            createdAt: new Date().toISOString(),
        };

        await DB().saveContribution(contribution);
        State().addContribution(contribution);

        // Check and update milestones
        await checkAndUpdateMilestones(goalId);

        return { success: true, contribution: contribution };
    }

    async function removeContribution(contributionId) {
        var contribution = State().getContributions().find(function (c) {
            return c.id === contributionId;
        });
        if (!contribution) return { success: false, errors: ['Contribution not found'] };

        var goalId = contribution.goalId;
        await DB().deleteContribution(contributionId);
        State().removeContribution(contributionId);

        // Recalculate milestones after removal
        await checkAndUpdateMilestones(goalId);

        return { success: true };
    }

    /**
     * Check if new milestones have been reached and update the goal.
     */
    async function checkAndUpdateMilestones(goalId) {
        var progress = getGoalProgress(goalId);
        if (!progress) return;

        var goal = getGoalById(goalId);
        if (!goal) return;

        var currentMilestones = goal.milestones || [];
        var newMilestones = [];

        for (var i = 0; i < MILESTONE_THRESHOLDS.length; i++) {
            var threshold = MILESTONE_THRESHOLDS[i];
            var alreadyReached = currentMilestones.some(function (m) {
                return m.threshold === threshold;
            });
            if (!alreadyReached && progress.percentage >= threshold) {
                newMilestones.push({
                    threshold: threshold,
                    reachedAt: new Date().toISOString(),
                });
            }
        }

        if (newMilestones.length > 0) {
            var updatedMilestones = currentMilestones.concat(newMilestones);
            var updated = Object.assign({}, goal, { milestones: updatedMilestones });

            // Auto-complete at 100%
            if (progress.percentage >= 100 && goal.status === GoalStatus.ACTIVE) {
                updated.status = GoalStatus.COMPLETED;
                updated.completedAt = new Date().toISOString();
            }

            await DB().saveGoal(updated);
            State().updateGoal(updated);
        }
    }

    // =====================================================================
    // Export
    // =====================================================================

    global.FCL = global.FCL || {};
    global.FCL.GoalService = {
        GoalStatus: GoalStatus,
        loadAll: loadAll,
        getAllGoals: getAllGoals,
        getGoalById: getGoalById,
        getActiveGoals: getActiveGoals,
        getContributionsForGoal: getContributionsForGoal,
        getGoalProgress: getGoalProgress,
        getAllGoalsSummary: getAllGoalsSummary,
        createGoal: createGoal,
        updateGoal: updateGoal,
        deleteGoal: deleteGoal,
        addContribution: addContribution,
        removeContribution: removeContribution,
    };

})(window);
