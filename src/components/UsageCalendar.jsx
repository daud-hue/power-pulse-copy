import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';

export default function UsageCalendar({ logs, dailyKwh }) {
  const [monthOffset, setMonthOffset] = useState(0);

  const { label, days, maxUsage } = useMemo(() => {
    const base = new Date();
    base.setMonth(base.getMonth() + monthOffset);
    const year = base.getFullYear();
    const month = base.getMonth();

    const logByDate = {};
    (logs || []).forEach(l => { logByDate[l.log_date] = l; });

    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startWeekday = firstDay.getDay();

    const cells = [];
    for (let i = 0; i < startWeekday; i++) cells.push(null);
    let max = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const log = logByDate[dateStr];
      const usage = log?.kwh_used || 0;
      if (usage > max) max = usage;
      cells.push({ day: d, dateStr, usage, hasLog: !!log });
    }

    return {
      label: base.toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' }),
      days: cells,
      maxUsage: max,
    };
  }, [logs, monthOffset]);

  const getColor = (usage, hasLog) => {
    if (!hasLog) return 'bg-white/[0.03] border-white/5 text-white/20';
    const avg = dailyKwh || 10;
    const ratio = usage / avg;
    if (ratio >= 1.3) return 'bg-red-alert/20 border-red-alert/40 text-red-alert';
    if (ratio >= 1.0) return 'bg-amber/20 border-amber/40 text-amber';
    if (ratio >= 0.5) return 'bg-lime/15 border-lime/30 text-lime';
    return 'bg-lime/25 border-lime/50 text-lime';
  };

  const weekdays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div className="card-dark p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-lime" />
          <span className="font-display text-white/60 text-xs tracking-widest">USAGE CALENDAR</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMonthOffset(m => m - 1)}
            className="w-7 h-7 flex items-center justify-center bg-white/5 border border-white/10 rounded-lg hover:border-lime/40 transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5 text-white/50" />
          </button>
          <span className="font-display text-white text-xs tracking-widest w-28 text-center">{label}</span>
          <button
            onClick={() => setMonthOffset(m => Math.min(0, m + 1))}
            disabled={monthOffset >= 0}
            className="w-7 h-7 flex items-center justify-center bg-white/5 border border-white/10 rounded-lg hover:border-lime/40 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-3.5 h-3.5 text-white/50" />
          </button>
        </div>
      </div>

      {/* Weekday header */}
      <div className="grid grid-cols-7 gap-1.5">
        {weekdays.map((w, i) => (
          <div key={i} className="text-center text-white/25 text-xs font-body">{w}</div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1.5">
        {days.map((cell, i) => (
          cell ? (
            <div
              key={i}
              title={cell.hasLog ? `${cell.usage.toFixed(1)} kWh` : 'No log'}
              className={`aspect-square rounded-lg border flex flex-col items-center justify-center transition-colors ${getColor(cell.usage, cell.hasLog)}`}
            >
              <span className="font-display text-xs">{cell.day}</span>
              {cell.hasLog && (
                <span className="text-[9px] font-body opacity-80">{cell.usage.toFixed(1)}</span>
              )}
            </div>
          ) : (
            <div key={i} />
          )
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-3 pt-1 flex-wrap">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-lime/50 border border-lime/60" />
          <span className="text-white/30 text-xs font-body">Low</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-lime/15 border border-lime/30" />
          <span className="text-white/30 text-xs font-body">Normal</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-amber/20 border border-amber/40" />
          <span className="text-white/30 text-xs font-body">High</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-alert/20 border border-red-alert/40" />
          <span className="text-white/30 text-xs font-body">Very High</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-white/[0.03] border border-white/5" />
          <span className="text-white/30 text-xs font-body">No Log</span>
        </div>
      </div>
    </div>
  );
}