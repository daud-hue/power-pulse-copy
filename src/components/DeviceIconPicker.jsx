import { useState, useMemo } from 'react';
import {
  Thermometer, Flame, Wind, Snowflake, Fan, AirVent,
  Lightbulb, Lamp, Sun, Tv, Monitor, Speaker, Gamepad2, Headphones, Radio, Music, Camera, Cast,
  Coffee, Utensils, CookingPot, Refrigerator, WashingMachine, Microwave, Plug, Zap,
  Battery, BatteryCharging, Power, Server, Router, Wifi,
  Computer, Laptop, Smartphone, Tablet, Printer, ShowerHead, Bath,
} from 'lucide-react';

export const DEVICE_ICON_CATEGORIES = [
  { label: 'Heating', icons: ['Thermometer', 'Flame', 'AirVent'] },
  { label: 'Cooling', icons: ['Wind', 'Snowflake', 'Fan'] },
  { label: 'Lighting', icons: ['Lightbulb', 'Lamp', 'Sun'] },
  { label: 'Kitchen', icons: ['Refrigerator', 'Microwave', 'Coffee', 'Utensils', 'CookingPot'] },
  { label: 'Laundry & Bath', icons: ['WashingMachine', 'ShowerHead', 'Bath'] },
  { label: 'Entertainment', icons: ['Tv', 'Monitor', 'Speaker', 'Gamepad2', 'Headphones', 'Radio', 'Music', 'Camera', 'Cast'] },
  { label: 'Electronics', icons: ['Computer', 'Laptop', 'Smartphone', 'Tablet', 'Printer', 'Server', 'Router', 'Wifi'] },
  { label: 'Power', icons: ['Zap', 'Plug', 'Battery', 'BatteryCharging', 'Power'] },
];

export const ICON_COMPONENTS = {
  Thermometer, Flame, Wind, Snowflake, Fan, AirVent,
  Lightbulb, Lamp, Sun, Tv, Monitor, Speaker, Gamepad2, Headphones, Radio, Music, Camera, Cast,
  Coffee, Utensils, CookingPot, Refrigerator, WashingMachine, Microwave, Plug, Zap,
  Battery, BatteryCharging, Power, Server, Router, Wifi,
  Computer, Laptop, Smartphone, Tablet, Printer, ShowerHead, Bath,
};

export function getIconComponent(name) {
  return ICON_COMPONENTS[name] || Zap;
}

export const ALL_ICON_NAMES = DEVICE_ICON_CATEGORIES.flatMap(c => c.icons);

export default function DeviceIconPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [activeCat, setActiveCat] = useState('Heating');

  const CurrentIcon = getIconComponent(value);

  const filteredIcons = useMemo(() => {
    if (search.trim()) {
      const q = search.toLowerCase();
      return ALL_ICON_NAMES.filter(n => n.toLowerCase().includes(q));
    }
    return DEVICE_ICON_CATEGORIES.find(c => c.label === activeCat)?.icons || [];
  }, [search, activeCat]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 bg-black/50 border border-card-border rounded-lg px-3 py-2.5 text-left hover:border-lime/50 transition-colors"
      >
        <div className="w-8 h-8 rounded-lg bg-lime/10 border border-lime/20 flex items-center justify-center flex-shrink-0">
          <CurrentIcon className="w-4 h-4 text-lime" />
        </div>
        <span className="text-white/70 text-sm font-body flex-1">{value || 'Choose icon'}</span>
        <span className="text-white/30 text-xs font-display">CHANGE</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => { setOpen(false); setSearch(''); }} />
          <div className="absolute z-50 mt-2 w-full card-dark border border-lime/20 rounded-xl p-3 shadow-2xl animate-fade-in" style={{ background: '#0a0a0a' }}>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search icons..."
              className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-body focus:outline-none focus:border-lime/50 mb-3"
            />

            {!search.trim() && (
              <div className="flex flex-wrap gap-1 mb-3">
                {DEVICE_ICON_CATEGORIES.map(c => (
                  <button
                    key={c.label}
                    type="button"
                    onClick={() => setActiveCat(c.label)}
                    className={`px-2 py-1 rounded text-xs font-display transition-colors ${
                      activeCat === c.label ? 'bg-lime text-black' : 'bg-white/5 text-white/50 hover:text-white/80'
                    }`}
                  >
                    {c.label.toUpperCase()}
                  </button>
                ))}
              </div>
            )}

            <div className="grid grid-cols-6 gap-1.5 max-h-44 overflow-y-auto pr-1">
              {filteredIcons.map(name => {
                const Icon = getIconComponent(name);
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => {
                      onChange(name);
                      setOpen(false);
                      setSearch('');
                    }}
                    className={`aspect-square rounded-lg flex items-center justify-center transition-all ${
                      value === name
                        ? 'bg-lime/20 border-2 border-lime'
                        : 'bg-white/5 border border-white/5 hover:bg-lime/10 hover:border-lime/30'
                    }`}
                    title={name}
                  >
                    <Icon className={`w-4 h-4 ${value === name ? 'text-lime' : 'text-white/60'}`} />
                  </button>
                );
              })}
              {filteredIcons.length === 0 && (
                <p className="col-span-6 text-white/30 text-xs font-body text-center py-4">No icons found</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}