import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Sparkles, Loader2, Wand2, Check } from 'lucide-react';

const VALID_ICONS = [
  'Thermometer', 'Flame', 'AirVent', 'Wind', 'Snowflake', 'Fan',
  'Lightbulb', 'Lamp', 'Sun', 'Refrigerator', 'Microwave', 'Coffee',
  'Utensils', 'CookingPot', 'WashingMachine', 'ShowerHead', 'Bath',
  'Tv', 'Monitor', 'Speaker', 'Gamepad2', 'Headphones', 'Radio',
  'Music', 'Camera', 'Cast', 'Computer', 'Laptop', 'Smartphone',
  'Tablet', 'Printer', 'Server', 'Router', 'Wifi', 'Zap', 'Plug',
  'Battery', 'BatteryCharging', 'Power',
];

export default function DeviceAISearch({ onApply }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const search = async () => {
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const prompt = `You are an appliance energy expert. Given a device name and optional description, estimate its power consumption and pick the best matching icon.

Device name: "${name}"
Description: "${description || 'N/A'}"

Return JSON with:
- "kwh_per_hour": estimated power draw in kWh per hour (number, 1-2 decimals). Typical ranges: phone charger 0.005, LED bulb 0.01, TV 0.15, fridge 0.1-0.3, washing machine 1.5-2.5, microwave 1.2, kettle 2.0-2.5, geyser 3-5, air conditioner 2-4, heater 1.5-3, stove 2.5-4.
- "daily_hours": estimated hours used per day (number)
- "category": one of "heating", "cooling", "lighting", "appliances", "entertainment", "kitchen", "other"
- "icon": pick the EXACT best-matching name from this list: ${VALID_ICONS.join(', ')}`;

      const res = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            kwh_per_hour: { type: 'number' },
            daily_hours: { type: 'number' },
            category: { type: 'string' },
            icon: { type: 'string' },
          },
        },
      });

      // Validate icon exists
      let icon = res?.icon || 'Zap';
      if (!VALID_ICONS.includes(icon)) icon = 'Zap';

      setResult({
        kwh_per_hour: parseFloat(res?.kwh_per_hour || 0.1),
        daily_hours: parseFloat(res?.daily_hours || 1),
        category: res?.category || 'other',
        icon,
      });
    } catch (e) {
      setError('Could not analyze device. Try again.');
    }
    setLoading(false);
  };

  const apply = () => {
    if (result && onApply) {
      onApply({
        name: name.trim(),
        ...result,
      });
      setName('');
      setDescription('');
      setResult(null);
    }
  };

  return (
    <div className="bg-black/40 border border-lime/20 rounded-xl p-4 space-y-3 animate-fade-in">
      <div className="flex items-center gap-2">
        <Wand2 className="w-3.5 h-3.5 text-lime" />
        <p className="font-display text-lime/80 text-xs tracking-widest">AI DEVICE FINDER</p>
      </div>

      <input
        type="text"
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Device name (e.g. Kettle)"
        className="w-full bg-black/50 border border-card-border rounded-lg px-3 py-2 text-white text-sm font-body focus:outline-none focus:border-lime transition-colors"
      />
      <input
        type="text"
        value={description}
        onChange={e => setDescription(e.target.value)}
        placeholder="Optional description (e.g. 2000W rapid boil)"
        className="w-full bg-black/50 border border-card-border rounded-lg px-3 py-2 text-white text-sm font-body focus:outline-none focus:border-lime transition-colors"
      />

      <button
        onClick={search}
        disabled={!name.trim() || loading}
        className="w-full bg-lime/15 border border-lime/30 text-lime font-display text-xs py-2 rounded-lg hover:bg-lime/25 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
      >
        {loading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> ANALYZING...</> : <><Sparkles className="w-3.5 h-3.5" /> FIND SPECS & ICON</>}
      </button>

      {error && <p className="text-red-400 text-xs font-body text-center">{error}</p>}

      {result && (
        <div className="bg-lime/5 border border-lime/20 rounded-lg p-3 space-y-2 animate-fade-in">
          <p className="font-display text-white/60 text-xs tracking-widest">AI ESTIMATE</p>
          <div className="grid grid-cols-2 gap-2 text-xs font-body">
            <div>
              <span className="text-white/40">Power:</span>{' '}
              <span className="text-lime font-display">{result.kwh_per_hour} kWh/hr</span>
            </div>
            <div>
              <span className="text-white/40">Usage:</span>{' '}
              <span className="text-white font-display">{result.daily_hours} h/day</span>
            </div>
            <div>
              <span className="text-white/40">Category:</span>{' '}
              <span className="text-white font-display capitalize">{result.category}</span>
            </div>
            <div>
              <span className="text-white/40">Icon:</span>{' '}
              <span className="text-white font-display">{result.icon}</span>
            </div>
          </div>
          <button
            onClick={apply}
            className="w-full bg-lime text-black font-display text-xs py-2 rounded-lg hover:bg-lime/90 transition-all flex items-center justify-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" /> USE THESE DETAILS
          </button>
        </div>
      )}
    </div>
  );
}