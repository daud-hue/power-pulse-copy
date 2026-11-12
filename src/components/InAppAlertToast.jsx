import { useEffect, useRef, useState } from 'react';
import { X, Zap, Bell } from 'lucide-react';

export default function InAppAlertToast({ notifications, onDismiss }) {
  const [visible, setVisible] = useState([]);
  const timersRef = useRef({});

  useEffect(() => {
    const newItems = notifications.filter(n => !visible.find(v => v.id === n.id));
    if (newItems.length === 0) return;

    setVisible(prev => [...prev, ...newItems]);

    newItems.forEach(n => {
      timersRef.current[n.id] = setTimeout(() => {
        setVisible(prev => prev.filter(v => v.id !== n.id));
      }, 8000);
    });

    return () => {
      Object.values(timersRef.current).forEach(clearTimeout);
    };
  }, [notifications]);

  const handleDismiss = (n) => {
    clearTimeout(timersRef.current[n.id]);
    setVisible(prev => prev.filter(v => v.id !== n.id));
    onDismiss(n);
  };

  if (visible.length === 0) return null;

  return (
    <div className="fixed bottom-24 right-6 z-50 space-y-2 max-w-sm w-full pointer-events-none">
      {visible.map((n) => (
        <div
          key={n.id}
          className="pointer-events-auto card-dark border border-lime/30 rounded-xl p-4 animate-fade-in shadow-lg shadow-lime/10"
          style={{ background: 'rgba(10,15,0,0.97)' }}
        >
          <div className="flex items-start gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
              n.type === 'high_usage' ? 'bg-amber/20' : 'bg-lime/20'
            }`}>
              {n.type === 'high_usage' ? (
                <Zap className="w-4 h-4 text-amber" />
              ) : (
                <Bell className="w-4 h-4 text-lime" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-display tracking-wide">{n.title}</p>
              <p className="text-white/50 text-xs font-body mt-1 line-clamp-2">{n.message}</p>
            </div>
            <button
              onClick={() => handleDismiss(n)}
              className="text-white/30 hover:text-white flex-shrink-0 mt-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}