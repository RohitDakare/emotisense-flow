import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Sparkles, Heart, Lightbulb, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useMood, MoodType, moodEmojis } from '@/lib/mood-context';
import { toast } from 'sonner';

interface AnalysisResult {
  mood: MoodType;
  sentiment: string;
  emotions: string[];
  insight: string;
  affirmation: string;
  suggestion: string;
}

export function AIJournalAnalysis() {
  const [journalEntry, setJournalEntry] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const { addMoodEntry } = useMood();

  const analyzeJournal = async () => {
    if (!journalEntry.trim() || isAnalyzing) return;

    setIsAnalyzing(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('analyze-mood', {
        body: {
          userInput: journalEntry.trim(),
          analysisType: 'journal'
        }
      });

      if (error) throw error;

      if (data.mood) {
        setResult(data as AnalysisResult);
        addMoodEntry(data.mood, journalEntry.trim());
        toast.success('Journal analyzed!', {
          description: `Detected mood: ${moodEmojis[data.mood as MoodType]} ${data.mood}`
        });
      }
    } catch (error) {
      console.error('Journal analysis error:', error);
      toast.error('Analysis failed', {
        description: 'Please try again in a moment.'
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const reset = () => {
    setJournalEntry('');
    setResult(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="text-center">
        <h2 className="text-xl font-semibold flex items-center justify-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          AI Journal Analysis
        </h2>
        <p className="text-sm text-muted-foreground">Write your thoughts and let AI understand your emotions</p>
      </div>

      <AnimatePresence mode="wait">
        {!result ? (
          <motion.div
            key="input"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <Textarea
              value={journalEntry}
              onChange={(e) => setJournalEntry(e.target.value)}
              placeholder="How are you feeling today? Write about your thoughts, experiences, or anything on your mind..."
              className="min-h-[200px] bg-muted/30 border-0 resize-none"
              disabled={isAnalyzing}
            />

            <Button
              onClick={analyzeJournal}
              disabled={!journalEntry.trim() || isAnalyzing}
              className="w-full gradient-primary text-primary-foreground border-0"
              size="lg"
            >
              {isAnalyzing ? (
                <>
                  <Sparkles className="mr-2 h-5 w-5 animate-pulse" />
                  Analyzing your feelings...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Analyze with AI
                </>
              )}
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* Mood Card */}
            <Card className="glass border-0 overflow-hidden">
              <div className="gradient-primary p-4 text-center">
                <span className="text-4xl">{moodEmojis[result.mood]}</span>
                <h3 className="text-lg font-semibold text-primary-foreground capitalize mt-2">
                  {result.mood}
                </h3>
                <p className="text-sm text-primary-foreground/80">Detected mood</p>
              </div>
              <CardContent className="p-4 space-y-4">
                {/* Emotions */}
                {result.emotions && result.emotions.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {result.emotions.map((emotion, i) => (
                      <span key={i} className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm">
                        {emotion}
                      </span>
                    ))}
                  </div>
                )}

                {/* Insight */}
                <div className="flex gap-3">
                  <Lightbulb className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground">{result.insight}</p>
                </div>

                {/* Affirmation */}
                <div className="flex gap-3 p-3 rounded-xl bg-primary/5">
                  <Heart className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <p className="text-sm font-medium">{result.affirmation}</p>
                </div>

                {/* Suggestion */}
                <div className="flex gap-3">
                  <Sun className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground">{result.suggestion}</p>
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={reset}
              variant="outline"
              className="w-full"
            >
              Write Another Entry
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
