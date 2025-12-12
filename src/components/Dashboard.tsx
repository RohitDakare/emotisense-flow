import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Heart, Gamepad2, BarChart3, Sparkles, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMood, moodEmojis, MoodType } from '@/lib/mood-context';
import { useAuth } from '@/hooks/useAuth';
import { CalendarView } from './CalendarView';
import { FeelHealRoom } from './FeelHealRoom';
import { CognitiveQuests } from './CognitiveQuests';
import { WeeklyReport } from './WeeklyReport';
import { ProductivityCastle } from './ProductivityCastle';
import { WellnessReminders } from './WellnessReminders';
import { AmbientSoundPlayer } from './AmbientSoundPlayer';
import { AIWellnessChat } from './AIWellnessChat';
import { AIJournalAnalysis } from './AIJournalAnalysis';
import { toast } from 'sonner';


type View = 'home' | 'calendar' | 'heal' | 'quests' | 'report' | 'journal';

const navItems = [
  { id: 'home' as View, icon: Sparkles, label: 'Home' },
  { id: 'calendar' as View, icon: Calendar, label: 'Calendar' },
  { id: 'heal' as View, icon: Heart, label: 'Feel & Heal' },
  { id: 'quests' as View, icon: Gamepad2, label: 'Quests' },
  { id: 'report' as View, icon: BarChart3, label: 'Report' },
];

interface CalendarEvent {
  id: string;
  title: string;
  time: string;
  date: string;
  predictedMood: MoodType;
  tag: string;
}

