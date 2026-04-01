import { motion } from 'framer-motion';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Brain, Zap, Activity, Shield, ArrowRight, Heart, Sparkles, Monitor, Moon, BarChart } from 'lucide-react';

const Landing = () => {
  const { isAuthenticated } = useAuth();

  // If user is already logged in, take them straight to their dashboard
  if (isAuthenticated) return <Navigate to="/dashboard" />;

  return (
    <div className="relative -mt-8 overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] -mr-64 -mt-64 animate-pulse" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-fuchsia-500/10 rounded-full blur-[120px] -ml-64 -mb-64" />

      {/* Hero Section */}
      <section className="relative pt-20 pb-32">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-primary text-sm font-bold mb-8"
          >
            <Sparkles size={16} /> <span>The World's First Burnout Prediction Engine</span>
          </motion.div>

          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-6xl md:text-8xl font-black tracking-tight leading-tight mb-8"
          >
            Predict Your <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-fuchsia-400 to-violet-500">
              Future Wellness
            </span>
          </motion.h1>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-gray-400 text-xl md:text-2xl max-w-2xl mx-auto mb-12 leading-relaxed"
          >
            MindMap AI synthesizes your sleep, screen time, and emotional patterns to catch burnout 7 days before it hits.
          </motion.p>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6"
          >
            <Link to="/register" className="btn-primary px-10 py-5 text-xl w-full sm:w-auto flex items-center justify-center gap-3">
              Secure Your Mind <ArrowRight size={24} />
            </Link>
            <Link to="/login" className="px-10 py-5 text-xl font-bold text-white hover:text-primary transition-colors">
              Access Dashboard
            </Link>
          </motion.div>
        </div>
      </section>

      {/* AI Preview Section */}
      <section className="pb-32">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            className="glass-card p-1 max-w-5xl mx-auto relative group overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-fuchsia-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="bg-slate-900 rounded-3xl overflow-hidden border border-white/5 relative z-10">
               {/* Mockup Top Bar */}
               <div className="h-10 bg-black/40 border-b border-white/5 flex items-center px-4 gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/50" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50" />
                  <div className="flex-1" />
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">MindMap OS v2.0</div>
               </div>
               {/* Content Mockup */}
               <div className="p-12 text-center md:text-left grid md:grid-cols-2 gap-12 items-center">
                  <div>
                     <h3 className="text-3xl font-black mb-6">Built for High Performance. Protected by AI.</h3>
                     <p className="text-gray-400 mb-8 max-w-md">Our neural engine maps 12 unique triggers in real-time. Whether it's digital strain or sleep debt, you'll see the impact before you feel the symptoms.</p>
                     <div className="flex gap-4">
                        <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                           <Zap className="text-amber-400 mb-2" size={20} />
                           <div className="text-[10px] font-black uppercase text-gray-500">Live Stress Map</div>
                        </div>
                        <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                           <Activity className="text-primary mb-2" size={20} />
                           <div className="text-[10px] font-black uppercase text-gray-500">Health Sync</div>
                        </div>
                     </div>
                  </div>
                  <div className="relative group">
                     {/* Floating Gauge Mockup */}
                     <div className="w-64 h-64 mx-auto rounded-full border-8 border-white/5 flex items-center justify-center relative">
                        <div className="text-6xl font-black text-white">42</div>
                        <div className="absolute inset-0 rounded-full border-8 border-transparent border-t-primary border-l-primary -rotate-12 transition-transform group-hover:rotate-12 duration-1000" />
                     </div>
                  </div>
               </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-24 bg-black/40">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-black mb-4">Neural Protection Suite</h2>
            <p className="text-gray-500">Comprehensive tools for the modern mind.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { 
                icon: <Zap className="text-amber-400" />, 
                title: 'Burnout Predictor', 
                desc: 'Advanced algorithms analyze your sleep and activity to predict exhaustion.' 
              },
              { 
                icon: <Activity className="text-fuchsia-400" />, 
                title: 'Trigger Radar', 
                desc: 'Identifies specific stress sources from your productivity and screen habits.' 
              },
              { 
                icon: <Moon className="text-blue-400" />, 
                title: 'Sleep Intelligence', 
                desc: 'Deep integration of rest data to calculate your cognitive recovery capacity.' 
              },
              { 
                icon: <BarChart className="text-primary" />, 
                title: 'Emotional Trends', 
                desc: 'Historical mood mapping to detect long-term emotional trajectories.' 
              },
              { 
                icon: <Heart className="text-red-400" />, 
                title: 'Emergency SOS', 
                desc: 'One-tap connection to your pre-verified support network during crises.' 
              },
              { 
                icon: <Shield className="text-emerald-400" />, 
                title: 'Privacy First', 
                desc: 'Your data is encrypted and stays between you and your progress.' 
              }
            ].map((f, i) => (
              <motion.div
                key={i}
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-card p-10 hover:bg-white/5 transition-all group"
              >
                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                  {f.icon}
                </div>
                <h3 className="text-xl font-bold mb-4">{f.title}</h3>
                <p className="text-gray-500 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32">
        <div className="container mx-auto px-4 text-center">
          <div className="glass-card p-12 md:p-24 bg-gradient-to-br from-primary/10 to-violet-500/10 border-primary/20 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-64 h-64 bg-primary opacity-20 rounded-full blur-[100px] -mr-32 -mt-32" />
             <h2 className="text-4xl md:text-6xl font-black mb-8 relative z-10">Ready to take control?</h2>
             <p className="text-gray-400 text-lg mb-12 max-w-xl mx-auto relative z-10">Start your journey today. High-performance minds deserve high-performance protection.</p>
             <Link to="/register" className="btn-primary px-12 py-5 text-xl relative z-10">
               Get MindMap AI Now
             </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Brain className="text-primary" />
            <span className="font-bold text-xl uppercase tracking-widest">MindMap AI</span>
          </div>
          <p className="text-gray-500 text-sm">© 2026 MindMap AI. Professional Neural Protection.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
