import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Castle, Flower2, Flag, Sparkles, Star, Trophy, Heart } from 'lucide-react';

interface ProductivityCastleProps {
  level: number;
  xp: number;
  moodChecks: number;
  healSessions: number;
  questsCompleted: number;
}

export function ProductivityCastle({ 
  level = 1, 
  xp = 0, 
  moodChecks = 0, 
  healSessions = 0, 
  questsCompleted = 0 
}: ProductivityCastleProps) {
  const xpForNextLevel = level * 100;
  const progress = Math.min((xp % 100) / 100 * 100, 100);
  
  // Calculate wellness score (0-100)
  const wellnessScore = Math.min(
    (moodChecks * 10 + healSessions * 20 + questsCompleted * 15), 
    100
  );

  // Determine castle appearance based on wellness activities
  const hasFlowers = healSessions >= 1;
  const hasFlags = questsCompleted >= 1;
  const hasGlow = wellnessScore >= 50;

  return (
    <Card className="glass border-0 overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Castle className="w-5 h-5 text-primary" />
          Productivity Castle
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative h-48 flex items-end justify-center">
          {/* Castle Background Glow */}
          {hasGlow && (
            <motion.div
              className="absolute inset-0 gradient-primary opacity-10 blur-3xl"
              animate={{ opacity: [0.1, 0.2, 0.1] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
          )}

          {/* Castle Structure */}
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="relative"
          >
            {/* Main Tower */}
            <div className={`relative ${hasGlow ? 'drop-shadow-lg' : ''}`}>
              {/* Tower Top */}
              <motion.div 
                className="w-0 h-0 border-l-[30px] border-r-[30px] border-b-[40px] border-l-transparent border-r-transparent border-b-primary/80 mx-auto"
                animate={hasFlags ? { y: [0, -2, 0] } : {}}
                transition={{ duration: 2, repeat: Infinity }}
              />
              
              {/* Flag on top */}
              {hasFlags && (
                <motion.div 
                  className="absolute -top-2 left-1/2 -translate-x-1/2"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                >
                  <Flag className="w-4 h-4 text-accent" />
                </motion.div>
              )}

              {/* Tower Body */}
              <div className="w-16 h-24 bg-primary/60 mx-auto relative">
                {/* Window */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-6 h-8 bg-background/80 rounded-t-full" />
                
                {/* Sparkles for wellness */}
                {hasGlow && (
                  <motion.div
                    className="absolute -right-4 top-2"
                    animate={{ rotate: 360, scale: [1, 1.2, 1] }}
                    transition={{ duration: 4, repeat: Infinity }}
                  >
                    <Sparkles className="w-4 h-4 text-primary" />
                  </motion.div>
                )}
              </div>
            </div>

            {/* Side Towers */}
            <div className="absolute -left-8 bottom-0">
              <div className="w-0 h-0 border-l-[15px] border-r-[15px] border-b-[20px] border-l-transparent border-r-transparent border-b-primary/60 mx-auto" />
              <div className="w-8 h-16 bg-primary/40" />
            </div>
            <div className="absolute -right-8 bottom-0">
              <div className="w-0 h-0 border-l-[15px] border-r-[15px] border-b-[20px] border-l-transparent border-r-transparent border-b-primary/60 mx-auto" />
              <div className="w-8 h-16 bg-primary/40" />
            </div>

            {/* Base Wall */}
            <div className="w-32 h-8 bg-primary/50 -mx-2 flex items-center justify-center gap-2">
              {/* Door */}
              <div className="w-6 h-6 bg-background/60 rounded-t-full" />
            </div>

            {/* Flowers */}
            {hasFlowers && (
              <>
                <motion.div 
                  className="absolute -left-12 bottom-0"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1, rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <Flower2 className="w-6 h-6 text-pink-400" />
                </motion.div>
                <motion.div 
                  className="absolute -right-12 bottom-0"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1, rotate: [0, -5, 5, 0] }}
                  transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
                >
                  <Flower2 className="w-6 h-6 text-purple-400" />
                </motion.div>
                <motion.div 
                  className="absolute left-1/2 -translate-x-1/2 bottom-0"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 1 }}
                >
                  <Heart className="w-4 h-4 text-red-400" />
                </motion.div>
              </>
            )}
          </motion.div>
        </div>

        {/* Stats */}
        <div className="space-y-4 mt-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Level {level}</span>
            <span className="text-muted-foreground">{xp} / {xpForNextLevel} XP</span>
          </div>
          <Progress value={progress} className="h-2" />

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="glass p-2 rounded-lg">
              <Star className="w-4 h-4 mx-auto text-primary mb-1" />
              <p className="text-xs text-muted-foreground">Mood Checks</p>
              <p className="font-semibold">{moodChecks}</p>
            </div>
            <div className="glass p-2 rounded-lg">
              <Heart className="w-4 h-4 mx-auto text-pink-400 mb-1" />
              <p className="text-xs text-muted-foreground">Heal Sessions</p>
              <p className="font-semibold">{healSessions}</p>
            </div>
            <div className="glass p-2 rounded-lg">
              <Trophy className="w-4 h-4 mx-auto text-accent mb-1" />
              <p className="text-xs text-muted-foreground">Quests Done</p>
              <p className="font-semibold">{questsCompleted}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
