import { useState } from 'react';
import { Bell, BellOff, X, CheckCircle } from 'lucide-react';
import { requestNotificationPermission, getNotificationPermission } from '@/lib/notifications';

export default function NotificationPermissionBanner({ onPermissionChange }) {
  const [permission, setPermission] = useState(getNotificationPermission());
  const [dismissed, setDismissed] = useState(
    localStorage.getItem('powerpulse_notif_dismissed') === 'true'
  );
  const [requesting, setRequesting] = useState(false);

  if (permission === 'unsupported') return null;
  if (permission === 'granted') return null;
  if (permission === 'denied') return null;
  if (dismissed) return null;

  const handleEnable = async () => {
    setRequesting(true);
    const result = await requestNotificationPermission();
    setPermission(result);
    setRequesting(false);
    onPermissionChange?.(result);
  };

  const handleDismiss = () => {
    localStorage.setItem('powerpulse_notif_dismissed', 'true');
    setDismissed(true);
  };

  return (
    <div className="bg-lime/5 border border-lime/20 rounded-xl p-4 flex items-start gap-3 animate-fade-in">
      <div className="w-9 h-9 bg-lime/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
        <Bell className="w-4 h-4 text-lime" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-display text-white text-sm">ENABLE PUSH NOTIFICATIONS</p>
        <p className="text-white/50 text-xs font-body mt-0.5 leading-relaxed">
          Get alerted when your balance is low — even when the app is closed.
        </p>
        <button
          onClick={handleEnable}
          disabled={requesting}
          className="mt-3 bg-lime text-black font-display text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 hover:bg-lime/90 transition-all disabled:opacity-60"
        >
          <Bell className="w-3.5 h-3.5" />
          {requesting ? 'REQUESTING...' : 'ENABLE ALERTS'}
        </button>
      </div>
      <button onClick={handleDismiss} className="text-white/20 hover:text-white/50 transition-colors flex-shrink-0">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}