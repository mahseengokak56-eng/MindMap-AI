import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Bot, User, KeyRound } from 'lucide-react';
import { sendMessage } from '../services/api';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);
  const [apiInputValue, setApiInputValue] = useState('');

  const [messages, setMessages] = useState([
    { text: "Hi there. I'm your MindMap AI assistant. How are you feeling today?", sender: 'bot' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, apiKeyMissing]);

  useEffect(() => {
    if (isOpen && !localStorage.getItem('gemini_key')) {
      setApiKeyMissing(true);
    }
  }, [isOpen]);

  const handleSaveKey = (e) => {
    e.preventDefault();
    if (apiInputValue.trim()) {
      localStorage.setItem('gemini_key', apiInputValue.trim());
      setApiKeyMissing(false);
      setMessages(prev => [...prev, { text: "API Key saved securely in your browser! I am now fully dynamic. ✨ What's on your mind?", sender: 'bot' }]);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    if (!localStorage.getItem('gemini_key')) {
      setApiKeyMissing(true);
      return;
    }

    const userMsg = input.trim();
    setMessages(prev => [...prev, { text: userMsg, sender: 'user' }]);
    setInput('');
    setLoading(true);

    try {
      const res = await sendMessage({ message: userMsg });
      setMessages(prev => [...prev, { text: res.data.reply, sender: 'bot' }]);
    } catch (err) {
      setMessages(prev => [...prev, { text: "I'm having trouble connecting to the server. Please check your network or API Key.", sender: 'bot' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-24 right-6 w-[340px] sm:w-[400px] glass-card shadow-2xl z-50 overflow-hidden border border-white/20 flex flex-col"
          >
            {/* Header */}
            <div className="bg-primary/20 border-b border-white/10 p-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <Bot size={18} className="text-white" />
                </div>
                <h3 className="font-bold text-white">MindMap Support AI</h3>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Messages - fixed height */}
            <div className="h-[350px] overflow-y-auto p-4 flex flex-col gap-4 bg-[rgba(15,23,42,0.8)]">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center ${msg.sender === 'user' ? 'bg-fuchsia-500/20 text-fuchsia-400' : 'bg-blue-500/20 text-blue-400'}`}>
                    {msg.sender === 'user' ? <User size={16} /> : <Bot size={16} />}
                  </div>
                  <div className={`p-3 rounded-2xl max-w-[75%] text-sm ${msg.sender === 'user' ? 'bg-fuchsia-500/10 border-fuchsia-500/20 border text-white rounded-tr-none' : 'bg-white/5 border border-white/10 text-gray-200 rounded-tl-none'} shadow-sm`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              
              {/* API Key Modal Box injected into chat stream */}
              {apiKeyMissing && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-xl border border-blue-500/30 bg-[rgba(59,130,246,0.1)] text-sm mb-2 shadow-lg">
                  <div className="flex items-center gap-2 mb-2 text-blue-400 font-semibold">
                    <KeyRound size={16} /> Setup Required
                  </div>
                  <p className="text-gray-300 text-xs mb-3">
                    Please securely enter your Gemini API Key. It will be saved locally in your browser cache and bypassed directly to the AI!
                  </p>
                  <form onSubmit={handleSaveKey} className="flex gap-2">
                    <input
                      type="password"
                      placeholder="Paste Gemini API Key..."
                      value={apiInputValue}
                      onChange={e => setApiInputValue(e.target.value)}
                      className="flex-1 bg-black/40 text-white text-xs rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-blue-500/50"
                    />
                    <button type="submit" disabled={!apiInputValue.trim()} className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-semibold text-xs px-3 py-2 rounded-lg transition-colors">
                      Save
                    </button>
                  </form>
                </motion.div>
              )}

              {loading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 shrink-0 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                    <Bot size={16} />
                  </div>
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-gray-400 rounded-tl-none flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-current animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-current animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-current animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form with Quick Actions */}
            <div className="bg-[rgba(15,23,42,0.9)] border-t border-white/10 shrink-0">
              <div className="px-3 py-2 flex gap-2 overflow-x-auto hide-scrollbar">
                <a href="https://www.google.com/maps/search/nearest+hospital+or+mental+health+clinic" target="_blank" rel="noopener noreferrer" className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-full text-xs font-bold border border-red-500/20 transition-colors">
                   🏥 Find Nearest Healthcare
                </a>
              </div>
              <form onSubmit={handleSend} className="p-3 pt-0 flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Type a message..."
                  disabled={apiKeyMissing}
                  className="flex-1 bg-black/40 text-white text-sm rounded-xl px-4 py-2 border border-white/10 outline-none focus:border-primary/50 disabled:opacity-50 transition-colors"
                />
                <button type="submit" disabled={!input.trim() || apiKeyMissing} className="w-10 h-10 shrink-0 bg-primary hover:bg-primary/80 disabled:opacity-50 text-white rounded-xl flex items-center justify-center transition-colors">
                  <Send size={16} className="-ml-1" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(prev => !prev)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-primary to-fuchsia-500 rounded-full shadow-lg shadow-primary/30 flex items-center justify-center text-white z-[60] border border-white/20"
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </motion.button>
    </>
  );
};

export default Chatbot;
