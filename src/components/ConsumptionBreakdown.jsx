import { useState } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, BarChart3, PieChart as PieChartIcon, Activity } from 'lucide-react';

const DEVICE_COLORS = ['#AAFF00', '#7ACC00', '#F59E0B', '#3B82F6', '#8B5CF6', '#EF4444', '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16', '#06B6D4'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="card-dark border border-lime/20 rounded-lg px-3 py-2 text-xs font-body">
      <p className="text-white/50 mb-1">{label}</p>
      <p className="text-lime font-display">R{payload[0]?.value?.toFixed(2)}</p>
    </div>
  );
};

export default function ConsumptionBreakdown({ dailyKwh = 15 }) {
  const [chartType, setChartType] = useState('bar');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const now = new Date();
  const currentMonth = now.getMonth();

  const chartData = months.map((month, i) => {
    const isCurrentOrFuture = i >= currentMonth;
    const daysInMonth = new Date(now.getFullYear(), i + 1, 0).getDate();
    const seasonalFactor = 1 + Math.sin((i / 12) * Math.PI * 2 - 1.5) * 0.2;
    const baseSpend = dailyKwh * daysInMonth * 2.85 * seasonalFactor;
    const variation = isCurrentOrFuture ? 0 : (Math.random() * 0.15 - 0.05) * baseSpend;
    const spend = parseFloat((baseSpend + variation).toFixed(2));
    return {
      month,
      spend: isCurrentOrFuture && month !== months[currentMonth] ? null : spend,
      projected: i === currentMonth,
    };
  }).filter(d => d.spend != null);

  return (
    <div className="card-dark p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-lime" />
          <h3 className="font-display text-white text-lg">MONTHLY SPENT PER MONTH</h3>
        </div>
        <div className="flex bg-white/5 rounded-lg p-0.5">
          {[
            { id: 'bar', icon: BarChart3 },
            { id: 'area', icon: Activity },
            { id: 'line', icon: TrendingUp },
            { id: 'pie', icon: PieChartIcon },
          ].map(({ id, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setChartType(id)}
              className={`px-2 py-1 rounded transition-colors ${chartType === id ? 'bg-lime text-black' : 'text-white/50 hover:text-white/80'}`}
            >
              <Icon className="w-3.5 h-3.5" />
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        {chartType === 'bar' ? (
          <BarChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
            <XAxis dataKey="month" tick={{ fill: '#555', fontSize: 11, fontFamily: 'Inter' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#555', fontSize: 11, fontFamily: 'Inter' }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="spend" radius={[4, 4, 0, 0]} maxBarSize={32}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.spend == null ? 'transparent' : DEVICE_COLORS[index % DEVICE_COLORS.length]}
                  fillOpacity={entry.spend == null ? 0 : entry.projected ? 0.6 : 0.9}
                  stroke={entry.projected ? '#F59E0B' : 'none'}
                  strokeWidth={entry.projected ? 1.5 : 0}
                  strokeDasharray={entry.projected ? '4 3' : 'none'}
                />
              ))}
            </Bar>
          </BarChart>
        ) : chartType === 'area' ? (
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="monthlyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#AAFF00" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#AAFF00" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
            <XAxis dataKey="month" tick={{ fill: '#555', fontSize: 11, fontFamily: 'Inter' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#555', fontSize: 11, fontFamily: 'Inter' }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="spend" stroke="#AAFF00" strokeWidth={2} fill="url(#monthlyGrad)" />
          </AreaChart>
        ) : chartType === 'line' ? (
          <LineChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
            <XAxis dataKey="month" tick={{ fill: '#555', fontSize: 11, fontFamily: 'Inter' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#555', fontSize: 11, fontFamily: 'Inter' }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="spend" stroke="#AAFF00" strokeWidth={2} dot={{ fill: '#AAFF00', r: 3 }} />
          </LineChart>
        ) : (
          <PieChart>
            <Pie data={chartData} dataKey="spend" nameKey="month" cx="50%" cy="50%" outerRadius={80} innerRadius={40} paddingAngle={2}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={DEVICE_COLORS[index % DEVICE_COLORS.length]} fillOpacity={entry.projected ? 0.6 : 0.9} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        )}
      </ResponsiveContainer>

      <p className="text-white/25 text-xs font-body mt-3">
        Based on {dailyKwh.toFixed(1)} kWh/day estimate at ~R2.85/kWh. Dashed/projected = current month.
      </p>
    </div>
  );
}