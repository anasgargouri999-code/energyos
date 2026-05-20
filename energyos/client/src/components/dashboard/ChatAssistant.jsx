import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../../store';
import { chatWithAssistant } from '../../lib/groq';
import {
  Cpu, X, ChevronRight, CornerDownLeft, Zap, AlertTriangle,
  Activity, RotateCcw, ChevronLeft
} from 'lucide-react';

const QUICK_PROMPTS = [
  'Analyser les alertes actives',
  'Zones à risque en ce moment ?',
  'Comment optimiser la consommation ?',
];

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-0.5 ml-1">
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className="w-1 h-1 rounded-full bg-accent-cyan/60"
          style={{ animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }}
        />
      ))}
    </span>
  );
}

export default function ChatAssistant({ zones, liveData, alerts }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const logEndRef = useRef(null);
  const { blackoutMode } = useStore();

  const safeAlerts = Array.isArray(alerts) ? alerts : [];
  const activeAlertCount = safeAlerts.filter(a => !a.acknowledged).length;

  const context = {
    power: liveData?.total_power_kw?.toFixed(1) ?? '--',
    energy: liveData?.today_kwh?.toFixed(1) ?? '--',
    cosPhi: liveData?.cos_phi?.toFixed(2) ?? '--',
    alertCount: activeAlertCount,
    isBlackout: blackoutMode || liveData?.total_power_kw === 0,
    zoneSummary: zones.length > 0
      ? zones.slice(0, 6).map(z => `${z.name.split(' ')[0]}:${z.mode}`).join(' ')
      : 'Aucune zone',
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 120);
      if (messages.length === 0) {
        setMessages([{
          role: 'assistant',
          text: `Interface GTB initialisée.\nSystème : ${context.power} kW · ${activeAlertCount} alerte${activeAlertCount !== 1 ? 's' : ''} active${activeAlertCount !== 1 ? 's' : ''}.\nQue souhaitez-vous analyser ?`,
          ts: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        }]);
      }
    }
  }, [isOpen]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const streamResponse = (fullText, onDone) => {
    const id = Date.now();
    const ts = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    setMessages(prev => [...prev, { role: 'assistant', text: '', ts, id }]);

    let i = 0;
    const interval = setInterval(() => {
      i += 2;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.id !== id) { clearInterval(interval); return prev; }
        return [...prev.slice(0, -1), { ...last, text: fullText.slice(0, i) }];
      });
      if (i >= fullText.length) {
        clearInterval(interval);
        onDone?.();
      }
    }, 12);
  };

  const send = async (text) => {
    const trimmed = (text ?? input).trim();
    if (!trimmed || loading) return;
    setInput('');

    const userMsg = {
      role: 'user',
      text: trimmed,
      ts: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    };
    const history = [...messages, userMsg];
    setMessages(history);
    setLoading(true);

    try {
      const response = await chatWithAssistant(
        history.filter(m => m.role !== 'system'),
        context
      );
      streamResponse(response, () => setLoading(false));
    } catch {
      setMessages(prev => [...prev, {
        role: 'error',
        text: 'Connexion au modèle impossible. Vérifiez la clé VITE_GROQ_API_KEY.',
        ts: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      }]);
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const reset = () => {
    setMessages([]);
    setTimeout(() => {
      setMessages([{
        role: 'assistant',
        text: 'Session réinitialisée. Comment puis-je vous aider ?',
        ts: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      }]);
    }, 80);
  };

  return (
    <>
      {/* ── Trigger tab on right edge ── */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed right-0 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center justify-center gap-1.5 py-5 px-2 bg-bg-surface border border-white/10 border-r-0 rounded-l-xl text-text-muted hover:text-accent-cyan hover:border-accent-cyan/30 transition-all duration-200 group"
          title="GTB Neural Interface (Alt+A)"
          style={{ writingMode: 'vertical-rl' }}
        >
          <Cpu className="w-3.5 h-3.5 rotate-180 group-hover:text-accent-cyan transition-colors" style={{ writingMode: 'initial' }} />
          <span className="text-[9px] font-mono font-bold uppercase tracking-[0.2em] select-none">
            GTB AI
          </span>
          {activeAlertCount > 0 && (
            <span
              className="w-4 h-4 rounded-full bg-accent-red text-white text-[8px] font-bold flex items-center justify-center"
              style={{ writingMode: 'initial' }}
            >
              {activeAlertCount}
            </span>
          )}
        </button>
      )}

      {/* ── Panel ── */}
      {isOpen && (
        <div
          className="fixed right-0 top-0 h-screen z-50 flex flex-col w-[340px] bg-bg-surface border-l border-white/8 shadow-2xl"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/8 flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <Cpu className="w-4 h-4 text-accent-cyan" />
                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-accent-green" />
              </div>
              <div>
                <p className="text-xs font-bold text-text-primary tracking-wider uppercase">
                  GTB Neural Interface
                </p>
                <p className="text-[9px] text-text-muted tracking-widest uppercase">
                  Errachid · Llama 3.1
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={reset}
                className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors"
                title="Nouvelle session"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Context strip */}
          <div className="flex items-center gap-3 px-4 py-2 bg-bg-primary/40 border-b border-white/5 text-[10px] font-mono flex-shrink-0">
            <span className="flex items-center gap-1 text-text-muted">
              <Zap className="w-3 h-3 text-accent-amber" />
              {context.isBlackout
                ? <span className="text-accent-red font-bold tracking-widest">COUPURE</span>
                : <span className="text-text-primary">{context.power} kW</span>
              }
            </span>
            <span className="w-px h-3 bg-white/10" />
            <span className="flex items-center gap-1 text-text-muted">
              <Activity className="w-3 h-3 text-accent-cyan" />
              <span className="text-text-primary">{context.energy} kWh</span>
            </span>
            <span className="w-px h-3 bg-white/10" />
            <span className="flex items-center gap-1">
              <AlertTriangle className={`w-3 h-3 ${activeAlertCount > 0 ? 'text-accent-red' : 'text-text-muted'}`} />
              <span className={activeAlertCount > 0 ? 'text-accent-red font-bold' : 'text-text-muted'}>
                {activeAlertCount} alerte{activeAlertCount !== 1 ? 's' : ''}
              </span>
            </span>
          </div>

          {/* Message log */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-0 scrollbar-thin scrollbar-thumb-white/10">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`py-2.5 border-b border-white/4 last:border-0 ${
                  msg.role === 'user' ? 'pl-0' : 'pl-2'
                }`}
              >
                {msg.role === 'user' ? (
                  <div className="flex items-start gap-2">
                    <ChevronRight className="w-3.5 h-3.5 text-accent-cyan mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-accent-cyan leading-relaxed break-words">
                        {msg.text}
                      </p>
                      <span className="text-[9px] text-text-subtle mt-0.5 block">{msg.ts}</span>
                    </div>
                  </div>
                ) : msg.role === 'error' ? (
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-accent-red mt-0.5 flex-shrink-0" />
                    <p className="text-[11px] text-accent-red leading-relaxed">{msg.text}</p>
                  </div>
                ) : (
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5 w-3.5 h-3.5 flex items-center justify-center flex-shrink-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-accent-cyan/70" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-text-primary leading-relaxed break-words whitespace-pre-wrap">
                        {msg.text}
                      </p>
                      <span className="text-[9px] text-text-subtle mt-0.5 block">{msg.ts}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="py-2.5 flex items-center gap-2 pl-2">
                <div className="w-3.5 h-3.5 flex items-center justify-center flex-shrink-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent-cyan/40 animate-pulse" />
                </div>
                <span className="text-[11px] text-text-muted">
                  Analyse en cours<TypingDots />
                </span>
              </div>
            )}
            <div ref={logEndRef} />
          </div>

          {/* Quick prompts (only when no user messages yet) */}
          {messages.filter(m => m.role === 'user').length === 0 && !loading && (
            <div className="px-3 pb-2 flex flex-wrap gap-1.5 flex-shrink-0">
              {QUICK_PROMPTS.map(p => (
                <button
                  key={p}
                  onClick={() => send(p)}
                  className="text-[9px] font-mono text-text-muted hover:text-accent-cyan border border-white/8 hover:border-accent-cyan/30 px-2.5 py-1 rounded-lg transition-all hover:bg-accent-cyan/5 cursor-pointer"
                >
                  {p}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="px-3 pb-3 pt-2 border-t border-white/8 flex-shrink-0">
            <div className="flex items-center gap-2 bg-bg-elevated border border-white/8 rounded-xl px-3 py-2 focus-within:border-accent-cyan/40 transition-colors">
              <ChevronRight className="w-3.5 h-3.5 text-accent-cyan flex-shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Votre question..."
                disabled={loading}
                className="flex-1 bg-transparent text-[11px] text-text-primary placeholder:text-text-subtle outline-none font-mono disabled:opacity-50"
              />
              <button
                onClick={() => send()}
                disabled={!input.trim() || loading}
                className="flex-shrink-0 p-1 rounded-lg text-text-muted hover:text-accent-cyan disabled:opacity-30 transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                <CornerDownLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
