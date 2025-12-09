import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMood, MoodType, moodEmojis } from '@/lib/mood-context';
import { RealEmotionDetector } from './RealEmotionDetector';

interface MoodScannerProps {
  onComplete: () => void;
}

const moods: MoodType[] = ['happy', 'calm', 'neutral', 'tired', 'anxious', 'energetic'];

export function MoodScanner({ onComplete }: MoodScannerProps) {
  const { addMoodEntry } = useMood();
  const [useRealCamera, setUseRealCamera] = useState(false);
  const [detected, setDetected] = useState<MoodType | null>(null);
  const [showManual, setShowManual] = useState(false);

  const handleMoodDetected = (mood: MoodType) => {
    setDetected(mood);
    setUseRealCamera(false);
  };

  const confirmMood = (mood: MoodType) => {
    addMoodEntry(mood);
    setTimeout(onComplete, 500);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 gradient-mood">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md w-full"
      >
        <motion.h1 
          className="text-4xl font-bold mb-2 text-gradient"
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
        >
          MindFlow
        </motion.h1>
        <p className="text-muted-foreground mb-8">Let's check in with how you're feeling</p>

        <AnimatePresence mode="wait">
          {useRealCamera && (
            <motion.div
              key="real-camera"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <RealEmotionDetector
                onMoodDetected={handleMoodDetected}
                onCancel={() => {
                  setUseRealCamera(false);
                  setShowManual(true);
                }}
              />
            </motion.div>
          )}

          {!useRealCamera && !detected && !showManual && (
            <motion.div
              key="scanner"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <motion.div
                className="mx-auto w-48 h-48 rounded-full glass flex items-center justify-center relative overflow-hidden"
              >
                <Camera className="w-16 h-16 text-primary" />
              </motion.div>

              <div className="space-y-3">
                <Button
                  onClick={() => setUseRealCamera(true)}
                  size="lg"
                  className="w-full gradient-primary text-primary-foreground border-0"
                >
                  <Camera className="mr-2 h-5 w-5" />
                  Start Real Mood Scan
                </Button>

                <Button
                  variant="ghost"
                  onClick={() => setShowManual(true)}
                  className="w-full text-muted-foreground"
                >
                  Or select manually
                </Button>
              </div>
            </motion.div>
          )}

          {detected && (
            <motion.div
              key="detected"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              <div className="glass p-8 rounded-2xl">
                <p className="text-sm text-muted-foreground mb-2">Detected mood</p>
                <div className="text-6xl mb-4">{moodEmojis[detected]}</div>
                <h2 className="text-2xl font-semibold capitalize mb-4">{detected}</h2>
                <div className="flex gap-3 justify-center">
                  <Button onClick={() => confirmMood(detected)} className="gradient-primary text-primary-foreground border-0">
                    <Sparkles className="mr-2 h-4 w-4" />
                    Confirm
                  </Button>
                  <Button variant="outline" onClick={() => { setDetected(null); setShowManual(true); }}>
                    Change
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {showManual && !detected && (
            <motion.div
              key="manual"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              <p className="text-muted-foreground">How are you feeling?</p>
              <div className="grid grid-cols-3 gap-3">
                {moods.map((mood) => (
                  <motion.button
                    key={mood}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => confirmMood(mood)}
                    className="glass p-4 rounded-xl flex flex-col items-center gap-2 hover:bg-primary/10 transition-colors"
                  >
                    <span className="text-3xl">{moodEmojis[mood]}</span>
                    <span className="text-sm capitalize">{mood}</span>
                  </motion.button>
                ))}
              </div>
              <Button variant="ghost" onClick={() => setShowManual(false)} className="mt-4">
                Back to scan
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
