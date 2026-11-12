import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Zap, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function ManualLogModal({ balance, onClose, onLogged }) {
  const [kwh, setKwh] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newKwh = parseFloat(kwh);
    if (isNaN(newKwh) || newKwh < 0) return;

    setSaving(true);
    const now = new Date();
    const todayStr = format(now, 'yyyy-MM-dd');
    const timeStr = format(now, 'HH:mm');

    // Calculate kwh_used since last known balance
    const prevKwh = balance?.current_kwh || newKwh;
    const kwhUsed = Math.max(0, prevKwh - newKwh);

    // Upsert today's log
    const existingLogs = await base44.entities.DailyConsumptionLog.filter({ log_date: todayStr });
    if (existingLogs.length > 0) {
      await base44.entities.DailyConsumptionLog.update(existingLogs[0].id, {
        kwh_used: parseFloat(kwhUsed.toFixed(3)),
        balance_end: newKwh,
        logged_at: now.toISOString(),
      });
    } else {
      await base44.entities.DailyConsumptionLog.create({
        log_date: todayStr,
        kwh_used: parseFloat(kwhUsed.toFixed(3)),
        balance_start: prevKwh,
        balance_end: newKwh,
        day_of_week: now.toLocaleDateString('en-ZA', { weekday: 'long' }),
        logged_at: now.toISOString(),
      });
    }

    // Update main balance
    if (balance?.id) {
      await base44.entities.ElectricityBalance.update(balance.id, {
        current_kwh: newKwh,
        last_updated: now.toISOString(),
      });
    }

    setDone(true);
    setTimeout(() => {
      onLogged();
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)' }}>
      <div className="card-dark w-full max-w-sm p-6 relative animate-fade-in">
        <button onClick={onClose} className="absolute top-4 right-4 text-white/30 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>

        {done ? (
          <div className="flex flex-col items-center gap-3 py-6">
            <CheckCircle className="w-12 h-12 text-lime" />
            <p className="font-display text-lime text-xl tracking-widest">LOGGED!</p>
            <p className="text-white/40 text-sm font-body">Predictions updated.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-lime/10 border border-lime/30 rounded-lg flex items-center justify-center">
                <Zap className="w-4 h-4 text-lime" />
              </div>
              <div>
                <h2 className="font-display text-white text-lg">LOG METER READING</h2>
                <p className="text-white/30 text-xs font-body">Enter your current kWh balance · auto-stamped {format(new Date(), 'HH:mm')}</p>
              </div>
            </div>

            {balance?.current_kwh != null && (
              <div className="bg-white/5 rounded-lg px-4 py-3 mb-4 flex justify-between items-center">
                <span className="text-white/40 text-xs font-body">LAST KNOWN BALANCE</span>
                <span className="font-display text-white/70">{balance.current_kwh.toFixed(1)} kWh</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-white/50 text-xs font-display tracking-widest block mb-2">CURRENT METER READING (kWh)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={kwh}
                  onChange={e => setKwh(e.target.value)}
                  placeholder="e.g. 45.5"
                  required
                  autoFocus
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white font-display text-xl focus:outline-none focus:border-lime/50 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={saving || !kwh}
                className="w-full bg-lime text-black font-display py-3 rounded-lg hover:bg-lime/90 transition-all lime-glow disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'SAVING...' : 'SAVE LOG'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}