export function Dashboard() {
  const { currentMood, moodHistory } = useMood();
  const { signOut, user } = useAuth();
  const [view, setView] = useState<View>('home');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [questsCompleted, setQuestsCompleted] = useState(() => {
    const saved = localStorage.getItem('questsCompleted');
    return saved ? parseInt(saved) : 0;
  });
  const [healSessions, setHealSessions] = useState(() => {
    const saved = localStorage.getItem('healSessions');
    return saved ? parseInt(saved) : 0;
  });

  useEffect(() => {
    localStorage.setItem('questsCompleted', questsCompleted.toString());
  }, [questsCompleted]);

  useEffect(() => {
    localStorage.setItem('healSessions', healSessions.toString());
  }, [healSessions]);

  const addEvent = (event: Omit<CalendarEvent, 'id'>) => {
    const newEvent = { ...event, id: Date.now().toString() };
    setEvents(prev => [...prev, newEvent]);
  };

  const handleQuestComplete = () => {
    setQuestsCompleted(prev => prev + 1);
  };

  const handleHealComplete = () => {
    setHealSessions(prev => prev + 1);
  };

  const renderView = () => {
    switch (view) {
      case 'calendar':
        return <CalendarView events={events} onAddEvent={addEvent} />;
      case 'heal':
        return <FeelHealRoom onComplete={handleHealComplete} />;
      case 'quests':
        return <CognitiveQuests onQuestComplete={handleQuestComplete} />;
      case 'report':
        return <WeeklyReport />;
      case 'journal':
        return <AIJournalAnalysis />;
      default:
        return (
          <HomeView
            events={events}
            onNavigate={setView}
            questsCompleted={questsCompleted}
            healSessions={healSessions}
          />
        );
    }
  };

  return (
    <div className="min-h-screen pb-24 gradient-mood">
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="p-6 glass sticky top-0 z-40"
      >
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div>
            <h1 className="text-2xl font-bold text-gradient">MindFlow</h1>
            <p className="text-sm text-muted-foreground">
              Welcome, {user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Wellness Seeker'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="glass px-4 py-2 rounded-full flex items-center gap-2">
              <span className="text-2xl">{moodEmojis[currentMood]}</span>
              <span className="text-sm capitalize font-medium hidden sm:inline">{currentMood}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={signOut}
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </motion.header>

      <main className="p-4 max-w-2xl mx-auto">
        {renderView()}
      </main>

      {/* Ambient Sound Player */}
      <AmbientSoundPlayer />

      {/* AI Wellness Chat */}
      <AIWellnessChat />

      <nav className="fixed bottom-0 left-0 right-0 glass border-t border-border/50 p-2 z-50">
        <div className="flex justify-around max-w-2xl mx-auto">
          {navItems.map((item) => (
            <motion.button
              key={item.id}
              whileTap={{ scale: 0.9 }}
              onClick={() => setView(item.id)}
              className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-colors ${
                view === item.id ? 'text-primary bg-primary/10' : 'text-muted-foreground'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs">{item.label}</span>
            </motion.button>
          ))}
        </div>
      </nav>
    </div>
  );
}

interface HomeViewProps {
  events: CalendarEvent[];
  onNavigate: (view: View) => void;
  questsCompleted: number;
  healSessions: number;
}

function HomeView({ events, onNavigate, questsCompleted, healSessions }: HomeViewProps) {
  const { currentMood, moodHistory, addMoodEntry } = useMood();

  const todayMoods = moodHistory.filter(entry => {
    const today = new Date();
    const entryDate = new Date(entry.timestamp);
    return entryDate.toDateString() === today.toDateString();
  });

  const totalXp = todayMoods.length * 10 + healSessions * 20 + questsCompleted * 15;
  const level = Math.floor(totalXp / 100) + 1;

  const handleQuickMood = async (mood: MoodType) => {
    await addMoodEntry(mood, undefined, 'quick-select');
    toast.success(`Mood updated to ${mood}`, {
      description: `${moodEmojis[mood]} Your mood has been recorded`
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      {/* Welcome Card */}
      <Card className="glass border-0 overflow-hidden">
        <CardContent className="p-6 relative">
          <div className="absolute top-0 right-0 w-32 h-32 gradient-primary opacity-20 rounded-full blur-3xl" />
          <h2 className="text-xl font-semibold mb-2">Good to see you! {moodEmojis[currentMood]}</h2>
          <p className="text-muted-foreground">
            You've logged {todayMoods.length} mood{todayMoods.length !== 1 ? 's' : ''} today.
            {currentMood === 'happy' && ' Keep spreading that joy!'}
            {currentMood === 'tired' && ' Take it easy today.'}
            {currentMood === 'anxious' && " Let's find some calm together."}
            {currentMood === 'calm' && ' Perfect state for productivity.'}
            {currentMood === 'neutral' && ' Ready for whatever comes your way.'}
          </p>
        </CardContent>
      </Card>

      {/* Recapture Mood Section */}
      <Card className="glass border-0 overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <h3 className="font-medium">How are you feeling now?</h3>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                localStorage.removeItem('lastMoodScan');
                window.location.reload();
              }}
              className="text-xs"
            >
              Full Scan
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(moodEmojis) as MoodType[]).map((mood) => (
              <motion.button
                key={mood}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleQuickMood(mood)}
                className={`px-3 py-2 rounded-xl text-sm flex items-center gap-1.5 transition-all ${
                  currentMood === mood
                    ? 'bg-primary text-primary-foreground ring-2 ring-primary'
                    : 'bg-muted/50 hover:bg-muted'
                }`}
              >
                <span className="text-lg">{moodEmojis[mood]}</span>
                <span className="capitalize">{mood}</span>
              </motion.button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Productivity Castle */}
      <ProductivityCastle
        level={level}
        xp={totalXp}
        moodChecks={todayMoods.length}
        healSessions={healSessions}
        questsCompleted={questsCompleted}
      />

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <motion.div whileTap={{ scale: 0.98 }}>
          <Card
            className="glass border-0 cursor-pointer hover:bg-primary/5 transition-colors"
            onClick={() => onNavigate('heal')}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/10">
                <Heart className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-medium">Feel & Heal</p>
                <p className="text-xs text-muted-foreground">Process emotions</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileTap={{ scale: 0.98 }}>
          <Card
            className="glass border-0 cursor-pointer hover:bg-primary/5 transition-colors"
            onClick={() => onNavigate('quests')}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-3 rounded-xl bg-accent/10">
                <Gamepad2 className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="font-medium">Play Quest</p>
                <p className="text-xs text-muted-foreground">CBT mini-games</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Wellness Reminders */}
      <WellnessReminders />

      {/* Upcoming Events Preview */}
      <Card className="glass border-0">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Today's Schedule</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => onNavigate('calendar')}>
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {events.slice(0, 3).map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-3 p-3 rounded-xl bg-background/50"
            >
              <div
                className="w-2 h-full min-h-[40px] rounded-full"
                style={{ backgroundColor: `hsl(var(--mood-${event.predictedMood}))` }}
              />
              <div className="flex-1">
                <p className="font-medium">{event.title}</p>
                <p className="text-xs text-muted-foreground">{event.time}</p>
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-muted/50 text-muted-foreground">
                {event.tag}
              </span>
            </motion.div>
          ))}
          {events.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No events scheduled. Add some in Calendar!
            </p>
          )}
        </CardContent>
      </Card>

      {/* Weekly Insight Teaser */}
      <Card
        className="glass border-0 cursor-pointer hover:bg-primary/5 transition-colors"
        onClick={() => onNavigate('report')}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl gradient-primary">
              <BarChart3 className="w-6 h-6 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <p className="font-medium">Weekly Reflection</p>
              <p className="text-sm text-muted-foreground">See your mood patterns</p>
            </div>
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
