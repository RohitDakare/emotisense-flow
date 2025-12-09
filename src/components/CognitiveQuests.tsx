import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gamepad2, Trophy, Star, RefreshCw, Target, Puzzle, Zap, Brain, Heart, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

type Quest = 'balloon' | 'puzzle' | 'breathing' | 'memory' | 'gratitude' | null;

interface Balloon {
  id: number;
  text: string;
  x: number;
  popped: boolean;
  reframe: string;
}

const negativeThoughts = [
  { thought: "I can't do this", reframe: "I'm learning and growing" },
  { thought: "I'm not good enough", reframe: "I am worthy as I am" },
  { thought: "Everyone judges me", reframe: "Most people focus on themselves" },
  { thought: "I always fail", reframe: "Every attempt teaches me something" },
  { thought: "Things never work out", reframe: "Challenges lead to growth" },
  { thought: "I'm so stupid", reframe: "Making mistakes is human" },
  { thought: "Nobody likes me", reframe: "I have people who care" },
  { thought: "It's hopeless", reframe: "Change takes time" },
];

interface PuzzleMatch {
  feeling: string;
  trigger: string;
  solution: string;
  matched: boolean;
}

const puzzleData: PuzzleMatch[] = [
  { feeling: '😰 Anxious', trigger: 'Upcoming deadline', solution: 'Break into small tasks', matched: false },
  { feeling: '😢 Sad', trigger: 'Feeling isolated', solution: 'Reach out to a friend', matched: false },
  { feeling: '😠 Frustrated', trigger: 'Plans changed', solution: 'Practice flexibility', matched: false },
  { feeling: '😴 Drained', trigger: 'Overworking', solution: 'Take regular breaks', matched: false },
];

const memoryCards = ['🌸', '🌊', '🌿', '☀️', '🦋', '🌙'];

const gratitudePrompts = [
  "Something that made you smile today",
  "A person you're grateful for",
  "A skill or ability you have",
  "Something in nature you appreciate",
  "A comfortable thing you enjoy",
  "A challenge that helped you grow"
];

interface CognitiveQuestsProps {
  onQuestComplete?: () => void;
}

