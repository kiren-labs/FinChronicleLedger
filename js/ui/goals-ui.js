/**
 * FinChronicleLedger — UI: Goals
 * Goals tab — progress display, create/edit goals, add contributions.
 */
(function (global) {
    'use strict';

    var State = function () { return global.FCL.State; };
    var GoalService = function () { return global.FCL.GoalService; };
    var AccountService = function () { return global.FCL.AccountService; };
    var R = function () { return global.FCL.UI.Renderer; };

    // =====================================================================
    // Render
    // =====================================================================

    function render() {
        var container = document.getElementById('goals-container');
        if (!container) return;

        var goalsSummary = GoalService().getAllGoalsSummary();

        if (goalsSummary.length === 0) {
            container.innerHTML = '<div class="goals-empty">'
                + '<i class="ri-flag-line goals-empty-icon"></i>'
                + '<h3>No Financial Goals Yet</h3>'
                + '<p class="text-muted">Set savings targets and track your progress toward them.</p>'
                + '<button class="btn btn--primary" id="create-goal-btn"><i class="ri-add-line"></i> Create Your First Goal</button>'
                + '</div>';
            _bindCreateGoalBtn();
            return;
        }

        var activeGoals = goalsSummary.filter(function (g) { return g.status === 'active'; });
        var pausedGoals = goalsSummary.filter(function (g) { return g.status === 'paused'; });
        var completedGoals = goalsSummary.filter(function (g) { return g.status === 'completed'; });

        var html = '<div class="goals-header">'
            + '<h2>Financial Goals</h2>'
            + '<button class="btn btn--primary btn--small" id="create-goal-btn"><i class="ri-add-line"></i> New Goal</button>'
            + '</div>';

        if (activeGoals.length > 0) {
            html += '<div class="goals-section">'
                + '<h3 class="goals-section-title">Active</h3>'
                + activeGoals.map(_renderGoalCard).join('')
                + '</div>';
        }

        if (pausedGoals.length > 0) {
            html += '<div class="goals-section">'
                + '<h3 class="goals-section-title">Paused</h3>'
                + pausedGoals.map(_renderGoalCard).join('')
                + '</div>';
        }

        if (completedGoals.length > 0) {
            html += '<div class="goals-section">'
                + '<h3 class="goals-section-title">Completed</h3>'
                + completedGoals.map(_renderGoalCard).join('')
                + '</div>';
        }

        container.innerHTML = html;
        _applyProgressBarWidths(container);
        _bindEvents();
        _bindCreateGoalBtn();
    }

    function _renderGoalCard(goalData) {
        var p = goalData.progress;
        if (!p) return '';

        var statusCls = goalData.status === 'completed' ? 'goal-card--completed'
            : goalData.status === 'paused' ? 'goal-card--paused' : '';

        var pctClass = p.percentage >= 100 ? 'goal-pct--complete'
            : p.percentage >= 75 ? 'goal-pct--near' : '';

        var targetDateHTML = '';
        if (goalData.targetDate) {
            targetDateHTML = '<span class="goal-target-date"><i class="ri-calendar-line"></i> ' + R().formatDate(goalData.targetDate) + '</span>';
        }

        var linkedAcct = goalData.linkedAccountId ? AccountService().getAccountById(goalData.linkedAccountId) : null;
        var linkedHTML = linkedAcct ? '<span class="goal-linked-acct"><i class="ri-bank-line"></i> ' + R().escapeHTML(linkedAcct.name) + '</span>' : '';

        var milestonesHTML = '';
        if (p.reachedMilestones.length > 0) {
            milestonesHTML = '<div class="goal-milestones">'
                + p.reachedMilestones.map(function (m) {
                    return '<span class="goal-milestone-badge">' + m.threshold + '%</span>';
                }).join('')
                + '</div>';
        }

        var paceHTML = '';
        if (goalData.status === 'active' && !p.isComplete) {
            paceHTML = '<div class="goal-pace">';
            if (p.monthlyNeeded > 0) {
                paceHTML += '<span>Need: ' + R().formatCurrency(p.monthlyNeeded) + '/mo</span>';
            }
            if (p.currentPace > 0) {
                paceHTML += '<span>Pace: ' + R().formatCurrency(p.currentPace) + '/mo</span>';
            }
            paceHTML += '</div>';
        }

        return '<div class="goal-card ' + statusCls + '" data-goal-id="' + R().escapeHTML(goalData.id) + '">'
            + '<div class="goal-card-header">'
            + '<h4 class="goal-card-name">' + R().escapeHTML(goalData.name) + '</h4>'
            + '<div class="goal-card-meta">'
            + targetDateHTML
            + linkedHTML
            + '</div>'
            + '</div>'
            + '<div class="goal-progress">'
            + '<div class="goal-amounts">'
            + '<span class="goal-current">' + R().formatCurrency(p.currentAmount) + '</span>'
            + '<span class="goal-target">of ' + R().formatCurrency(p.targetAmount) + '</span>'
            + '</div>'
            + '<div class="goal-bar"><div class="goal-bar-fill ' + pctClass + '" data-pct="' + Math.min(p.percentage, 100) + '"></div></div>'
            + '<span class="goal-pct">' + p.percentage + '%</span>'
            + '</div>'
            + paceHTML
            + milestonesHTML
            + '<div class="goal-card-actions">'
            + (goalData.status === 'active' ? '<button class="btn btn--primary btn--small goal-contribute-btn" data-goal-id="' + R().escapeHTML(goalData.id) + '"><i class="ri-add-line"></i> Contribute</button>' : '')
            + '<button class="btn btn--ghost btn--small goal-edit-btn" data-goal-id="' + R().escapeHTML(goalData.id) + '" title="Edit"><i class="ri-pencil-line"></i></button>'
            + (goalData.status === 'active' ? '<button class="btn btn--ghost btn--small goal-pause-btn" data-goal-id="' + R().escapeHTML(goalData.id) + '" title="Pause"><i class="ri-pause-line"></i></button>' : '')
            + (goalData.status === 'paused' ? '<button class="btn btn--ghost btn--small goal-resume-btn" data-goal-id="' + R().escapeHTML(goalData.id) + '" title="Resume"><i class="ri-play-line"></i></button>' : '')
            + '<button class="btn btn--ghost btn--small btn--danger goal-delete-btn" data-goal-id="' + R().escapeHTML(goalData.id) + '" title="Delete"><i class="ri-delete-bin-line"></i></button>'
            + '</div>'
            + '</div>';
    }

    function _applyProgressBarWidths(root) {
        root.querySelectorAll('.goal-bar-fill[data-pct]').forEach(function (el) {
            el.style.width = el.dataset.pct + '%';
        });
    }

    // =====================================================================
    // Events
    // =====================================================================

    function _bindCreateGoalBtn() {
        var btn = document.getElementById('create-goal-btn');
        if (btn) {
            btn.addEventListener('click', function () { _showGoalForm(); });
        }
    }

    function _bindEvents() {
        document.querySelectorAll('.goal-contribute-btn').forEach(function (btn) {
            btn.addEventListener('click', function () { _showContributeForm(btn.dataset.goalId); });
        });

        document.querySelectorAll('.goal-edit-btn').forEach(function (btn) {
            btn.addEventListener('click', function () { _showGoalForm(btn.dataset.goalId); });
        });

        document.querySelectorAll('.goal-pause-btn').forEach(function (btn) {
            btn.addEventListener('click', async function () {
                await GoalService().updateGoal(btn.dataset.goalId, { status: 'paused' });
                R().showToast('Goal paused', 'info');
                render();
            });
        });

        document.querySelectorAll('.goal-resume-btn').forEach(function (btn) {
            btn.addEventListener('click', async function () {
                await GoalService().updateGoal(btn.dataset.goalId, { status: 'active' });
                R().showToast('Goal resumed', 'success');
                render();
            });
        });

        document.querySelectorAll('.goal-delete-btn').forEach(function (btn) {
            btn.addEventListener('click', async function () {
                var goal = GoalService().getGoalById(btn.dataset.goalId);
                if (!goal) return;
                if (confirm('Delete goal "' + goal.name + '" and all its contributions?')) {
                    await GoalService().deleteGoal(goal.id);
                    R().showToast('Goal deleted', 'info');
                    render();
                }
            });
        });

        // Click on goal card to show contributions
        document.querySelectorAll('.goal-card').forEach(function (card) {
            card.addEventListener('click', function (e) {
                // Don't trigger if clicking on a button
                if (e.target.closest('button')) return;
                _showContributions(card.dataset.goalId);
            });
        });
    }

    // =====================================================================
    // Goal Form Modal
    // =====================================================================

    function _showGoalForm(editGoalId) {
        var mount = document.getElementById('modalMount');
        if (!mount) return;

        var existing = editGoalId ? GoalService().getGoalById(editGoalId) : null;
        var assetAccounts = AccountService().getActiveAccountsByType('asset');

        var acctOptions = '<option value="">None</option>' + assetAccounts.map(function (a) {
            var sel = existing && existing.linkedAccountId === a.id ? ' selected' : '';
            return '<option value="' + R().escapeHTML(a.id) + '"' + sel + '>' + R().escapeHTML(a.name) + '</option>';
        }).join('');

        mount.innerHTML = '<div class="modal-overlay" id="goal-modal-overlay">'
            + '<div class="modal">'
            + '<h3>' + (existing ? 'Edit Goal' : 'Create Financial Goal') + '</h3>'
            + '<form id="goal-form">'
            + '<div class="form-group">'
            + '<label for="goal-name">Goal Name</label>'
            + '<input type="text" id="goal-name" required minlength="1" maxlength="100" placeholder="e.g. Emergency Fund" value="' + (existing ? R().escapeHTML(existing.name) : '') + '">'
            + '</div>'
            + '<div class="form-group">'
            + '<label for="goal-amount">Target Amount</label>'
            + '<input type="number" id="goal-amount" step="0.01" min="0.01" required placeholder="0.00" inputmode="decimal" value="' + (existing ? existing.targetAmount : '') + '">'
            + '</div>'
            + '<div class="form-group">'
            + '<label for="goal-date">Target Date (optional)</label>'
            + '<input type="date" id="goal-date" value="' + (existing && existing.targetDate ? existing.targetDate : '') + '">'
            + '</div>'
            + '<div class="form-group">'
            + '<label for="goal-account">Linked Account (optional)</label>'
            + '<select id="goal-account">' + acctOptions + '</select>'
            + '</div>'
            + '<button type="submit" class="btn btn--primary btn--full">' + (existing ? 'Save Changes' : 'Create Goal') + '</button>'
            + '<button type="button" class="btn btn--secondary btn--full" id="goal-form-cancel">Cancel</button>'
            + '</form>'
            + '</div>'
            + '</div>';

        document.getElementById('goal-form-cancel').addEventListener('click', function () { mount.innerHTML = ''; });
        document.getElementById('goal-modal-overlay').addEventListener('click', function (e) {
            if (e.target.id === 'goal-modal-overlay') mount.innerHTML = '';
        });

        document.getElementById('goal-form').addEventListener('submit', async function (e) {
            e.preventDefault();
            var name = document.getElementById('goal-name').value;
            var targetAmount = parseFloat(document.getElementById('goal-amount').value);
            var targetDate = document.getElementById('goal-date').value || null;
            var linkedAccountId = document.getElementById('goal-account').value || null;
            var result;

            if (existing) {
                result = await GoalService().updateGoal(existing.id, {
                    name: name,
                    targetAmount: targetAmount,
                    targetDate: targetDate,
                    linkedAccountId: linkedAccountId,
                });
            } else {
                result = await GoalService().createGoal({
                    name: name,
                    targetAmount: targetAmount,
                    targetDate: targetDate,
                    linkedAccountId: linkedAccountId,
                });
            }

            if (result.success) {
                R().showToast(existing ? 'Goal updated' : 'Goal created!', 'success');
                mount.innerHTML = '';
                render();
            } else {
                R().showToast(result.errors[0] || 'Error', 'error');
            }
        });
    }

    // =====================================================================
    // Contribute Modal
    // =====================================================================

    function _showContributeForm(goalId) {
        var mount = document.getElementById('modalMount');
        if (!mount) return;

        var goal = GoalService().getGoalById(goalId);
        if (!goal) return;
        var progress = GoalService().getGoalProgress(goalId);
        var today = new Date().toISOString().slice(0, 10);

        mount.innerHTML = '<div class="modal-overlay" id="contribute-modal-overlay">'
            + '<div class="modal">'
            + '<h3>Add Contribution — ' + R().escapeHTML(goal.name) + '</h3>'
            + (progress ? '<p class="text-muted">' + R().formatCurrency(progress.currentAmount) + ' of ' + R().formatCurrency(progress.targetAmount) + ' (' + progress.percentage + '%)</p>' : '')
            + '<form id="contribute-form">'
            + '<div class="form-group">'
            + '<label for="contrib-amount">Amount</label>'
            + '<input type="number" id="contrib-amount" step="0.01" min="0.01" required placeholder="0.00" inputmode="decimal">'
            + '</div>'
            + '<div class="form-group">'
            + '<label for="contrib-date">Date</label>'
            + '<input type="date" id="contrib-date" value="' + today + '" required>'
            + '</div>'
            + '<div class="form-group">'
            + '<label for="contrib-notes">Notes (optional)</label>'
            + '<input type="text" id="contrib-notes" maxlength="500" placeholder="e.g. Monthly savings">'
            + '</div>'
            + '<button type="submit" class="btn btn--primary btn--full">Add Contribution</button>'
            + '<button type="button" class="btn btn--secondary btn--full" id="contrib-cancel">Cancel</button>'
            + '</form>'
            + '</div>'
            + '</div>';

        document.getElementById('contrib-cancel').addEventListener('click', function () { mount.innerHTML = ''; });
        document.getElementById('contribute-modal-overlay').addEventListener('click', function (e) {
            if (e.target.id === 'contribute-modal-overlay') mount.innerHTML = '';
        });

        document.getElementById('contribute-form').addEventListener('submit', async function (e) {
            e.preventDefault();
            var amount = parseFloat(document.getElementById('contrib-amount').value);
            var date = document.getElementById('contrib-date').value;
            var notes = document.getElementById('contrib-notes').value;

            var result = await GoalService().addContribution(goalId, {
                amount: amount,
                date: date,
                notes: notes,
            });

            if (result.success) {
                // Check for new milestones
                var updatedProgress = GoalService().getGoalProgress(goalId);
                if (updatedProgress && updatedProgress.isComplete) {
                    R().showToast('Goal completed! Congratulations!', 'success');
                } else {
                    R().showToast('Contribution added!', 'success');
                }
                mount.innerHTML = '';
                render();
            } else {
                R().showToast(result.errors[0] || 'Error', 'error');
            }
        });
    }

    // =====================================================================
    // Contributions Detail Modal
    // =====================================================================

    function _showContributions(goalId) {
        var mount = document.getElementById('modalMount');
        if (!mount) return;

        var goal = GoalService().getGoalById(goalId);
        if (!goal) return;
        var contributions = GoalService().getContributionsForGoal(goalId);
        var progress = GoalService().getGoalProgress(goalId);

        var contribHTML = '';
        if (contributions.length === 0) {
            contribHTML = '<p class="text-muted">No contributions yet.</p>';
        } else {
            var sorted = contributions.slice().sort(function (a, b) {
                return b.date < a.date ? -1 : b.date > a.date ? 1 : 0;
            });
            contribHTML = '<div class="contrib-list">' + sorted.map(function (c) {
                return '<div class="contrib-row">'
                    + '<span class="contrib-date">' + R().formatDate(c.date) + '</span>'
                    + '<span class="contrib-amount">+' + R().formatCurrency(c.amount) + '</span>'
                    + (c.notes ? '<span class="contrib-notes text-muted">' + R().escapeHTML(c.notes) + '</span>' : '')
                    + '<button class="btn btn--ghost btn--small btn--danger contrib-delete-btn" data-contrib-id="' + R().escapeHTML(c.id) + '" title="Remove"><i class="ri-close-line"></i></button>'
                    + '</div>';
            }).join('') + '</div>';
        }

        mount.innerHTML = '<div class="modal-overlay" id="contrib-list-overlay">'
            + '<div class="modal">'
            + '<h3>' + R().escapeHTML(goal.name) + ' — Contributions</h3>'
            + (progress ? '<p>' + R().formatCurrency(progress.currentAmount) + ' of ' + R().formatCurrency(progress.targetAmount) + ' (' + progress.percentage + '%) — ' + contributions.length + ' contribution' + (contributions.length !== 1 ? 's' : '') + '</p>' : '')
            + contribHTML
            + '<button class="btn btn--ghost btn--full" id="contrib-list-close">Close</button>'
            + '</div>'
            + '</div>';

        document.getElementById('contrib-list-close').addEventListener('click', function () {
            mount.innerHTML = '';
        });
        document.getElementById('contrib-list-overlay').addEventListener('click', function (e) {
            if (e.target.id === 'contrib-list-overlay') mount.innerHTML = '';
        });

        document.querySelectorAll('.contrib-delete-btn').forEach(function (btn) {
            btn.addEventListener('click', async function () {
                await GoalService().removeContribution(btn.dataset.contribId);
                R().showToast('Contribution removed', 'info');
                _showContributions(goalId); // re-render
                render(); // update the main tab too
            });
        });
    }

    // =====================================================================
    // Export
    // =====================================================================
    global.FCL = global.FCL || {};
    global.FCL.UI = global.FCL.UI || {};
    global.FCL.UI.GoalsUI = { render: render };

})(window);
