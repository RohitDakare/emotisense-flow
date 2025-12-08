import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Heart, Gamepad2, BarChart3, Plus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMood, moodEmojis, MoodType } from '@/lib/mood-context';
import { CalendarView } from './CalendarView';
import { FeelHealRoom } from './FeelHealRoom';
import { CognitiveQuests } from './CognitiveQuests';
import { WeeklyReport } from './WeeklyReport';

type View = 'home' | 'calendar' | 'heal' | 'quests' | 'report';

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
  predictedMood: MoodType;
  tag: string;
}

const initialEvents: CalendarEvent[] = [
  { id: '1', title: 'Team Meeting', time: '10:00 AM', predictedMood: 'anxious', tag: 'Energy Dip Likely' },
  { id: '2', title: 'Lunch Break', time: '12:30 PM', predictedMood: 'happy', tag: 'Recharge Time' },
  { id: '3', title: 'Project Review', time: '3:00 PM', predictedMood: 'neutral', tag: 'Focus Required' },
];

export function Dashboard() {
  const { currentMood } = useMood();
  const [view, setView] = useState<View>('home');
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents);

  const addEvent = (event: Omit<CalendarEvent, 'id'>) => {
    setEvents(prev => [...prev, { ...event, id: Date.now().toString() }]);
  };

  const renderView = () => {
    switch (view) {
      case 'calendar':
        return <CalendarView events={events} onAddEvent={addEvent} />;
      case 'heal':
        return <FeelHealRoom />;
      case 'quests':
        return <CognitiveQuests />;
      case 'report':
        return <WeeklyReport />;
      default:
        return <HomeView events={events} onNavigate={setView} />;
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
            <p className="text-sm text-muted-foreground">Your wellness companion</p>
          </div>
          <div className="flex items-center gap-2 glass px-4 py-2 rounded-full">
            <span className="text-2xl">{moodEmojis[currentMood]}</span>
            <span className="text-sm capitalize font-medium">{currentMood}</span>
          </div>
        </div>
      </motion.header>

      <main className="p-4 max-w-2xl mx-auto">
        {renderView()}
      </main>

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

function HomeView({ events, onNavigate }: { events: CalendarEvent[]; onNavigate: (view: View) => void }) {
  const { currentMood, moodHistory } = useMood();

  const todayMoods = moodHistory.filter(entry => {
    const today = new Date();
    const entryDate = new Date(entry.timestamp);
    return entryDate.toDateString() === today.toDateString();
  });

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
            {currentMood === 'anxious' && ' Let\'s find some calm together.'}
            {currentMood === 'calm' && ' Perfect state for productivity.'}
            {currentMood === 'neutral' && ' Ready for whatever comes your way.'}
          </p>
        </CardContent>
      </Card>

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
