import { useState, useEffect, useCallback, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Zap, RefreshCw, History, Lightbulb, BarChart2, Cpu, TrendingUp, ClipboardList, User, Sparkles } from 'lucide-react';
import CountdownRing from '@/components/CountdownRing';
import ReloadModal from '@/components/ReloadModal';
import AlertBanner from '@/components/AlertBanner';
import StatCards from '@/components/StatCards';
import ConsumptionChart from '@/components/ConsumptionChart';
import ConsumptionBreakdown from '@/components/ConsumptionBreakdown';
import SavingTips from '@/components/SavingTips';
import ReloadHistory from '@/components/ReloadHistory';
import NotificationPermissionBanner from '@/components/NotificationPermissionBanner';
import PeakHoursPanel from '@/components/PeakHoursPanel';
import MonthlySpendChart from '@/components/MonthlySpendChart';
import DeviceManager from '@/components/DeviceManager';
import ManualLogModal from '@/components/ManualLogModal';
import ProfilePanel from '@/components/ProfilePanel';
import BalanceSummaryCard from '@/components/BalanceSummaryCard';
import InAppAlertToast from '@/components/InAppAlertToast';
import DeviceUsageBreakdown from '@/components/DeviceUsageBreakdown';
import ExportLogsButton from '@/components/ExportLogsButton';
import BudgetTracker from '@/components/BudgetTracker';
import BudgetPredictor from '@/components/BudgetPredictor';
import UsageCalendar from '@/components/UsageCalendar';
import DraggableReloadButton from '@/components/DraggableReloadButton';
import EskomCalculator from '@/components/EskomCalculator';
import SmartTips from '@/components/SmartTips';
import AIChat from '@/components/AIChat';
import {
  registerServiceWorker,
  checkBalanceAndNotify,
  getNotificationPermission,
  markThresholdNotified,
  wasThresholdNotified,
  clearNotifiedThresholds } from
'@/lib/notifications';

const TABS = [
{ id: 'overview', label: 'OVERVIEW', icon: BarChart2 },
{ id: 'devices', label: 'DEVICES', icon: Cpu },
{ id: 'budget', label: 'BUDGET', icon: TrendingUp },
{ id: 'history', label: 'HISTORY', icon: History },
{ id: 'tips', label: 'TIPS', icon: Lightbulb }];


