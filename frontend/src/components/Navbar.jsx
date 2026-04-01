import { Link, useLocation } from 'react-router-dom';
import { Activity, Brain, Book, PenLine, AlertCircle, LogOut, Settings, PlayCircle, PauseCircle, Headphones, Music, CloudRain, Wind } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { triggerSOS, getProfile } from '../services/api';
import { useAuth } from '../context/AuthContext';
import EmergencySettings from './EmergencySettings';

const TRACKS = [
  { id: 'ocean', name: 'Ocean Waves', icon: Headphones, url: 'https://actions.google.com/sounds/v1/water/ocean_waves_steady.ogg' },
  { id: 'rain',  name: 'Rain & Thunder', icon: CloudRain, url: 'https://actions.google.com/sounds/v1/weather/rain_on_roof.ogg' },
  { id: 'ambient', name: 'Calm Melody', icon: Music, url: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3' },
  { id: 'wind',  name: 'Desert Wind', icon: Wind, url: 'https://actions.google.com/sounds/v1/weather/strong_wind.ogg' }
];

const Navbar = () => {
  const location = useLocation();
  const [sosStatus, setSosStatus] = useState('idle');
  const [showSettings, setShowSettings] = useState(false);
  const [showMusicMenu, setShowMusicMenu] = useState(false);

  const [eContact, setEContact] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(TRACKS[0]);
  
  const { isAuthenticated, logout } = useAuth();
  
  // Soothing Music Audio Object
  const audioRef = useRef(new Audio(TRACKS[0].url));

  useEffect(() => {
    if (isAuthenticated) {
      getProfile().then(res => {
        if (res.data?.emergencyContact?.phone) {
          setEContact(res.data.emergencyContact);
        }
      }).catch(err => console.log('Silently failing profile fetch in navbar'));
    }
  }, [isAuthenticated]);

  useEffect(() => {
    audioRef.current.loop = true;
    audioRef.current.volume = 0.5;
    return () => {
      audioRef.current.pause();
    };
  }, []);

  const toggleMusic = () => {
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(e => console.log('Audio play failed', e));
      setIsPlaying(true);
    }
  };

  const changeTrack = (track) => {
    const wasPlaying = !audioRef.current.paused;
    audioRef.current.pause();
    audioRef.current.src = track.url;
    audioRef.current.load();
    setCurrentTrack(track);
    setShowMusicMenu(false);
    
    if (wasPlaying) {
      audioRef.current.play().catch(e => console.log(e));
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
    }
  };

  const handleSOS = async () => {
    if(window.confirm("Trigger Emergency SOS Alert? This will draft an emergency message to your contact.")) {
      setSosStatus('loading');
      try {
        const res = await triggerSOS();
        const contact = res.data.contact || eContact;

        if (contact?.phone) {
           const message = encodeURIComponent(`Emergency from MindMap AI: I am feeling extremely overwhelmed and need immediate support. Please contact me.`);
           const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
           const smsUrl = `sms:${contact.phone}${isIOS ? '&' : '?'}body=${message}`;
           
           // Create a ghost link to trigger SMS reliably
           const link = document.createElement('a');
           link.href = smsUrl;
           document.body.appendChild(link);
           link.click();
           document.body.removeChild(link);
           
           alert(`SOS Alert sent to ${contact.name}! Opening your messaging app...`);
        } else {
           alert("SOS Alert triggered! (Please set an Emergency Contact in Settings first).");
           setShowSettings(true);
        }
      } catch (e) {
        console.error("SOS Error:", e);
        alert(e.response?.data?.error || "Failed to trigger SOS.");
      }
      setSosStatus('idle');
    }
  };

  return (
    <>
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
                {/* Music Player Dropdown Container */}
                <div className="relative">
                  <div className={`flex flex-col sm:flex-row items-center rounded-lg transition-colors border ${isPlaying ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'}`}>
                    <button onClick={toggleMusic} className="flex items-center gap-2 px-3 py-2 sm:border-r border-current/20 active:scale-95 transition-transform" title="Play/Pause Context Music">
                      {isPlaying ? <PauseCircle size={20} className="animate-pulse" /> : <PlayCircle size={20} />}
                      <span className="hidden sm:inline font-medium text-sm w-24 text-left truncate">{isPlaying ? currentTrack.name : 'Focus Sounds'}</span>
                    </button>
                    <button onClick={() => setShowMusicMenu(!showMusicMenu)} className="hidden sm:flex px-2 py-2 hover:bg-white/10 rounded-r-lg transition-colors" title="Change Atmosphere">
                      <Music size={16} />
                    </button>
                  </div>

                  {/* Dropdown Menu */}
                  {showMusicMenu && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowMusicMenu(false)} />
                      <div className="absolute top-12 right-0 w-48 bg-gray-900 border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50 animate-[fadeIn_0.1s_ease-out]">
                        <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest p-3 pb-2 border-b border-white/5 bg-black/50">Select Atmosphere</div>
                        <div className="p-1 flex flex-col">
                          {TRACKS.map(t => {
                            const Icon = t.icon;
                            const active = currentTrack.id === t.id;
                            return (
                              <button 
                                key={t.id} 
                                onClick={() => changeTrack(t)}
                                className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-colors text-left ${active ? 'bg-primary/20 text-primary font-semibold' : 'text-gray-300 hover:bg-white/10 hover:text-white'}`}
                              >
                                <Icon size={16} className={active ? 'text-primary' : 'text-gray-500'} />
                                {t.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="w-px h-6 bg-white/10 mx-1 hidden sm:block"></div>

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

                <Link 
                   to="/journal"
                   className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${location.pathname === '/journal' ? 'text-primary bg-primary/10' : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'}`}
                >
                  <Book size={20} />
                  <span className="hidden sm:inline font-medium">Journal</span>
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
                  onClick={() => setShowSettings(true)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                  title="Emergency Contacts & Settings"
                >
                  <Settings size={20} />
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

      {showSettings && (
        <EmergencySettings 
          onClose={() => setShowSettings(false)} 
          setSavedContact={setEContact} 
        />
      )}
    </>
  );
};

export default Navbar;
