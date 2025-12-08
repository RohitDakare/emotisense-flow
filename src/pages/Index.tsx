import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MoodProvider } from '@/lib/mood-context';
import { MoodScanner } from '@/components/MoodScanner';
import { Dashboard } from '@/components/Dashboard';

const Index = () => {
  const [showScanner, setShowScanner] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user has completed initial scan today
    const lastScan = localStorage.getItem('lastMoodScan');
    const today = new Date().toDateString();
    
    if (lastScan === today) {
      setShowScanner(false);
    }

    // Simulate initial load
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleScanComplete = () => {
    localStorage.setItem('lastMoodScan', new Date().toDateString());
    setShowScanner(false);
  };

  return (
    <MoodProvider>
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen flex flex-col items-center justify-center bg-background"
          >
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, 180, 360]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="w-16 h-16 rounded-2xl gradient-primary mb-4"
            />
            <motion.h1 
              className="text-2xl font-bold text-gradient"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              MindFlow
            </motion.h1>
            <p className="text-muted-foreground text-sm mt-2">Preparing your wellness space...</p>
          </motion.div>
        ) : showScanner ? (
          <motion.div
            key="scanner"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <MoodScanner onComplete={handleScanComplete} />
          </motion.div>
        ) : (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Dashboard />
          </motion.div>
        )}
      </AnimatePresence>
    </MoodProvider>
  );
};

export default Index;
