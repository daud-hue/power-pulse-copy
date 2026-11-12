import { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Camera, Upload, Loader2, CheckCircle, X, RotateCcw, Zap, AlertCircle } from 'lucide-react';

export default function ReloadImageExtractor({ onConfirm }) {
  const [status, setStatus] = useState('idle'); // idle | uploading | extracted | error
  const [errorMsg, setErrorMsg] = useState('');
  const [extracted, setExtracted] = useState({ kwh_added: '', amount_paid_zar: '', notes: '' });
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;
    setStatus('uploading');
    setErrorMsg('');
    try {
      // 1. Upload the image
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      // 2. Ask AI to extract reload details from the receipt
      const result = await base44.integrations.Core.InvokeLLM({
        prompt:
          'You are looking at a prepaid electricity receipt/voucher from a South African municipality or Eskom. ' +
          'Extract the following details:\n' +
          '- kwh_added: the number of kWh units purchased (number only)\n' +
          '- amount_paid_zar: the amount paid in South African Rand (number only)\n' +
          '- notes: any reference number, meter number, or vendor name (short string)\n\n' +
          'If a value is not visible, use 0 for numbers and empty string for notes. ' +
          'Only return the JSON object, no explanation.',
        file_urls: [file_url],
        response_json_schema: {
          type: 'object',
          properties: {
            kwh_added: { type: 'number' },
            amount_paid_zar: { type: 'number' },
            notes: { type: 'string' },
          },
          required: ['kwh_added', 'amount_paid_zar', 'notes'],
        },
      });

      setExtracted({
        kwh_added: result.kwh_added ? String(result.kwh_added) : '',
        amount_paid_zar: result.amount_paid_zar ? String(result.amount_paid_zar) : '',
        notes: result.notes || '',
      });
      setStatus('extracted');
    } catch (err) {
      setErrorMsg('Could not read the receipt. Please enter details manually or try a clearer photo.');
      setStatus('error');
    }
  };

  const reset = () => {
    setStatus('idle');
    setExtracted({ kwh_added: '', amount_paid_zar: '', notes: '' });
    setErrorMsg('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const confirm = () => {
    onConfirm({
      kwh_added: parseFloat(extracted.kwh_added) || 0,
      amount_paid_zar: parseFloat(extracted.amount_paid_zar) || 0,
      notes: extracted.notes || '',
    });
    reset();
  };

  // ── IDLE: show upload options ──
  if (status === 'idle') {
    return (
      <div className="mb-5">
        <p className="text-lime text-xs font-display tracking-widest mb-2 block">SCAN RECEIPT (AI)</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => cameraInputRef.current?.click()}
            className="flex flex-col items-center gap-1.5 bg-lime/10 border border-lime/30 rounded-lg py-3 hover:bg-lime/20 transition-colors"
          >
            <Camera className="w-5 h-5 text-lime" />
            <span className="text-lime text-xs font-display">TAKE PHOTO</span>
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center gap-1.5 bg-white/5 border border-white/10 rounded-lg py-3 hover:bg-white/10 transition-colors"
          >
            <Upload className="w-5 h-5 text-white/60" />
            <span className="text-white/60 text-xs font-display">UPLOAD</span>
          </button>
        </div>
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={e => handleFile(e.target.files?.[0])}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={e => handleFile(e.target.files?.[0])}
        />
      </div>
    );
  }

  // ── UPLOADING: spinner ──
  if (status === 'uploading') {
    return (
      <div className="mb-5 bg-lime/5 border border-lime/20 rounded-lg p-4 flex items-center gap-3">
        <Loader2 className="w-5 h-5 text-lime animate-spin" />
        <div>
          <p className="text-lime text-xs font-display tracking-widest">READING RECEIPT...</p>
          <p className="text-white/40 text-xs font-body">AI is extracting your reload details</p>
        </div>
      </div>
    );
  }

  // ── ERROR ──
  if (status === 'error') {
    return (
      <div className="mb-5 bg-red-500/5 border border-red-500/30 rounded-lg p-4">
        <div className="flex items-start gap-2 mb-2">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-red-400 text-xs font-body">{errorMsg}</p>
        </div>
        <button
          onClick={reset}
          className="flex items-center gap-1.5 text-red-400 text-xs font-display hover:text-red-300 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" /> TRY AGAIN
        </button>
      </div>
    );
  }

  // ── EXTRACTED: review & confirm ──
  return (
    <div className="mb-5 bg-lime/5 border border-lime/30 rounded-lg p-4 animate-fade-in">
      <div className="flex items-center gap-2 mb-3">
        <Zap className="w-4 h-4 text-lime" />
        <p className="text-lime text-xs font-display tracking-widest">AI EXTRACTED — PLEASE VERIFY</p>
      </div>

      <div className="space-y-2.5">
        <div>
          <label className="text-white/40 text-xs font-body block mb-1">kWh Purchased</label>
          <input
            type="number"
            value={extracted.kwh_added}
            onChange={e => setExtracted({ ...extracted, kwh_added: e.target.value })}
            className="w-full bg-black/50 border border-card-border rounded-lg px-3 py-2 text-white text-sm font-body focus:outline-none focus:border-lime transition-colors"
          />
        </div>
        <div>
          <label className="text-white/40 text-xs font-body block mb-1">Amount Paid (ZAR)</label>
          <input
            type="number"
            value={extracted.amount_paid_zar}
            onChange={e => setExtracted({ ...extracted, amount_paid_zar: e.target.value })}
            className="w-full bg-black/50 border border-card-border rounded-lg px-3 py-2 text-white text-sm font-body focus:outline-none focus:border-lime transition-colors"
          />
        </div>
        <div>
          <label className="text-white/40 text-xs font-body block mb-1">Reference / Notes</label>
          <input
            type="text"
            value={extracted.notes}
            onChange={e => setExtracted({ ...extracted, notes: e.target.value })}
            className="w-full bg-black/50 border border-card-border rounded-lg px-3 py-2 text-white text-sm font-body focus:outline-none focus:border-lime transition-colors"
          />
        </div>
      </div>

      <p className="text-white/40 text-xs font-body mt-2.5 mb-3">
        Check the values above — edit any mistakes, then confirm to apply them.
      </p>

      <div className="flex gap-2">
        <button
          onClick={confirm}
          disabled={!extracted.kwh_added || parseFloat(extracted.kwh_added) <= 0}
          className="flex-1 bg-lime text-black font-display text-xs py-2.5 rounded-lg flex items-center justify-center gap-1.5 hover:bg-lime/90 transition-all disabled:opacity-40"
        >
          <CheckCircle className="w-4 h-4" /> CONFIRM & APPLY
        </button>
        <button
          onClick={reset}
          className="px-3 bg-white/5 border border-white/10 text-white/60 font-display text-xs rounded-lg flex items-center gap-1.5 hover:bg-white/10 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" /> RETAKE
        </button>
      </div>
    </div>
  );
}