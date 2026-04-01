import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Book, Send, Clock, Smile, Frown, Meh, Sparkles } from 'lucide-react';
import { createJournal, getJournals } from '../services/api';
import { useToast } from '../context/ToastContext';

const Journal = () => {
  const [entry, setEntry] = useState('');
  const [journals, setJournals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const { addToast } = useToast();

  const fetchJournals = async () => {
    try {
      const res = await getJournals();
      setJournals(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchJournals();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!entry.trim()) return;

    setLoading(true);
    try {
      const res = await createJournal({ entry });
      addToast(`Journal saved! Sentiment: ${res.data.sentimentScore > 0 ? 'Positive' : res.data.sentimentScore < 0 ? 'Negative' : 'Neutral'}`, 'success');
      setEntry('');
      fetchJournals();
    } catch (err) {
      console.error('[Journal Save Error]', err);
      const errorMsg = err.response?.data?.error || 'Failed to save journal entry';
      const details = err.response?.data?.details || '';
      
      if (errorMsg.includes('User not found') || errorMsg.includes('session')) {
        addToast('Session expired. Please login again.', 'error');
      } else if (err.response?.status === 401) {
        addToast('Please login to save journal entries.', 'error');
      } else {
        addToast(`${errorMsg}${details ? ': ' + details : ''}`, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const getSentimentIcon = (score) => {
    if (score > 2) return <Smile className="text-emerald-400" size={18} />;
    if (score < -2) return <Frown className="text-red-400" size={18} />;
    return <Meh className="text-amber-400" size={18} />;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header>
        <h1 className="text-4xl font-extrabold tracking-tight mb-2 flex items-center gap-3">
          <Book className="text-primary" size={36} /> AI Sentiment Journal
        </h1>
        <p className="text-gray-500 text-lg">Pour your thoughts out. Our AI will analyze your mood patterns privately.</p>
      </header>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Editor */}
        <div className="md:col-span-2 space-y-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6"
          >
            <div className="flex items-center gap-2 mb-4 text-primary font-bold uppercase tracking-widest text-xs">
              <Sparkles size={14} /> Daily Reflection
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <textarea
                value={entry}
                onChange={(e) => setEntry(e.target.value)}
                placeholder="How was your day? What's on your mind? (e.g. 'I felt grateful for the peaceful rain today, but overwhelmed by work...')"
                className="w-full h-64 bg-black/40 border border-white/10 rounded-2xl p-4 text-gray-200 focus:border-primary/50 outline-none transition-all resize-none leading-relaxed"
              />
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500 font-medium">{entry.length} characters</span>
                <button 
                  type="submit" 
                  disabled={loading || !entry.trim()}
                  className="btn-primary flex items-center gap-2 px-8 py-3"
                >
                  <Send size={18} /> {loading ? 'Analyzing...' : 'Save Reflection'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>

        {/* History Sidebar */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Clock size={20} className="text-gray-400" /> Recent Entries
          </h2>
          <div className="space-y-3 h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {fetching ? (
              <div className="text-center py-10 text-gray-500">Loading history...</div>
            ) : journals.length === 0 ? (
              <div className="glass-card p-6 text-center text-gray-500 italic">No entries yet. Start writing!</div>
            ) : (
              <AnimatePresence>
                {journals.map((j, idx) => (
                  <motion.div 
                    key={j._id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="glass-card p-4 hover:border-white/20 transition-all cursor-default"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">
                        {new Date(j.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      {getSentimentIcon(j.sentimentScore)}
                    </div>
                    <p className="text-sm text-gray-300 line-clamp-3 leading-relaxed">
                      {j.entry}
                    </p>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Journal;
