import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Bell, Clock, Zap, Calendar, Loader2 } from 'lucide-react';

const ALERTS = [
  { key: 'high_usage_alert_enabled', label: 'High Usage Alert', desc: 'Notify when today\'s usage exceeds your threshold', icon: Zap, iconColor: '#AAFF00' },
  { key: 'reminder_9am', label: '9:00 AM Reminder', desc: 'Morning log reminder', icon: Clock, iconColor: '#F59E0B' },
  { key: 'reminder_12pm', label: '12:00 PM Reminder', desc: 'Midday log reminder', icon: Clock, iconColor: '#F59E0B' },
  { key: 'reminder_4pm', label: '4:00 PM Reminder', desc: 'Afternoon log reminder', icon: Clock, iconColor: '#F59E0B' },
  { key: 'reminder_8pm', label: '8:00 PM Reminder', desc: 'Evening log reminder', icon: Clock, iconColor: '#F59E0B' },
];

export default function AlertSettings({ settings, onUpdate }) {
  const [local, setLocal] = useState({ ...settings });
  const [saving, setSaving] = useState(null);

  const toggle = async (key) => {
    const newValue = !local[key];
    setLocal(prev => ({ ...prev, [key]: newValue }));
    setSaving(key);
    await base44.entities.UserSettings.update(settings.id, { [key]: newValue });
    setSaving(null);
    if (onUpdate) onUpdate();
  };

  const toggleCalendar = async () => {
    const newValue = !local.calendar_sync_enabled;
    setLocal(prev => ({ ...prev, calendar_sync_enabled: newValue }));
    setSaving('calendar');
    await base44.entities.UserSettings.update(settings.id, { calendar_sync_enabled: newValue });
    setSaving(null);
    if (onUpdate) onUpdate();
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-3">
        <Bell className="w-3.5 h-3.5 text-lime" />
        <p className="text-white/50 text-xs font-display tracking-widest">ALERT SETTINGS</p>
      </div>

      {ALERTS.map(({ key, label, desc, icon: Icon, iconColor }) => (
        <div key={key} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: iconColor }} />
            <div className="min-w-0">
              <p className="text-white text-xs font-body truncate">{label}</p>
              <p className="text-white/25 text-[10px] font-body truncate">{desc}</p>
            </div>
          </div>
          <button
            onClick={() => toggle(key)}
            disabled={saving === key}
            className={`w-9 h-5 rounded-full relative transition-colors duration-200 flex-shrink-0 ${
              local[key] ? 'bg-lime/30 border border-lime/50' : 'bg-white/10 border border-white/10'
            }`}
          >
            {saving === key ? (
              <Loader2 className="w-3 h-3 text-white/60 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin" />
            ) : (
              <div
                className={`w-4 h-4 rounded-full absolute top-1/2 -translate-y-1/2 transition-all duration-200 ${
                  local[key] ? 'left-4 bg-lime' : 'left-0.5 bg-white/30'
                }`}
              />
            )}
          </button>
        </div>
      ))}

      {/* Calendar Sync */}
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <Calendar className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-white text-xs font-body truncate">Calendar Sync</p>
            <p className="text-white/25 text-[10px] font-body truncate">Add reloads to Google Calendar</p>
          </div>
        </div>
        <button
          onClick={toggleCalendar}
          disabled={saving === 'calendar'}
          className={`w-9 h-5 rounded-full relative transition-colors duration-200 flex-shrink-0 ${
            local.calendar_sync_enabled ? 'bg-blue-500/30 border border-blue-500/50' : 'bg-white/10 border border-white/10'
          }`}
        >
          {saving === 'calendar' ? (
            <Loader2 className="w-3 h-3 text-white/60 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin" />
          ) : (
            <div
              className={`w-4 h-4 rounded-full absolute top-1/2 -translate-y-1/2 transition-all duration-200 ${
                local.calendar_sync_enabled ? 'left-4 bg-blue-400' : 'left-0.5 bg-white/30'
              }`}
            />
          )}
        </button>
      </div>
    </div>
  );
}