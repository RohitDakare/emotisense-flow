import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Wind, Music, Send, Sparkles, Volume2, VolumeX, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useMood } from '@/lib/mood-context';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const musicVibes = [
  { id: 'calm', label: 'Calm & Soothing', emoji: '🌊', color: 'var(--mood-calm)', frequencies: [200, 300, 400] },
  { id: 'nature', label: 'Nature Sounds', emoji: '🌿', color: 'var(--mood-neutral)', frequencies: [150, 250, 350] },
  { id: 'focus', label: 'Focus Flow', emoji: '🎯', color: 'var(--mood-energetic)', frequencies: [300, 400, 500] },
  { id: 'uplift', label: 'Uplifting', emoji: '☀️', color: 'var(--mood-happy)', frequencies: [400, 500, 600] },
];

const reflectionPrompts = [
  "What triggered this feeling?",
  "How does your body feel right now?",
  "What would you tell a friend in this situation?",
  "What's one small thing that could help?",
];

interface FeelHealRoomProps {
  onComplete?: () => void;
}

export function FeelHealRoom({ onComplete }: FeelHealRoomProps = {}) {
  const { currentMood } = useMood();
  const [releaseText, setReleaseText] = useState('');
  const [isReleasing, setIsReleasing] = useState(false);
  const [releasedItems, setReleasedItems] = useState<string[]>([]);
  const [activeVibe, setActiveVibe] = useState<string | null>(null);
  const [isPlayingSound, setIsPlayingSound] = useState(false);
  const [reflectionAnswer, setReflectionAnswer] = useState('');
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [reflectionAnswers, setReflectionAnswers] = useState<string[]>([]);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [reflectionComplete, setReflectionComplete] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorsRef = useRef<OscillatorNode[]>([]);
  const gainNodeRef = useRef<GainNode | null>(null);

  const stopSound = () => {
    oscillatorsRef.current.forEach(osc => {
      try {
        osc.stop();
        osc.disconnect();
      } catch (e) {}
    });
    oscillatorsRef.current = [];
    if (gainNodeRef.current) {
      gainNodeRef.current.disconnect();
    }
    setIsPlayingSound(false);
  };

  const playVibeSound = async (vibeId: string) => {
    const vibe = musicVibes.find(v => v.id === vibeId);
    if (!vibe) return;

    // Stop existing sounds
    stopSound();

    // Create audio context
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    const ctx = audioContextRef.current;

    // Create gain node for volume control
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
    gainNode.connect(ctx.destination);
    gainNodeRef.current = gainNode;

    // Create oscillators based on vibe type
    const oscillators: OscillatorNode[] = [];
    
    vibe.frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = vibeId === 'nature' ? 'sine' : vibeId === 'focus' ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      
      // Add slight detuning for richness
      osc.detune.setValueAtTime(i * 5, ctx.currentTime);
      
      // Create individual gain for mixing
      const oscGain = ctx.createGain();
      oscGain.gain.setValueAtTime(0.05 / (i + 1), ctx.currentTime);
      
      osc.connect(oscGain);
      oscGain.connect(gainNode);
      osc.start();
      oscillators.push(osc);
    });

    // Add brown noise for nature/calm vibes
    if (vibeId === 'calm' || vibeId === 'nature') {
      const bufferSize = 2 * ctx.sampleRate;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      
      let lastOut = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = output[i];
        output[i] *= 3.5;
      }
      
      const noiseNode = ctx.createBufferSource();
      noiseNode.buffer = noiseBuffer;
      noiseNode.loop = true;
      
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.03, ctx.currentTime);
      noiseNode.connect(noiseGain);
      noiseGain.connect(gainNode);
      noiseNode.start();
    }

    oscillatorsRef.current = oscillators;
    setIsPlayingSound(true);
  };

  const handleRelease = () => {
    if (!releaseText.trim()) return;
    
    setIsReleasing(true);
    setReleasedItems(prev => [...prev, releaseText]);
    
    setTimeout(() => {
      setReleaseText('');
      setIsReleasing(false);
      toast.success('Released! Let it go... 🍃', {
        description: 'Your thoughts have been processed and released.',
      });
      onComplete?.();
    }, 1000);
  };

  const handleVibeChange = (vibeId: string) => {
    if (activeVibe === vibeId) {
      stopSound();
      setActiveVibe(null);
      toast.success('Sound stopped');
    } else {
      setActiveVibe(vibeId);
      playVibeSound(vibeId);
      const vibe = musicVibes.find(v => v.id === vibeId);
      toast.success(`Now playing: ${vibe?.label}`, {
        description: `${vibe?.emoji} Ambient sounds activated`,
      });
    }
  };

  const saveAndNextPrompt = async () => {
    if (!reflectionAnswer.trim()) return;
    
    const newAnswers = [...reflectionAnswers, reflectionAnswer];
    setReflectionAnswers(newAnswers);
    setReflectionAnswer('');
    
    if (currentPromptIndex < reflectionPrompts.length - 1) {
      setCurrentPromptIndex(prev => prev + 1);
      toast.success('Reflection saved!');
    } else {
      // All prompts completed - get AI feedback
      setReflectionComplete(true);
      setIsLoadingAi(true);
      
      try {
        const reflectionSummary = reflectionPrompts.map((prompt, i) => 
          `Q: ${prompt}\nA: ${newAnswers[i]}`
        ).join('\n\n');

        const { data, error } = await supabase.functions.invoke('analyze-mood', {
          body: {
            userInput: `Based on this CBT reflection session, provide a brief, supportive summary and one actionable insight:\n\n${reflectionSummary}`,
            analysisType: 'chat'
          }
        });

        if (!error && data?.response) {
          setAiResponse(data.response);
        } else {
          setAiResponse("Great job completing your reflection! Taking time to understand your feelings is a powerful step toward emotional wellness. 💙");
        }
      } catch (err) {
        setAiResponse("Wonderful work reflecting on your emotions. Self-awareness is the first step to positive change. 🌟");
      } finally {
        setIsLoadingAi(false);
      }
      
      onComplete?.();
    }
  };

  const resetReflection = () => {
    setCurrentPromptIndex(0);
    setReflectionAnswers([]);
    setReflectionAnswer('');
    setAiResponse(null);
    setReflectionComplete(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopSound();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="text-center">
        <h2 className="text-xl font-semibold flex items-center justify-center gap-2">
          <Heart className="w-5 h-5 text-primary" />
          Feel & Heal Room
        </h2>
        <p className="text-sm text-muted-foreground">A safe space to process your emotions</p>
      </div>

      {/* Release Section */}
      <Card className="glass border-0 overflow-hidden">
        <CardContent className="p-6 relative">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
          
          <div className="flex items-center gap-2 mb-4">
            <Wind className="w-5 h-5 text-primary" />
            <h3 className="font-medium">Release & Let Go</h3>
          </div>

          <p className="text-sm text-muted-foreground mb-4">
            Write what's bothering you and tap to release it into the void
          </p>

          <div className="relative">
            <AnimatePresence>
              {releasedItems.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 1, y: 0, scale: 1 }}
                  animate={{ opacity: 0, y: -200, scale: 0.5 }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                >
                  <div className="glass p-4 rounded-xl max-w-[80%] text-center blur-sm">
                    {item}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            <Textarea
              value={releaseText}
              onChange={(e) => setReleaseText(e.target.value)}
              placeholder="What's weighing on your mind?"
              className={`glass border-0 min-h-[100px] resize-none transition-opacity ${isReleasing ? 'opacity-0' : ''}`}
            />
          </div>

          <Button 
            onClick={handleRelease}
            disabled={!releaseText.trim() || isReleasing}
            className="w-full mt-4 gradient-primary text-primary-foreground border-0"
          >
            {isReleasing ? (
              <motion.span
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
              >
                Releasing...
              </motion.span>
            ) : (
              <>
                <Wind className="w-4 h-4 mr-2" />
                Release to the Void
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Music Vibes */}
      <Card className="glass border-0">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Music className="w-5 h-5 text-primary" />
              <h3 className="font-medium">Music Vibes</h3>
            </div>
            {isPlayingSound && (
              <Button variant="ghost" size="sm" onClick={stopSound}>
                <VolumeX className="w-4 h-4 mr-1" />
                Stop
              </Button>
            )}
          </div>

          <p className="text-xs text-muted-foreground mb-4">
            Tap a vibe to play AI-generated ambient sounds
          </p>

          <div className="grid grid-cols-2 gap-3">
            {musicVibes.map((vibe) => (
              <motion.button
                key={vibe.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleVibeChange(vibe.id)}
                className={`p-4 rounded-xl text-left transition-all ${
                  activeVibe === vibe.id 
                    ? 'ring-2 ring-primary bg-primary/10' 
                    : 'bg-muted/30 hover:bg-muted/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{vibe.emoji}</span>
                  {activeVibe === vibe.id && isPlayingSound && (
                    <Volume2 className="w-4 h-4 text-primary animate-pulse" />
                  )}
                </div>
                <span className="text-sm font-medium block mt-1">{vibe.label}</span>
                {activeVibe === vibe.id && (
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    className="h-1 bg-primary rounded-full mt-2"
                  />
                )}
              </motion.button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Guided Reflection */}
      <Card className="glass border-0">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-primary" />
            <h3 className="font-medium">Guided Reflection (CBT)</h3>
          </div>

          {!reflectionComplete ? (
            <motion.div
              key={currentPromptIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-3"
            >
              <p className="text-lg font-medium text-primary">
                {reflectionPrompts[currentPromptIndex]}
              </p>

              <Textarea
                value={reflectionAnswer}
                onChange={(e) => setReflectionAnswer(e.target.value)}
                placeholder="Take your time to reflect..."
                className="glass border-0 min-h-[80px] resize-none"
              />

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setReflectionAnswer('');
                    if (currentPromptIndex < reflectionPrompts.length - 1) {
                      setCurrentPromptIndex(prev => prev + 1);
                    }
                  }}
                  className="flex-1"
                >
                  Skip
                </Button>
                <Button 
                  onClick={saveAndNextPrompt}
                  disabled={!reflectionAnswer.trim()}
                  className="flex-1 gradient-primary text-primary-foreground border-0"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {currentPromptIndex === reflectionPrompts.length - 1 ? 'Complete' : 'Save & Next'}
                </Button>
              </div>

              <div className="flex justify-center gap-1 mt-4">
                {reflectionPrompts.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index < reflectionAnswers.length ? 'bg-primary' :
                      index === currentPromptIndex ? 'bg-primary/50' : 'bg-muted'
                    }`}
                  />
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 text-primary">
                <CheckCircle className="w-6 h-6" />
                <span className="font-medium">Reflection Complete!</span>
              </div>

              {isLoadingAi ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  <span className="ml-2 text-sm text-muted-foreground">Getting AI insights...</span>
                </div>
              ) : aiResponse && (
                <div className="p-4 rounded-xl bg-primary/10">
                  <div className="flex items-start gap-2">
                    <Sparkles className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-primary mb-1">AI Insight</p>
                      <p className="text-sm text-muted-foreground">{aiResponse}</p>
                    </div>
                  </div>
                </div>
              )}

              <Button onClick={resetReflection} variant="outline" className="w-full">
                Start New Reflection
              </Button>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
