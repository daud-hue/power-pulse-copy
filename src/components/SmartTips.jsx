import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Lightbulb, RefreshCw, Sparkles, TrendingDown, Clock, Zap } from 'lucide-react';

const TIP_ICONS = {
  geyser: 'Flame',
  lighting: 'Lightbulb',
  appliances: 'Plug',
  heating: 'Thermometer',
  cooling: 'Wind',
  general: 'Sparkles',
  peak: 'Clock',
  standby: 'Zap',
};

export default function SmartTips({ logs, transactions, balance, dailyKwh }) {
  const [tips, setTips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [devices, setDevices] = useState([]);

  // Load devices for context
  useEffect(() => {
    base44.entities.Device.list('sort_order', 50).then(setDevices).catch(() => {});
  }, []);

  // Derive rate per kWh from transactions
  const ratePerKwh = (() => {
    const recent = (transactions || []).filter(t => t.amount_paid_zar > 0 && t.kwh_added > 0);
    if (recent.length === 0) return 2.85;
    return recent.reduce((s, t) => s + t.amount_paid_zar / t.kwh_added, 0) / recent.length;
  })();

  const generateTips = async () => {
    setLoading(true);
    setError(null);
    try {
      const recentLogs = (logs || []).slice(0, 14).map(l => ({
        date: l.log_date,
        kwh: l.kwh_used,
        day: l.day_of_week,
      }));
      const recentTx = (transactions || []).slice(0, 10).map(t => ({
        kwh: t.kwh_added,
        zar: t.amount_paid_zar,
        date: t.created_date,
      }));
      const deviceList = (devices || []).map(d => ({
        name: d.name,
        kwhPerHour: d.kwh_per_hour,
        hoursPerDay: d.daily_hours,
        isOn: d.is_on,
        category: d.category,
      }));

      const prompt = `You are an energy-saving advisor for a South African prepaid electricity user. 
Based on the following data, generate 3-5 personalized, actionable energy saving tips.
Each tip must be specific, practical, and include an estimated monthly saving in ZAR where possible.

CONSUMPTION DATA:
- Estimated daily usage: ${dailyKwh || 10} kWh
- Current balance: ${balance?.current_kwh || 0} kWh
- Recent daily logs (last 14): ${JSON.stringify(recentLogs)}
- Recent reloads: ${JSON.stringify(recentTx)}
- Devices: ${JSON.stringify(deviceList)}
- Average rate: R${(ratePerKwh || 2.85).toFixed(2)}/kWh

Return a JSON array of tips. Each tip object must have:
- "title": short catchy title (max 40 chars)
- "description": 1-2 sentences with specific actionable advice
- "category": one of "geyser", "lighting", "appliances", "heating", "cooling", "general", "peak", "standby"
- "estimated_saving_zar": number (monthly saving estimate)
- "action": a specific action the user should take (imperative, max 50 chars)`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            tips: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  category: { type: 'string' },
                  estimated_saving_zar: { type: 'number' },
                  action: { type: 'string' },
                },
              },
            },
          },
        },
      });

      setTips(result?.tips || []);
    } catch (e) {
      setError('Could not generate tips. Try again.');
    }
    setLoading(false);
  };

  useEffect(() => {
    generateTips();
  }, []);

  const categoryColor = (cat) => {
    const map = {
      geyser: '#EF4444', lighting: '#AAFF00', appliances: '#F59E0B',
      heating: '#EF4444', cooling: '#3B82F6', general: '#AAFF00',
      peak: '#F59E0B', standby: '#A855F7',
    };
    return map[cat] || '#AAFF00';
  };

  return (
    <div className="card-dark p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-lime" />
          <span className="font-display text-white/60 text-xs tracking-widest">AI SAVING TIPS</span>
        </div>
        <button
          onClick={generateTips}
          disabled={loading}
          className="w-8 h-8 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center hover:border-lime/40 transition-colors disabled:opacity-50"
          title="Regenerate tips"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-white/40 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center py-8">
          <div className="w-8 h-8 border-2 border-lime/20 border-t-lime rounded-full animate-spin mb-3" />
          <p className="text-white/40 text-xs font-body">Analyzing your usage patterns...</p>
        </div>
      ) : error ? (
        <div className="text-center py-6">
          <p className="text-red-400 text-xs font-body mb-3">{error}</p>
          <button onClick={generateTips} className="text-lime text-xs font-display hover:underline">TRY AGAIN</button>
        </div>
      ) : tips.length === 0 ? (
        <div className="text-center py-6">
          <Lightbulb className="w-10 h-10 text-lime/30 mx-auto mb-2" />
          <p className="text-white/40 text-sm font-body">No tips available yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tips.map((tip, i) => {
            const color = categoryColor(tip.category);
            return (
              <div
                key={i}
                className="rounded-xl p-3 border transition-all"
                style={{ background: `${color}08`, borderColor: `${color}25` }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: `${color}20` }}
                  >
                    <Lightbulb className="w-4 h-4" style={{ color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-display text-white text-sm">{tip.title}</p>
                      {tip.estimated_saving_zar > 0 && (
                        <span
                          className="font-display text-xs px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0"
                          style={{ background: `${color}15`, color }}
                        >
                          ~R{tip.estimated_saving_zar}/mo
                        </span>
                      )}
                    </div>
                    <p className="text-white/50 text-xs font-body mt-1">{tip.description}</p>
                    <div
                      className="mt-2 flex items-center gap-1.5 text-xs font-body font-medium"
                      style={{ color }}
                    >
                      <Zap className="w-3 h-3" />
                      {tip.action}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && tips.length > 0 && (
        <p className="text-white/25 text-xs font-body text-center">
          Tips are personalized to your actual usage. Tap refresh for new suggestions.
        </p>
      )}
    </div>
  );
}