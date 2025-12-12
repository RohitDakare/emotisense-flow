import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type MoodType = 'happy' | 'calm' | 'tired' | 'anxious' | 'neutral' | 'sad' | 'energetic';

interface MoodEntry {
  id: string;
  mood: MoodType;
  timestamp: Date;
  note?: string;
}

interface MoodContextType {
  currentMood: MoodType;
  setCurrentMood: (mood: MoodType) => void;
  moodHistory: MoodEntry[];
  addMoodEntry: (mood: MoodType, note?: string, detectedBy?: string) => Promise<void>;
  theme: string;
  refreshMoods: () => Promise<void>;
}

const moodToTheme: Record<MoodType, string> = {
  happy: 'theme-happy',
  calm: 'theme-calm',
  tired: 'theme-tired',
  anxious: 'theme-anxious',
  neutral: '',
  sad: 'theme-calm',
  energetic: 'theme-happy',
};

const MoodContext = createContext<MoodContextType | undefined>(undefined);

export function MoodProvider({ children }: { children: ReactNode }) {
  const [currentMood, setCurrentMood] = useState<MoodType>('neutral');
  const [moodHistory, setMoodHistory] = useState<MoodEntry[]>([]);
  const { user } = useAuth();

  const theme = moodToTheme[currentMood];

  const fetchMoods = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('mood_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      const entries: MoodEntry[] = data.map((entry) => ({
        id: entry.id,
        mood: entry.mood as MoodType,
        timestamp: new Date(entry.created_at),
        note: entry.notes || undefined,
      }));
      setMoodHistory(entries);
      
      // Set current mood to the most recent entry
      if (entries.length > 0) {
        setCurrentMood(entries[0].mood);
      }
    }
  };

  useEffect(() => {
    fetchMoods();
  }, [user]);

  useEffect(() => {
    document.body.className = theme;
  }, [theme]);

  const addMoodEntry = async (mood: MoodType, note?: string, detectedBy?: string) => {
    if (!user) return;

    const { data, error } = await supabase
      .from('mood_entries')
      .insert({
        user_id: user.id,
        mood,
        notes: note || null,
        detected_by: detectedBy || 'manual',
      })
      .select()
      .single();

    if (!error && data) {
      const newEntry: MoodEntry = {
        id: data.id,
        mood: data.mood as MoodType,
        timestamp: new Date(data.created_at),
        note: data.notes || undefined,
      };
      setMoodHistory((prev) => [newEntry, ...prev]);
      setCurrentMood(mood);
    }
  };

  const refreshMoods = async () => {
    await fetchMoods();
  };

  return (
    <MoodContext.Provider value={{ currentMood, setCurrentMood, moodHistory, addMoodEntry, theme, refreshMoods }}>
      {children}
    </MoodContext.Provider>
  );
}

export function useMood() {
  const context = useContext(MoodContext);
  if (!context) {
    throw new Error('useMood must be used within a MoodProvider');
  }
  return context;
}

export const moodEmojis: Record<MoodType, string> = {
  happy: '😊',
  calm: '😌',
  tired: '😴',
  anxious: '😰',
  neutral: '😐',
  sad: '😢',
  energetic: '⚡',
};

export const moodColors: Record<MoodType, string> = {
  happy: 'hsl(45, 95%, 55%)',
  calm: 'hsl(200, 60%, 55%)',
  tired: 'hsl(270, 40%, 60%)',
  anxious: 'hsl(35, 90%, 55%)',
  neutral: 'hsl(158, 64%, 42%)',
  sad: 'hsl(220, 40%, 50%)',
  energetic: 'hsl(340, 75%, 55%)',
};
