import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type MoodType = 'happy' | 'calm' | 'tired' | 'anxious' | 'neutral' | 'sad' | 'energetic';

interface MoodEntry {
  mood: MoodType;
  timestamp: Date;
  note?: string;
}

interface MoodContextType {
  currentMood: MoodType;
  setCurrentMood: (mood: MoodType) => void;
  moodHistory: MoodEntry[];
  addMoodEntry: (mood: MoodType, note?: string) => void;
  theme: string;
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
  const [moodHistory, setMoodHistory] = useState<MoodEntry[]>(() => {
    const saved = localStorage.getItem('moodHistory');
    return saved ? JSON.parse(saved) : [];
  });

  const theme = moodToTheme[currentMood];

  useEffect(() => {
    localStorage.setItem('moodHistory', JSON.stringify(moodHistory));
  }, [moodHistory]);

  useEffect(() => {
    document.body.className = theme;
  }, [theme]);

  const addMoodEntry = (mood: MoodType, note?: string) => {
    const entry: MoodEntry = {
      mood,
      timestamp: new Date(),
      note,
    };
    setMoodHistory(prev => [...prev, entry]);
    setCurrentMood(mood);
  };

  return (
    <MoodContext.Provider value={{ currentMood, setCurrentMood, moodHistory, addMoodEntry, theme }}>
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
