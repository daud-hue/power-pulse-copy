import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import Onboarding from './Onboarding';
import Dashboard from './Dashboard';

export default function Home() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadSettings = async () => {
    const all = await base44.entities.UserSettings.list('-created_date', 1);
    setSettings(all[0] || null);
    setLoading(false);
  };

  useEffect(() => {
    loadSettings();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#000000' }}>
        <div className="w-12 h-12 border-4 border-lime/20 border-t-lime rounded-full animate-spin" />
      </div>
    );
  }

  if (!settings || !settings.onboarding_complete) {
    return <Onboarding onComplete={loadSettings} />;
  }

  return <Dashboard settings={settings} onSettingsChange={loadSettings} />;
}