import { format, addDays } from 'date-fns';
import { Zap, DollarSign, Calendar, TrendingDown } from 'lucide-react';

const RATE_PER_KWH = 2.85; // ZAR per kWh (average SA rate)

export default function StatCards({ balance, settings, transactions }) {
  const currentKwh = balance?.current_kwh || 0;
  const dailyKwh = balance?.estimated_daily_kwh || settings?.daily_kwh_estimate || 10;
  const daysRemaining = dailyKwh > 0 ? currentKwh / dailyKwh : 0;

  const runOutDate = addDays(new Date(), daysRemaining);
  const costPerDay = dailyKwh * RATE_PER_KWH;

  // Compute average reload cost per kWh from history
  let avgRate = RATE_PER_KWH;
  if (transactions && transactions.length > 0) {
    const validTx = transactions.filter(t => t.kwh_added > 0 && t.amount_paid_zar > 0);
    if (validTx.length > 0) {
      const totalKwh = validTx.reduce((s, t) => s + t.kwh_added, 0);
      const totalZar = validTx.reduce((s, t) => s + t.amount_paid_zar, 0);
      avgRate = totalZar / totalKwh;
    }
  }

  const estimatedCostPerDay = dailyKwh * avgRate;

  const cards = [
    {
      label: 'kWh REMAINING',
      value: currentKwh.toFixed(1),
      unit: 'kWh',
      icon: Zap,
      color: currentKwh < 20 ? '#EF4444' : currentKwh < 50 ? '#F59E0B' : '#AAFF00',
    },
    {
      label: 'DAILY COST',
      value: `R${estimatedCostPerDay.toFixed(0)}`,
      unit: '/day',
      icon: DollarSign,
      color: '#AAFF00',
    },
    {
      label: 'RUNS OUT ON',
      value: format(runOutDate, 'dd MMM'),
      unit: format(runOutDate, 'yyyy'),
      icon: Calendar,
      color: daysRemaining < 3 ? '#EF4444' : daysRemaining < 7 ? '#F59E0B' : '#AAFF00',
    },
    {
      label: 'DAILY USAGE',
      value: dailyKwh.toFixed(1),
      unit: 'kWh/day',
      icon: TrendingDown,
      color: '#AAFF00',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <div key={i} className="card-dark p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-white/40 text-xs font-display tracking-wide">{card.label}</span>
              <Icon className="w-4 h-4" style={{ color: card.color }} />
            </div>
            <div>
              <span className="font-display text-2xl leading-none" style={{ color: card.color }}>
                {card.value}
              </span>
              <span className="text-white/40 text-xs font-body ml-1">{card.unit}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}