import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { registerUser } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Brain, Lock, Mail, User, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const Register = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();
  const { addToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    console.log('[Register] Attempting registration with:', { name: formData.name, email: formData.email });
    console.log('[Register] API URL:', import.meta.env.VITE_API_URL);
    
    try {
      const res = await registerUser(formData);
      console.log('[Register] Success:', res.data);
      login(res.data.token, res.data.user);
      addToast('Account created successfully!', 'success');
      navigate('/');
    } catch (err) {
      console.error('[Register] Full error:', err);
      console.error('[Register] Response:', err.response);
      console.error('[Register] Request config:', err.config);
      
      const errorMsg = err.response?.data?.error || 'Registration failed';
      const details = err.response?.data?.details || '';
      const status = err.response?.status;
      
      const debugMsg = `API: ${import.meta.env.VITE_API_URL || 'NOT SET'} | Status: ${status || 'Network Error'} | Error: ${errorMsg}`;
      setDebugInfo(debugMsg);
      console.error(`[Register] ${debugMsg}`);
      
      if (status === 500) {
        addToast(`Server error: ${details || 'Check Render logs'}`, 'error');
      } else if (err.message === 'Network Error') {
        addToast('Cannot connect to server. CORS or network issue.', 'error');
      } else {
        addToast(`${errorMsg}${details ? ': ' + details : ''}`, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center mt-8 mb-20">
      <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-center mb-8">
        <h1 className="text-3xl font-black mb-2 flex justify-center items-center gap-3"><Brain className="text-primary" /> Create Account</h1>
        <p className="text-gray-400">Start your mental wellness journey</p>
      </motion.div>

      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-card w-full max-w-md p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-fuchsia-500 opacity-5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
        
        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
          <div>
            <label className="text-sm font-semibold text-gray-300 flex items-center gap-2 mb-2">
              <User size={16} className="text-emerald-400" /> Full Name
            </label>
            <input type="text" required placeholder="John Doe" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="glass-input w-full" />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-300 flex items-center gap-2 mb-2">
              <Mail size={16} className="text-fuchsia-400" /> Email
            </label>
            <input type="email" required placeholder="you@example.com" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="glass-input w-full" />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-300 flex items-center gap-2 mb-2">
              <Lock size={16} className="text-blue-400" /> Password
            </label>
            <input type="password" required placeholder="••••••••" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className="glass-input w-full" />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full py-3 flex items-center justify-center gap-2 font-bold text-lg mt-4">
            {loading ? <span className="animate-spin border-t-2 border-white rounded-full w-5 h-5 inline-block" /> : <>Sign Up <ArrowRight size={20} /></>}
          </button>

          <p className="text-center text-sm text-gray-400 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:text-white transition-colors font-semibold">Log in</Link>
          </p>
          
          {debugInfo && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-xs text-red-400 font-mono break-all">{debugInfo}</p>
            </div>
          )}
        </form>
      </motion.div>
    </div>
  );
};

export default Register;