export function CognitiveQuests({ onQuestComplete }: CognitiveQuestsProps = {}) {
  const [activeQuest, setActiveQuest] = useState<Quest>(null);
  const [score, setScore] = useState(0);
  const [balloons, setBalloons] = useState<Balloon[]>([]);
  const [showReframe, setShowReframe] = useState<string | null>(null);
  const [puzzleState, setPuzzleState] = useState(puzzleData);
  const [selectedFeeling, setSelectedFeeling] = useState<string | null>(null);
  
  // Breathing exercise state
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold' | 'exhale' | 'rest'>('inhale');
  const [breathCount, setBreathCount] = useState(0);
  const [breathTimer, setBreathTimer] = useState(4);
  
  // Memory game state
  const [memoryGameCards, setMemoryGameCards] = useState<{id: number; emoji: string; flipped: boolean; matched: boolean}[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [memoryMoves, setMemoryMoves] = useState(0);
  
  // Gratitude game state
  const [currentPrompt, setCurrentPrompt] = useState(0);
  const [gratitudeAnswers, setGratitudeAnswers] = useState<string[]>([]);

  const startBalloonQuest = useCallback(() => {
    setActiveQuest('balloon');
    setScore(0);
    setBalloons([]);
    spawnBalloon();
  }, []);

  const spawnBalloon = useCallback(() => {
    const thought = negativeThoughts[Math.floor(Math.random() * negativeThoughts.length)];
    const newBalloon: Balloon = {
      id: Date.now(),
      text: thought.thought,
      x: 10 + Math.random() * 70,
      popped: false,
      reframe: thought.reframe,
    };
    setBalloons(prev => [...prev, newBalloon]);
  }, []);

  useEffect(() => {
    if (activeQuest === 'balloon') {
      const interval = setInterval(() => {
        if (balloons.length < 5) {
          spawnBalloon();
        }
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [activeQuest, balloons.length, spawnBalloon]);

  const popBalloon = (balloon: Balloon) => {
    setBalloons(prev => prev.map(b => 
      b.id === balloon.id ? { ...b, popped: true } : b
    ));
    setScore(prev => prev + 10);
    setShowReframe(balloon.reframe);
    onQuestComplete?.();
    
    setTimeout(() => {
      setShowReframe(null);
      setBalloons(prev => prev.filter(b => b.id !== balloon.id));
    }, 1500);
  };

  const startPuzzleQuest = () => {
    setActiveQuest('puzzle');
    setScore(0);
    setPuzzleState(puzzleData.map(p => ({ ...p, matched: false })));
    setSelectedFeeling(null);
  };

  const handlePuzzleMatch = (feeling: string, solution: string) => {
    const match = puzzleState.find(p => p.feeling === feeling && p.solution === solution);
    if (match && !match.matched) {
      setPuzzleState(prev => prev.map(p => 
        p.feeling === feeling ? { ...p, matched: true } : p
      ));
      setScore(prev => prev + 25);
      setSelectedFeeling(null);
      onQuestComplete?.();
      
      if (puzzleState.filter(p => !p.matched).length === 1) {
        setTimeout(() => {
          toast.success('🎉 Puzzle Complete!', {
            description: 'You matched all feelings with solutions!'
          });
        }, 500);
      }
    } else {
      toast.error('Not quite right', {
        description: 'Try a different combination'
      });
    }
  };

  // Breathing exercise
  const startBreathingQuest = () => {
    setActiveQuest('breathing');
    setBreathPhase('inhale');
    setBreathCount(0);
    setBreathTimer(4);
  };

  useEffect(() => {
    if (activeQuest !== 'breathing') return;
    
    const interval = setInterval(() => {
      setBreathTimer(prev => {
        if (prev <= 1) {
          // Move to next phase
          if (breathPhase === 'inhale') {
            setBreathPhase('hold');
            return 7;
          } else if (breathPhase === 'hold') {
            setBreathPhase('exhale');
            return 8;
          } else if (breathPhase === 'exhale') {
            setBreathCount(c => c + 1);
            if (breathCount >= 3) {
              toast.success('🧘 Breathing Complete!', {
                description: 'Great job! You completed 4 breathing cycles.'
              });
              onQuestComplete?.();
              setActiveQuest(null);
            }
            setBreathPhase('inhale');
            return 4;
          }
          return 4;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [activeQuest, breathPhase, breathCount, onQuestComplete]);

  // Memory game
  const startMemoryQuest = () => {
    const shuffled = [...memoryCards, ...memoryCards]
      .sort(() => Math.random() - 0.5)
      .map((emoji, index) => ({ id: index, emoji, flipped: false, matched: false }));
    setMemoryGameCards(shuffled);
    setFlippedCards([]);
    setMemoryMoves(0);
    setActiveQuest('memory');
  };

  const handleCardFlip = (cardId: number) => {
    if (flippedCards.length >= 2) return;
    const card = memoryGameCards.find(c => c.id === cardId);
    if (!card || card.flipped || card.matched) return;

    const newCards = memoryGameCards.map(c => 
      c.id === cardId ? { ...c, flipped: true } : c
    );
    setMemoryGameCards(newCards);
    const newFlipped = [...flippedCards, cardId];
    setFlippedCards(newFlipped);

    if (newFlipped.length === 2) {
      setMemoryMoves(prev => prev + 1);
      const [first, second] = newFlipped;
      const firstCard = newCards.find(c => c.id === first);
      const secondCard = newCards.find(c => c.id === second);
      
      if (firstCard?.emoji === secondCard?.emoji) {
        setMemoryGameCards(prev => prev.map(c => 
          c.id === first || c.id === second ? { ...c, matched: true } : c
        ));
        setFlippedCards([]);
        setScore(prev => prev + 20);
        onQuestComplete?.();
        
        if (newCards.filter(c => !c.matched).length === 2) {
          setTimeout(() => {
            toast.success('🎉 Memory Complete!', {
              description: `You matched all cards in ${memoryMoves + 1} moves!`
            });
          }, 500);
        }
      } else {
        setTimeout(() => {
          setMemoryGameCards(prev => prev.map(c => 
            c.id === first || c.id === second ? { ...c, flipped: false } : c
          ));
          setFlippedCards([]);
        }, 1000);
      }
    }
  };

  // Gratitude game
  const startGratitudeQuest = () => {
    setActiveQuest('gratitude');
    setCurrentPrompt(0);
    setGratitudeAnswers([]);
  };

  const submitGratitude = (answer: string) => {
    if (!answer.trim()) return;
    setGratitudeAnswers(prev => [...prev, answer]);
    setScore(prev => prev + 15);
    onQuestComplete?.();
    
    if (currentPrompt < gratitudePrompts.length - 1) {
      setCurrentPrompt(prev => prev + 1);
    } else {
      toast.success('🙏 Gratitude Complete!', {
        description: `You found ${gratitudeAnswers.length + 1} things to be grateful for!`
      });
      setTimeout(() => setActiveQuest(null), 1500);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="text-center">
        <h2 className="text-xl font-semibold flex items-center justify-center gap-2">
          <Gamepad2 className="w-5 h-5 text-primary" />
          Cognitive Adventure Quests
        </h2>
        <p className="text-sm text-muted-foreground">Train your mind through play</p>
      </div>

      <AnimatePresence mode="wait">
        {!activeQuest && (
          <motion.div
            key="menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid gap-4"
          >
            <Card 
              className="glass border-0 cursor-pointer hover:bg-primary/5 transition-colors"
              onClick={startBalloonQuest}
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-4 rounded-2xl gradient-primary">
                    <Target className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">Catch the Negative Thoughts</h3>
                    <p className="text-sm text-muted-foreground">Pop negative balloons to reveal positive reframes</p>
                  </div>
                  <Star className="w-5 h-5 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card 
              className="glass border-0 cursor-pointer hover:bg-primary/5 transition-colors"
              onClick={startPuzzleQuest}
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-4 rounded-2xl bg-accent">
                    <Puzzle className="w-8 h-8 text-accent-foreground" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">Emotion Puzzles</h3>
                    <p className="text-sm text-muted-foreground">Match feelings with solutions</p>
                  </div>
                  <Star className="w-5 h-5 text-accent" />
                </div>
              </CardContent>
            </Card>

            <Card 
              className="glass border-0 cursor-pointer hover:bg-primary/5 transition-colors"
              onClick={startBreathingQuest}
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-4 rounded-2xl bg-primary/20">
                    <Zap className="w-8 h-8 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">4-7-8 Breathing</h3>
                    <p className="text-sm text-muted-foreground">Calming breathing exercise</p>
                  </div>
                  <Star className="w-5 h-5 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card 
              className="glass border-0 cursor-pointer hover:bg-primary/5 transition-colors"
              onClick={startMemoryQuest}
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-4 rounded-2xl bg-accent/50">
                    <Brain className="w-8 h-8 text-accent-foreground" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">Mindful Memory</h3>
                    <p className="text-sm text-muted-foreground">Match calming symbols</p>
                  </div>
                  <Star className="w-5 h-5 text-accent" />
                </div>
              </CardContent>
            </Card>

            <Card 
              className="glass border-0 cursor-pointer hover:bg-primary/5 transition-colors"
              onClick={startGratitudeQuest}
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-4 rounded-2xl bg-primary/30">
                    <Heart className="w-8 h-8 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">Gratitude Journey</h3>
                    <p className="text-sm text-muted-foreground">Find things to appreciate</p>
                  </div>
                  <Star className="w-5 h-5 text-primary" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {activeQuest === 'balloon' && (
          <motion.div
            key="balloon"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-primary" />
                <span className="font-semibold">Score: {score}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setActiveQuest(null)}>
                Exit Quest
              </Button>
            </div>

            <Card className="glass border-0 overflow-hidden">
              <CardContent className="p-0 h-[400px] relative bg-gradient-to-b from-primary/5 to-accent/5">
                <AnimatePresence>
                  {showReframe && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5, y: 50 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 flex items-center justify-center z-20"
                    >
                      <div className="glass p-6 rounded-2xl text-center max-w-[80%]">
                        <Star className="w-8 h-8 text-primary mx-auto mb-2" />
                        <p className="text-lg font-medium text-primary">{showReframe}</p>
                      </div>
                    </motion.div>
                  )}

                  {balloons.map((balloon) => (
                    <motion.button
                      key={balloon.id}
                      initial={{ y: 400, opacity: 0 }}
                      animate={{ 
                        y: balloon.popped ? -100 : -50, 
                        opacity: balloon.popped ? 0 : 1,
                        scale: balloon.popped ? 1.5 : 1
                      }}
                      transition={{ 
                        y: { duration: balloon.popped ? 0.3 : 8, ease: "linear" },
                        scale: { duration: 0.2 }
                      }}
                      onClick={() => !balloon.popped && popBalloon(balloon)}
                      className="absolute bottom-0"
                      style={{ left: `${balloon.x}%` }}
                    >
                      <div className={`w-24 h-32 rounded-full flex items-center justify-center p-2 text-center text-xs font-medium ${
                        balloon.popped 
                          ? 'bg-primary/20' 
                          : 'bg-destructive/80 text-destructive-foreground hover:bg-destructive cursor-pointer'
                      }`}>
                        {!balloon.popped && balloon.text}
                      </div>
                      <div className="w-px h-12 bg-muted mx-auto" />
                    </motion.button>
                  ))}
                </AnimatePresence>

                <p className="absolute bottom-4 left-0 right-0 text-center text-sm text-muted-foreground">
                  Tap the balloons to pop negative thoughts!
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {activeQuest === 'puzzle' && (
          <motion.div
            key="puzzle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-primary" />
                <span className="font-semibold">Score: {score}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setActiveQuest(null)}>
                Exit Quest
              </Button>
            </div>

            <Card className="glass border-0">
              <CardContent className="p-4 space-y-4">
                <p className="text-sm text-muted-foreground text-center">
                  {selectedFeeling ? 'Now tap the matching solution!' : 'Tap a feeling to start matching'}
                </p>

                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Feelings</h4>
                  <div className="flex flex-wrap gap-2">
                    {puzzleState.map((item) => (
                      <motion.button
                        key={item.feeling}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => !item.matched && setSelectedFeeling(item.feeling)}
                        disabled={item.matched}
                        className={`px-4 py-2 rounded-xl text-sm transition-all ${
                          item.matched 
                            ? 'bg-primary/20 text-primary opacity-50' 
                            : selectedFeeling === item.feeling
                              ? 'bg-primary text-primary-foreground ring-2 ring-primary'
                              : 'bg-muted/50 hover:bg-muted'
                        }`}
                      >
                        {item.feeling}
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Solutions</h4>
                  <div className="flex flex-wrap gap-2">
                    {puzzleState.map((item) => (
                      <motion.button
                        key={item.solution}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => selectedFeeling && handlePuzzleMatch(selectedFeeling, item.solution)}
                        disabled={item.matched || !selectedFeeling}
                        className={`px-4 py-2 rounded-xl text-sm transition-all ${
                          item.matched 
                            ? 'bg-accent/20 text-accent opacity-50' 
                            : 'bg-muted/50 hover:bg-accent/20'
                        }`}
                      >
                        {item.solution}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {puzzleState.every(p => p.matched) && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center p-6"
                  >
                    <Trophy className="w-12 h-12 text-primary mx-auto mb-2" />
                    <h3 className="text-lg font-semibold">All Matched!</h3>
                    <Button 
                      onClick={startPuzzleQuest}
                      className="mt-4 gradient-primary text-primary-foreground border-0"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Play Again
                    </Button>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {activeQuest === 'breathing' && (
          <motion.div
            key="breathing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Timer className="w-5 h-5 text-primary" />
                <span className="font-semibold">Cycle: {breathCount + 1}/4</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setActiveQuest(null)}>
                Exit Quest
              </Button>
            </div>

            <Card className="glass border-0">
              <CardContent className="p-8 text-center space-y-6">
                <motion.div
                  animate={{
                    scale: breathPhase === 'inhale' ? 1.3 : breathPhase === 'exhale' ? 0.7 : 1,
                  }}
                  transition={{ duration: breathPhase === 'inhale' ? 4 : breathPhase === 'exhale' ? 8 : 0.3 }}
                  className="w-32 h-32 mx-auto rounded-full gradient-primary flex items-center justify-center"
                >
                  <span className="text-4xl text-primary-foreground font-bold">{breathTimer}</span>
                </motion.div>

                <div className="space-y-2">
                  <h3 className="text-2xl font-semibold capitalize">{breathPhase}</h3>
                  <p className="text-muted-foreground">
                    {breathPhase === 'inhale' && 'Breathe in slowly through your nose'}
                    {breathPhase === 'hold' && 'Hold your breath gently'}
                    {breathPhase === 'exhale' && 'Breathe out slowly through your mouth'}
                  </p>
                </div>

                <Progress value={(breathCount / 4) * 100} className="h-2" />
              </CardContent>
            </Card>
          </motion.div>
        )}

        {activeQuest === 'memory' && (
          <motion.div
            key="memory"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-primary" />
                  <span className="font-semibold">Score: {score}</span>
                </div>
                <span className="text-sm text-muted-foreground">Moves: {memoryMoves}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setActiveQuest(null)}>
                Exit Quest
              </Button>
            </div>

            <Card className="glass border-0">
              <CardContent className="p-4">
                <div className="grid grid-cols-4 gap-2">
                  {memoryGameCards.map((card) => (
                    <motion.button
                      key={card.id}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleCardFlip(card.id)}
                      disabled={card.matched || card.flipped}
                      className={`aspect-square rounded-xl text-2xl flex items-center justify-center transition-all ${
                        card.flipped || card.matched
                          ? 'bg-primary/20'
                          : 'bg-muted/50 hover:bg-muted'
                      }`}
                    >
                      {(card.flipped || card.matched) ? card.emoji : '?'}
                    </motion.button>
                  ))}
                </div>

                {memoryGameCards.every(c => c.matched) && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center p-6 mt-4"
                  >
                    <Trophy className="w-12 h-12 text-primary mx-auto mb-2" />
                    <h3 className="text-lg font-semibold">Perfect Memory!</h3>
                    <Button 
                      onClick={startMemoryQuest}
                      className="mt-4 gradient-primary text-primary-foreground border-0"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Play Again
                    </Button>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {activeQuest === 'gratitude' && (
          <motion.div
            key="gratitude"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-primary" />
                <span className="font-semibold">{currentPrompt + 1}/{gratitudePrompts.length}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setActiveQuest(null)}>
                Exit Quest
              </Button>
            </div>

            <Card className="glass border-0">
              <CardContent className="p-6 space-y-4">
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">I'm grateful for...</h3>
                  <p className="text-primary font-medium">{gratitudePrompts[currentPrompt]}</p>
                </div>

                <GratitudeInput onSubmit={submitGratitude} />

                {gratitudeAnswers.length > 0 && (
                  <div className="space-y-2 pt-4 border-t border-border/50">
                    <p className="text-sm text-muted-foreground">Your gratitude list:</p>
                    {gratitudeAnswers.map((answer, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <Star className="w-4 h-4 text-primary" />
                        <span>{answer}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function GratitudeInput({ onSubmit }: { onSubmit: (answer: string) => void }) {
  const [value, setValue] = useState('');
  
  const handleSubmit = () => {
    if (value.trim()) {
      onSubmit(value.trim());
      setValue('');
    }
  };

  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        placeholder="Type something you're grateful for..."
        className="flex-1 px-4 py-2 rounded-xl bg-muted/50 border-0 focus:ring-2 focus:ring-primary outline-none"
      />
      <Button onClick={handleSubmit} className="gradient-primary border-0">
        <Star className="w-4 h-4" />
      </Button>
    </div>
  );
}
