import { Thermometer, Lightbulb, Plug, Clock, Zap, X, Leaf } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const iconMap = {
  Thermometer, Lightbulb, Plug, Clock, Zap, Leaf,
};

const categoryColors = {
  geyser: '#AAFF00',
  lighting: '#7ACC00',
  appliances: '#5A9900',
  standby: '#F59E0B',
  peak_hours: '#EF4444',
  general: '#AAFF00',
};

export default function SavingTips({ tips, onDismiss }) {
  if (!tips || tips.length === 0) return null;

  const activeTips = tips.filter(t => !t.dismissed).slice(0, 3);
  if (activeTips.length === 0) return null;

  return (
    <div className="card-dark p-5">
      <div className="flex items-center gap-2 mb-4">
        <Leaf className="w-4 h-4 text-lime" />
        <h3 className="font-display text-white text-lg">SAVING TIPS</h3>
      </div>
      <div className="space-y-3">
        {activeTips.map(tip => {
          const IconComponent = iconMap[tip.icon] || Zap;
          const color = categoryColors[tip.category] || '#AAFF00';
          return (
            <div
              key={tip.id}
              className="bg-black/40 border border-white/8 rounded-xl p-4 flex gap-3 items-start animate-fade-in"
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: `${color}15`, border: `1px solid ${color}30` }}
              >
                <IconComponent className="w-4 h-4" style={{ color }} />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-display tracking-widest" style={{ color }}>
                  {tip.category?.toUpperCase().replace('_', ' ')}
                </span>
                <p className="text-white/80 text-sm font-body mt-0.5 leading-relaxed">{tip.message}</p>
              </div>
              <button
                onClick={() => onDismiss(tip.id)}
                className="text-white/20 hover:text-white/60 transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}