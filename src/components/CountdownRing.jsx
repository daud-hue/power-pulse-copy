import { useEffect, useState } from 'react';

export default function CountdownRing({ currentKwh, estimatedDailyKwh, maxKwh, size = 260 }) {
  const [animatedPercent, setAnimatedPercent] = useState(100);

  const daysRemaining = estimatedDailyKwh > 0 ? currentKwh / estimatedDailyKwh : 0;
  const days = Math.floor(daysRemaining);
  const hours = Math.floor((daysRemaining - days) * 24);
  const percent = maxKwh > 0 ? Math.min(100, (currentKwh / maxKwh) * 100) : 0;

  const getColor = () => {
    if (percent <= 10) return '#EF4444';
    if (percent <= 25) return '#F59E0B';
    return '#AAFF00';
  };

  const getGlowClass = () => {
    if (percent <= 10) return 'red-glow';
    if (percent <= 25) return 'amber-glow';
    return 'ring-glow';
  };

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedPercent(percent), 100);
    return () => clearTimeout(timer);
  }, [percent]);

  const strokeWidth = size >= 240 ? 14 : 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedPercent / 100) * circumference;
  const color = getColor();

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className={`transition-all duration-300 ${getGlowClass()}`}
          style={{ transform: 'rotate(-90deg)' }}
        >
          {/* Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#1a2000"
            strokeWidth={strokeWidth}
          />
          {/* Progress */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: 'stroke-dashoffset 1.5s ease-out, stroke 0.5s ease' }}
          />
        </svg>

        {/* Inner content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="font-display leading-none" style={{ color, fontSize: size >= 240 ? '3rem' : '2.25rem' }}>
            {days}
          </div>
          <div className="font-display text-white/60" style={{ fontSize: size >= 240 ? '1.125rem' : '0.875rem' }}>DAYS</div>
          <div className="font-display" style={{ color, fontSize: size >= 240 ? '1.5rem' : '1.25rem' }}>
            {hours}h
          </div>
          <div className="text-white/40 text-xs font-body mt-1">REMAINING</div>
        </div>
      </div>

      {/* Percent label */}
      <div className="mt-3 text-center">
        <span className="font-display text-sm" style={{ color }}>
          {percent.toFixed(1)}% BALANCE
        </span>
      </div>
    </div>
  );
}