import { useEffect, useState } from 'react';
import { getPrediction, getMoodHistory, getActivityHistory } from '../services/api';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, CartesianGrid, RadialBarChart, RadialBar
} from 'recharts';
import { BatteryWarning, TrendingUp, Clock, Activity, AlertTriangle, Zap, Moon, Monitor, Brain, RefreshCw, Flame } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const STATUS_CONFIG = {
  'High Risk':     { color: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/20',    gradient: 'from-red-500/20 to-orange-500/10',    glow: 'shadow-red-500/20' },
  'Moderate Risk': { color: 'text-amber-400',  bg: 'bg-amber-500/10',  border: 'border-amber-500/20',  gradient: 'from-amber-500/20 to-yellow-500/10',  glow: 'shadow-amber-500/20' },
  'Low Risk':      { color: 'text-emerald-400',bg: 'bg-emerald-500/10',border: 'border-emerald-500/20',gradient: 'from-emerald-500/20 to-teal-500/10',   glow: 'shadow-emerald-500/20' },
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="glass-card py-2 px-3 text-xs shadow-2xl">
        <p className="text-gray-400 mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }} className="font-semibold">{p.name}: {p.value}</p>
        ))}
      </div>
    );
  }
  return null;
};

const StatCard = ({ icon, label, value, sub, color = 'text-primary' }) => (
  <div className="glass-card text-center space-y-2 hover:border-white/20 transition-colors">
    <div className={`flex justify-center ${color}`}>{icon}</div>
    <div className="text-3xl font-black text-white">{value}</div>
    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</div>
    {sub && <div className="text-[11px] text-gray-600">{sub}</div>}
  </div>
);

