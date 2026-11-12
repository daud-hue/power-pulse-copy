import { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Send, Sparkles, Zap, TrendingUp, Lightbulb, Wallet } from 'lucide-react';

const SUGGESTED_PROMPTS = [
  { icon: Zap, text: 'How much electricity do I have left?' },
  { icon: TrendingUp, text: 'When will I run out of power?' },
  { icon: Wallet, text: 'How can I reduce my monthly spend?' },
  { icon: Lightbulb, text: 'Which devices use the most energy?' },
];

export default function AIChat({ balance, settings, transactions, logs, onClose }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm your Power Pulse AI assistant. Ask me anything about your electricity usage, costs, or how to save energy.",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const buildContext = () => {
    const currentKwh = balance?.current_kwh || 0;
    const initialKwh = balance?.initial_kwh || currentKwh;
    const dailyKwh = balance?.estimated_daily_kwh || settings?.daily_kwh_estimate || 10;
    const daysLeft = dailyKwh > 0 ? (currentKwh / dailyKwh).toFixed(1) : 'unknown';
    const recentTx = (transactions || []).slice(0, 5).map(t => ({
      date: t.created_date ? new Date(t.created_date).toLocaleDateString() : 'unknown',
      kwh: t.kwh_added,
      zar: t.amount_paid_zar,
    }));
    const recentLogs = (logs || []).slice(0, 7).map(l => ({
      date: l.log_date,
      kwh: l.kwh_used,
    }));
    const budget = settings?.monthly_budget_zar || 0;

    return `You are an AI assistant for a prepaid electricity tracking app called Power Pulse (South Africa, currency ZAR).
User data context:
- Current balance: ${currentKwh.toFixed(1)} kWh
- Balance at start of cycle: ${initialKwh.toFixed(1)} kWh
- Estimated daily consumption: ${dailyKwh.toFixed(1)} kWh/day
- Estimated days remaining: ${daysLeft} days
- Monthly budget: R${budget}
- Recent reloads (most recent first): ${JSON.stringify(recentTx)}
- Recent daily consumption logs: ${JSON.stringify(recentLogs)}

Answer the user's question concisely and helpfully, using this data. Use ZAR for money. Keep responses under 150 words. Be friendly and practical.`;
  };

  const send = async (text) => {
    const msg = text.trim();
    if (!msg || loading) return;

    const newMessages = [...messages, { role: 'user', content: msg }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `${buildContext()}\n\nUser question: ${msg}`,
      });
      setMessages([...newMessages, { role: 'assistant', content: res }]);
    } catch (err) {
      setMessages([...newMessages, { role: 'assistant', content: 'Sorry, I had trouble connecting. Please try again.' }]);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md h-full card-dark border-l border-card-border flex flex-col animate-fade-in"
        style={{ background: '#050505' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 h-14 flex items-center justify-between border-b border-card-border flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-lime rounded-md flex items-center justify-center lime-glow">
              <Sparkles className="w-4 h-4 text-black" />
            </div>
            <div>
              <p className="font-display text-white text-sm tracking-widest">POWER PULSE AI</p>
              <p className="text-white/30 text-xs font-body">Your electricity assistant</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((m, i) => (
            <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
              <div
                className={
                  m.role === 'user'
                    ? 'bg-lime text-black rounded-2xl rounded-br-sm px-3.5 py-2.5 max-w-[80%]'
                    : 'bg-white/5 border border-white/10 text-white/90 rounded-2xl rounded-bl-sm px-3.5 py-2.5 max-w-[85%]'
                }
              >
                <p className="text-sm font-body whitespace-pre-wrap">{m.content}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white/5 border border-white/10 rounded-2xl rounded-bl-sm px-3.5 py-3">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-lime rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-lime rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-lime rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          {/* Suggested prompts (only on first message) */}
          {messages.length === 1 && !loading && (
            <div className="pt-2 space-y-2">
              <p className="text-white/30 text-xs font-display tracking-widest px-1">SUGGESTED QUESTIONS</p>
              {SUGGESTED_PROMPTS.map(({ icon: Icon, text }) => (
                <button
                  key={text}
                  onClick={() => send(text)}
                  className="w-full flex items-center gap-2.5 bg-white/[0.03] border border-white/10 hover:border-lime/40 hover:bg-lime/5 rounded-lg px-3 py-2.5 text-left transition-all group"
                >
                  <Icon className="w-4 h-4 text-lime/60 group-hover:text-lime transition-colors flex-shrink-0" />
                  <span className="text-white/70 group-hover:text-white text-sm font-body transition-colors">{text}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-3 border-t border-card-border flex-shrink-0">
          <div className="flex gap-2 items-end">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send(input)}
              placeholder="Ask about your usage..."
              disabled={loading}
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3.5 py-2.5 text-white text-sm font-body focus:outline-none focus:border-lime/50 transition-colors disabled:opacity-50"
            />
            <button
              onClick={() => send(input)}
              disabled={!input.trim() || loading}
              className="w-10 h-10 bg-lime text-black rounded-lg flex items-center justify-center hover:bg-lime/90 transition-all disabled:opacity-30 disabled:cursor-not-allowed lime-glow flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}