import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MoodType, moodEmojis } from '@/lib/mood-context';

interface CalendarEvent {
  id: string;
  title: string;
  time: string;
  predictedMood: MoodType;
  tag: string;
}

interface CalendarViewProps {
  events: CalendarEvent[];
  onAddEvent: (event: Omit<CalendarEvent, 'id'>) => void;
}

const moodTags: Record<MoodType, string> = {
  happy: 'Energizing Activity',
  calm: 'Peaceful Time',
  neutral: 'Neutral & Productive',
  tired: 'Low Energy Task',
  anxious: 'Energy Dip Likely',
  sad: 'Need Support',
  energetic: 'High Energy'
};

export function CalendarView({ events, onAddEvent }: CalendarViewProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('');
  const [predictedMood, setPredictedMood] = useState<MoodType>('neutral');

  const handleSubmit = () => {
    if (title && time) {
      onAddEvent({
        title,
        time,
        predictedMood,
        tag: moodTags[predictedMood]
      });
      setTitle('');
      setTime('');
      setPredictedMood('neutral');
      setShowAdd(false);
    }
  };

  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Emotion-Smart Calendar</h2>
          <p className="text-sm text-muted-foreground">{today}</p>
        </div>
        <Button 
          onClick={() => setShowAdd(true)} 
          size="icon"
          className="gradient-primary text-primary-foreground border-0"
        >
          <Plus className="w-5 h-5" />
        </Button>
      </div>

      {/* Calendar Heatmap Preview */}
      <Card className="glass border-0">
        <CardContent className="p-4">
          <div className="grid grid-cols-7 gap-1">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
              <div key={i} className="text-center text-xs text-muted-foreground py-1">
                {day}
              </div>
            ))}
            {Array.from({ length: 7 }).map((_, i) => {
              const moods: MoodType[] = ['happy', 'calm', 'neutral', 'tired', 'anxious', 'energetic', 'calm'];
              const mood = moods[i];
              const isToday = i === new Date().getDay();
              return (
                <motion.div
                  key={i}
                  whileHover={{ scale: 1.1 }}
                  className={`aspect-square rounded-lg flex items-center justify-center text-sm ${
                    isToday ? 'ring-2 ring-primary' : ''
                  }`}
                  style={{ 
                    backgroundColor: `hsl(var(--mood-${mood}) / ${isToday ? 0.4 : 0.2})` 
                  }}
                >
                  {i + 1}
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Events List */}
      <div className="space-y-3">
        {events.map((event, index) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="glass border-0 overflow-hidden">
              <div 
                className="h-1"
                style={{ backgroundColor: `hsl(var(--mood-${event.predictedMood}))` }}
              />
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{moodEmojis[event.predictedMood]}</span>
                      <h3 className="font-medium">{event.title}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{event.time}</p>
                  </div>
                  <span 
                    className="text-xs px-3 py-1 rounded-full"
                    style={{ 
                      backgroundColor: `hsl(var(--mood-${event.predictedMood}) / 0.2)`,
                      color: `hsl(var(--mood-${event.predictedMood}))`
                    }}
                  >
                    {event.tag}
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Add Event Modal */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
            onClick={() => setShowAdd(false)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass p-6 rounded-2xl w-full max-w-md space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Add Event</h3>
                <Button variant="ghost" size="icon" onClick={() => setShowAdd(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Event Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="What's happening?"
                    className="glass border-0 mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="time">Time</Label>
                  <Input
                    id="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    placeholder="e.g., 2:00 PM"
                    className="glass border-0 mt-1"
                  />
                </div>

                <div>
                  <Label>Predicted Mood</Label>
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {(['happy', 'calm', 'neutral', 'tired', 'anxious', 'energetic'] as MoodType[]).map((mood) => (
                      <motion.button
                        key={mood}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setPredictedMood(mood)}
                        className={`p-3 rounded-xl flex flex-col items-center gap-1 transition-colors ${
                          predictedMood === mood ? 'bg-primary/20 ring-2 ring-primary' : 'bg-muted/30'
                        }`}
                      >
                        <span className="text-xl">{moodEmojis[mood]}</span>
                        <span className="text-xs capitalize">{mood}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {title && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="flex items-center gap-2 p-3 rounded-xl bg-primary/10"
                  >
                    <Sparkles className="w-4 h-4 text-primary" />
                    <p className="text-sm">AI predicts: <span className="font-medium">{moodTags[predictedMood]}</span></p>
                  </motion.div>
                )}

                <Button 
                  onClick={handleSubmit} 
                  className="w-full gradient-primary text-primary-foreground border-0"
                  disabled={!title || !time}
                >
                  Add Event
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
