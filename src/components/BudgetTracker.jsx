import { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Wallet, Pencil, Check, AlertTriangle, TrendingUp } from 'lucide-react';

export default function BudgetTracker({ settings, transactions, onSettingsChange }) {
  const [editing, setEditing] = useState(false);
  const [budgetInput, setBudgetInput] = useState('');
  const [saving, setSaving] = useState(false);

  const budget = settings?.monthly_budget_zar || 0;

  const spent = useMemo(() => {
    if (!transactions?.length) return 0;
    const now = new Date();
    const cy = now.getFullYear();
    const cm = now.getMonth();
    return transactions
      .filter((t) => {
        const d = new Date(t.created_date);
        return d.getFullYear() === cy && d.getMonth() === cm;
      })
      .reduce((s, t) => s + (t.amount_paid_zar || 0), 0);
  }, [transactions]);

  const percent = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
  const remaining = Math.max(0, budget - spent);
  const over = budget > 0 && spent > budget;

  // Color thresholds: <75% lime, 75-95% amber, >95% red
  const barColor = budget <= 0
    ? '#6B7280'
    : percent >= 95
      ? '#EF4444'
      : percent >= 75
        ? '#F59E0B'
        : '#AAFF00';

  const statusLabel = budget <= 0
    ? 'SET A BUDGET'
    : over
      ? 'OVER BUDGET'
      : percent >= 95
        ? 'ALMOST AT LIMIT'
        : percent >= 75
          ? 'APPROACHING LIMIT'
          : 'ON TRACK';

  const saveBudget = async () => {
    const val = parseFloat(budgetInput);
    if (isNaN(val) || val < 0) return;
    setSaving(true);
    await base44.entities.UserSettings.update(settings.id, { monthly_budget_zar: val });
    if (onSettingsChange) await onSettingsChange();
    setBudgetInput('');
    setEditing(false);
    setSaving(false);
  };

  return (
    <div className="card-dark p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wallet className="w-4 h-4 text-lime" />
          <span className="font-display text-white/60 text-xs tracking-widest">MONTHLY BUDGET</span>
        </div>
        <span
          className="font-display text-xs px-2 py-1 rounded-full border"
          style={{
            color: barColor,
            borderColor: `${barColor}40`,
            background: `${barColor}15`,
          }}
        >
          {statusLabel}
        </span>
      </div>

      {/* Spend vs budget */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-white/40 text-xs font-body">SPENT THIS MONTH</p>
          <p className="font-display text-white text-3xl">R{spent.toFixed(0)}</p>
        </div>
        <div className="text-right">
          <p className="text-white/40 text-xs font-body">{over ? 'OVER BY' : 'REMAINING'}</p>
          <p className="font-display text-2xl" style={{ color: barColor }}>
            R{over ? (spent - budget).toFixed(0) : (budget - spent).toFixed(0)}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative h-3 w-full rounded-full bg-white/5 overflow-hidden border border-white/5">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${percent}%`, background: barColor, boxShadow: `0 0 12px ${barColor}80` }}
        />
        {budget > 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[10px] font-display tracking-widest mix-blend-difference text-white">
              {percent.toFixed(0)}%
            </span>
          </div>
        )}
      </div>

      {budget > 0 && (
        <p className="text-white/30 text-xs font-body text-center">
          R{spent.toFixed(0)} of R{budget.toFixed(0)} budget
        </p>
      )}

      {/* Set / edit budget */}
      {editing ? (
        <div className="flex gap-2 animate-fade-in">
          <input
            type="number"
            value={budgetInput}
            onChange={(e) => setBudgetInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && saveBudget()}
            placeholder={budget > 0 ? budget.toString() : 'e.g. 1500'}
            className="flex-1 bg-black/50 border border-card-border rounded-lg px-3 py-2 text-white text-sm font-body focus:outline-none focus:border-lime transition-colors"
          />
          <button
            onClick={saveBudget}
            disabled={saving}
            className="bg-lime text-black font-display text-xs px-3 rounded-lg hover:bg-lime/90 transition-colors flex items-center gap-1 disabled:opacity-50"
          >
            {saving ? <Check className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} SAVE
          </button>
        </div>
      ) : (
        <button
          onClick={() => {
            setBudgetInput(budget > 0 ? budget.toString() : '');
            setEditing(true);
          }}
          className="w-full flex items-center justify-center gap-2 text-white/50 hover:text-lime text-xs font-display border border-white/10 rounded-lg py-2 hover:border-lime/30 transition-colors"
        >
          <Pencil className="w-3.5 h-3.5" /> {budget > 0 ? 'EDIT BUDGET LIMIT' : 'SET BUDGET LIMIT'}
        </button>
      )}

      {budget > 0 && percent >= 75 && (
        <div
          className="flex items-start gap-2 rounded-lg p-2.5 text-xs font-body"
          style={{ background: `${barColor}10`, border: `1px solid ${barColor}30` }}
        >
          {over ? (
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: barColor }} />
          ) : (
            <TrendingUp className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: barColor }} />
          )}
          <p style={{ color: barColor }}>
            {over
              ? `You've exceeded your monthly budget by R${(spent - budget).toFixed(0)}.`
              : `You've used ${percent.toFixed(0)}% of your budget. Watch your spending for the rest of the month.`}
          </p>
        </div>
      )}
    </div>
  );
}