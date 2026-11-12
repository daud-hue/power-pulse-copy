import { useState, useMemo } from 'react';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp, BarChart3, PieChart as PieChartIcon } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="card-dark border border-lime/20 rounded-lg px-3 py-2 text-xs font-body">
      <p className="text-white/50 mb-1">{label}</p>
      <p className="text-lime font-display">R{payload[0]?.value?.toFixed(2)}</p>
      {payload[1] && <p className="text-white/40">Avg: R{payload[1]?.value?.toFixed(2)}</p>}
    </div>
  );
};

export default function MonthlySpendChart({ transactions, balance, settings }) {
  const [chartType, setChartType] = useState('area');
  const { chartData, projectedMonthly, avgMonthly } = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return { chartData: [], projectedMonthly: 0, avgMonthly: 0 };
    }

    // Group transactions by month
    const byMonth = {};
    transactions.forEach(tx => {
      const d = new Date(tx.created_date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-ZA', { month: 'short', year: '2-digit' });
      if (!byMonth[key]) byMonth[key] = { key, label, totalZar: 0, totalKwh: 0, count: 0 };
      byMonth[key].totalZar += tx.amount_paid_zar || 0;
      byMonth[key].totalKwh += tx.kwh_added || 0;
      byMonth[key].count += 1;
    });

    const sorted = Object.values(byMonth).sort((a, b) => a.key.localeCompare(b.key));

    // Calculate average monthly spend
    const avg = sorted.length > 0
      ? sorted.reduce((s, m) => s + m.totalZar, 0) / sorted.length
      : 0;

    // Project current month: extrapolate based on daily rate from balance
    const dailyKwh = balance?.estimated_daily_kwh || settings?.daily_kwh_estimate || 10;
    const recentTx = transactions.filter(tx => tx.amount_paid_zar > 0 && tx.kwh_added > 0);
    const avgCostPerKwh = recentTx.length > 0
      ? recentTx.reduce((s, tx) => s + tx.amount_paid_zar / tx.kwh_added, 0) / recentTx.length
      : 2.5; // fallback ZAR/kWh

    const projectedMonthlyKwh = dailyKwh * 30;
    const projected = projectedMonthlyKwh * avgCostPerKwh;

    // Add projection for current/next month if not present
    const now = new Date();
    const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const currentLabel = now.toLocaleDateString('en-ZA', { month: 'short', year: '2-digit' });

    const existing = sorted.find(m => m.key === currentKey);
    const data = sorted.map(m => ({
      label: m.label,
      spend: parseFloat(m.totalZar.toFixed(2)),
      avg: parseFloat(avg.toFixed(2)),
    }));

    if (!existing) {
      data.push({ label: currentLabel, spend: parseFloat(projected.toFixed(2)), avg: parseFloat(avg.toFixed(2)), projected: true });
    }

    return { chartData: data.slice(-7), projectedMonthly: projected, avgMonthly: avg };
  }, [transactions, balance, settings]);

  const dailyKwh = balance?.estimated_daily_kwh || settings?.daily_kwh_estimate || 10;
  const recentTx = transactions?.filter(tx => tx.amount_paid_zar > 0 && tx.kwh_added > 0) || [];
  const avgCostPerKwh = recentTx.length > 0
    ? recentTx.reduce((s, tx) => s + tx.amount_paid_zar / tx.kwh_added, 0) / recentTx.length
    : 2.5;

  return (
    <div className="card-dark p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-lime" />
          <span className="font-display text-white/60 text-xs tracking-widest">MONTHLY BUDGET FORECAST</span>
        </div>
        <div className="flex bg-white/5 rounded-lg p-0.5">
          <button
            onClick={() => setChartType('area')}
            className={`px-2 py-1 rounded text-xs transition-colors ${chartType === 'area' ? 'bg-lime text-black' : 'text-white/50 hover:text-white/80'}`}
            title="Area chart"
          >
            <TrendingUp className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setChartType('bar')}
            className={`px-2 py-1 rounded text-xs transition-colors ${chartType === 'bar' ? 'bg-lime text-black' : 'text-white/50 hover:text-white/80'}`}
            title="Bar chart"
          >
            <BarChart3 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setChartType('pie')}
            className={`px-2 py-1 rounded text-xs transition-colors ${chartType === 'pie' ? 'bg-lime text-black' : 'text-white/50 hover:text-white/80'}`}
            title="Pie chart"
          >
            <PieChartIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-black/30 rounded-lg p-3 border border-white/5">
          <p className="text-white/40 text-xs font-body">PROJECTED</p>
          <p className="font-display text-lime text-xl">R{projectedMonthly.toFixed(0)}</p>
          <p className="text-white/30 text-xs font-body">/month</p>
        </div>
        <div className="bg-black/30 rounded-lg p-3 border border-white/5">
          <p className="text-white/40 text-xs font-body">HISTORICAL AVG</p>
          <p className="font-display text-white text-xl">R{avgMonthly.toFixed(0)}</p>
          <p className="text-white/30 text-xs font-body">/month</p>
        </div>
        <div className="bg-black/30 rounded-lg p-3 border border-white/5">
          <p className="text-white/40 text-xs font-body">RATE</p>
          <p className="font-display text-amber text-xl">R{avgCostPerKwh.toFixed(2)}</p>
          <p className="text-white/30 text-xs font-body">/kWh</p>
        </div>
      </div>

      {/* Chart */}
      {chartData.length > 0 ? (
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'area' ? (
              <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#AAFF00" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#AAFF00" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
                <XAxis dataKey="label" tick={{ fill: '#555', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#555', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                {avgMonthly > 0 && (
                  <ReferenceLine y={avgMonthly} stroke="#F59E0B" strokeDasharray="4 4" strokeWidth={1} />
                )}
                <Area
                  type="monotone"
                  dataKey="spend"
                  stroke="#AAFF00"
                  strokeWidth={2}
                  fill="url(#spendGrad)"
                  dot={(props) => {
                    const { cx, cy, payload } = props;
                    return (
                      <circle
                        key={`dot-${cx}-${cy}`}
                        cx={cx} cy={cy} r={3}
                        fill={payload.projected ? '#F59E0B' : '#AAFF00'}
                        stroke="none"
                      />
                    );
                  }}
                />
              </AreaChart>
            ) : chartType === 'bar' ? (
              <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
                <XAxis dataKey="label" tick={{ fill: '#555', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#555', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                {avgMonthly > 0 && (
                  <ReferenceLine y={avgMonthly} stroke="#F59E0B" strokeDasharray="4 4" strokeWidth={1} />
                )}
                <Bar dataKey="spend" radius={[4, 4, 0, 0]} maxBarSize={28}>
                  {chartData.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={entry.projected ? '#F59E0B' : '#AAFF00'} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            ) : (
              <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <Pie
                  data={chartData}
                  dataKey="spend"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  outerRadius={65}
                  innerRadius={35}
                  paddingAngle={2}
                  label={({ label, spend }) => `${label}`}
                  labelLine={{ stroke: '#555', strokeWidth: 0.5 }}
                >
                  {chartData.map((entry, idx) => (
                    <Cell
                      key={`cell-${idx}`}
                      fill={entry.projected ? '#F59E0B' : idx % 2 === 0 ? '#AAFF00' : '#7ACC00'}
                      fillOpacity={0.85}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            )}
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-32 flex items-center justify-center text-white/20 text-sm font-body">
          No reload history yet — data will appear after your first reload.
        </div>
      )}

      <p className="text-white/25 text-xs font-body">
        Projection based on {dailyKwh.toFixed(1)} kWh/day at R{avgCostPerKwh.toFixed(2)}/kWh. Amber dot = projected.
      </p>
    </div>
  );
}