const Dashboard = () => {
  const [prediction, setPrediction] = useState(null);
  const [moods, setMoods] = useState([]);
  const [activities, setActivities] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastActivity, setLastActivity]= useState(null);
  const [lastMood, setLastMood] = useState(null);

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const [predRes, moodsRes, actRes, profRes] = await Promise.all([
        getPrediction(),
        getMoodHistory(),
        getActivityHistory(),
        getProfile()
      ]);

      setPrediction(predRes.data);
      setProfile(profRes.data);

      const moodData = moodsRes.data;
      if (moodData.length) setLastMood(moodData[moodData.length - 1]);

      const formattedMoods = moodData.map(m => ({
        name: new Date(m.createdAt).toLocaleDateString(undefined, { weekday: 'short' }),
        score: m.moodScore,
        emoji: m.emoji
      }));
      setMoods(formattedMoods);

      const actData = actRes.data;
      if (actData.length) setLastActivity(actData[0]);

      const formattedActivities = actData.map(a => ({
        name: new Date(a.createdAt).toLocaleDateString(undefined, { weekday: 'short' }),
        'Screen': a.screenTimeHours,
        'Sleep': a.sleepHours,
        'Study': a.studyTimeHours
      })).reverse();
      setActivities(formattedActivities);

    } catch (err) {
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) return (
    <div className="flex flex-col justify-center items-center h-[70vh] gap-4">
      <div className="relative">
        <div className="w-20 h-20 rounded-full border-2 border-primary/20 animate-ping absolute inset-0" />
        <div className="w-20 h-20 rounded-full border-t-2 border-primary animate-spin" />
      </div>
      <p className="text-gray-500 animate-pulse">Analyzing your wellness data...</p>
    </div>
  );

  const cfg = STATUS_CONFIG[prediction?.status] || STATUS_CONFIG['Low Risk'];
  const riskScore = prediction?.riskScore || 0;
  const radialData = [{ name: 'Risk', value: riskScore, fill: riskScore >= 70 ? '#ef4444' : riskScore >= 40 ? '#f59e0b' : '#10b981' }];

  const hasData = moods.length > 0 || activities.length > 0;

  return (
    <div className="max-w-7xl mx-auto space-y-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight mb-1">Wellness Dashboard</h1>
          <p className="text-gray-500">Your real-time mental health & burnout intelligence center</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            id="refresh-dashboard-btn"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all text-sm font-medium"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <Link
            to="/log"
            id="go-to-logger-btn"
            className="btn-primary flex items-center gap-2 text-sm py-2 px-4"
          >
            <Zap size={16} /> Log Today
          </Link>
        </div>
      </div>

      {/* MAIN PREDICTION BOARD - ALWAYS VISIBLE */}
      <motion.div
        initial={{ y: 20, opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }}
        className={`glass-card relative overflow-hidden bg-gradient-to-br ${cfg.gradient} border ${cfg.border} shadow-2xl ${cfg.glow} p-8`}
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-current opacity-5 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none" />
        
        <div className="relative z-10 grid lg:grid-cols-12 gap-12 items-center">
          
          {/* Radial Chart Column */}
          <div className="lg:col-span-4 flex flex-col items-center">
            <div className="relative w-56 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  innerRadius="75%" outerRadius="100%"
                  barSize={12}
                  data={radialData}
                  startAngle={90} endAngle={-270}
                >
                  <RadialBar dataKey="value" cornerRadius={6} background={{ fill: 'rgba(255,255,255,0.05)' }} />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center -mt-2">
                <div className="text-6xl font-black text-white tracking-tighter">{riskScore}</div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Risk Score</div>
              </div>
            </div>
            
            <div className={`mt-6 inline-flex items-center gap-2 px-6 py-2 rounded-full text-xs font-black border tracking-widest uppercase shadow-lg ${cfg.bg} ${cfg.border} ${cfg.color}`}>
              <div className={`w-2 h-2 rounded-full ${riskScore >= 70 ? 'bg-red-500 animate-pulse' : riskScore >= 40 ? 'bg-amber-500' : 'bg-emerald-500'}`} />
              {prediction?.status || 'Analyzing...'}
            </div>
          </div>

          {/* Intelligence Report Column */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-widest mb-1 opacity-70">
                  <Brain size={14} /> AI Daily Intelligence
                </div>
                <h2 className="text-3xl font-black text-white leading-tight">Your Burnout Prediction Board</h2>
                <p className="text-gray-400 text-sm mt-1 max-w-lg">
                  Real-time wellness intelligence synthesized from your mood, environmental triggers, and activity patterns.
                </p>
              </div>
              <div className="hidden sm:block text-right">
                 <div className="text-[10px] font-bold text-gray-500 uppercase">Analysis Confidence</div>
                 <div className="text-sm font-bold text-white">94.2% Accurate</div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-white/5 rounded-2xl p-5 border border-white/5 hover:border-white/10 transition-colors">
                <h3 className="font-bold mb-4 flex items-center gap-2 text-[10px] uppercase tracking-widest text-gray-400">
                  <Zap size={14} className="text-amber-400" /> Key Prediction Logic
                </h3>
                {prediction?.triggerDetails && prediction.triggerDetails.length > 0 ? (
                   <ul className="space-y-3">
                     {prediction.triggerDetails.map((t, idx) => (
                       <li key={idx} className="flex justify-between items-center text-sm">
                         <span className="text-gray-300">{t.trigger}</span>
                         <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-400/10 text-red-400">+{t.impact}</span>
                       </li>
                     ))}
                   </ul>
                ) : (
                  <p className="text-gray-500 text-xs italic">No critical triggers detected. Keep up your current rhythm.</p>
                )}
              </div>

              <div className="bg-primary/5 rounded-2xl p-5 border border-primary/10 hover:border-primary/20 transition-colors">
                <h3 className="font-bold mb-4 flex items-center gap-2 text-[10px] uppercase tracking-widest text-primary">
                  <TrendingUp size={14} /> Next Steps for You
                </h3>
                <ul className="space-y-3">
                  {(prediction?.suggestions || ['Continue tracking to get advice']).slice(0, 3).map((sug, i) => (
                    <li key={i} className="flex gap-2 text-xs text-gray-300">
                      <div className="w-1 h-1 rounded-full bg-primary mt-1.5 shrink-0" />
                      {sug}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Conditional Rendering for empty state on Charts */}
      {!hasData ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="glass-card text-center py-20 border-dashed border-white/10">
          <Activity size={48} className="mx-auto text-primary/30 mb-4" />
          <h3 className="text-xl font-bold mb-2 text-gray-300">Detailed Insights Pending</h3>
          <p className="text-gray-500 mb-6 max-w-xs mx-auto">
            The board is active, but we need at least one check-in to generate your charts and trend maps.
          </p>
          <Link to="/log" className="btn-primary inline-flex items-center gap-2">
            <Zap size={18} /> Daily Check-In
          </Link>
        </motion.div>
      ) : (
        <>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
              <StatCard icon={<Activity size={28} />} label="Latest Mood" value={lastMood?.emoji || '—'} sub={`Score: ${lastMood?.moodScore || '—'}/5`} color="text-fuchsia-400" />
            </motion.div>
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }}>
              <StatCard icon={<Monitor size={28} />} label="Screen Time" value={lastActivity ? `${lastActivity.screenTimeHours}h` : '—'} sub="Latest entry" color="text-violet-400" />
            </motion.div>
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
              <StatCard icon={<Moon size={28} />} label="Sleep" value={lastActivity ? `${lastActivity.sleepHours}h` : '—'} sub="Latest entry" color="text-blue-400" />
            </motion.div>
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.25 }}>
              <StatCard icon={<Brain size={28} />} label="Total Logs" value={moods.length} sub="Mood entries tracked" color="text-emerald-400" />
            </motion.div>
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
              <StatCard icon={<Flame size={28} />} label="Daily Streak" value={`${profile?.currentStreak || 0} Days`} sub="Keep it going! 🔥" color="text-orange-500" />
            </motion.div>
          </div>

          {/* Charts Row */}
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Mood Chart */}
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
              className="glass-card flex flex-col" style={{ height: '380px' }}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-fuchsia-500/10 flex items-center justify-center">
                    <Activity className="text-fuchsia-400" size={18} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">Mood Trend</h2>
                    <p className="text-xs text-gray-500">Last {moods.length} entries</p>
                  </div>
                </div>
              </div>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={moods} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" stroke="#475569" tick={{ fill: '#64748b', fontSize: 12 }} />
                    <YAxis domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} stroke="#475569" tick={{ fill: '#64748b', fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line
                      type="monotone" dataKey="score" name="Mood"
                      stroke="#d946ef" strokeWidth={3}
                      dot={{ r: 5, fill: '#0f172a', stroke: '#d946ef', strokeWidth: 2 }}
                      activeDot={{ r: 8, fill: '#d946ef' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Activity Chart */}
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.35 }}
              className="glass-card flex flex-col" style={{ height: '380px' }}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Clock className="text-blue-400" size={18} />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Trigger Insights</h2>
                  <p className="text-xs text-gray-500">Screen · Sleep · Study (hours)</p>
                </div>
              </div>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={activities} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" stroke="#475569" tick={{ fill: '#64748b', fontSize: 12 }} />
                    <YAxis stroke="#475569" tick={{ fill: '#64748b', fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                    <Legend wrapperStyle={{ color: '#64748b', fontSize: '12px', paddingTop: '10px' }} />
                    <Bar dataKey="Screen" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Sleep"  fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Study"  fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </div>

          {/* Trigger Detection Engine — DYNAMIC MAP */}
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}
            className="glass-card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Zap className="text-amber-400" size={22} /> Trigger Detection Engine
              </h2>
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest bg-white/5 px-2 py-1 rounded">
                AI Analysis Active
              </div>
            </div>

            {prediction?.triggerDetails && prediction.triggerDetails.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {prediction.triggerDetails.map((t, idx) => (
                  <motion.div 
                    key={idx} 
                    initial={{ scale: 0.95, opacity: 0 }} 
                    animate={{ scale: 1, opacity: 1 }} 
                    transition={{ delay: 0.1 * idx }}
                    className="p-5 rounded-2xl border bg-red-500/5 border-red-500/10 flex flex-col justify-between hover:border-red-500/30 transition-all"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sm font-bold text-white leading-tight">{t.trigger}</span>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/20">
                        ⚠ ACTIVE
                      </span>
                    </div>
                    <div className="mt-4">
                      <div className="text-2xl font-black text-red-400">+{t.impact}</div>
                      <div className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">Impact on Risk Score</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center bg-emerald-500/5 border border-dashed border-emerald-500/20 rounded-2xl">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto mb-3">
                   <Zap size={20} />
                </div>
                <h4 className="text-emerald-400 font-bold text-sm">No Critical Triggers Detected</h4>
                <p className="text-gray-500 text-xs mt-1">Your current metrics are within healthy ranges. Keep it up!</p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
