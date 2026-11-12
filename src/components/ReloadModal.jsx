import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Zap } from 'lucide-react';
import ReloadImageExtractor from '@/components/ReloadImageExtractor';

export default function ReloadModal({ balance, settings, onClose, onReloaded }) {
  const [kwh, setKwh] = useState('');
  const [zar, setZar] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const handleExtracted = (data) => {
    setKwh(data.kwh_added ? String(data.kwh_added) : '');
    setZar(data.amount_paid_zar ? String(data.amount_paid_zar) : '');
    setNotes(data.notes || '');
  };

  const handleReload = async () => {
    const kwhVal = parseFloat(kwh);
    const zarVal = parseFloat(zar);
    if (!kwhVal || kwhVal <= 0) return;

    setSaving(true);
    const prevKwh = balance?.current_kwh || 0;
    const newKwh = prevKwh + kwhVal;

    // Log transaction
    await base44.entities.ReloadTransaction.create({
      kwh_added: kwhVal,
      amount_paid_zar: zarVal || 0,
      balance_after: newKwh,
      balance_before: prevKwh,
      notes: notes || undefined,
    });

    // Update balance
    const now = new Date().toISOString();
    const dailyEst = balance?.estimated_daily_kwh || settings?.daily_kwh_estimate || 10;

    await base44.entities.ElectricityBalance.update(balance.id, {
      current_kwh: newKwh,
      last_updated: now,
      initial_kwh: newKwh,
      cycle_start: now,
      estimated_daily_kwh: dailyEst,
    });

    setSaving(false);
    onReloaded();
    onClose();
  };

  const kwhVal = parseFloat(kwh) || 0;
  const zarVal = parseFloat(zar) || 0;
  const costPerKwh = kwhVal > 0 && zarVal > 0 ? (zarVal / kwhVal).toFixed(2) : null;
  const currentDaily = balance?.estimated_daily_kwh || settings?.daily_kwh_estimate || 10;
  const newTotal = (balance?.current_kwh || 0) + kwhVal;
  const newDays = currentDaily > 0 ? Math.floor(newTotal / currentDaily) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md card-dark rounded-t-2xl sm:rounded-2xl p-6 animate-fade-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-display text-2xl text-white">RELOAD ELECTRICITY</h2>
            <p className="text-white/40 text-sm font-body">Add kWh to your balance</p>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Current balance pill */}
        <div className="bg-lime/10 border border-lime/20 rounded-lg px-4 py-3 mb-5 flex items-center justify-between">
          <span className="text-white/60 text-sm font-body">Current Balance</span>
          <span className="font-display text-lime text-xl">{(balance?.current_kwh || 0).toFixed(1)} kWh</span>
        </div>

        {/* AI Receipt Scanner */}
        <ReloadImageExtractor onConfirm={handleExtracted} />

        {/* Inputs */}
        <div className="space-y-4 mb-5">
          <div>
            <label className="text-lime text-xs font-display tracking-widest mb-2 block">kWh PURCHASED</label>
            <input
              type="number"
              value={kwh}
              onChange={e => setKwh(e.target.value)}
              placeholder="e.g. 100"
              className="w-full bg-black/50 border border-card-border rounded-lg px-4 py-3 text-white text-xl font-body focus:outline-none focus:border-lime transition-colors"
            />
          </div>
          <div>
            <label className="text-lime text-xs font-display tracking-widest mb-2 block">AMOUNT PAID (ZAR)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 font-display text-lg">R</span>
              <input
                type="number"
                value={zar}
                onChange={e => setZar(e.target.value)}
                placeholder="0.00"
                className="w-full bg-black/50 border border-card-border rounded-lg pl-8 pr-4 py-3 text-white text-xl font-body focus:outline-none focus:border-lime transition-colors"
              />
            </div>
          </div>
          <div>
            <label className="text-lime text-xs font-display tracking-widest mb-2 block">REFERENCE / NOTES</label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Meter number, reference, or note (optional)"
              className="w-full bg-black/50 border border-card-border rounded-lg px-4 py-3 text-white text-sm font-body focus:outline-none focus:border-lime transition-colors"
            />
          </div>
        </div>

        {/* Preview */}
        {kwhVal > 0 && (
          <div className="bg-black/40 border border-white/10 rounded-lg p-4 mb-5 space-y-2 animate-fade-in">
            <div className="flex justify-between text-sm font-body">
              <span className="text-white/50">New Balance</span>
              <span className="text-lime font-display">{newTotal.toFixed(1)} kWh</span>
            </div>
            <div className="flex justify-between text-sm font-body">
              <span className="text-white/50">Days Added</span>
              <span className="text-white font-display">{newDays} days</span>
            </div>
            {costPerKwh && (
              <div className="flex justify-between text-sm font-body">
                <span className="text-white/50">Cost per kWh</span>
                <span className="text-white/80 font-display">R{costPerKwh}/kWh</span>
              </div>
            )}
          </div>
        )}

        <button
          onClick={handleReload}
          disabled={!kwh || parseFloat(kwh) <= 0 || saving}
          className="w-full bg-lime text-black font-display text-xl py-4 rounded-lg flex items-center justify-center gap-2 hover:bg-lime/90 transition-all disabled:opacity-30 disabled:cursor-not-allowed lime-glow"
        >
          <Zap className="w-5 h-5" fill="black" />
          {saving ? 'RELOADING...' : 'CONFIRM RELOAD'}
        </button>
      </div>
    </div>
  );
}