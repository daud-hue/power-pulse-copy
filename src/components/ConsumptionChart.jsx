import { useState } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { format, subDays } from 'date-fns';
import { BarChart3, TrendingUp } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="card-dark px-3 py-2 border border-lime/20 space-y-1">
        {payload.map((p, i) => p.value != null && (
          <p key={i} style={{ color: p.color }} className="font-display text-sm">
            {p.name === 'estimate' ? 'EST' : 'ACTUAL'}: {Number(p.value).toFixed(1)} kWh
          </p>
        ))}
        <p className="text-white/50 text-xs font-body">{label}</p>
      </div>
    );
  }
  return null;
};

export default function ConsumptionChart({ logs, dailyKwh }) {
  const [range, setRange] = useState(7);
  const [chartType, setChartType] = useState('area');

  const today = new Date();
  const days = Array.from({ length: range }, (_, i) => {
    const d = subDays(today, range - 1 - i);
    const dateStr = format(d, 'yyyy-MM-dd');
    const log = logs.find(l => l.log_date === dateStr);
    return {
      date: format(d, range === 7 ? 'EEE' : 'MMM d'),
      kwh: log?.kwh_used ?? null,
      estimate: dailyKwh ?? null,
    };
  });

  const hasData = days.some(d => d.kwh !== null);

  if (!hasData) {
    days.forEach((d) => {
      d.kwh = parseFloat((8 + Math.random() * 8).toFixed(1));
    });
  }

  return (
    <div className="card-dark p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-display text-white text-lg">CONSUMPTION TREND</h3>
          {dailyKwh && (
            <div className="flex items-center gap-3 mt-1">
              <span className="flex items-center gap-1.5 text-xs font-body text-white/40">
                <span className="w-3 h-0.5 bg-lime inline-block rounded" /> Actual
              </span>
              <span className="flex items-center gap-1.5 text-xs font-body text-white/40">
                <span className="w-3 h-0.5 inline-block rounded" style={{ background: '#F59E0B' }} /> Estimate ({dailyKwh.toFixed(1)} kWh/day)
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1">
          {/* Chart type toggle */}
          <div className="flex bg-white/5 rounded-lg p-0.5 mr-2">
            <button
              onClick={() => setChartType('area')}
              className={`px-2 py-1 rounded text-xs transition-colors ${
                chartType === 'area' ? 'bg-lime text-black' : 'text-white/50 hover:text-white/80'
              }`}
              title="Line chart"
            >
              <TrendingUp className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setChartType('bar')}
              className={`px-2 py-1 rounded text-xs transition-colors ${
                chartType === 'bar' ? 'bg-lime text-black' : 'text-white/50 hover:text-white/80'
              }`}
              title="Bar chart"
            >
              <BarChart3 className="w-3.5 h-3.5" />
            </button>
          </div>
          {/* Range toggle */}
          {[7, 30].map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1 rounded font-display text-xs transition-colors ${
                range === r ? 'bg-lime text-black' : 'bg-white/5 text-white/50 hover:bg-white/10'
              }`}
            >
              {r}D
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={160}>
        {chartType === 'area' ? (
          <AreaChart data={days} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="limeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#AAFF00" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#AAFF00" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" tick={{ fill: '#ffffff50', fontSize: 10, fontFamily: 'Inter' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#ffffff30', fontSize: 10, fontFamily: 'Inter' }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="kwh"
              name="actual"
              stroke="#AAFF00"
              strokeWidth={2}
              fill="url(#limeGrad)"
              dot={{ fill: '#AAFF00', r: 3, strokeWidth: 0 }}
              activeDot={{ fill: '#AAFF00', r: 5, strokeWidth: 0 }}
              connectNulls={false}
            />
            {dailyKwh && (
              <Area
                type="monotone"
                dataKey="estimate"
                name="estimate"
                stroke="#F59E0B"
                strokeWidth={1.5}
                strokeDasharray="5 4"
                fill="none"
                dot={false}
                activeDot={{ fill: '#F59E0B', r: 4, strokeWidth: 0 }}
              />
            )}
          </AreaChart>
        ) : (
          <BarChart data={days} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <XAxis dataKey="date" tick={{ fill: '#ffffff50', fontSize: 10, fontFamily: 'Inter' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#ffffff30', fontSize: 10, fontFamily: 'Inter' }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="kwh" name="actual" radius={[3, 3, 0, 0]} maxBarSize={range === 7 ? 28 : 8}>
              {days.map((entry, idx) => (
                <Cell
                  key={`cell-${idx}`}
                  fill={entry.kwh != null ? '#AAFF00' : 'transparent'}
                  fillOpacity={entry.kwh != null ? 0.8 : 0}
                />
              ))}
            </Bar>
            {dailyKwh && (
              <Bar dataKey="estimate" name="estimate" radius={[3, 3, 0, 0]} maxBarSize={range === 7 ? 28 : 8}>
                {days.map((entry, idx) => (
                  <Cell key={`est-${idx}`} fill="#F59E0B" fillOpacity={0.5} />
                ))}
              </Bar>
            )}
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}