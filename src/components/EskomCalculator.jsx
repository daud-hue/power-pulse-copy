import { useState, useMemo } from 'react';
import { Calculator, Zap, Clock, TrendingUp } from 'lucide-react';

export default function EskomCalculator({ transactions, balance, settings, dailyKwh }) {
  const [randInput, setRandInput] = useState('');

  // Derive rate per kWh from transactions
  const ratePerKwh = useMemo(() => {
    const recent = (transactions || []).filter(t => t.amount_paid_zar > 0 && t.kwh_added > 0);
    if (recent.length === 0) return 2.85;
    return recent.reduce((s, t) => s + t.amount_paid_zar / t.kwh_added, 0) / recent.length;
  }, [transactions]);

  const dailyUsage = dailyKwh || balance?.estimated_daily_kwh || settings?.daily_kwh_estimate || 10;

  const amount = parseFloat(randInput) || 0;
  const kwh = amount > 0 && ratePerKwh > 0 ? amount / ratePerKwh : 0;
  const days = kwh > 0 && dailyUsage > 0 ? kwh / dailyUsage : 0;

  return (
    <div className="card-dark p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Calculator className="w-4 h-4 text-lime" />
        <span className="font-display text-white/60 text-xs tracking-widest">BUYING POWER CALCULATOR</span>
      </div>

      {/* Input */}
      <div>
        <label className="text-white/40 text-xs font-body block mb-1.5">ENTER AMOUNT (R)</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 font-display text-lg">R</span>
          <input
            type="number"
            value={randInput}
            onChange={e => setRandInput(e.target.value)}
            placeholder="e.g. 200"
            className="w-full bg-black/50 border border-card-border rounded-lg pl-8 pr-3 py-3 text-white text-lg font-display focus:outline-none focus:border-lime transition-colors"
          />
        </div>
      </div>

      {/* Results */}
      {amount > 0 ? (
        <div className="grid grid-cols-2 gap-3 animate-fade-in">
          <div className="bg-lime/10 border border-lime/20 rounded-xl p-4 text-center">
            <Zap className="w-5 h-5 text-lime mx-auto mb-2" />
            <p className="font-display text-lime text-3xl">{kwh.toFixed(1)}</p>
            <p className="text-white/40 text-xs font-body mt-1">kWh UNITS</p>
          </div>
          <div className="bg-amber/10 border border-amber/20 rounded-xl p-4 text-center">
            <Clock className="w-5 h-5 text-amber mx-auto mb-2" />
            <p className="font-display text-amber text-3xl">{days.toFixed(1)}</p>
            <p className="text-white/40 text-xs font-body mt-1">DAYS OF POWER</p>
          </div>
        </div>
      ) : (
        <div className="bg-black/30 border border-white/5 rounded-xl p-6 text-center">
          <Calculator className="w-8 h-8 text-white/20 mx-auto mb-2" />
          <p className="text-white/30 text-sm font-body">Enter an amount to see how much power you'd get</p>
        </div>
      )}

      {/* Rate info */}
      <div className="flex items-center justify-between text-xs font-body border-t border-white/5 pt-3">
        <span className="text-white/40 flex items-center gap-1.5">
          <TrendingUp className="w-3 h-3" />
          RATE: R{ratePerKwh.toFixed(2)}/kWh
        </span>
        <span className="text-white/40">USAGE: {dailyUsage.toFixed(1)} kWh/day</span>
      </div>

      {amount > 0 && days > 0 && (
        <p className="text-white/25 text-xs font-body text-center">
          R{amount.toFixed(0)} buys ~{kwh.toFixed(0)} kWh — enough for about {Math.floor(days)} days and {Math.floor((days % 1) * 24)} hours.
        </p>
      )}
    </div>
  );
}