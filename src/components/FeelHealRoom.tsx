import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Wind, Music, Send, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useMood } from '@/lib/mood-context';
import { toast } from 'sonner';

const musicVibes = [
  { id: 'calm', label: 'Calm & Soothing', emoji: '🌊', color: 'var(--mood-calm)' },
  { id: 'nature', label: 'Nature Sounds', emoji: '🌿', color: 'var(--mood-neutral)' },
  { id: 'focus', label: 'Focus Flow', emoji: '🎯', color: 'var(--mood-energetic)' },
  { id: 'uplift', label: 'Uplifting', emoji: '☀️', color: 'var(--mood-happy)' },
];

const reflectionPrompts = [
  "What triggered this feeling?",
  "How does your body feel right now?",
  "What would you tell a friend in this situation?",
  "What's one small thing that could help?",
];

export function FeelHealRoom() {
  const { currentMood } = useMood();
  const [releaseText, setReleaseText] = useState('');
  const [isReleasing, setIsReleasing] = useState(false);
  const [releasedItems, setReleasedItems] = useState<string[]>([]);
  const [activeVibe, setActiveVibe] = useState<string | null>(null);
  const [reflectionAnswer, setReflectionAnswer] = useState('');
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);

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
    }, 1000);
  };

  const handleVibeChange = (vibeId: string) => {
    setActiveVibe(vibeId);
    const vibe = musicVibes.find(v => v.id === vibeId);
    toast.success(`Now playing: ${vibe?.label}`, {
      description: `${vibe?.emoji} Ambient sounds activated`,
    });
  };

  const nextPrompt = () => {
    if (reflectionAnswer.trim()) {
      toast.success('Reflection saved!');
      setReflectionAnswer('');
    }
    setCurrentPromptIndex((prev) => (prev + 1) % reflectionPrompts.length);
  };

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
          <div className="flex items-center gap-2 mb-4">
            <Music className="w-5 h-5 text-primary" />
            <h3 className="font-medium">Music Vibes</h3>
          </div>

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
                <span className="text-2xl mb-2 block">{vibe.emoji}</span>
                <span className="text-sm font-medium">{vibe.label}</span>
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
                onClick={nextPrompt}
                className="flex-1"
              >
                Skip
              </Button>
              <Button 
                onClick={nextPrompt}
                disabled={!reflectionAnswer.trim()}
                className="flex-1 gradient-primary text-primary-foreground border-0"
              >
                <Send className="w-4 h-4 mr-2" />
                Save & Next
              </Button>
            </div>
          </motion.div>

          <div className="flex justify-center gap-1 mt-4">
            {reflectionPrompts.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentPromptIndex ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
