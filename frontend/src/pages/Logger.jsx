import { useState } from 'react';
import { logMood, logActivity } from '../services/api';
import { motion } from 'framer-motion';
import { Sparkles, Moon, Monitor, BookOpen, Send, Smile, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';

const EMOJIS = [
  { char: '😢', score: 1, label: 'Awful', color: 'text-red-400', ringColor: 'ring-red-500' },
  { char: '🙁', score: 2, label: 'Bad',   color: 'text-orange-400', ringColor: 'ring-orange-500' },
  { char: '😐', score: 3, label: 'Okay',  color: 'text-yellow-400', ringColor: 'ring-yellow-500' },
  { char: '🙂', score: 4, label: 'Good',  color: 'text-lime-400',  ringColor: 'ring-lime-500' },
  { char: '🤩', score: 5, label: 'Awesome', color: 'text-emerald-400', ringColor: 'ring-emerald-500' },
];

const SliderInput = ({ label, icon, value, onChange, min = 0, max = 24, step = 0.5, unit = 'hrs', colorClass = 'text-primary' }) => {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="space-y-3 p-5 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
      <label className={`flex items-center gap-2 font-semibold text-sm ${colorClass}`}>
        {icon} {label}
      </label>
      <div className="flex items-center gap-4">
        <input
          type="range"
          min={min} max={max} step={step}
          value={value}
          onChange={e => onChange(parseFloat(e.target.value))}
          className="flex-1 accent-violet-500 h-2 cursor-pointer"
        />
        <span className="text-2xl font-black w-20 text-right text-white">
          {value}<span className="text-xs font-normal text-gray-400 ml-1">{unit}</span>
        </span>
      </div>
      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

const Logger = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [moodForm, setMoodForm] = useState({ emoji: '😐', text: '', moodScore: 3 });
  const [activityForm, setActivityForm] = useState({ screenTimeHours: 4, sleepHours: 8, studyTimeHours: 2 });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await logMood(moodForm);
      await logActivity(activityForm);
      addToast('Check-in saved! Predictions updated. 🧠', 'success');
      setTimeout(() => navigate('/dashboard'), 800);
    } catch (err) {
      addToast('Failed to save. Is the backend running?', 'error');
    } finally {
      setLoading(false);
    }
  };

  const selectedEmoji = EMOJIS.find(e => e.score === moodForm.moodScore);

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="text-center mb-12">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}
          className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-semibold">
          <Sparkles size={14} /> Daily Mental Wellness Check-In
        </motion.div>
        <h1 className="text-5xl font-black tracking-tight mb-3">How's Your Day?</h1>
        <p className="text-gray-400 text-lg">Log your mood and triggers — the AI will predict your burnout risk.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">

        {/* Mood Section */}
        <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.05 }} className="glass-card">
          <h2 className="text-2xl font-bold mb-2 flex items-center gap-3">
            <Smile className="text-fuchsia-400" /> How are you feeling?
          </h2>
          <p className="text-gray-500 text-sm mb-8">Pick your mood for today — be honest with yourself.</p>

          <div className="flex flex-wrap gap-4 mb-8 justify-center">
            {EMOJIS.map(em => (
              <button
                key={em.score}
                type="button"
                id={`emoji-btn-${em.score}`}
                onClick={() => setMoodForm({ ...moodForm, emoji: em.char, moodScore: em.score })}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl transition-all text-4xl ${
                  moodForm.moodScore === em.score
                    ? `bg-white/10 ring-2 ${em.ringColor} scale-110 shadow-lg`
                    : 'hover:bg-white/5 opacity-50 hover:opacity-100'
                }`}
              >
                {em.char}
                <span className={`text-xs font-semibold ${moodForm.moodScore === em.score ? em.color : 'text-gray-500'}`}>
                  {em.label}
                </span>
              </button>
            ))}
          </div>

          {selectedEmoji && (
            <motion.div key={moodForm.moodScore} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className={`inline-flex items-center gap-2 mb-6 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/5 border border-white/10 ${selectedEmoji.color}`}>
              {selectedEmoji.char} You're feeling "{selectedEmoji.label}" today
            </motion.div>
          )}

          <div className="space-y-2">
            <label className="text-sm text-gray-400 font-medium flex items-center gap-2">
              <BookOpen size={14} /> What's on your mind? <span className="text-gray-600">(optional)</span>
            </label>
            <textarea
              value={moodForm.text}
              onChange={(e) => setMoodForm({ ...moodForm, text: e.target.value })}
              placeholder="I'm feeling overwhelmed with exams and haven't slept well..."
              rows={3}
              className="glass-input resize-none"
            />
          </div>
        </motion.div>

        {/* Trigger Sliders */}
        <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="glass-card">
          <h2 className="text-2xl font-bold mb-2 text-blue-400">Trigger Logging</h2>
          <p className="text-gray-500 text-sm mb-6">These are the key burnout triggers — the AI uses them to calculate your risk score.</p>
          <div className="space-y-4">
            <SliderInput
              label="Screen Time"
              icon={<Monitor size={16} />}
              value={activityForm.screenTimeHours}
              onChange={v => setActivityForm({ ...activityForm, screenTimeHours: v })}
              colorClass="text-violet-400"
            />
            <SliderInput
              label="Sleep"
              icon={<Moon size={16} />}
              value={activityForm.sleepHours}
              onChange={v => setActivityForm({ ...activityForm, sleepHours: v })}
              colorClass="text-blue-400"
            />
            <SliderInput
              label="Study / Work Time"
              icon={<BookOpen size={16} />}
              value={activityForm.studyTimeHours}
              onChange={v => setActivityForm({ ...activityForm, studyTimeHours: v })}
              colorClass="text-emerald-400"
            />
          </div>
        </motion.div>

        {/* Risk Preview */}
        <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }}
          className="glass-card bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 border-violet-500/20">
          <h3 className="font-semibold text-gray-300 mb-3 text-sm uppercase tracking-wider">What happens next?</h3>
          <div className="flex flex-wrap gap-4 text-sm">
            {[
              { label: 'Mood Score', value: `${moodForm.moodScore}/5 ${moodForm.emoji}` },
              { label: 'Screen Time', value: `${activityForm.screenTimeHours}h` },
              { label: 'Sleep', value: `${activityForm.sleepHours}h` },
              { label: 'Study Time', value: `${activityForm.studyTimeHours}h` },
            ].map(stat => (
              <div key={stat.label} className="flex-1 min-w-[100px] bg-white/5 rounded-xl p-3 text-center">
                <div className="text-gray-400 text-xs mb-1">{stat.label}</div>
                <div className="text-white font-bold">{stat.value}</div>
              </div>
            ))}
          </div>
          <p className="text-gray-500 text-xs mt-4">→ The AI burnout engine will calculate your risk score after submission</p>
        </motion.div>

        <motion.button
          initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={loading}
          id="submit-checkin-btn"
          className="btn-primary w-full py-5 text-lg flex items-center justify-center gap-3 mt-2"
        >
          {loading ? (
            <span className="flex items-center gap-3">
              <span className="animate-spin border-t-2 border-white rounded-full w-5 h-5 inline-block" />
              Saving & Analyzing...
            </span>
          ) : (
            <>
              <CheckCircle size={22} /> Save Check-In &amp; Run Prediction
              <Send size={18} />
            </>
          )}
        </motion.button>
      </form>
    </div>
  );
};

export default Logger;
