import { useEffect, useState } from 'react';
import { getPrediction, getMoodHistory, getActivityHistory, getProfile } from '../services/api';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, CartesianGrid, RadialBarChart, RadialBar, PolarAngleAxis,
  Radar, RadarChart, PolarGrid, PolarRadiusAxis
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
      const results = await Promise.allSettled([
        getPrediction(),
        getMoodHistory(),
        getActivityHistory(),
        getProfile()
      ]);

      // Helper to extract data from settled promise
      const ok = (idx) => results[idx].status === 'fulfilled' ? results[idx].value.data : null;

      const predData = ok(0);
      const moodData = ok(1) || [];
      const actData  = ok(2) || [];
      const profData = ok(3);

      if (predData) setPrediction(predData);
      if (profData) setProfile(profData);

      if (moodData.length) {
        setLastMood(moodData[moodData.length - 1]);
        const formattedMoods = moodData.map(m => ({
          name: new Date(m.createdAt).toLocaleDateString(undefined, { weekday: 'short' }),
          score: m.moodScore,
          emoji: m.emoji
        }));
        setMoods(formattedMoods);
      }

      if (actData.length) {
        setLastActivity(actData[0]);
        const formattedActivities = actData.map(a => ({
          name: new Date(a.createdAt).toLocaleDateString(undefined, { weekday: 'short' }),
          'Screen': a.screenTimeHours,
          'Sleep': a.sleepHours,
          'Study': a.studyTimeHours
        })).reverse();
        setActivities(formattedActivities);
      }

    } catch (err) {
      console.error('Core Dashboard Error:', err);
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
  const riskScore = Math.ceil(prediction?.riskScore || 0);
  const radialData = [
    { name: 'Risk', value: riskScore, fill: riskScore >= 70 ? '#ef4444' : riskScore >= 40 ? '#f59e0b' : '#10b981' }
  ];

  // Normalized Trigger Map Data (Larger area = more stress in that zone)
  const radarData = [
    { subject: 'Low Sleep', A: Math.max(0, ((8 - (lastActivity?.sleepHours || 8)) / 8) * 100), fullMark: 100 },
    { subject: 'Digital Strain', A: Math.min(100, ((lastActivity?.screenTimeHours || 0) / 12) * 100), fullMark: 100 },
    { subject: 'Mood Heavy', A: Math.max(0, ((5 - (lastMood?.moodScore || 5)) / 5) * 100), fullMark: 100 },
    { subject: 'Workload', A: Math.min(100, ((lastActivity?.studyTimeHours || 0) / 10) * 100), fullMark: 100 },
    { subject: 'Burnout Risk', A: riskScore, fullMark: 100 },
  ];

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
        
        <div className="relative z-10 grid lg:grid-cols-12 gap-8 items-center">
          
          {/* Radial Chart Column */}
          <div className="lg:col-span-4 flex flex-col items-center">
            <div className="relative w-64 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  width={256} height={256}
                  innerRadius="80%" outerRadius="100%"
                  barSize={24}
                  data={radialData}
                  startAngle={90} endAngle={-270}
                >
                  <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                  <RadialBar 
                    dataKey="value" 
                    cornerRadius={12} 
                    background={{ fill: 'rgba(255,255,255,0.08)' }} 
                  />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center -mt-2">
                <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="text-7xl font-black text-white tracking-tighter drop-shadow-2xl">
                  {riskScore}
                </motion.div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em]">Score / 100</div>
              </div>
            </div>
            
            <div className={`mt-6 inline-flex items-center gap-3 px-8 py-3 rounded-full text-xs font-black border tracking-[0.2em] uppercase shadow-2xl transition-all ${cfg.bg} ${cfg.border} ${cfg.color}`}>
              <div className={`w-3 h-3 rounded-full ${riskScore >= 70 ? 'bg-red-500 animate-pulse' : riskScore >= 40 ? 'bg-amber-500' : 'bg-emerald-500'}`} />
              {prediction?.status || 'Analyzing...'}
            </div>
          </div>

          {/* Intelligence Report Column */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-widest mb-1 opacity-70">
                  <Brain size={14} /> AI Analysis Engine
                </div>
                <h2 className="text-4xl font-black text-white leading-tight">Burnout Intelligence Board</h2>
                <p className="text-gray-400 text-sm mt-1 max-w-xl">
                  Advanced synthesis of sleep quality, digital strain, and emotional patterns.
                </p>
              </div>
              <div className="flex items-center gap-4">
                 <div className="text-right">
                    <div className="text-[10px] font-bold text-gray-500 uppercase">Analysis Engine</div>
                    <div className="text-sm font-bold text-white">MindMap v2.0</div>
                 </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-6">
              {/* Input Analysis Section */}
              <div className="bg-white/5 rounded-2xl p-6 border border-white/5 hover:border-white/10 transition-colors">
                <h3 className="font-bold mb-4 flex items-center gap-2 text-[10px] uppercase tracking-widest text-gray-400">
                  <Activity size={14} className="text-fuchsia-500" /> Metrics Breakdown
                </h3>
                <div className="space-y-4">
                   <div className="flex justify-between items-end border-b border-white/5 pb-2">
                      <div className="text-xs text-gray-400">Sleep Level</div>
                      <div className="text-sm font-bold text-white text-right">
                        {lastActivity?.sleepHours || 0}h 
                      </div>
                   </div>
                   <div className="flex justify-between items-end border-b border-white/5 pb-2">
                      <div className="text-xs text-gray-400">Digital Strain</div>
                      <div className="text-sm font-bold text-white text-right">
                        {lastActivity?.screenTimeHours || 0}h
                      </div>
                   </div>
                   <div className="flex justify-between items-end border-b border-white/5 pb-2">
                      <div className="text-xs text-gray-400">Productivity</div>
                      <div className="text-sm font-bold text-white text-right">
                        {lastActivity?.studyTimeHours || 0}h
                      </div>
                   </div>
                </div>
              </div>

              {/* Trigger Map (Radar) Section */}
              <div className="bg-white/5 rounded-2xl p-6 border border-white/5 hover:border-white/10 transition-colors flex flex-col items-center">
                <h3 className="font-bold mb-2 flex items-center gap-2 text-[10px] uppercase tracking-widest text-violet-400 w-full">
                  <Zap size={14} /> AI Stress Map
                </h3>
                <div className="w-full h-48 flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="65%" data={radarData}>
                      <PolarGrid stroke="rgba(255,255,255,0.05)" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 'bold' }} />
                      <Radar
                        name="Strain"
                        dataKey="A"
                        stroke="#a855f7"
                        strokeWidth={3}
                        fill="#a855f7"
                        fillOpacity={0.2}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Suggestions / Next Steps */}
              <div className="bg-primary/5 rounded-2xl p-6 border border-primary/10 hover:border-primary/20 transition-colors">
                <h3 className="font-bold mb-4 flex items-center gap-2 text-[10px] uppercase tracking-widest text-primary">
                  <Flame size={14} /> Next Steps
                </h3>
                <ul className="space-y-4">
                  {(prediction?.suggestions || ['Logging habits will trigger specific AI suggestions...']).slice(0, 3).map((sug, i) => (
                    <li key={i} className="flex gap-3 text-[11px] text-gray-300 leading-relaxed">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0 shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)]" />
                      {sug}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* QUICK STATS & TRENDS SECTION - ALWAYS VISIBLE */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: <TrendingUp size={24} />, label: "Health Score", value: `${100 - riskScore}%`, color: "text-emerald-400" },
          { icon: <Monitor size={24} />, label: "Latest Stressor", value: lastActivity?.screenTimeHours > 8 ? "Screen Time" : "None", color: "text-violet-400" },
          { icon: <Moon size={24} />, label: "Last Sleep", value: `${lastActivity?.sleepHours || 0}h`, color: "text-blue-400" },
          { icon: <Flame size={24} />, label: "Consistency", value: `${profile?.currentStreak || 0}d`, color: "text-orange-500" },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 * i }}>
            <div className="glass-card text-center p-6 space-y-2 hover:bg-white/5 transition-all cursor-default">
              <div className={`flex justify-center mb-2 ${stat.color}`}>{stat.icon}</div>
              <div className="text-2xl font-black text-white">{stat.value}</div>
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{stat.label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Mood Analysis Trend */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="glass-card min-h-[400px] flex flex-col">
          <div className="flex items-center justify-between mb-8">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-fuchsia-500/10 flex items-center justify-center text-fuchsia-400">
                   <Activity size={20} />
                </div>
                <div>
                   <h2 className="text-xl font-bold">Emotional Trajectory</h2>
                   <p className="text-xs text-gray-500">Historical mood mapping</p>
                </div>
             </div>
          </div>
          <div className="flex-1 w-full min-h-[250px] relative">
            {!hasData && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[2px] z-10 rounded-xl">
                 <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Logging Data Required</p>
              </div>
            )}
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={moods.length > 0 ? moods : [{name: 'M', score: 3}, {name: 'T', score: 3}]} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="#475569" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} />
                <YAxis domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} stroke="#475569" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="score" stroke="#d946ef" strokeWidth={4} dot={{ r: 6, fill: '#0f172a', stroke: '#d946ef', strokeWidth: 2 }} activeDot={{ r: 10, fill: '#d946ef' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Activity Correlation Chart */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }} className="glass-card min-h-[400px] flex flex-col">
          <div className="flex items-center gap-3 mb-8">
             <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                <Monitor size={20} />
             </div>
             <div>
                <h2 className="text-xl font-bold">Input Correlation</h2>
                <p className="text-xs text-gray-500">Sleep vs Screen vs Study</p>
             </div>
          </div>
          <div className="flex-1 w-full min-h-[250px] relative">
            {!hasData && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[2px] z-10 rounded-xl">
                 <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Logging Data Required</p>
              </div>
            )}
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activities.length > 0 ? activities : [{name: 'M', Screen: 4, Sleep: 8, Study: 2}]} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="#475569" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} />
                <YAxis stroke="#475569" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '15px' }} />
                <Bar dataKey="Screen" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Sleep"  fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Study"  fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      <div className="pb-10">
        {/* Dynamic Trigger Engine Map */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }} className="glass-card">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black flex items-center gap-3">
              <Zap className="text-amber-400" size={28} /> Trigger Intelligence Engine
            </h2>
            <div className="flex items-center gap-2 px-3 py-1 rounded bg-white/5 border border-white/10 text-[10px] font-black text-gray-500 tracking-widest uppercase">
               Neural Analysis Active
            </div>
          </div>

          {!prediction?.triggerDetails || prediction.triggerDetails.length === 0 ? (
             <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-3xl">
                <Brain size={40} className="mx-auto text-gray-700 mb-4" />
                <h4 className="text-gray-500 font-bold uppercase tracking-widest text-xs">No Critical Stressors Active</h4>
                <p className="text-gray-600 text-[10px] mt-2">Log your latest metrics to update the Intelligence Engine.</p>
             </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {prediction.triggerDetails.map((t, idx) => (
                <motion.div 
                  key={idx} 
                  whileHover={{ y: -5 }}
                  className="p-6 rounded-3xl border bg-red-500/5 border-red-500/10 flex flex-col justify-between hover:bg-red-500/10 hover:border-red-500/30 transition-all shadow-xl"
                >
                  <div className="flex justify-between items-start">
                    <span className="text-lg font-black text-white leading-tight uppercase tracking-tighter">{t.trigger}</span>
                    <div className="bg-red-500/20 text-red-400 p-1.5 rounded-lg border border-red-500/20 shadow-lg">
                      <AlertTriangle size={18} />
                    </div>
                  </div>
                  <div className="mt-8 pt-4 border-t border-white/5">
                    <div className="text-4xl font-black text-red-500 leading-none">+{t.impact}</div>
                    <div className="text-[10px] text-gray-500 font-black uppercase tracking-widest mt-2">AI Risk Attribution</div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
