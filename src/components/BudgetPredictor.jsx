import { useMemo } from 'react';
import { TrendingUp, TrendingDown, Calendar, Target } from 'lucide-react';

export default function BudgetPredictor({ transactions, settings, balance }) {
  const budget = settings?.monthly_budget_zar || 0;

  const { spentSoFar, projectedTotal, daysIn, daysTotal, onTrack, projectedOver, avgDailySpend, daysRemaining } = useMemo(() => {
    const now = new Date();
    const cy = now.getFullYear();
    const cm = now.getMonth();
    const daysTotal = new Date(cy, cm + 1, 0).getDate();
    const daysIn = now.getDate();
    const daysRemaining = daysTotal - daysIn;

    // This month's transactions
    const thisMonth = (transactions || []).filter(t => {
      const d = new Date(t.created_date);
      return d.getFullYear() === cy && d.getMonth() === cm;
    });
    const spentSoFar = thisMonth.reduce((s, t) => s + (t.amount_paid_zar || 0), 0);

    // Average daily spend this month from actual data
    const avgDailySpend = daysIn > 0 ? spentSoFar / daysIn : 0;

    // If we have daily consumption estimate, use it as alternative projection
    const dailyKwh = balance?.estimated_daily_kwh || settings?.daily_kwh_estimate || 10;
    const recentTx = (transactions || []).filter(t => t.amount_paid_zar > 0 && t.kwh_added > 0);
    const ratePerKwh = recentTx.length > 0
      ? recentTx.reduce((s, t) => s + t.amount_paid_zar / t.kwh_added, 0) / recentTx.length
      : 2.85;

    const projectedFromUsage = dailyKwh * daysTotal * ratePerKwh;
    const projectedFromSpend = spentSoFar + (avgDailySpend * daysRemaining);

    // Use whichever has more data: if spentSoFar exists, use spend-based; otherwise usage-based
    const projectedTotal = spentSoFar > 0 ? projectedFromSpend : projectedFromUsage;

    const onTrack = budget <= 0 || projectedTotal <= budget;
    const projectedOver = budget > 0 && projectedTotal > budget;

    return { spentSoFar, projectedTotal, daysIn, daysTotal, onTrack, projectedOver, avgDailySpend, daysRemaining };
  }, [transactions, settings, balance]);

  if (budget <= 0) return null;

  const overAmount = Math.max(0, projectedTotal - budget);
  const underAmount = Math.max(0, budget - projectedTotal);
  const monthProgress = (daysIn / daysTotal) * 100;
  const budgetUsedPercent = budget > 0 ? Math.min((spentSoFar / budget) * 100, 100) : 0;
  const projectedPercent = budget > 0 ? Math.min((projectedTotal / budget) * 100, 150) : 0;

  return (
    <div className="card-dark p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Target className="w-4 h-4 text-lime" />
        <span className="font-display text-white/60 text-xs tracking-widest">BUDGET PREDICTOR</span>
      </div>

      {/* Projected total vs budget */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-white/40 text-xs font-body">PROJECTED MONTH TOTAL</p>
          <p className="font-display text-2xl" style={{ color: projectedOver ? '#EF4444' : '#AAFF00' }}>
            R{projectedTotal.toFixed(0)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-white/40 text-xs font-body">BUDGET</p>
          <p className="font-display text-white text-xl">R{budget.toFixed(0)}</p>
        </div>
      </div>

      {/* Progress bars: spent vs projected vs budget */}
      <div className="space-y-2">
        {/* Budget line */}
        <div className="relative">
          <div className="flex justify-between text-xs font-body mb-1">
            <span className="text-white/40">MONTH PROGRESS</span>
            <span className="text-white/40">{daysIn}/{daysTotal} days</span>
          </div>
          <div className="relative h-2.5 w-full rounded-full bg-white/5 overflow-hidden">
            <div className="h-full bg-white/20 rounded-full" style={{ width: `${monthProgress}%` }} />
          </div>
        </div>

        {/* Budget usage */}
        <div className="relative">
          <div className="flex justify-between text-xs font-body mb-1">
            <span className="text-white/40">SPENT SO FAR</span>
            <span className="text-white/60">R{spentSoFar.toFixed(0)}</span>
          </div>
          <div className="relative h-3 w-full rounded-full bg-white/5 overflow-hidden border border-white/5">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${budgetUsedPercent}%`,
                background: '#F59E0B',
                boxShadow: '0 0 12px rgba(245,158,11,0.5)',
              }}
            />
          </div>
        </div>

        {/* Projected */}
        <div className="relative">
          <div className="flex justify-between text-xs font-body mb-1">
            <span className="text-white/40">PROJECTED TOTAL</span>
            <span style={{ color: projectedOver ? '#EF4444' : '#AAFF00' }}>R{projectedTotal.toFixed(0)}</span>
          </div>
          <div className="relative h-3 w-full rounded-full bg-white/5 overflow-hidden border border-white/5">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(projectedPercent, 100)}%`,
                background: projectedOver ? '#EF4444' : '#AAFF00',
                boxShadow: projectedOver ? '0 0 12px rgba(239,68,68,0.5)' : '0 0 12px rgba(170,255,0,0.5)',
              }}
            />
            {/* Budget marker */}
            <div className="absolute top-0 bottom-0 w-0.5 bg-white/60" style={{ left: '100%', transform: 'translateX(-1px)' }} />
          </div>
        </div>
      </div>

      {/* Status message */}
      <div
        className="flex items-start gap-2 rounded-lg p-3 text-xs font-body"
        style={{
          background: projectedOver ? 'rgba(239,68,68,0.08)' : 'rgba(170,255,0,0.08)',
          border: `1px solid ${projectedOver ? 'rgba(239,68,68,0.25)' : 'rgba(170,255,0,0.25)'}`,
        }}
      >
        {projectedOver ? (
          <TrendingUp className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-400" />
        ) : (
          <TrendingDown className="w-4 h-4 flex-shrink-0 mt-0.5 text-lime" />
        )}
        <div>
          {projectedOver ? (
            <p className="text-red-400">
              At your current rate, you're projected to spend <span className="font-display">R{overAmount.toFixed(0)}</span> over budget by month-end.
            </p>
          ) : (
            <p className="text-lime">
              You're on track! Projected to stay <span className="font-display">R{underAmount.toFixed(0)}</span> under budget.
            </p>
          )}
          <p className="text-white/30 mt-1">
            ~R{avgDailySpend.toFixed(2)}/day so far · {daysRemaining} days left this month
          </p>
        </div>
      </div>
    </div>
  );
}