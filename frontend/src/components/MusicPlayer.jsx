import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Music, Play, Pause, Volume2, VolumeX } from 'lucide-react';

const MusicPlayer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const audioRef = useRef(null);

  // We are using a highly reliable, royalty-free soothing Lofi track
  const audioContext = 'https://raw.githubusercontent.com/himalayasingh/music-player-1/master/music/2.mp3';

  useEffect(() => {
    // Attempt autoplay (might be blocked by browser)
    if (audioRef.current) {
      audioRef.current.volume = 0.3; // Low volume for background soothing
    }
  }, []);

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(e => console.log("Audio playback blocked", e));
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="fixed bottom-6 left-6 z-50 flex items-end">
      <audio ref={audioRef} src={audioContext} loop preload="auto" />
      
      <motion.div 
        className="glass-card !p-2 !rounded-full flex items-center justify-center cursor-pointer overflow-hidden shadow-lg"
        animate={{ width: isHovered || isPlaying ? 160 : 48, borderRadius: 24 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={togglePlay}
      >
        <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full bg-primary/20 text-primary relative">
          {isPlaying ? (
            <Volume2 size={18} className="animate-pulse" />
          ) : (
            <Music size={18} />
          )}
        </div>
        
        <motion.div 
          className="whitespace-nowrap overflow-hidden pl-3 pr-4 flex items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered || isPlaying ? 1 : 0 }}
          transition={{ duration: 0.2, delay: 0.1 }}
        >
          {isPlaying ? (
            <span className="text-sm font-medium text-white flex items-center gap-2">
              <Pause size={14} /> Chill Lo-Fi
            </span>
          ) : (
            <span className="text-sm font-medium text-gray-300 flex items-center gap-2">
              <Play size={14} /> Play Relaxing Audio
            </span>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default MusicPlayer;
