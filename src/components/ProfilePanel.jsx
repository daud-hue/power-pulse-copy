import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { X, User, LogOut, Save, CheckCircle, Sun, Moon, Plus, AlertTriangle, Calendar, MapPin, Camera } from 'lucide-react';
import ColorThemePicker from '@/components/ColorThemePicker';

function getInitialTheme() {
  if (typeof window !== 'undefined') {
    return document.documentElement.classList.contains('light') ? 'light' : 'dark';
  }
  return 'dark';
}

export default function ProfilePanel({ onClose }) {
  const [user, setUser] = useState(null);
  const [displayName, setDisplayName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [theme, setTheme] = useState(getInitialTheme);
  const [accentColor, setAccentColor] = useState(() => localStorage.getItem('accentColor') || 'lime');
  const [userSettings, setUserSettings] = useState(null);
  const [thresholds, setThresholds] = useState([20, 10, 5]);
  const [newThreshold, setNewThreshold] = useState('');
  const [savingAlerts, setSavingAlerts] = useState(false);
  const [calendarSync, setCalendarSync] = useState(false);
  const [savingCalendar, setSavingCalendar] = useState(false);
  const [highUsageAlert, setHighUsageAlert] = useState(true);
  const [highUsageThreshold, setHighUsageThreshold] = useState(150);
  const [reminder9am, setReminder9am] = useState(true);
  const [reminder12pm, setReminder12pm] = useState(true);
  const [reminder4pm, setReminder4pm] = useState(false);
  const [reminder8pm, setReminder8pm] = useState(true);
  const [notificationMode, setNotificationMode] = useState('email');
  const [savingAlertSettings, setSavingAlertSettings] = useState(false);
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [savingLocation, setSavingLocation] = useState(false);
  const [savedLocation, setSavedLocation] = useState(false);
  const [photoUrl, setPhotoUrl] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    Promise.all([
      base44.auth.me(),
      base44.entities.UserSettings.list('-created_date', 1)
    ]).then(([u, settings]) => {
      setUser(u);
      setDisplayName(u?.full_name || '');
      setPhotoUrl(u?.photo_url || null);
      const s = settings[0];
      setUserSettings(s);
      if (s?.alert_thresholds?.length) {
        setThresholds([...s.alert_thresholds].sort((a, b) => b - a));
      }
      setCalendarSync(s?.calendar_sync_enabled || false);
      setHighUsageAlert(s?.high_usage_alert_enabled ?? true);
      setHighUsageThreshold(s?.high_usage_threshold_percent ?? 150);
      setReminder9am(s?.reminder_9am ?? true);
      setReminder12pm(s?.reminder_12pm ?? true);
      setReminder4pm(s?.reminder_4pm ?? false);
      setReminder8pm(s?.reminder_8pm ?? true);
      setNotificationMode(s?.notification_mode || 'email');
      setAddress(s?.address || '');
      setCity(s?.city || '');
      setProvince(s?.province || '');
    });
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    if (newTheme === 'light') {
      document.documentElement.classList.add('light');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.classList.remove('light');
      localStorage.setItem('theme', 'dark');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    await base44.auth.updateMe({ full_name: displayName });
    setSaved(true);
    setSaving(false);
    setTimeout(() => setSaved(false), 2000);
  };

  const addThreshold = () => {
    const val = parseFloat(newThreshold);
    if (!isNaN(val) && val > 0 && val <= 100 && !thresholds.includes(val)) {
      setThresholds([...thresholds, val].sort((a, b) => b - a));
      setNewThreshold('');
    }
  };

  const removeThreshold = (t) => setThresholds(thresholds.filter(x => x !== t));

  const saveAlerts = async () => {
    if (!userSettings) return;
    setSavingAlerts(true);
    await base44.entities.UserSettings.update(userSettings.id, { alert_thresholds: thresholds });
    setSavingAlerts(false);
  };

  const saveAlertSettings = async (updates) => {
    if (!userSettings) return;
    setSavingAlertSettings(true);
    await base44.entities.UserSettings.update(userSettings.id, updates);
    setSavingAlertSettings(false);
  };

  const toggleCalendarSync = async () => {
    if (!userSettings) return;
    const newVal = !calendarSync;
    setCalendarSync(newVal);
    setSavingCalendar(true);
    await base44.entities.UserSettings.update(userSettings.id, { calendar_sync_enabled: newVal });
    setSavingCalendar(false);
  };

  const saveLocation = async () => {
    if (!userSettings) return;
    setSavingLocation(true);
    await base44.entities.UserSettings.update(userSettings.id, { address, city, province });
    setSavingLocation(false);
    setSavedLocation(true);
    setTimeout(() => setSavedLocation(false), 2000);
  };

  const handleLogout = () => {
    base44.auth.logout('/');
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.auth.updateMe({ photo_url: file_url });
      setPhotoUrl(file_url);
      setUser(prev => ({ ...prev, photo_url: file_url }));
    } catch (err) {
      console.error('Photo upload failed', err);
    }
    setUploadingPhoto(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)' }}>
      <div className="card-dark w-full max-w-sm relative animate-fade-in rounded-2xl flex flex-col" style={{ maxHeight: '90vh' }}>
        <button onClick={onClose} className="absolute top-4 right-4 text-white/30 hover:text-white transition-colors z-10">
          <X className="w-4 h-4" />
        </button>

        <div className="overflow-y-auto p-6 pt-12">

          {/* Avatar */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative mb-3 group">
              <div className="w-20 h-20 rounded-full bg-lime/10 border-2 border-lime/40 flex items-center justify-center overflow-hidden">
                {photoUrl ? (
                  <img src={photoUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-10 h-10 text-lime" />
                )}
              </div>
              <label className="absolute bottom-0 right-0 w-7 h-7 bg-lime rounded-full flex items-center justify-center cursor-pointer hover:bg-lime/90 transition-colors border-2 border-black lime-glow">
                {uploadingPhoto ? (
                  <div className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                ) : (
                  <Camera className="w-3.5 h-3.5 text-black" />
                )}
                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" disabled={uploadingPhoto} />
              </label>
            </div>
            <p className="font-display text-white text-lg tracking-widest">{user?.full_name || 'USER'}</p>
            <p className="text-white/30 text-xs font-body mt-0.5">{user?.email || ''}</p>
          </div>

          {/* Theme Toggle */}
          <div className="mb-5 p-3 rounded-xl border border-white/10 bg-white/[0.02]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/50 text-xs font-display tracking-widest">THEME</p>
                <p className="text-white text-sm font-body mt-0.5">{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</p>
              </div>
              <button
                onClick={toggleTheme}
                className={`w-12 h-7 rounded-full relative transition-colors duration-300 ${
                  theme === 'dark' ? 'bg-lime/20 border border-lime/40' : 'bg-amber/20 border border-amber/40'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full absolute top-1/2 -translate-y-1/2 transition-all duration-300 flex items-center justify-center ${
                    theme === 'dark' ? 'left-1 bg-lime text-black' : 'left-6 bg-amber text-black'
                  }`}
                >
                  {theme === 'dark' ? <Moon className="w-3 h-3" /> : <Sun className="w-3 h-3" />}
                </div>
              </button>
            </div>
          </div>

          {/* Accent Color */}
          <ColorThemePicker value={accentColor} onChange={setAccentColor} />

          {/* Alert Thresholds */}
          <div className="mb-5 p-3 rounded-xl border border-white/10 bg-white/[0.02]">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-3.5 h-3.5 text-amber" />
              <p className="text-white/50 text-xs font-display tracking-widest">LOW BALANCE ALERTS</p>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {thresholds.map(t => (
                <div key={t} className="flex items-center gap-1 bg-amber/10 border border-amber/30 rounded-full px-2.5 py-1">
                  <span className="text-amber text-xs font-display">{t}%</span>
                  <button onClick={() => removeThreshold(t)}><X className="w-3 h-3 text-amber/60 hover:text-amber" /></button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="number"
                value={newThreshold}
                onChange={e => setNewThreshold(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addThreshold()}
                placeholder="Add % (e.g. 15)"
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-body focus:outline-none focus:border-amber/50 transition-colors"
              />
              <button onClick={addThreshold} className="bg-amber/20 border border-amber/40 text-amber rounded-lg px-3 hover:bg-amber/30 transition-colors">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={saveAlerts}
              disabled={savingAlerts}
              className="w-full mt-3 bg-amber/20 border border-amber/40 text-amber font-display text-xs py-2 rounded-lg hover:bg-amber/30 transition-colors disabled:opacity-50"
            >
              {savingAlerts ? 'SAVING...' : 'SAVE ALERTS'}
            </button>
          </div>

          {/* Google Calendar */}
          <div className="mb-5 p-3 rounded-xl border border-white/10 bg-white/[0.02]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-lime" />
                <div>
                  <p className="text-white/50 text-xs font-display tracking-widest">GOOGLE CALENDAR</p>
                  <p className="text-white/30 text-xs font-body mt-0.5">Connected ✓</p>
                </div>
              </div>
              <button
                onClick={toggleCalendarSync}
                disabled={savingCalendar}
                className={`w-12 h-7 rounded-full relative transition-colors duration-300 ${
                  calendarSync ? 'bg-lime/20 border border-lime/40' : 'bg-white/5 border border-white/10'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full absolute top-1/2 -translate-y-1/2 transition-all duration-300 flex items-center justify-center ${
                    calendarSync ? 'left-6 bg-lime text-black' : 'left-1 bg-white/20'
                  }`}
                />
              </button>
            </div>
            {calendarSync && (
              <p className="text-lime/50 text-xs font-body mt-2">Reload transactions will appear as calendar events</p>
            )}
          </div>

          {/* Alert Settings */}
          <div className="mb-5 p-3 rounded-xl border border-white/10 bg-white/[0.02]">
            <p className="text-white/50 text-xs font-display tracking-widest mb-3">ALERT SETTINGS</p>
            
            {/* High Usage Alert */}
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-white/5">
              <div>
                <p className="text-white/80 text-xs font-body">High Usage Alert</p>
                <p className="text-white/30 text-xs font-body">Notify when daily usage exceeds estimate</p>
                {highUsageAlert && (
                  <div className="flex items-center gap-2 mt-1.5">
                    <input
                      type="number"
                      value={highUsageThreshold}
                      onChange={e => setHighUsageThreshold(parseFloat(e.target.value) || 150)}
                      className="w-14 bg-white/5 border border-white/10 rounded px-1.5 py-0.5 text-white text-xs text-center font-body focus:outline-none focus:border-amber/50"
                    />
                    <span className="text-white/30 text-xs font-body">% of estimate</span>
                  </div>
                )}
              </div>
              <button
                onClick={() => {
                  const newVal = !highUsageAlert;
                  setHighUsageAlert(newVal);
                  saveAlertSettings({ high_usage_alert_enabled: newVal, high_usage_threshold_percent: highUsageThreshold });
                }}
                className={`w-12 h-7 rounded-full relative transition-colors duration-300 flex-shrink-0 ${
                  highUsageAlert ? 'bg-lime/20 border border-lime/40' : 'bg-white/5 border border-white/10'
                }`}
              >
                <div className={`w-5 h-5 rounded-full absolute top-1/2 -translate-y-1/2 transition-all duration-300 ${
                  highUsageAlert ? 'left-6 bg-lime' : 'left-1 bg-white/20'
                }`} />
              </button>
            </div>

            {/* Log Reminders */}
            <p className="text-white/30 text-xs font-body mb-2">Log Reading Reminders</p>
            {[
              { label: '9:00 AM', state: reminder9am, setter: setReminder9am, field: 'reminder_9am' },
              { label: '12:00 PM', state: reminder12pm, setter: setReminder12pm, field: 'reminder_12pm' },
              { label: '4:00 PM', state: reminder4pm, setter: setReminder4pm, field: 'reminder_4pm' },
              { label: '8:00 PM', state: reminder8pm, setter: setReminder8pm, field: 'reminder_8pm' },
            ].map(({ label, state, setter, field }) => (
              <div key={field} className="flex items-center justify-between py-1.5">
                <span className="text-white/60 text-xs font-body">{label}</span>
                <button
                  onClick={() => {
                    const newVal = !state;
                    setter(newVal);
                    saveAlertSettings({ [field]: newVal });
                  }}
                  className={`w-10 h-6 rounded-full relative transition-colors duration-300 flex-shrink-0 ${
                    state ? 'bg-lime/20 border border-lime/40' : 'bg-white/5 border border-white/10'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full absolute top-1/2 -translate-y-1/2 transition-all duration-300 ${
                    state ? 'left-5 bg-lime' : 'left-0.5 bg-white/20'
                  }`} />
                </button>
              </div>
            ))}
          </div>

          {/* Notification Mode */}
          <div className="mb-5 p-3 rounded-xl border border-white/10 bg-white/[0.02]">
            <p className="text-white/50 text-xs font-display tracking-widest mb-3">NOTIFICATION DELIVERY</p>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { value: 'email', label: 'Email' },
                { value: 'inapp', label: 'In-App' },
                { value: 'both', label: 'Both' },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => {
                    setNotificationMode(value);
                    saveAlertSettings({ notification_mode: value });
                  }}
                  className={`py-2 rounded-lg font-display text-xs transition-all ${
                    notificationMode === value
                      ? 'bg-lime text-black'
                      : 'bg-white/5 text-white/40 hover:text-white/70 hover:bg-white/10'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="text-white/25 text-xs font-body mt-2">
              {notificationMode === 'email' && 'Alerts sent via email only'}
              {notificationMode === 'inapp' && 'Alerts shown while app is open'}
              {notificationMode === 'both' && 'Email + in-app notifications'}
            </p>
          </div>

          {/* Edit name form */}
          <form onSubmit={handleSave} className="space-y-4 mb-6">
            <div>
              <label className="text-white/50 text-xs font-display tracking-widest block mb-2">DISPLAY NAME</label>
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Your name"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white font-body focus:outline-none focus:border-lime/50 transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={saving || !displayName.trim()}
              className="w-full bg-lime text-black font-display py-2.5 rounded-lg hover:bg-lime/90 transition-all lime-glow disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saved ? <><CheckCircle className="w-4 h-4" /> SAVED</> : saving ? 'SAVING...' : <><Save className="w-4 h-4" /> SAVE NAME</>}
            </button>
          </form>

          {/* Location / Address */}
          <div className="mb-5 p-3 rounded-xl border border-white/10 bg-white/[0.02]">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-3.5 h-3.5 text-lime" />
              <p className="text-white/50 text-xs font-display tracking-widest">LOCATION</p>
            </div>
            <div className="space-y-2">
              <input
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="Street address"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-body focus:outline-none focus:border-lime/50 transition-colors"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  placeholder="City / Suburb"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-body focus:outline-none focus:border-lime/50 transition-colors"
                />
                <select
                  value={province}
                  onChange={e => setProvince(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-body focus:outline-none focus:border-lime/50 transition-colors"
                >
                  <option value="">Province</option>
                  <option value="Eastern Cape">Eastern Cape</option>
                  <option value="Free State">Free State</option>
                  <option value="Gauteng">Gauteng</option>
                  <option value="KwaZulu-Natal">KwaZulu-Natal</option>
                  <option value="Limpopo">Limpopo</option>
                  <option value="Mpumalanga">Mpumalanga</option>
                  <option value="North West">North West</option>
                  <option value="Northern Cape">Northern Cape</option>
                  <option value="Western Cape">Western Cape</option>
                </select>
              </div>
              <button
                onClick={saveLocation}
                disabled={savingLocation}
                className="w-full bg-lime/20 border border-lime/40 text-lime font-display text-xs py-2 rounded-lg hover:bg-lime/30 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {savedLocation ? <><CheckCircle className="w-3.5 h-3.5" /> SAVED</> : savingLocation ? 'SAVING...' : <><Save className="w-3.5 h-3.5" /> SAVE LOCATION</>}
              </button>
            </div>
          </div>

          {/* Info */}
          <div className="border-t border-white/5 pt-4 space-y-2 mb-5">
            <div className="flex justify-between items-center">
              <span className="text-white/30 text-xs font-body">ROLE</span>
              <span className="text-white/60 text-xs font-display uppercase">{user?.role || 'user'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/30 text-xs font-body">MEMBER SINCE</span>
              <span className="text-white/60 text-xs font-display">
                {user?.created_date ? new Date(user.created_date).getFullYear() : '—'}
              </span>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-red-500/30 text-red-400 font-display text-sm hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            SIGN OUT
          </button>

        </div>
      </div>
    </div>
  );
}