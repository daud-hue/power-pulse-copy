import { useMemo } from 'react';
import { History, Zap } from 'lucide-react';

const MONTH_COLORS = [
  '#AAFF00', '#7ACC00', '#88CC00', '#99DD00', '#BBFF22',
  '#66BB00', '#AAEE00', '#55AA00', '#CCFF33', '#44AA00',
  '#80CC00', '#8BCC00',
];

export default function ReloadHistory({ transactions }) {
  const monthlyData = useMemo(() => {
    if (!transactions || transactions.length === 0) return [];

    const byMonth = {};
    transactions.forEach(tx => {
      const d = new Date(tx.created_date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-ZA', { month: 'short', year: '2-digit' });
      if (!byMonth[key]) {
        byMonth[key] = { key, label, totalKwh: 0, totalZar: 0, count: 0 };
      }
      byMonth[key].totalKwh += tx.kwh_added || 0;
      byMonth[key].totalZar += tx.amount_paid_zar || 0;
      byMonth[key].count += 1;
    });

    return Object.values(byMonth)
      .sort((a, b) => b.key.localeCompare(a.key))
      .slice(0, 12);
  }, [transactions]);

  if (monthlyData.length === 0) return null;

  const totalKwh = monthlyData.reduce((s, m) => s + m.totalKwh, 0);
  const totalZar = monthlyData.reduce((s, m) => s + m.totalZar, 0);

  return (
    <div className="card-dark p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-lime" />
          <h3 className="font-display text-white text-lg">RELOAD HISTORY</h3>
        </div>
        <span className="text-white/30 text-xs font-body">{monthlyData.length} months</span>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-black/40 rounded-lg p-3 border border-white/5">
          <p className="text-white/40 text-xs font-body">Total Purchased</p>
          <p className="font-display text-lime text-lg">{totalKwh.toFixed(0)} kWh</p>
        </div>
        <div className="bg-black/40 rounded-lg p-3 border border-white/5">
          <p className="text-white/40 text-xs font-body">Total Spent</p>
          <p className="font-display text-white text-lg">R{totalZar.toFixed(0)}</p>
        </div>
      </div>

      {/* Monthly list */}
      <div className="space-y-2">
        {monthlyData.map((month, i) => (
          <div key={month.key} className="flex items-center gap-3 py-3 border-b border-white/5 last:border-0">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border"
              style={{
                background: `${MONTH_COLORS[i % MONTH_COLORS.length]}15`,
                borderColor: `${MONTH_COLORS[i % MONTH_COLORS.length]}30`,
              }}
            >
              <Zap className="w-4 h-4" style={{ color: MONTH_COLORS[i % MONTH_COLORS.length] }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-display text-white text-sm">{month.label}</span>
                <span className="font-display text-lime text-sm">R{month.totalZar.toFixed(0)}</span>
              </div>
              <div className="flex items-center justify-between mt-0.5">
                <span className="text-white/30 text-xs font-body">
                  {month.totalKwh.toFixed(1)} kWh · {month.count} reload{month.count !== 1 ? 's' : ''}
                </span>
                <span className="text-white/30 text-xs font-body">
                  R{(month.totalZar / (month.totalKwh || 1)).toFixed(2)}/kWh
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}