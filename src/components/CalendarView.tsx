import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Sparkles, ChevronLeft, ChevronRight, Edit2, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MoodType, moodEmojis } from '@/lib/mood-context';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface CalendarEvent {
  id: string;
  title: string;
  time: string;
  date: string;
  predictedMood: MoodType;
  tag: string;
}

interface CalendarViewProps {
  events: CalendarEvent[];
  onAddEvent: (event: Omit<CalendarEvent, 'id'>) => void;
  onUpdateEvent?: (event: CalendarEvent) => void;
  onDeleteEvent?: (id: string) => void;
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

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function CalendarView({ events, onAddEvent, onUpdateEvent, onDeleteEvent }: CalendarViewProps) {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('');
  const [predictedMood, setPredictedMood] = useState<MoodType>('neutral');
  const [dbEvents, setDbEvents] = useState<CalendarEvent[]>([]);
  const [viewMode, setViewMode] = useState<'month' | 'year'>('month');
  const [isPredictingMood, setIsPredictingMood] = useState(false);

  // Fetch events from database
  useEffect(() => {
    const fetchEvents = async () => {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', user.id);
      
      if (!error && data) {
        setDbEvents(data.map(e => ({
          id: e.id,
          title: e.title,
          time: e.event_time || '',
          date: e.event_date,
          predictedMood: (e.predicted_mood || 'neutral') as MoodType,
          tag: moodTags[(e.predicted_mood || 'neutral') as MoodType]
        })));
      }
    };
    
    fetchEvents();
  }, [user]);

  const allEvents = [...events, ...dbEvents];

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const formatDateKey = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const getEventsForDate = (date: Date) => {
    const dateKey = formatDateKey(date);
    return allEvents.filter(e => e.date === dateKey);
  };

  const navigateMonth = (direction: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1));
  };

  const navigateYear = (direction: number) => {
    setCurrentDate(new Date(currentDate.getFullYear() + direction, currentDate.getMonth(), 1));
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setEditingEvent(null);
    setTitle('');
    setTime('');
    setPredictedMood('neutral');
    setShowEventModal(true);
  };

  const handleEditEvent = (event: CalendarEvent) => {
    setEditingEvent(event);
    setTitle(event.title);
    setTime(event.time);
    setPredictedMood(event.predictedMood);
    setSelectedDate(new Date(event.date));
    setShowEventModal(true);
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', eventId);
      
      if (error) throw error;
      
      setDbEvents(prev => prev.filter(e => e.id !== eventId));
      onDeleteEvent?.(eventId);
      toast.success('Event deleted');
    } catch (error) {
      toast.error('Failed to delete event');
    }
  };

  // AI mood prediction based on event title and time - analyzes the event, not the user
  const predictMoodWithAI = async (eventTitle: string, eventTime: string) => {
    if (!eventTitle.trim()) {
      toast.error('Please enter an event title first');
      return;
    }
    setIsPredictingMood(true);
    try {
      // Get day of week for context
      const dayOfWeek = selectedDate ? ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][selectedDate.getDay()] : 'unknown';
      
      const { data, error } = await supabase.functions.invoke('analyze-mood', {
        body: {
          userInput: `Analyze this calendar event and predict what mood it might cause:
Event Title: "${eventTitle}"
Scheduled Time: ${eventTime || 'not specified'}
Day: ${dayOfWeek}

Consider: Is this a stressful event (like a deadline, exam, medical appointment)? A relaxing activity (yoga, vacation)? A social event? A work task? An early morning or late night event?`,
          analysisType: 'event_mood'
        }
      });
      
      if (error) throw error;
      
      if (data?.mood) {
        setPredictedMood(data.mood as MoodType);
        toast.success(`AI predicted: ${data.mood}`, { 
          description: data.reason || 'Based on event analysis' 
        });
      } else if (data?.response) {
        // Fallback for text response
        const moodMatch = data.response.toLowerCase().match(/\b(happy|calm|tired|anxious|neutral|sad|energetic)\b/);
        if (moodMatch) {
          setPredictedMood(moodMatch[1] as MoodType);
          toast.success(`AI predicted: ${moodMatch[1]}`);
        }
      }
    } catch (err) {
      console.error('Mood prediction failed:', err);
      toast.error('Failed to predict mood');
    } finally {
      setIsPredictingMood(false);
    }
  };

  const handleSubmit = async () => {
    if (!title || !selectedDate || !user) return;

    const dateKey = formatDateKey(selectedDate);
    
    try {
      if (editingEvent) {
        // Update existing event
        const { error } = await supabase
          .from('calendar_events')
          .update({
            title,
            event_time: time || null,
            event_date: dateKey,
            predicted_mood: predictedMood
          })
          .eq('id', editingEvent.id);
        
        if (error) throw error;
        
        setDbEvents(prev => prev.map(e => 
          e.id === editingEvent.id 
            ? { ...e, title, time, date: dateKey, predictedMood, tag: moodTags[predictedMood] }
            : e
        ));
        toast.success('Event updated');
      } else {
        // Create new event
        const { data, error } = await supabase
          .from('calendar_events')
          .insert({
            user_id: user.id,
            title,
            event_time: time || null,
            event_date: dateKey,
            predicted_mood: predictedMood
          })
          .select()
          .single();
        
        if (error) throw error;
        
        if (data) {
          setDbEvents(prev => [...prev, {
            id: data.id,
            title,
            time,
            date: dateKey,
            predictedMood,
            tag: moodTags[predictedMood]
          }]);
        }
        
        onAddEvent({
          title,
          time,
          date: dateKey,
          predictedMood,
          tag: moodTags[predictedMood]
        });
        toast.success('Event added');
      }
    } catch (error) {
      toast.error('Failed to save event');
    }

    setTitle('');
    setTime('');
    setPredictedMood('neutral');
    setShowEventModal(false);
    setEditingEvent(null);
  };

  const renderMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const today = new Date();

    return (
      <div className="space-y-2">
        <div className="grid grid-cols-7 gap-1">
          {WEEKDAYS.map(day => (
            <div key={day} className="text-center text-xs text-muted-foreground py-2 font-medium">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const date = new Date(year, month, i + 1);
            const dayEvents = getEventsForDate(date);
            const isToday = date.toDateString() === today.toDateString();
            const hasEvents = dayEvents.length > 0;
            const primaryMood = hasEvents ? dayEvents[0].predictedMood : null;

            return (
              <motion.button
                key={i}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleDateClick(date)}
                className={`aspect-square rounded-lg flex flex-col items-center justify-center text-sm relative transition-colors ${
                  isToday ? 'ring-2 ring-primary' : ''
                } ${hasEvents ? 'bg-primary/10' : 'hover:bg-muted/50'}`}
                style={primaryMood ? { 
                  backgroundColor: `hsl(var(--mood-${primaryMood}) / 0.2)` 
                } : undefined}
              >
                <span className={isToday ? 'font-bold text-primary' : ''}>{i + 1}</span>
                {hasEvents && (
                  <div className="flex gap-0.5 mt-0.5">
                    {dayEvents.slice(0, 3).map((_, idx) => (
                      <div key={idx} className="w-1 h-1 rounded-full bg-primary" />
                    ))}
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    );
  };

  const renderYearView = () => {
    const year = currentDate.getFullYear();
    const today = new Date();

    return (
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
        {MONTHS.map((monthName, monthIndex) => {
          const daysInMonth = getDaysInMonth(year, monthIndex);
          const firstDay = getFirstDayOfMonth(year, monthIndex);
          
          return (
            <motion.div
              key={monthName}
              whileHover={{ scale: 1.02 }}
              className="glass rounded-lg p-3 cursor-pointer"
              onClick={() => {
                setCurrentDate(new Date(year, monthIndex, 1));
                setViewMode('month');
              }}
            >
              <h4 className="text-sm font-medium mb-2 text-center">{monthName}</h4>
              <div className="grid grid-cols-7 gap-px text-[8px]">
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square" />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const date = new Date(year, monthIndex, i + 1);
                  const dayEvents = getEventsForDate(date);
                  const isToday = date.toDateString() === today.toDateString();
                  const hasEvents = dayEvents.length > 0;

                  return (
                    <div
                      key={i}
                      className={`aspect-square rounded-sm flex items-center justify-center ${
                        isToday ? 'bg-primary text-primary-foreground' : ''
                      } ${hasEvents && !isToday ? 'bg-primary/30' : ''}`}
                    >
                      {i + 1}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>
    );
  };

  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Emotion-Smart Calendar</h2>
          <p className="text-sm text-muted-foreground">
            {viewMode === 'month' 
              ? `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`
              : currentDate.getFullYear()
            }
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === 'month' ? 'year' : 'month')}
          >
            {viewMode === 'month' ? 'Year' : 'Month'}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => viewMode === 'month' ? navigateMonth(-1) : navigateYear(-1)}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => viewMode === 'month' ? navigateMonth(1) : navigateYear(1)}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <Card className="glass border-0">
        <CardContent className="p-4">
          {viewMode === 'month' ? renderMonthView() : renderYearView()}
        </CardContent>
      </Card>

      {/* Today's Events */}
      {viewMode === 'month' && (
        <div className="space-y-3">
          <h3 className="font-medium">Upcoming Events</h3>
          {allEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No events yet. Click on a date to add one.</p>
          ) : (
            allEvents.slice(0, 5).map((event, index) => (
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
                          <div>
                            <h3 className="font-medium">{event.title}</h3>
                            <p className="text-xs text-muted-foreground">
                              {event.date} {event.time && `• ${event.time}`}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEditEvent(event)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleDeleteEvent(event.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* Event Modal */}
      <AnimatePresence>
        {showEventModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
            onClick={() => setShowEventModal(false)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass p-6 rounded-2xl w-full max-w-md space-y-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">
                    {editingEvent ? 'Edit Event' : 'Add Event'}
                  </h3>
                  {selectedDate && (
                    <p className="text-sm text-muted-foreground">
                      {selectedDate.toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        month: 'long', 
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  )}
                </div>
                <Button variant="ghost" size="icon" onClick={() => setShowEventModal(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Events for selected date */}
              {selectedDateEvents.length > 0 && !editingEvent && (
                <div className="space-y-2">
                  <Label>Events on this day:</Label>
                  {selectedDateEvents.map(event => (
                    <div key={event.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-2">
                        <span>{moodEmojis[event.predictedMood]}</span>
                        <span className="text-sm">{event.title}</span>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleEditEvent(event)}>
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleDeleteEvent(event.id)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

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
                  <Label htmlFor="time">Time (optional)</Label>
                  <Input
                    id="time"
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="glass border-0 mt-1"
                  />
                </div>

                <div>
                  <Label>Predicted Mood</Label>
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {(['happy', 'calm', 'neutral', 'tired', 'anxious', 'energetic', 'sad'] as MoodType[]).map((mood) => (
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
                  disabled={!title}
                >
                  {editingEvent ? 'Update Event' : 'Add Event'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
