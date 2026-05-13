import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, X, Send, Bot, User, KeyRound,
  Trash2, Sparkles, ChevronDown
} from 'lucide-react';
import { sendMessage } from '../services/api';

// ── Suggestion chips shown at start ──────────────────────────────────────────
const SUGGESTIONS = [
  '👋 What can you do?',
  '😟 I feel stressed',
  '🧠 What is AI?',
  '💡 Help me focus',
  '📖 Tell me something interesting',
];

// ── Simple inline markdown renderer (bold, italic, code) ─────────────────────
const RenderText = ({ text }) => {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g);
  return (
    <span>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**'))
          return <strong key={i}>{part.slice(2, -2)}</strong>;
        if (part.startsWith('`') && part.endsWith('`'))
          return (
            <code key={i} style={{
              background: 'rgba(255,255,255,0.08)',
              borderRadius: '4px',
              padding: '1px 5px',
              fontFamily: 'monospace',
              fontSize: '0.85em',
            }}>
              {part.slice(1, -1)}
            </code>
          );
        if (part.startsWith('*') && part.endsWith('*'))
          return <em key={i}>{part.slice(1, -1)}</em>;
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
};

// ── Timestamp helper ─────────────────────────────────────────────────────────
const formatTime = (date) =>
  date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);
  const [apiInputValue, setApiInputValue] = useState('');

  // ── UI messages (what the user sees) ──────────────────────────────────────
  const [messages, setMessages] = useState([
    {
      text: "Hi! I'm **Aura AI** — your intelligent conversational assistant. Ask me anything: technical, educational, casual, or just vent. I'm all ears. 🧠",
      sender: 'bot',
      time: new Date(),
    }
  ]);

  // ── Gemini-format history (sent to backend for context) ───────────────────
  const [history, setHistory] = useState([]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = (behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => { scrollToBottom(); }, [messages, apiKeyMissing, loading]);

  // Clear any old/revoked browser-cached Gemini key — backend now uses its own .env key
  useEffect(() => {
    localStorage.removeItem('gemini_key');
  }, []);

  // API key is optional — backend uses its own GEMINI_API_KEY from .env as fallback.
  // Only prompt if user explicitly wants to use their own key.
  useEffect(() => {
    if (isOpen) {
      // Do NOT block the chat — backend key is always available
      setApiKeyMissing(false);
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // Show scroll-to-bottom button when user scrolls up
  const handleScroll = () => {
    const el = messagesContainerRef.current;
    if (!el) return;
    setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 80);
  };

  const handleSaveKey = (e) => {
    e.preventDefault();
    if (!apiInputValue.trim()) return;
    localStorage.setItem('gemini_key', apiInputValue.trim());
    setApiKeyMissing(false);
    pushBotMessage("API Key saved! ✨ I'm now running at full capacity. What would you like to talk about?");
    inputRef.current?.focus();
  };

  const pushBotMessage = (text) => {
    setMessages(prev => [...prev, { text, sender: 'bot', time: new Date() }]);
  };

  const handleClearChat = () => {
    setHistory([]);
    setMessages([{
      text: "Chat cleared! I'm **Aura AI** — ready to start fresh. What's on your mind? 🧠",
      sender: 'bot',
      time: new Date(),
    }]);
  };

  // ── Core send handler ─────────────────────────────────────────────────────
  const sendUserMessage = async (text) => {
    const userText = text.trim();
    if (!userText) return;
    // No key gate — backend uses its own GEMINI_API_KEY env var as fallback

    // Append user message to UI
    setMessages(prev => [...prev, { text: userText, sender: 'user', time: new Date() }]);
    setInput('');
    setLoading(true);

    try {
      const res = await sendMessage({ message: userText, history });
      const botReply = res.data.reply;

      // Update Gemini-format history with both turns
      setHistory(prev => [
        ...prev,
        { role: 'user',  parts: [{ text: userText }] },
        { role: 'model', parts: [{ text: botReply }] },
      ]);

      pushBotMessage(botReply);
    } catch (err) {
      pushBotMessage("I'm having trouble connecting right now. Please check your network or API Key and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    sendUserMessage(input);
  };

  const handleSuggestion = (chip) => {
    // Strip the emoji prefix for the actual message
    const text = chip.replace(/^[^\s]+ /, '');
    sendUserMessage(text);
  };

  // ── Styles ────────────────────────────────────────────────────────────────
  const gradientHeader = {
    background: 'linear-gradient(135deg, rgba(99,102,241,0.35) 0%, rgba(168,85,247,0.25) 100%)',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && !isMinimized && (
          <motion.div
            key="chatwindow"
            initial={{ opacity: 0, y: 60, scale: 0.88 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 60, scale: 0.88 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            style={{
              position: 'fixed',
              bottom: '88px',
              right: '24px',
              width: 'clamp(320px, 92vw, 420px)',
              background: 'rgba(10,14,30,0.92)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid rgba(99,102,241,0.25)',
              borderRadius: '20px',
              boxShadow: '0 24px 60px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04)',
              display: 'flex',
              flexDirection: 'column',
              zIndex: 50,
              overflow: 'hidden',
              maxHeight: '80vh',
            }}
          >
            {/* ── Header ── */}
            <div style={{ ...gradientHeader, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 0 14px rgba(99,102,241,0.5)',
                }}>
                  <Sparkles size={17} color="white" />
                </div>
                <div>
                  <div style={{ color: 'white', fontWeight: 700, fontSize: '0.95rem', letterSpacing: '-0.01em' }}>Aura AI</div>
                  <div style={{ color: '#a5b4fc', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', display: 'inline-block', boxShadow: '0 0 6px #4ade80' }} />
                    Powered by Gemini
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={handleClearChat}
                  title="Clear chat"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '5px 7px', cursor: 'pointer', color: '#94a3b8', transition: 'all 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
                  onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
                >
                  <Trash2 size={14} />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '5px 7px', cursor: 'pointer', color: '#94a3b8', transition: 'all 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'white'}
                  onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* ── Messages ── */}
            <div
              ref={messagesContainerRef}
              onScroll={handleScroll}
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                minHeight: 0,
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(99,102,241,0.3) transparent',
              }}
            >
              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22 }}
                  style={{ display: 'flex', gap: 10, flexDirection: msg.sender === 'user' ? 'row-reverse' : 'row', alignItems: 'flex-end' }}
                >
                  {/* Avatar */}
                  <div style={{
                    width: 30, height: 30, flexShrink: 0, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: msg.sender === 'user'
                      ? 'linear-gradient(135deg, rgba(168,85,247,0.25), rgba(236,72,153,0.15))'
                      : 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(168,85,247,0.15))',
                    border: `1px solid ${msg.sender === 'user' ? 'rgba(168,85,247,0.3)' : 'rgba(99,102,241,0.3)'}`,
                  }}>
                    {msg.sender === 'user'
                      ? <User size={14} color="#c084fc" />
                      : <Sparkles size={14} color="#818cf8" />}
                  </div>

                  {/* Bubble + timestamp */}
                  <div style={{ maxWidth: '76%', display: 'flex', flexDirection: 'column', alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start', gap: 3 }}>
                    <div style={{
                      padding: '10px 14px',
                      borderRadius: msg.sender === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      fontSize: '0.855rem',
                      lineHeight: 1.6,
                      color: '#e2e8f0',
                      background: msg.sender === 'user'
                        ? 'linear-gradient(135deg, rgba(99,102,241,0.22), rgba(168,85,247,0.18))'
                        : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${msg.sender === 'user' ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.07)'}`,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}>
                      <RenderText text={msg.text} />
                    </div>
                    {msg.time && (
                      <span style={{ fontSize: '0.65rem', color: '#475569', paddingInline: 4 }}>
                        {formatTime(msg.time)}
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}

              {/* API Key setup card */}
              {apiKeyMissing && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    padding: '16px',
                    borderRadius: 14,
                    background: 'rgba(99,102,241,0.08)',
                    border: '1px solid rgba(99,102,241,0.25)',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#818cf8', fontWeight: 600, fontSize: '0.85rem', marginBottom: 8 }}>
                    <KeyRound size={15} /> Gemini API Key Required
                  </div>
                  <p style={{ color: '#94a3b8', fontSize: '0.75rem', marginBottom: 12, lineHeight: 1.55 }}>
                    Enter your Gemini API key to activate full AI capabilities. It's stored locally in your browser — never sent to any server except Gemini's.
                  </p>
                  <form onSubmit={handleSaveKey} style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="password"
                      placeholder="Paste Gemini API Key..."
                      value={apiInputValue}
                      onChange={e => setApiInputValue(e.target.value)}
                      style={{
                        flex: 1, background: 'rgba(0,0,0,0.4)', color: 'white',
                        fontSize: '0.78rem', borderRadius: 10, padding: '8px 12px',
                        border: '1px solid rgba(99,102,241,0.3)', outline: 'none',
                      }}
                    />
                    <button
                      type="submit"
                      disabled={!apiInputValue.trim()}
                      style={{
                        background: 'linear-gradient(135deg,#6366f1,#a855f7)',
                        color: 'white', fontWeight: 600, fontSize: '0.78rem',
                        padding: '8px 14px', borderRadius: 10, border: 'none',
                        cursor: apiInputValue.trim() ? 'pointer' : 'not-allowed',
                        opacity: apiInputValue.trim() ? 1 : 0.5, transition: 'opacity 0.2s',
                      }}
                    >
                      Save
                    </button>
                  </form>
                </motion.div>
              )}

              {/* Typing indicator */}
              {loading && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}
                >
                  <div style={{
                    width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                    background: 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(168,85,247,0.15))',
                    border: '1px solid rgba(99,102,241,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Sparkles size={14} color="#818cf8" />
                  </div>
                  <div style={{
                    padding: '12px 16px', borderRadius: '18px 18px 18px 4px',
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)',
                    display: 'flex', gap: 5, alignItems: 'center',
                  }}>
                    {[0, 150, 300].map(delay => (
                      <motion.span
                        key={delay}
                        animate={{ y: [0, -5, 0] }}
                        transition={{ repeat: Infinity, duration: 0.8, delay: delay / 1000, ease: 'easeInOut' }}
                        style={{ width: 7, height: 7, borderRadius: '50%', background: '#818cf8', display: 'block' }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Scroll-to-bottom button */}
            <AnimatePresence>
              {showScrollBtn && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={() => scrollToBottom()}
                  style={{
                    position: 'absolute', bottom: 110, left: '50%', transform: 'translateX(-50%)',
                    background: 'rgba(99,102,241,0.9)', border: 'none', borderRadius: '50%',
                    width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', zIndex: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                  }}
                >
                  <ChevronDown size={16} color="white" />
                </motion.button>
              )}
            </AnimatePresence>

            {/* ── Suggestion chips ── */}
            {messages.length <= 2 && !loading && (
              <div style={{
                padding: '8px 12px 0',
                display: 'flex', gap: 6, flexWrap: 'wrap',
                borderTop: '1px solid rgba(255,255,255,0.05)',
              }}>
                {SUGGESTIONS.map((chip, i) => (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    onClick={() => handleSuggestion(chip)}
                    disabled={false}
                    style={{
                      background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)',
                      borderRadius: 20, padding: '4px 11px', fontSize: '0.72rem',
                      color: '#a5b4fc', cursor: apiKeyMissing ? 'not-allowed' : 'pointer',
                      opacity: apiKeyMissing ? 0.4 : 1, transition: 'all 0.18s', whiteSpace: 'nowrap',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.22)'; e.currentTarget.style.color = 'white'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.1)'; e.currentTarget.style.color = '#a5b4fc'; }}
                  >
                    {chip}
                  </motion.button>
                ))}
              </div>
            )}

            {/* ── Input ── */}
            <div style={{ padding: '12px', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
              <form onSubmit={handleSend} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder={loading ? 'Aura AI is thinking...' : 'Message Aura AI...'}
                  disabled={loading}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e); } }}
                  style={{
                    flex: 1, background: 'rgba(255,255,255,0.04)', color: 'white',
                    fontSize: '0.875rem', borderRadius: 12, padding: '10px 14px',
                    border: '1px solid rgba(255,255,255,0.08)', outline: 'none',
                    transition: 'border-color 0.2s',
                    opacity: loading ? 0.5 : 1,
                  }}
                  onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.5)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                />
                <motion.button
                  type="submit"
                  disabled={!input.trim() || loading}
                  whileHover={{ scale: 1.07 }}
                  whileTap={{ scale: 0.93 }}
                  style={{
                    width: 40, height: 40, flexShrink: 0, borderRadius: 12, border: 'none',
                    background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: (!input.trim() || loading) ? 'not-allowed' : 'pointer',
                    opacity: (!input.trim() || loading) ? 0.45 : 1,
                    transition: 'opacity 0.2s',
                    boxShadow: '0 4px 14px rgba(99,102,241,0.4)',
                  }}
                >
                  <Send size={15} color="white" style={{ marginLeft: -1 }} />
                </motion.button>
              </form>
              <div style={{ textAlign: 'center', marginTop: 6, fontSize: '0.62rem', color: '#334155' }}>
                Aura AI · Context-aware · Powered by Gemini 2.5 Flash
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Floating toggle button ── */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onClick={() => { setIsOpen(prev => !prev); setIsMinimized(false); }}
        style={{
          position: 'fixed', bottom: 24, right: 24,
          width: 56, height: 56, borderRadius: '50%',
          background: 'linear-gradient(135deg, #6366f1, #a855f7)',
          border: '2px solid rgba(255,255,255,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', zIndex: 60,
          boxShadow: '0 6px 24px rgba(99,102,241,0.5), 0 0 0 0 rgba(99,102,241,0.4)',
          animation: isOpen ? 'none' : 'pulse-ring 2.5s ease-in-out infinite',
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={isOpen ? 'close' : 'open'}
            initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: 90, opacity: 0, scale: 0.6 }}
            transition={{ duration: 0.2 }}
          >
            {isOpen ? <X size={22} color="white" /> : <MessageSquare size={22} color="white" />}
          </motion.div>
        </AnimatePresence>
      </motion.button>

      {/* Pulse-ring keyframe */}
      <style>{`
        @keyframes pulse-ring {
          0%   { box-shadow: 0 6px 24px rgba(99,102,241,0.5), 0 0 0 0 rgba(99,102,241,0.35); }
          70%  { box-shadow: 0 6px 24px rgba(99,102,241,0.5), 0 0 0 14px rgba(99,102,241,0); }
          100% { box-shadow: 0 6px 24px rgba(99,102,241,0.5), 0 0 0 0 rgba(99,102,241,0); }
        }
      `}</style>
    </>
  );
};

export default Chatbot;
