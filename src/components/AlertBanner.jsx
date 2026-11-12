import { AlertTriangle, X, Zap } from 'lucide-react';

export default function AlertBanner({ balance, settings, onDismiss }) {
  if (!balance || !settings) return null;

  const currentKwh = balance.current_kwh || 0;
  const estimatedDaily = balance.estimated_daily_kwh || settings.daily_kwh_estimate || 10;
  const thresholds = settings.alert_thresholds || [20, 10, 5];
  const reminderKwh = settings.reload_reminder_kwh || 5;
  const reminderDays = settings.reload_reminder_days || 2;

  // Find what the max was (use initial_kwh from last reload)
  const maxKwh = balance.initial_kwh || currentKwh;
  const percentRemaining = maxKwh > 0 ? (currentKwh / maxKwh) * 100 : 100;
  const daysRemaining = estimatedDaily > 0 ? currentKwh / estimatedDaily : 0;

  const alerts = [];

  // Check percentage thresholds
  const sortedThresholds = [...thresholds].sort((a, b) => a - b);
  const triggeredThreshold = sortedThresholds.find(t => percentRemaining <= t);

  if (triggeredThreshold) {
    const isUrgent = triggeredThreshold <= 5;
    alerts.push({
      type: 'threshold',
      level: isUrgent ? 'critical' : 'warning',
      message: `Low balance alert: ${percentRemaining.toFixed(0)}% remaining (${currentKwh.toFixed(1)} kWh)`,
      sub: `You have approximately ${Math.floor(daysRemaining)} days and ${Math.floor((daysRemaining % 1) * 24)} hours left`,
    });
  }

  // Check day threshold
  if (daysRemaining <= reminderDays && daysRemaining > 0) {
    alerts.push({
      type: 'reload',
      level: 'reload',
      message: `Time to reload! Only ${Math.floor(daysRemaining)} days remaining`,
      sub: `Balance: ${currentKwh.toFixed(1)} kWh — reload soon to avoid outage`,
    });
  }

  if (alerts.length === 0) return null;

  const alert = alerts[0];
  const colors = {
    critical: { bg: 'bg-red-500/10', border: 'border-red-500/40', text: 'text-red-400', icon: '#EF4444' },
    warning: { bg: 'bg-amber/10', border: 'border-amber/40', text: 'text-amber', icon: '#F59E0B' },
    reload: { bg: 'bg-lime/10', border: 'border-lime/30', text: 'text-lime', icon: '#AAFF00' },
  };
  const c = colors[alert.level];

  return (
    <div className={`${c.bg} border ${c.border} rounded-xl p-4 flex items-start gap-3 animate-fade-in`}>
      <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: c.icon }} />
      <div className="flex-1 min-w-0">
        <p className={`font-display text-sm ${c.text}`}>{alert.message}</p>
        <p className="text-white/50 text-xs font-body mt-0.5">{alert.sub}</p>
      </div>
    </div>
  );
}