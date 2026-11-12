import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Zap, ChevronRight, Plus, X, Star } from 'lucide-react';

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(1);
  const [dailyKwh, setDailyKwh] = useState('');
  const [thresholds, setThresholds] = useState([20, 10, 5]);
  const [newThreshold, setNewThreshold] = useState('');
  const [reminderKwh, setReminderKwh] = useState('');
  const [reminderDays, setReminderDays] = useState('');
  const [initialKwh, setInitialKwh] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [saving, setSaving] = useState(false);

  const addThreshold = () => {
    const val = parseFloat(newThreshold);
    if (!isNaN(val) && val > 0 && val <= 100 && !thresholds.includes(val)) {
      setThresholds([...thresholds, val].sort((a, b) => b - a));
      setNewThreshold('');
    }
  };

  const removeThreshold = (t) => setThresholds(thresholds.filter(x => x !== t));

  const handleComplete = async () => {
    setSaving(true);
    const daily = parseFloat(dailyKwh) || 10;
    const kwh = parseFloat(initialKwh) || 0;

    await base44.entities.UserSettings.create({
      daily_kwh_estimate: daily,
      alert_thresholds: thresholds,
      reload_reminder_kwh: parseFloat(reminderKwh) || 5,
      reload_reminder_days: parseFloat(reminderDays) || 2,
      onboarding_complete: true,
      dismissed_tips: []
    });

    const now = new Date().toISOString();
    await base44.entities.ElectricityBalance.create({
      current_kwh: kwh,
      estimated_daily_kwh: daily,
      last_updated: now,
      initial_kwh: kwh,
      cycle_start: now
    });

    if (kwh > 0) {
      await base44.entities.ReloadTransaction.create({
        kwh_added: kwh,
        amount_paid_zar: parseFloat(amountPaid) || 0,
        balance_after: kwh,
        balance_before: 0,
        notes: 'Initial balance'
      });
    }

    // Seed saving tips
    const tips = [
      { message: 'Switch off your geyser between 6–9am and 5–8pm during peak hours to save up to 30% on heating costs.', category: 'geyser', icon: 'Thermometer', priority: 3 },
      { message: 'Replace old bulbs with LED lighting — they use 80% less electricity and last 25x longer.', category: 'lighting', icon: 'Lightbulb', priority: 2 },
      { message: 'Unplug appliances on standby — TVs, chargers and microwaves on standby can account for 10% of your bill.', category: 'standby', icon: 'Plug', priority: 2 },
      { message: 'Run your washing machine and dishwasher during off-peak hours (after 9pm or before 6am).', category: 'appliances', icon: 'Clock', priority: 2 },
      { message: 'Set your geyser thermostat to 55°C — it\'s hot enough and reduces energy by up to 20%.', category: 'geyser', icon: 'Thermometer', priority: 1 },
      { message: 'Use a slow cooker or microwave instead of the oven — they use significantly less electricity.', category: 'appliances', icon: 'Zap', priority: 1 },
    ];
    for (const tip of tips) {
      await base44.entities.SavingTip.create({ ...tip, dismissed: false });
    }

    setSaving(false);
    onComplete();
  };

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4" style={{ background: '#000000' }}>
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Star className="text-lime w-6 h-6" fill="#AAFF00" />
            <Zap className="text-lime w-8 h-8" fill="#AAFF00" />
            <Star className="text-lime w-6 h-6" fill="#AAFF00" />
          </div>
          <h1 className="font-display text-4xl text-lime lime-glow-text mb-1">POWER PULSE</h1>
          <p className="text-white/50 text-sm uppercase tracking-widest font-body">Intelligent Electricity Tracker</p>
        </div>

        {/* Step Indicators */}
        <div className="flex gap-2 justify-center mb-8">
          {[1, 2, 3].map(s => (
            <div key={s} className={`h-1 rounded-full transition-all duration-300 ${s <= step ? 'w-10 bg-lime' : 'w-6 bg-white/20'}`} />
          ))}
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <div className="card-dark p-6 animate-fade-in">
            <h2 className="font-display text-2xl text-white mb-1">SETUP YOUR TRACKER</h2>
            <p className="text-white/50 text-sm font-body mb-6">Let's calibrate your electricity countdown</p>

            <div className="space-y-5">
              <div>
                <label className="text-lime text-xs font-display tracking-widest mb-2 block">ESTIMATED DAILY USAGE (kWh)</label>
                <input
                  type="number"
                  value={dailyKwh}
                  onChange={e => setDailyKwh(e.target.value)}
                  placeholder="e.g. 15"
                  className="w-full bg-black/50 border border-card-border rounded-lg px-4 py-3 text-white text-lg font-body focus:outline-none focus:border-lime transition-colors"
                />
                <p className="text-white/30 text-xs mt-1 font-body">Average South African household: 10–25 kWh/day</p>
              </div>

              <div>
                <label className="text-lime text-xs font-display tracking-widest mb-2 block">CURRENT kWh BALANCE</label>
                <input
                  type="number"
                  value={initialKwh}
                  onChange={e => setInitialKwh(e.target.value)}
                  placeholder="e.g. 150"
                  className="w-full bg-black/50 border border-card-border rounded-lg px-4 py-3 text-white text-lg font-body focus:outline-none focus:border-lime transition-colors"
                />
              </div>

              <div>
                <label className="text-lime text-xs font-display tracking-widest mb-2 block">AMOUNT PAID (ZAR)</label>
                <input
                  type="number"
                  value={amountPaid}
                  onChange={e => setAmountPaid(e.target.value)}
                  placeholder="e.g. 500"
                  className="w-full bg-black/50 border border-card-border rounded-lg px-4 py-3 text-white text-lg font-body focus:outline-none focus:border-lime transition-colors"
                />
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!dailyKwh || !initialKwh}
              className="w-full mt-6 bg-lime text-black font-display text-lg py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-lime/90 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              NEXT <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="card-dark p-6 animate-fade-in">
            <h2 className="font-display text-2xl text-white mb-1">LOW BALANCE ALERTS</h2>
            <p className="text-white/50 text-sm font-body mb-6">Set percentage thresholds for warnings</p>

            <div className="flex flex-wrap gap-2 mb-4">
              {thresholds.map(t => (
                <div key={t} className="flex items-center gap-1 bg-lime/10 border border-lime/30 rounded-full px-3 py-1">
                  <span className="text-lime text-sm font-display">{t}%</span>
                  <button onClick={() => removeThreshold(t)}><X className="w-3 h-3 text-lime/60 hover:text-lime" /></button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="number"
                value={newThreshold}
                onChange={e => setNewThreshold(e.target.value)}
                placeholder="Add % (e.g. 15)"
                className="flex-1 bg-black/50 border border-card-border rounded-lg px-4 py-3 text-white font-body focus:outline-none focus:border-lime transition-colors"
              />
              <button onClick={addThreshold} className="bg-lime/20 border border-lime/40 text-lime rounded-lg px-4 hover:bg-lime/30 transition-colors">
                <Plus className="w-5 h-5" />
              </button>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setStep(1)} className="flex-1 border border-white/20 text-white/60 font-display py-3 rounded-lg hover:border-white/40 transition-colors">
                BACK
              </button>
              <button onClick={() => setStep(3)} className="flex-1 bg-lime text-black font-display text-lg py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-lime/90 transition-all">
                NEXT <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div className="card-dark p-6 animate-fade-in">
            <h2 className="font-display text-2xl text-white mb-1">RELOAD REMINDER</h2>
            <p className="text-white/50 text-sm font-body mb-6">When should we remind you to reload?</p>

            <div className="space-y-4">
              <div>
                <label className="text-lime text-xs font-display tracking-widest mb-2 block">REMIND WHEN kWh DROPS BELOW</label>
                <input
                  type="number"
                  value={reminderKwh}
                  onChange={e => setReminderKwh(e.target.value)}
                  placeholder="e.g. 20 kWh"
                  className="w-full bg-black/50 border border-card-border rounded-lg px-4 py-3 text-white font-body focus:outline-none focus:border-lime transition-colors"
                />
              </div>
              <div className="text-center text-white/30 text-sm font-body">— OR —</div>
              <div>
                <label className="text-lime text-xs font-display tracking-widest mb-2 block">REMIND WHEN DAYS REMAINING DROPS BELOW</label>
                <input
                  type="number"
                  value={reminderDays}
                  onChange={e => setReminderDays(e.target.value)}
                  placeholder="e.g. 3 days"
                  className="w-full bg-black/50 border border-card-border rounded-lg px-4 py-3 text-white font-body focus:outline-none focus:border-lime transition-colors"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setStep(2)} className="flex-1 border border-white/20 text-white/60 font-display py-3 rounded-lg hover:border-white/40 transition-colors">
                BACK
              </button>
              <button
                onClick={handleComplete}
                disabled={saving}
                className="flex-1 bg-lime text-black font-display text-lg py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-lime/90 transition-all disabled:opacity-60"
              >
                {saving ? 'SAVING...' : 'LAUNCH APP'}
                {!saving && <Zap className="w-5 h-5" fill="black" />}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}