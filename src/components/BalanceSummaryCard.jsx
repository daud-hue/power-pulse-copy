import { addDays, format, differenceInDays } from 'date-fns';
import { CalendarClock, TrendingDown, Zap, ClipboardList } from 'lucide-react';

export default function BalanceSummaryCard({ balance, logs, dailyKwh, onLogReading }) {
  const currentKwh = balance?.current_kwh || 0;

  // Compute avg daily usage from last 7 real logs
  const recentLogs = [...logs]
    .filter(l => l.kwh_used > 0)
    .sort((a, b) => b.log_date.localeCompare(a.log_date))
    .slice(0, 7);

  const avgFromLogs =
    recentLogs.length >= 2
      ? recentLogs.reduce((s, l) => s + l.kwh_used, 0) / recentLogs.length
      : null;

  const effectiveDailyKwh = avgFromLogs || dailyKwh || 10;
  const daysLeft = effectiveDailyKwh > 0 ? currentKwh / effectiveDailyKwh : 0;
  const runOutDate = addDays(new Date(), daysLeft);
  const daysLeftInt = Math.floor(daysLeft);

  const urgency =
    daysLeft < 3 ? 'red' : daysLeft < 7 ? 'amber' : 'lime';

  const colors = {
    red: { text: 'text-red-alert', border: 'border-red-alert/30', bg: 'bg-red-alert/5', glow: 'red-glow' },
    amber: { text: 'text-amber', border: 'border-amber/30', bg: 'bg-amber/5', glow: 'amber-glow' },
    lime: { text: 'text-lime', border: 'border-lime/30', bg: 'bg-lime/5', glow: 'ring-glow' },
  }[urgency];

  const label =
    daysLeft < 1
      ? 'RUNNING OUT TODAY'
      : daysLeft < 3
      ? 'CRITICALLY LOW'
      : daysLeft < 7
      ? 'RUNNING LOW'
      : 'POWER FORECAST';

  return (
    <div className={`card-dark border ${colors.border} ${colors.bg} p-5 space-y-4`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarClock className={`w-4 h-4 ${colors.text}`} />
          <span className={`font-display text-xs tracking-widest ${colors.text}`}>{label}</span>
        </div>
        {avgFromLogs && (
          <span className="text-white/30 text-xs font-body">
            Based on {recentLogs.length} day{recentLogs.length !== 1 ? 's' : ''} of data
          </span>
        )}
      </div>

      {/* Main forecast */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-white/40 text-xs font-body mb-1">ESTIMATED RUN-OUT</p>
          <p className={`font-display text-3xl leading-none ${colors.text}`}>
            {format(runOutDate, 'dd MMM')}
          </p>
          <p className="text-white/30 text-sm font-body mt-0.5">
            {format(runOutDate, 'EEEE')} · {daysLeftInt === 0 ? 'less than 1 day' : `${daysLeftInt} day${daysLeftInt !== 1 ? 's' : ''} left`}
          </p>
        </div>

        {/* Stats */}
        <div className="flex flex-col gap-2 text-right">
          <div>
            <p className="text-white/30 text-xs font-body">REMAINING</p>
            <p className="font-display text-white">{currentKwh.toFixed(1)} <span className="text-white/40 text-xs">kWh</span></p>
          </div>
          <div>
            <p className="text-white/30 text-xs font-body">AVG DAILY</p>
            <p className="font-display text-white">{effectiveDailyKwh.toFixed(1)} <span className="text-white/40 text-xs">kWh/day</span></p>
          </div>
        </div>
      </div>

      {/* Usage bar */}
      <div>
        <div className="flex justify-between text-xs font-body text-white/30 mb-1.5">
          <span>TODAY</span>
          <span>{format(runOutDate, 'dd MMM yyyy')}</span>
        </div>
        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700`}
            style={{
              width: `${Math.min(100, Math.max(2, (daysLeft / 30) * 100))}%`,
              background: urgency === 'lime' ? '#AAFF00' : urgency === 'amber' ? '#F59E0B' : '#EF4444',
            }}
          />
        </div>
      </div>

      {/* Log reading CTA */}
      <button
        onClick={onLogReading}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-lime/30 bg-lime/5 text-lime font-display text-sm hover:bg-lime/10 hover:border-lime/50 transition-all"
      >
        <ClipboardList className="w-4 h-4" />
        LOG METER READING NOW
      </button>
    </div>
  );
}