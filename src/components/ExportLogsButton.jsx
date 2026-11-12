import { useState } from 'react';
import { Download, Loader2, CheckCircle } from 'lucide-react';

function downloadCsv(filename, csv) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function ExportLogsButton({ logs, transactions }) {
  const [exporting, setExporting] = useState(false);
  const [done, setDone] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const rate = 2.85;
      // Monthly consumption summary
      const byMonth = {};
      (logs || []).forEach(l => {
        const d = new Date(l.log_date);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (!byMonth[key]) byMonth[key] = { month: key, totalKwh: 0, days: 0 };
        byMonth[key].totalKwh += l.kwh_used || 0;
        byMonth[key].days += 1;
      });
      const monthly = Object.values(byMonth).sort((a, b) => a.month.localeCompare(b.month));

      // Reload (spend) summary by month
      const spendByMonth = {};
      (transactions || []).forEach(t => {
        const d = new Date(t.created_date);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (!spendByMonth[key]) spendByMonth[key] = { month: key, totalZar: 0, totalKwh: 0, count: 0 };
        spendByMonth[key].totalZar += t.amount_paid_zar || 0;
        spendByMonth[key].totalKwh += t.kwh_added || 0;
        spendByMonth[key].count += 1;
      });
      const spendMonthly = Object.values(spendByMonth).sort((a, b) => a.month.localeCompare(b.month));

      let csv = 'VoltPulse Monthly Consumption Export\n\n';

      csv += 'MONTHLY CONSUMPTION SUMMARY\n';
      csv += 'Month,Total kWh,Days Logged,Avg kWh/Day,Est. Cost (R)\n';
      monthly.forEach(m => {
        const avg = m.days > 0 ? m.totalKwh / m.days : 0;
        csv += `${m.month},${m.totalKwh.toFixed(2)},${m.days},${avg.toFixed(2)},${(m.totalKwh * rate).toFixed(2)}\n`;
      });

      csv += '\nMONTHLY SPEND (RELOADS) SUMMARY\n';
      csv += 'Month,Total Spent (R),Total kWh Bought,Reloads,Avg R/kWh\n';
      spendMonthly.forEach(m => {
        const avgRate = m.totalKwh > 0 ? m.totalZar / m.totalKwh : 0;
        csv += `${m.month},${m.totalZar.toFixed(2)},${m.totalKwh.toFixed(2)},${m.count},${avgRate.toFixed(2)}\n`;
      });

      csv += '\nDAILY CONSUMPTION LOGS\n';
      csv += 'Date,Day,kWh Used,Balance Start,Balance End\n';
      (logs || []).slice().sort((a, b) => a.log_date.localeCompare(b.log_date)).forEach(l => {
        csv += `${l.log_date},${l.day_of_week || ''},${(l.kwh_used || 0).toFixed(2)},${(l.balance_start || 0).toFixed(2)},${(l.balance_end || 0).toFixed(2)}\n`;
      });

      csv += '\nRELOAD TRANSACTIONS\n';
      csv += 'Date,kWh Added,Amount Paid (R),Balance Before,Balance After,Notes\n';
      (transactions || []).forEach(t => {
        const d = new Date(t.created_date).toLocaleDateString('en-ZA');
        csv += `${d},${(t.kwh_added || 0).toFixed(2)},${(t.amount_paid_zar || 0).toFixed(2)},${(t.balance_before || 0).toFixed(2)},${(t.balance_after || 0).toFixed(2)},${(t.notes || '').replace(/,/g, ';')}\n`;
      });

      const stamp = new Date().toISOString().split('T')[0];
      downloadCsv(`voltpulse-consumption-${stamp}.csv`, csv);
      setDone(true);
      setTimeout(() => setDone(false), 2500);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="card-dark p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Download className="w-4 h-4 text-lime" />
        <span className="font-display text-white/60 text-xs tracking-widest">EXPORT CONSUMPTION DATA</span>
      </div>

      <p className="text-white/40 text-xs font-body">
        Download a CSV file with monthly consumption summaries, daily logs, and reload transactions.
      </p>

      <button
        onClick={handleExport}
        disabled={exporting}
        className="w-full bg-lime/15 border border-lime/40 text-lime font-display text-sm py-2.5 rounded-lg hover:bg-lime/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {exporting ? <><Loader2 className="w-4 h-4 animate-spin" /> EXPORTING...</> : done ? <><CheckCircle className="w-4 h-4" /> DOWNLOADED</> : <><Download className="w-4 h-4" /> DOWNLOAD CSV</>}
      </button>
    </div>
  );
}