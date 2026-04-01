import { useEffect, useState } from 'react';
import { getPrediction, getMoodHistory, getActivityHistory } from '../services/api';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, CartesianGrid, RadialBarChart, RadialBar
} from 'recharts';
import { BatteryWarning, TrendingUp, Clock, Activity, AlertTriangle, Zap, Moon, Monitor, Brain, RefreshCw } from 'lucide-react';
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
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastActivity, setLastActivity]= useState(null);
  const [lastMood, setLastMood] = useState(null);

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const [predRes, moodsRes, actRes] = await Promise.all([
        getPrediction(),
        getMoodHistory(),
        getActivityHistory()
      ]);

      setPrediction(predRes.data);

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

      {/* Empty State */}
      {!hasData && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="glass-card text-center py-16 border-dashed border-white/10">
          <Brain size={48} className="mx-auto text-primary/40 mb-4" />
          <h3 className="text-xl font-bold mb-2 text-gray-300">No Data Yet</h3>
          <p className="text-gray-500 mb-6">Start by logging your first daily check-in to see predictions here.</p>
          <Link to="/log" className="btn-primary inline-flex items-center gap-2">
            <Zap size={18} /> Start My First Check-In
          </Link>
        </motion.div>
      )}

      {hasData && (
        <>
          {/* Burnout Risk Panel */}
          <motion.div
            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            className={`glass-card relative overflow-hidden bg-gradient-to-br ${cfg.gradient} border ${cfg.border} shadow-2xl ${cfg.glow}`}
          >
            <div className="absolute top-0 right-0 w-72 h-72 bg-current opacity-5 rounded-full blur-3xl -mr-24 -mt-24 pointer-events-none" />
            <div className="relative z-10 flex flex-col lg:flex-row gap-8 items-center">

              {/* Radial chart */}
              <div className="flex-shrink-0 w-44 h-44">
                <RadialBarChart
                  width={176} height={176}
                  innerRadius={56} outerRadius={80}
                  data={radialData}
                  startAngle={90} endAngle={-270}
                >
                  <RadialBar dataKey="value" cornerRadius={10} background={{ fill: 'rgba(255,255,255,0.05)' }} />
                </RadialBarChart>
                <div className="text-center -mt-24">
                  <div className="text-4xl font-black">{riskScore}</div>
                  <div className="text-xs text-gray-500">/ 100</div>
                </div>
              </div>

              {/* Status Text */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <BatteryWarning className={cfg.color} size={28} />
                  <h2 className="text-2xl font-bold">Burnout Risk Score</h2>
                </div>
                <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold border mb-4 ${cfg.bg} ${cfg.border} ${cfg.color}`}>
                  <AlertTriangle size={14} />
                  {prediction?.status || 'Unknown'}
                </div>
                <p className="text-gray-400 text-sm mb-1">
                  Score based on screen time, sleep quality, and mood pattern analysis.
                </p>
                {/* Risk Bar */}
                <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden mt-4">
                  <motion.div
                    className={`h-full rounded-full ${riskScore >= 70 ? 'bg-gradient-to-r from-red-500 to-red-600' : riskScore >= 40 ? 'bg-gradient-to-r from-amber-400 to-orange-500' : 'bg-gradient-to-r from-emerald-400 to-teal-500'}`}
                    initial={{ width: 0 }} animate={{ width: `${riskScore}%` }}
                    transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
                  />
                </div>
              </div>

              {/* Suggestions */}
              <div className="flex-1 bg-white/5 rounded-2xl p-5 border border-white/5 min-w-0">
                <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm uppercase tracking-wider text-gray-400">
                  <TrendingUp size={14} /> AI Recommendations
                </h3>
                <ul className="space-y-3">
                  {(prediction?.suggestions || []).map((sug, i) => (
                    <motion.li key={i} initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.5 + i * 0.1 }}
                      className="flex gap-3 text-sm text-gray-300">
                      <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${i === 0 ? 'bg-primary' : 'bg-fuchsia-500'}`} />
                      {sug}
                    </motion.li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>

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

          {/* Trigger Detection Card */}
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}
            className="glass-card">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Zap className="text-amber-400" size={22} /> Trigger Detection Engine
            </h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { label: 'High Screen Time', desc: '> 8 hrs/day', impact: '+20 Risk', triggered: lastActivity?.screenTimeHours > 8, color: 'violet' },
                { label: 'Low Sleep',         desc: '< 6 hrs/day', impact: '+30 Risk', triggered: lastActivity?.sleepHours < 6, color: 'blue' },
                { label: 'Negative Streak',   desc: '3+ bad moods', impact: '+40 Risk', triggered: prediction?.riskScore >= 70, color: 'fuchsia' },
              ].map(t => (
                <div key={t.label} className={`p-4 rounded-xl border transition-all ${t.triggered ? 'bg-red-500/5 border-red-500/20' : 'bg-white/3 border-white/5'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-200">{t.label}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${t.triggered ? 'bg-red-500/20 text-red-400' : 'bg-green-500/10 text-green-500'}`}>
                      {t.triggered ? '⚠ ACTIVE' : '✓ OK'}
                    </span>
                  </div>
                  <p className="text-gray-500 text-xs mb-2">{t.desc}</p>
                  <p className={`text-xs font-bold ${t.triggered ? 'text-red-400' : 'text-gray-600'}`}>Burnout impact: {t.impact}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
