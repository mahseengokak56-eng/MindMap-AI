import { Link, useLocation } from 'react-router-dom';
import { Activity, Brain, PenLine, AlertCircle, LogOut } from 'lucide-react';
import { useState } from 'react';
import { triggerSOS } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const location = useLocation();
  const [sosStatus, setSosStatus] = useState('idle');
  const { isAuthenticated, logout } = useAuth();

  const handleSOS = async () => {
    if(window.confirm("Trigger Emergency SOS Alert? This will notify your emergency contact.")) {
      setSosStatus('loading');
      try {
        await triggerSOS();
        alert("SOS Alert triggered successfully. Help is on the way.");
      } catch (e) {
        alert("Failed to trigger SOS.");
      }
      setSosStatus('idle');
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-[rgba(15,23,42,0.8)] backdrop-blur-xl border-b border-[rgba(255,255,255,0.05)]">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-fuchsia-500 flex items-center justify-center text-white shadow-lg shadow-primary/30 group-hover:scale-110 transition-transform">
            <Brain size={24} />
          </div>
          <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-100 to-gray-400">
            MindMap<span className="text-primary ml-1">AI</span>
          </span>
        </Link>
        
        <div className="flex items-center gap-2 sm:gap-6">
          {isAuthenticated ? (
            <>
              <Link 
                to="/" 
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${location.pathname === '/' ? 'text-primary bg-primary/10' : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'}`}
              >
                <Activity size={20} />
                <span className="hidden sm:inline font-medium">Dashboard</span>
              </Link>
              <Link 
                 to="/log"
                 className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${location.pathname === '/log' ? 'text-primary bg-primary/10' : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'}`}
              >
                <PenLine size={20} />
                <span className="hidden sm:inline font-medium">Tracker</span>
              </Link>
              
              <div className="w-px h-6 bg-white/10 mx-2 hidden sm:block"></div>
              
              <button 
                onClick={handleSOS}
                disabled={sosStatus === 'loading'}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all font-bold border border-red-500/20 active:scale-95"
              >
                <AlertCircle size={20} className={sosStatus === 'loading' ? 'animate-pulse' : ''} />
                <span className="hidden sm:inline">SOS</span>
              </button>

              <button 
                onClick={logout}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                title="Logout"
              >
                <LogOut size={20} />
              </button>
            </>
          ) : (
            <>
              {location.pathname !== '/login' && location.pathname !== '/register' && (
                <Link to="/login" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary font-bold hover:bg-primary hover:text-white transition-colors">
                  Login / Register
                </Link>
              )}
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
