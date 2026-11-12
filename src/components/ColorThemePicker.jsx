import { Check } from 'lucide-react';

const COLORS = [
  { id: 'lime', label: 'Lime', hex: '#AAFF00' },
  { id: 'blue', label: 'Blue', hex: '#3B82F6' },
  { id: 'purple', label: 'Purple', hex: '#A855F7' },
  { id: 'orange', label: 'Orange', hex: '#F97316' },
  { id: 'pink', label: 'Pink', hex: '#EC4899' },
];

export default function ColorThemePicker({ value, onChange }) {
  const selectColor = (id) => {
    COLORS.forEach(c => document.documentElement.classList.remove(`theme-${c.id}`));
    if (id !== 'lime') document.documentElement.classList.add(`theme-${id}`);
    localStorage.setItem('accentColor', id);
    onChange(id);
  };

  return (
    <div className="mb-5 p-3 rounded-xl border border-white/10 bg-white/[0.02]">
      <p className="text-white/50 text-xs font-display tracking-widest mb-3">ACCENT COLOR</p>
      <div className="grid grid-cols-5 gap-2">
        {COLORS.map(c => (
          <button
            key={c.id}
            onClick={() => selectColor(c.id)}
            title={c.label}
            className="flex flex-col items-center gap-1.5"
          >
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all"
              style={{ backgroundColor: c.hex, borderColor: value === c.id ? c.hex : 'transparent' }}
            >
              {value === c.id && <Check className="w-4 h-4 text-black" />}
            </div>
            <span className="text-white/40 text-[10px] font-body">{c.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}