import { useState, useEffect } from 'react';
import { Zap, Moon, Sun, Clock } from 'lucide-react';

// South African Eskom standard peak/off-peak schedule
const SCHEDULE = [
  { label: 'OFF-PEAK', start: 0, end: 6, color: '#AAFF00', rate: 'Low Cost', icon: Moon },
  { label: 'STANDARD', start: 6, end: 9, color: '#F59E0B', rate: 'Medium Cost', icon: Sun },
  { label: 'PEAK', start: 9, end: 17, color: '#EF4444', rate: 'High Cost', icon: Zap },
  { label: 'STANDARD', start: 17, end: 19, color: '#F59E0B', rate: 'Medium Cost', icon: Sun },
  { label: 'PEAK', start: 19, end: 21, color: '#EF4444', rate: 'High Cost', icon: Zap },
  { label: 'OFF-PEAK', start: 21, end: 24, color: '#AAFF00', rate: 'Low Cost', icon: Moon },
];

const HOURS = Array.from({ length: 24 }, (_, i) => i);

function getCurrentPeriod(hour) {
  return SCHEDULE.find(s => hour >= s.start && hour < s.end) || SCHEDULE[0];
}

export default function PeakHoursPanel() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const hour = now.getHours();
  const minute = now.getMinutes();
  const period = getCurrentPeriod(hour);
  const Icon = period.icon;

  // Minutes until period ends
  const currentSched = SCHEDULE.find(s => hour >= s.start && hour < s.end) || SCHEDULE[0];
  const minutesLeft = (currentSched.end - hour) * 60 - minute;
  const hoursLeft = Math.floor(minutesLeft / 60);
  const minsLeft = minutesLeft % 60;

  // Next period
  const nextSchedIdx = SCHEDULE.findIndex(s => hour >= s.start && hour < s.end);
  const nextSched = SCHEDULE[(nextSchedIdx + 1) % SCHEDULE.length];

  return (
    <div className="card-dark p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-white/40" />
          <span className="font-display text-white/60 text-xs tracking-widest">TARIFF STATUS</span>
        </div>
        <span className="text-white/30 text-xs font-body">
          {now.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      {/* Current status pill */}
      <div
        className="rounded-xl p-4 flex items-center gap-4 border"
        style={{
          background: `${period.color}10`,
          borderColor: `${period.color}30`,
        }}
      >
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${period.color}20` }}
        >
          <Icon className="w-6 h-6" style={{ color: period.color }} />
        </div>
        <div className="flex-1">
          <div className="font-display text-xl" style={{ color: period.color }}>
            {period.label}
          </div>
          <div className="text-white/50 text-xs font-body">{period.rate}</div>
        </div>
        <div className="text-right">
          <div className="font-display text-white text-sm">
            {hoursLeft > 0 ? `${hoursLeft}h ${minsLeft}m` : `${minsLeft}m`}
          </div>
          <div className="text-white/30 text-xs font-body">remaining</div>
        </div>
      </div>

      {/* 24h timeline bar */}
      <div className="space-y-2">
        <div className="flex h-5 rounded-lg overflow-hidden w-full gap-px">
          {HOURS.map(h => {
            const seg = getCurrentPeriod(h);
            const isNow = h === hour;
            return (
              <div
                key={h}
                className="flex-1 relative transition-all"
                style={{
                  background: isNow ? seg.color : `${seg.color}30`,
                  opacity: isNow ? 1 : 0.6,
                }}
                title={`${h}:00 — ${seg.label}`}
              >
                {isNow && (
                  <div
                    className="absolute inset-0 animate-pulse"
                    style={{ background: seg.color, opacity: 0.4 }}
                  />
                )}
              </div>
            );
          })}
        </div>
        {/* Hour labels */}
        <div className="flex justify-between text-white/25 text-xs font-body px-0.5">
          <span>00h</span>
          <span>06h</span>
          <span>12h</span>
          <span>18h</span>
          <span>24h</span>
        </div>
      </div>

      {/* Next period */}
      <div className="flex items-center justify-between bg-white/3 rounded-lg px-3 py-2 border border-white/5">
        <span className="text-white/40 text-xs font-body">NEXT: {nextSched.label}</span>
        <span className="font-display text-xs" style={{ color: nextSched.color }}>{nextSched.rate}</span>
      </div>
    </div>
  );
}