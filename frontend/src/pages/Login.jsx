import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loginUser } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Brain, Lock, Mail, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  const { addToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await loginUser(formData);
      login(res.data.token, res.data.user);
      addToast('Successfully logged in!', 'success');
      navigate('/');
    } catch (err) {
      addToast(err.response?.data?.error || 'Login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center mt-12 mb-20">
      <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-primary to-fuchsia-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/30">
          <Brain size={32} className="text-white" />
        </div>
        <h1 className="text-3xl font-black mb-2">Welcome Back</h1>
        <p className="text-gray-400">Log in to track your mental wellness</p>
      </motion.div>

      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-card w-full max-w-md p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary opacity-5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
        
        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
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
            {loading ? <span className="animate-spin border-t-2 border-white rounded-full w-5 h-5 inline-block" /> : <>Log In <ArrowRight size={20} /></>}
          </button>

          <p className="text-center text-sm text-gray-400 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary hover:text-white transition-colors font-semibold">Sign up</Link>
          </p>
        </form>
      </motion.div>
    </div>
  );
};

export default Login;
