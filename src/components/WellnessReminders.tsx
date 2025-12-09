import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Bell, Plus, Trash2, Clock, X } from 'lucide-react';
import { toast } from 'sonner';

interface Reminder {
  id: string;
  title: string;
  time: string;
  isActive: boolean;
  message?: string;
}

const defaultReminders: Reminder[] = [
  { id: '1', title: 'Morning Check-in', time: '09:00', isActive: true, message: 'How are you feeling today?' },
  { id: '2', title: 'Mindful Break', time: '12:00', isActive: true, message: 'Take a moment to breathe deeply' },
  { id: '3', title: 'Afternoon Stretch', time: '15:00', isActive: false, message: 'Stand up and stretch!' },
  { id: '4', title: 'Evening Reflection', time: '20:00', isActive: true, message: 'Reflect on your day' },
];

export function WellnessReminders() {
  const [reminders, setReminders] = useState<Reminder[]>(() => {
    const saved = localStorage.getItem('wellnessReminders');
    return saved ? JSON.parse(saved) : defaultReminders;
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTime, setNewTime] = useState('');
  const [activeNotification, setActiveNotification] = useState<Reminder | null>(null);

  useEffect(() => {
    localStorage.setItem('wellnessReminders', JSON.stringify(reminders));
  }, [reminders]);

  // Check for reminders every minute
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      
      const dueReminder = reminders.find(r => r.isActive && r.time === currentTime);
      if (dueReminder && !activeNotification) {
        setActiveNotification(dueReminder);
        
        // Request notification permission and show notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('MindFlow Reminder', {
            body: dueReminder.message || dueReminder.title,
            icon: '/favicon.ico'
          });
        }
      }
    };

    // Request notification permission on mount
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const interval = setInterval(checkReminders, 60000);
    checkReminders(); // Check immediately
    
    return () => clearInterval(interval);
  }, [reminders, activeNotification]);

  const addReminder = () => {
    if (!newTitle || !newTime) {
      toast.error('Please fill in all fields');
      return;
    }

    const newReminder: Reminder = {
      id: Date.now().toString(),
      title: newTitle,
      time: newTime,
      isActive: true,
    };

    setReminders(prev => [...prev, newReminder]);
    setNewTitle('');
    setNewTime('');
    setShowAddForm(false);
    toast.success('Reminder added!');
  };

  const toggleReminder = (id: string) => {
    setReminders(prev => prev.map(r => 
      r.id === id ? { ...r, isActive: !r.isActive } : r
    ));
  };

  const deleteReminder = (id: string) => {
    setReminders(prev => prev.filter(r => r.id !== id));
    toast.success('Reminder deleted');
  };

  return (
    <>
      <Card className="glass border-0">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              Wellness Reminders
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAddForm(!showAddForm)}
              className="h-8 w-8 p-0"
            >
              {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <AnimatePresence>
            {showAddForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3 pb-3 border-b border-border/50"
              >
                <Input
                  placeholder="Reminder title"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
                <div className="flex gap-2">
                  <Input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={addReminder} size="sm" className="gradient-primary text-primary-foreground border-0">
                    Add
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {reminders.map((reminder, index) => (
            <motion.div
              key={reminder.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`flex items-center gap-3 p-3 rounded-xl bg-background/50 ${
                !reminder.isActive ? 'opacity-50' : ''
              }`}
            >
              <div className="p-2 rounded-lg bg-primary/10">
                <Clock className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{reminder.title}</p>
                <p className="text-xs text-muted-foreground">{reminder.time}</p>
              </div>
              <Switch
                checked={reminder.isActive}
                onCheckedChange={() => toggleReminder(reminder.id)}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteReminder(reminder.id)}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </motion.div>
          ))}

          {reminders.length === 0 && (
            <p className="text-center text-muted-foreground py-4">
              No reminders yet. Add one to stay on track!
            </p>
          )}
        </CardContent>
      </Card>

      {/* Notification Popup */}
      <AnimatePresence>
        {activeNotification && (
          <motion.div
            initial={{ opacity: 0, y: -100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -100 }}
            className="fixed top-4 left-4 right-4 z-50 max-w-md mx-auto"
          >
            <Card className="glass border-0 shadow-2xl">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-3 rounded-xl gradient-primary">
                    <Bell className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{activeNotification.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {activeNotification.message || 'Time for your wellness check!'}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveNotification(null)}
                    className="h-8 w-8 p-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
