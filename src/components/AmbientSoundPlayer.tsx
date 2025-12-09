import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { 
  Volume2, VolumeX, Play, Pause, 
  Cloud, Waves, Wind, Bird, Coffee, Flame
} from 'lucide-react';

interface SoundOption {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  frequency: number; // Hz for generating ambient sound
}

const sounds: SoundOption[] = [
  { id: 'rain', name: 'Rain', icon: Cloud, color: 'text-blue-400', frequency: 200 },
  { id: 'ocean', name: 'Ocean', icon: Waves, color: 'text-cyan-400', frequency: 150 },
  { id: 'wind', name: 'Wind', icon: Wind, color: 'text-slate-400', frequency: 100 },
  { id: 'birds', name: 'Birds', icon: Bird, color: 'text-green-400', frequency: 800 },
  { id: 'cafe', name: 'Café', icon: Coffee, color: 'text-amber-400', frequency: 300 },
  { id: 'fire', name: 'Fire', icon: Flame, color: 'text-orange-400', frequency: 250 },
];

export function AmbientSoundPlayer() {
  const [activeSound, setActiveSound] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(50);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const noiseNodeRef = useRef<AudioBufferSourceNode | null>(null);

  const createNoiseBuffer = (context: AudioContext) => {
    const bufferSize = context.sampleRate * 2;
    const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    return buffer;
  };

  const startSound = (soundId: string) => {
    stopSound();
    
    const context = new AudioContext();
    audioContextRef.current = context;
    
    const gainNode = context.createGain();
    gainNode.gain.value = volume / 100 * 0.3;
    gainNodeRef.current = gainNode;
    
    const sound = sounds.find(s => s.id === soundId);
    if (!sound) return;

    // Create noise-based ambient sound
    const noiseBuffer = createNoiseBuffer(context);
    const noiseNode = context.createBufferSource();
    noiseNode.buffer = noiseBuffer;
    noiseNode.loop = true;
    noiseNodeRef.current = noiseNode;

    // Create filter for different sound textures
    const filter = context.createBiquadFilter();
    
    switch (soundId) {
      case 'rain':
        filter.type = 'lowpass';
        filter.frequency.value = 1000;
        break;
      case 'ocean':
        filter.type = 'lowpass';
        filter.frequency.value = 500;
        // Add wave-like modulation
        const lfo = context.createOscillator();
        lfo.frequency.value = 0.1;
        const lfoGain = context.createGain();
        lfoGain.gain.value = 0.3;
        lfo.connect(lfoGain);
        lfoGain.connect(gainNode.gain);
        lfo.start();
        break;
      case 'wind':
        filter.type = 'bandpass';
        filter.frequency.value = 400;
        filter.Q.value = 0.5;
        break;
      case 'birds':
        filter.type = 'highpass';
        filter.frequency.value = 2000;
        break;
      case 'cafe':
        filter.type = 'bandpass';
        filter.frequency.value = 800;
        filter.Q.value = 1;
        break;
      case 'fire':
        filter.type = 'lowpass';
        filter.frequency.value = 600;
        break;
    }

    noiseNode.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(context.destination);
    noiseNode.start();

    setActiveSound(soundId);
    setIsPlaying(true);
  };

  const stopSound = () => {
    if (noiseNodeRef.current) {
      noiseNodeRef.current.stop();
      noiseNodeRef.current = null;
    }
    if (oscillatorRef.current) {
      oscillatorRef.current.stop();
      oscillatorRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setIsPlaying(false);
  };

  const togglePlay = () => {
    if (isPlaying) {
      stopSound();
      setActiveSound(null);
    } else if (activeSound) {
      startSound(activeSound);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = newVolume / 100 * 0.3;
    }
  };

  useEffect(() => {
    return () => {
      stopSound();
    };
  }, []);

  const activeSoundData = sounds.find(s => s.id === activeSound);

  return (
    <motion.div
      layout
      className="fixed bottom-24 right-4 z-40"
    >
      <AnimatePresence>
        {isExpanded ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
          >
            <Card className="glass border-0 w-72">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Ambient Sounds</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsExpanded(false)}
                    className="h-8 w-8 p-0"
                  >
                    ✕
                  </Button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {sounds.map((sound) => (
                    <motion.button
                      key={sound.id}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => startSound(sound.id)}
                      className={`p-3 rounded-xl flex flex-col items-center gap-1 transition-colors ${
                        activeSound === sound.id 
                          ? 'bg-primary/20 ring-2 ring-primary' 
                          : 'glass hover:bg-primary/10'
                      }`}
                    >
                      <sound.icon className={`w-5 h-5 ${sound.color}`} />
                      <span className="text-xs">{sound.name}</span>
                    </motion.button>
                  ))}
                </div>

                {activeSound && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-3"
                  >
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={togglePlay}
                        className="h-10 w-10 p-0 rounded-full"
                      >
                        {isPlaying ? (
                          <Pause className="w-5 h-5" />
                        ) : (
                          <Play className="w-5 h-5" />
                        )}
                      </Button>
                      <div className="flex-1 flex items-center gap-2">
                        <VolumeX className="w-4 h-4 text-muted-foreground" />
                        <Slider
                          value={[volume]}
                          onValueChange={handleVolumeChange}
                          max={100}
                          step={1}
                          className="flex-1"
                        />
                        <Volume2 className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsExpanded(true)}
            className={`w-14 h-14 rounded-full glass flex items-center justify-center shadow-lg ${
              isPlaying ? 'ring-2 ring-primary' : ''
            }`}
          >
            {isPlaying && activeSoundData ? (
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <activeSoundData.icon className={`w-6 h-6 ${activeSoundData.color}`} />
              </motion.div>
            ) : (
              <Volume2 className="w-6 h-6 text-muted-foreground" />
            )}
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