export default function Dashboard({ settings, onSettingsChange }) {
  const [balance, setBalance] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [logs, setLogs] = useState([]);
  const [tips, setTips] = useState([]);
  const [showReload, setShowReload] = useState(false);
  const [showManualLog, setShowManualLog] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [lastSync, setLastSync] = useState(null);
  const notifiedRef = useRef(new Set());
  const [appNotifications, setAppNotifications] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);

  // Register SW on mount and listen for OPEN_RELOAD messages
  useEffect(() => {
    registerServiceWorker();
    const handleSWMessage = (event) => {
      if (event.data?.type === 'OPEN_RELOAD') setShowReload(true);
    };
    navigator.serviceWorker?.addEventListener('message', handleSWMessage);
    return () => navigator.serviceWorker?.removeEventListener('message', handleSWMessage);
  }, []);

  // Handle ?action=reload in URL (from notification click)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('action') === 'reload') {
      setShowReload(true);
      window.history.replaceState({}, '', '/');
    }
  }, []);

  // Get current user ID for notification filtering
  useEffect(() => {
    base44.auth.me().then(u => setCurrentUserId(u?.id || null));
  }, []);

  // Subscribe to AppNotification for in-app alerts
  useEffect(() => {
    const unsubscribe = base44.entities.AppNotification.subscribe((event) => {
      if (event.type === 'create' && event.data && !event.data.dismissed) {
        if (event.data.user_id === currentUserId) {
          setAppNotifications(prev => [...prev, event.data]);
        }
      }
    });
    return unsubscribe;
  }, [currentUserId]);

  // Also poll for existing undismissed notifications
  useEffect(() => {
    if (!currentUserId) return;
    const fetchExisting = async () => {
      const existing = await base44.entities.AppNotification.filter({ dismissed: false, user_id: currentUserId }, '-created_date', 10);
      if (existing.length > 0) {
        setAppNotifications(prev => {
          const ids = new Set(prev.map(n => n.id));
          const fresh = existing.filter(n => !ids.has(n.id));
          return [...fresh, ...prev];
        });
      }
    };
    fetchExisting();
    const interval = setInterval(fetchExisting, 60000);
    return () => clearInterval(interval);
  }, [currentUserId]);

  const dismissNotification = async (n) => {
    await base44.entities.AppNotification.update(n.id, { dismissed: true });
    setAppNotifications(prev => prev.filter(x => x.id !== n.id));
  };

  const triggerNotifications = useCallback((bal, stg) => {
    if (getNotificationPermission() !== 'granted' || !bal || !stg) return;
    const currentKwh = bal.current_kwh || 0;
    const maxKwh = bal.initial_kwh || currentKwh;
    const dailyKwh = bal.estimated_daily_kwh || stg.daily_kwh_estimate || 10;
    const daysRemaining = dailyKwh > 0 ? currentKwh / dailyKwh : 0;
    const thresholds = stg.alert_thresholds || [20, 10, 5];
    const cycleId = bal.cycle_start || bal.id;
    clearNotifiedThresholds('prev');
    checkBalanceAndNotify({ currentKwh, maxKwh, thresholds, daysRemaining });
    const percent = maxKwh > 0 ? currentKwh / maxKwh * 100 : 100;
    const sortedThresholds = [...thresholds].sort((a, b) => b - a);
    const triggered = sortedThresholds.find((t) => percent <= t);
    if (triggered && !wasThresholdNotified(triggered, cycleId)) {
      markThresholdNotified(triggered, cycleId);
    }
  }, []);

  const loadData = useCallback(async () => {
    const [balances, txs, consumptionLogs, savingTips] = await Promise.all([
    base44.entities.ElectricityBalance.list('-updated_date', 1),
    base44.entities.ReloadTransaction.list('-created_date', 20),
    base44.entities.DailyConsumptionLog.list('-log_date', 30),
    base44.entities.SavingTip.filter({ dismissed: false }, '-priority', 10)]
    );
    const bal = balances[0] || null;
    setBalance(bal);
    setTransactions(txs);
    setLogs(consumptionLogs);
    setTips(savingTips);
    setLastSync(new Date());
    setLoading(false);
    if (bal) {
      await updateBalanceForElapsedTime(bal, settings);
      triggerNotifications(bal, settings);
    }
  }, [settings]);

  const updateBalanceForElapsedTime = async (bal, stg) => {
    if (!bal || !bal.last_updated) return;
    const dailyKwh = bal.estimated_daily_kwh || stg?.daily_kwh_estimate || 10;
    const hourlyKwh = dailyKwh / 24;
    const lastUpdated = new Date(bal.last_updated);
    const now = new Date();
    const hoursElapsed = (now - lastUpdated) / (1000 * 60 * 60);
    if (hoursElapsed < 0.25) return;
    const kwhUsed = hourlyKwh * hoursElapsed;
    const newKwh = Math.max(0, bal.current_kwh - kwhUsed);
    if (Math.abs(newKwh - bal.current_kwh) > 0.01) {
      await base44.entities.ElectricityBalance.update(bal.id, {
        current_kwh: newKwh,
        last_updated: now.toISOString()
      });
      setBalance((prev) => ({ ...prev, current_kwh: newKwh, last_updated: now.toISOString() }));
      const todayStr = now.toISOString().split('T')[0];
      const existingLog = logs.find((l) => l.log_date === todayStr);
      if (!existingLog && hoursElapsed <= 24) {
        const dayName = now.toLocaleDateString('en-ZA', { weekday: 'long' });
        await base44.entities.DailyConsumptionLog.create({
          log_date: todayStr,
          kwh_used: kwhUsed,
          balance_start: bal.current_kwh,
          balance_end: newKwh,
          day_of_week: dayName
        });
      }
      await refineEstimate(bal, stg);
    }
  };

  const refineEstimate = async (bal, stg) => {
    const txs = await base44.entities.ReloadTransaction.list('-created_date', 10);
    if (txs.length < 2) return;
    const rates = [];
    for (let i = 0; i < Math.min(txs.length - 1, 5); i++) {
      const t1 = txs[i];
      const t0 = txs[i + 1];
      if (!t1.created_date || !t0.created_date) continue;
      const elapsed = (new Date(t0.created_date) - new Date(t1.created_date)) / (1000 * 60 * 60 * 24);
      if (elapsed <= 0) continue;
      const kwhConsumed = (t0.balance_after || 0) - (t1.balance_before || 0);
      if (kwhConsumed <= 0) continue;
      const dailyRate = Math.abs(kwhConsumed) / elapsed;
      if (dailyRate > 0 && dailyRate < 100) rates.push(dailyRate);
    }
    if (rates.length === 0) return;
    const weights = rates.map((_, i) => rates.length - i);
    const weightedSum = rates.reduce((s, r, i) => s + r * weights[i], 0);
    const weightTotal = weights.reduce((s, w) => s + w, 0);
    const refined = weightedSum / weightTotal;
    if (Math.abs(refined - bal.estimated_daily_kwh) > 0.5) {
      await base44.entities.ElectricityBalance.update(bal.id, {
        estimated_daily_kwh: parseFloat(refined.toFixed(2))
      });
    }
  };

  const dismissTip = async (tipId) => {
    await base44.entities.SavingTip.update(tipId, { dismissed: true });
    setTips((prev) => prev.filter((t) => t.id !== tipId));
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Real-time cloud sync: subscribe to all key entities so changes from
  // other devices instantly refresh this device's UI
  useEffect(() => {
    const handler = () => loadData();
    const unsubs = [
      base44.entities.ElectricityBalance.subscribe(handler),
      base44.entities.ReloadTransaction.subscribe(handler),
      base44.entities.DailyConsumptionLog.subscribe(handler),
      base44.entities.SavingTip.subscribe(handler),
      base44.entities.Device.subscribe(handler),
      base44.entities.UserSettings.subscribe(handler),
    ];
    return () => unsubs.forEach(u => u && u());
  }, [loadData]);

  const maxKwh = balance?.initial_kwh || balance?.current_kwh || 100;
  const dailyKwh = balance?.estimated_daily_kwh || settings?.daily_kwh_estimate || 10;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#000000' }}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-lime/20 border-t-lime rounded-full animate-spin mx-auto mb-4" />
          <p className="text-lime font-display tracking-widest text-sm">LOADING POWER DATA...</p>
        </div>
      </div>);

  }

  return (
    <div className="min-h-screen" style={{ background: '#000000' }}>

      {/* ── TOP COMMAND BAR ── */}
      <header
        className="sticky top-0 z-30 px-6 h-14 flex items-center justify-between"
        style={{ background: 'rgba(0,0,0,0.97)', backdropFilter: 'blur(16px)', borderBottom: '1px solid #1a1a1a' }}>
        
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-lime rounded-md flex items-center justify-center">
            <Zap className="w-4 h-4 text-black" fill="black" />
          </div>
          <span className="font-display text-xl text-lime lime-glow-text tracking-widest">POWER PULSE</span>
          
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2">
          {lastSync &&
          <span className="hidden sm:flex items-center gap-1.5 text-white/25 text-xs font-body">
              <span className="w-1.5 h-1.5 rounded-full bg-lime animate-pulse" />
              SYNCED {lastSync.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}
            </span>
          }
          <button
            onClick={loadData}
            className="w-8 h-8 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center hover:border-lime/40 transition-colors group">
            <RefreshCw className="w-3.5 h-3.5 text-white/40 group-hover:text-lime transition-colors" />
          </button>
          <button
            onClick={() => setShowManualLog(true)}
            title="Log meter reading"
            className="bg-white/5 border border-white/10 text-white/70 font-display text-xs px-3 py-2 rounded-lg flex items-center gap-1.5 hover:border-lime/40 hover:text-lime transition-all">
            <ClipboardList className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">LOG</span>
          </button>
          <button
            onClick={() => setShowChat(true)}
            title="Ask AI"
            className="w-8 h-8 bg-lime/10 border border-lime/30 rounded-lg flex items-center justify-center hover:bg-lime/20 transition-colors group lime-glow">
            <Sparkles className="w-3.5 h-3.5 text-lime" />
          </button>
          <button
            onClick={() => setShowProfile(true)}
            title="Profile"
            className="w-8 h-8 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center hover:border-lime/40 transition-colors group">
            <User className="w-3.5 h-3.5 text-white/40 group-hover:text-lime transition-colors" />
          </button>
        </div>
      </header>

      {/* ── MAIN LAYOUT ── */}
      <div className="flex h-[calc(100vh-56px)]">

        {/* ── LEFT SIDEBAR (desktop) ── */}
        <aside className="hidden lg:flex flex-col w-64 xl:w-72 flex-shrink-0 border-r border-card-border overflow-y-auto p-4 gap-3">
          {/* Balance ring */}
          <div className="card-dark p-5 flex flex-col items-center">
            <p className="font-display text-white/40 text-xs tracking-widest mb-4">COUNTDOWN</p>
            <CountdownRing
              currentKwh={balance?.current_kwh || 0}
              estimatedDailyKwh={dailyKwh}
              maxKwh={maxKwh} />
            
            <div className="w-full mt-4 pt-3 border-t border-white/5 grid grid-cols-2 gap-2 text-center">
              <div>
                <p className="text-white/30 text-xs font-body">BALANCE</p>
                <p className="font-display text-lime">{(balance?.current_kwh || 0).toFixed(1)} kWh</p>
              </div>
              <div>
                <p className="text-white/30 text-xs font-body">DAILY USE</p>
                <p className="font-display text-white">{dailyKwh.toFixed(1)} kWh</p>
              </div>
            </div>
          </div>

          {/* Peak hours */}
          <PeakHoursPanel />

          {/* Notifications */}
          <NotificationPermissionBanner onPermissionChange={() => triggerNotifications(balance, settings)} />

          {/* Alert */}
          <AlertBanner balance={balance} settings={settings} />
        </aside>

        {/* ── CENTRE CONTENT ── */}
        <main className="flex-1 overflow-y-auto">
          {/* Mobile: ring + alert + peak (stacked) */}
          <div className="lg:hidden px-4 pt-4 space-y-3">
            <NotificationPermissionBanner onPermissionChange={() => triggerNotifications(balance, settings)} />
            <AlertBanner balance={balance} settings={settings} />
            <div className="card-dark p-5 flex flex-col items-center">
              <p className="font-display text-white/40 text-xs tracking-widest mb-3">ELECTRICITY COUNTDOWN</p>
              <CountdownRing
                currentKwh={balance?.current_kwh || 0}
                estimatedDailyKwh={dailyKwh}
                maxKwh={maxKwh}
                size={180} />
              
              <div className="w-full mt-4 pt-3 border-t border-white/5 flex justify-between text-center">
                <div>
                  <p className="text-white/30 text-xs font-body">BALANCE</p>
                  <p className="font-display text-lime">{(balance?.current_kwh || 0).toFixed(1)} kWh</p>
                </div>
                <div>
                  <p className="text-white/30 text-xs font-body">DAILY USE</p>
                  <p className="font-display text-white">{dailyKwh.toFixed(1)} kWh</p>
                </div>
                <div>
                  <p className="text-white/30 text-xs font-body">SYNC</p>
                  <p className="font-display text-white/50 text-sm">
                    {lastSync ? lastSync.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' }) : '—'}
                  </p>
                </div>
              </div>
            </div>
            <PeakHoursPanel />
          </div>

          {/* TAB NAV */}
          <div className="sticky top-0 z-20 px-4 lg:px-6 pt-4 pb-2" style={{ background: 'rgba(0,0,0,0.95)' }}>
            <div className="flex gap-1 bg-black/40 rounded-xl p-1 border border-card-border overflow-x-auto">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 min-w-fit flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg font-display text-xs transition-all whitespace-nowrap ${
                    activeTab === tab.id ?
                    'bg-lime text-black' :
                    'text-white/40 hover:text-white/70'}`
                    }>
                    
                    <Icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>);

              })}
            </div>
          </div>

          {/* TAB CONTENT */}
          <div className="px-4 lg:px-6 pb-10 pt-3">

            {activeTab === 'overview' &&
            <div className="space-y-4 animate-fade-in">
                <BalanceSummaryCard
                balance={balance}
                logs={logs}
                dailyKwh={dailyKwh}
                onLogReading={() => setShowManualLog(true)} />
                <StatCards balance={balance} settings={settings} transactions={transactions} />
                <ConsumptionChart logs={logs} dailyKwh={dailyKwh} />
                <ConsumptionBreakdown dailyKwh={dailyKwh} />
                <DeviceUsageBreakdown balance={balance} settings={settings} transactions={transactions} />
              </div>
            }

            {activeTab === 'devices' &&
            <div className="animate-fade-in">
                <DeviceManager transactions={transactions} />
              </div>
            }

            {activeTab === 'budget' &&
            <div className="animate-fade-in space-y-4">
                <BudgetTracker
                settings={settings}
                transactions={transactions}
                onSettingsChange={onSettingsChange} />
                <BudgetPredictor
                transactions={transactions}
                settings={settings}
                balance={balance} />
                <EskomCalculator
                transactions={transactions}
                balance={balance}
                settings={settings}
                dailyKwh={dailyKwh} />
                <MonthlySpendChart
                transactions={transactions}
                balance={balance}
                settings={settings} />
                <ExportLogsButton logs={logs} transactions={transactions} />
              </div>
            }

            {activeTab === 'history' &&
            <div className="animate-fade-in space-y-4">
                <UsageCalendar logs={logs} dailyKwh={dailyKwh} />
                <ReloadHistory transactions={transactions} />
                <ExportLogsButton logs={logs} transactions={transactions} />
              </div>
            }

            {activeTab === 'tips' &&
            <div className="animate-fade-in space-y-4">
                <SmartTips
                logs={logs}
                transactions={transactions}
                balance={balance}
                dailyKwh={dailyKwh} />
                <SavingTips tips={tips} onDismiss={dismissTip} />
                {tips.filter((t) => !t.dismissed).length === 0 &&
              <div className="card-dark p-8 text-center">
                    <Lightbulb className="w-12 h-12 text-lime/30 mx-auto mb-3" />
                    <p className="font-display text-white/40 text-lg">ALL TIPS DISMISSED</p>
                    <p className="text-white/20 text-sm font-body mt-1">Great job! Check back for new insights.</p>
                  </div>
              }
              </div>
            }

          </div>
        </main>

        {/* ── RIGHT SIDEBAR (xl screens) ── */}
        <aside className="hidden xl:flex flex-col w-72 flex-shrink-0 border-l border-card-border overflow-y-auto p-4 gap-3">
          <MonthlySpendChart
            transactions={transactions}
            balance={balance}
            settings={settings} />
          
          <ReloadHistory transactions={transactions} />
        </aside>

      </div>

      {/* Reload Modal */}
      {showReload &&
      <ReloadModal
        balance={balance}
        settings={settings}
        onClose={() => setShowReload(false)}
        onReloaded={loadData} />
      }

      {/* Manual Log Modal */}
      {showManualLog &&
      <ManualLogModal
        balance={balance}
        onClose={() => setShowManualLog(false)}
        onLogged={loadData} />
      }

      {/* Profile Panel */}
      {showProfile &&
      <ProfilePanel onClose={() => setShowProfile(false)} />
      }

      {/* AI Chat */}
      {showChat &&
      <AIChat
        balance={balance}
        settings={settings}
        transactions={transactions}
        logs={logs}
        onClose={() => setShowChat(false)} />
      }

      {/* In-App Alert Toasts */}
      <InAppAlertToast
        notifications={appNotifications}
        onDismiss={dismissNotification}
      />

      {/* Floating Reload Button */}
      <DraggableReloadButton onClick={() => setShowReload(true)} />
    </div>);

}