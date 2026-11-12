import { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, RadialBarChart, RadialBar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Cpu, BarChart3, PieChart as PieIcon, Activity, TrendingUp } from 'lucide-react';
import { getIconComponent } from '@/components/DeviceIconPicker';

const DEVICE_COLORS = ['#AAFF00', '#7ACC00', '#F59E0B', '#3B82F6', '#8B5CF6', '#EF4444', '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16', '#06B6D4'];

const RATE = 2.85; // fallback ZAR/kWh

const CostTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="card-dark border border-lime/20 rounded-lg px-3 py-2 text-xs font-body">
      <p className="text-white/50 mb-0.5">{p.name}</p>
      <p className="text-lime font-display">R{p.monthlyCost.toFixed(2)}/mo</p>
      <p className="text-white/40">{p.monthlyKwh.toFixed(1)} kWh/mo</p>
      <p className="text-white/30">{p.dailyKwh.toFixed(2)} kWh/day</p>
    </div>
  );
};

export default function DeviceUsageBreakdown({ balance, settings, transactions }) {
  const [devices, setDevices] = useState([]);
  const [chartType, setChartType] = useState('bar');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Device.list('sort_order', 50).then(list => {
      setDevices(list);
      setLoading(false);
    });
  }, []);

  const ratePerKwh = useMemo(() => {
    const recent = (transactions || []).filter(t => t.amount_paid_zar > 0 && t.kwh_added > 0);
    if (recent.length === 0) return RATE;
    return recent.reduce((s, t) => s + t.amount_paid_zar / t.kwh_added, 0) / recent.length;
  }, [transactions]);

  const breakdown = useMemo(() => {
    return devices
      .map(d => {
        const dailyHours = d.daily_hours ?? 1;
        const dailyKwh = (d.kwh_per_hour || 0) * dailyHours;
        const monthlyKwh = dailyKwh * 30;
        const monthlyCost = monthlyKwh * ratePerKwh;
        const yearlyCost = monthlyCost * 12;
        return { ...d, dailyKwh, monthlyKwh, monthlyCost, yearlyCost, dailyHours };
      })
      .sort((a, b) => b.monthlyCost - a.monthlyCost);
  }, [devices, ratePerKwh]);

  const totalMonthlyCost = breakdown.reduce((s, d) => s + d.monthlyCost, 0);
  const totalMonthlyKwh = breakdown.reduce((s, d) => s + d.monthlyKwh, 0);
  const topDevice = breakdown[0];

  if (loading) {
    return (
      <div className="card-dark p-5 flex items-center justify-center h-48">
        <div className="w-6 h-6 border-2 border-lime/20 border-t-lime rounded-full animate-spin" />
      </div>
    );
  }

  if (breakdown.length === 0) {
    return (
      <div className="card-dark p-5 text-center">
        <Cpu className="w-10 h-10 text-lime/30 mx-auto mb-2" />
        <p className="font-display text-white/40 text-sm">NO DEVICES YET</p>
        <p className="text-white/25 text-xs font-body mt-1">Add devices to see your cost breakdown.</p>
      </div>
    );
  }

  return (
    <div className="card-dark p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-lime" />
          <h3 className="font-display text-white text-lg">DEVICE COST BREAKDOWN</h3>
        </div>
        <div className="flex bg-white/5 rounded-lg p-0.5">
          {[
            { id: 'bar', icon: BarChart3 },
            { id: 'pie', icon: PieIcon },
            { id: 'area', icon: Activity },
            { id: 'radial', icon: TrendingUp },
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

      {/* Summary KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-black/30 rounded-lg p-3 border border-white/5">
          <p className="text-white/40 text-xs font-body">EST. MONTHLY</p>
          <p className="font-display text-lime text-xl">R{totalMonthlyCost.toFixed(0)}</p>
        </div>
        <div className="bg-black/30 rounded-lg p-3 border border-white/5">
          <p className="text-white/40 text-xs font-body">MONTHLY kWh</p>
          <p className="font-display text-white text-xl">{totalMonthlyKwh.toFixed(0)}</p>
        </div>
        <div className="bg-black/30 rounded-lg p-3 border border-amber/20">
          <p className="text-white/40 text-xs font-body">BIGGEST COST</p>
          <p className="font-display text-amber text-sm truncate">{topDevice?.name || '—'}</p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'bar' ? (
            <BarChart data={breakdown} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#555', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `R${v}`} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#aaa', fontSize: 10 }} axisLine={false} tickLine={false} width={80} />
              <Tooltip content={<CostTooltip />} />
              <Bar dataKey="monthlyCost" radius={[0, 4, 4, 0]} maxBarSize={22}>
                {breakdown.map((entry, idx) => (
                  <Cell key={`cell-${idx}`} fill={DEVICE_COLORS[idx % DEVICE_COLORS.length]} fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          ) : chartType === 'pie' ? (
            <PieChart>
              <Pie data={breakdown} dataKey="monthlyCost" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={40} paddingAngle={2}>
                {breakdown.map((entry, idx) => (
                  <Cell key={`cell-${idx}`} fill={DEVICE_COLORS[idx % DEVICE_COLORS.length]} fillOpacity={0.85} />
                ))}
              </Pie>
              <Tooltip content={<CostTooltip />} />
            </PieChart>
          ) : chartType === 'area' ? (
            <AreaChart data={breakdown} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="devGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#AAFF00" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#AAFF00" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: '#555', fontSize: 9 }} axisLine={false} tickLine={false} angle={-20} textAnchor="end" height={50} />
              <YAxis tick={{ fill: '#555', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `R${v}`} />
              <Tooltip content={<CostTooltip />} />
              <Area type="monotone" dataKey="monthlyCost" stroke="#AAFF00" strokeWidth={2} fill="url(#devGrad)" />
            </AreaChart>
          ) : (
            <RadialBarChart innerRadius="20%" outerRadius="100%" data={breakdown} startAngle={90} endAngle={-270}>
              <RadialBar dataKey="monthlyCost" background={{ fill: '#1a1a1a' }}>
                {breakdown.map((entry, idx) => (
                  <Cell key={`cell-${idx}`} fill={DEVICE_COLORS[idx % DEVICE_COLORS.length]} fillOpacity={0.85} />
                ))}
              </RadialBar>
              <Tooltip content={<CostTooltip />} />
            </RadialBarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Device list with cost */}
      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
        {breakdown.map((d, idx) => {
          const Icon = getIconComponent(d.icon);
          const pct = totalMonthlyCost > 0 ? (d.monthlyCost / totalMonthlyCost * 100) : 0;
          return (
            <div key={d.id} className="flex items-center gap-3 bg-black/30 rounded-lg px-3 py-2 border border-white/5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${DEVICE_COLORS[idx % DEVICE_COLORS.length]}20` }}>
                <Icon className="w-3.5 h-3.5" style={{ color: DEVICE_COLORS[idx % DEVICE_COLORS.length] }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-display text-white text-xs truncate">{d.name}</p>
                  <p className="font-display text-lime text-xs">R{d.monthlyCost.toFixed(0)}/mo</p>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: DEVICE_COLORS[idx % DEVICE_COLORS.length] }} />
                  </div>
                  <span className="text-white/30 text-xs font-body w-8 text-right">{pct.toFixed(0)}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-white/25 text-xs font-body">
        Estimates use {ratePerKwh.toFixed(2)} ZAR/kWh × (kWh/hr × daily hours × 30 days). Adjust daily hours per device in the Devices tab.
      </p>
    </div>
  );
}