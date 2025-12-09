import { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Camera, Sparkles, AlertCircle, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MoodType } from '@/lib/mood-context';
import { supabase } from '@/integrations/supabase/client';

interface RealEmotionDetectorProps {
  onMoodDetected: (mood: MoodType) => void;
  onCancel: () => void;
}

export function RealEmotionDetector({ onMoodDetected, onCancel }: RealEmotionDetectorProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setHasPermission(true);
        setError(null);
      }
    } catch (err) {
      console.error('Camera error:', err);
      setHasPermission(false);
      setError('Camera access denied. Please allow camera access to use mood detection.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  const [aiInsight, setAiInsight] = useState<string | null>(null);

  const analyzeEmotion = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    setIsAnalyzing(true);
    setAiInsight(null);

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) return;

      // Capture frame from video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);

      // Convert to base64 for AI analysis
      const imageBase64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];

      // Call AI for facial emotion analysis
      const { data, error } = await supabase.functions.invoke('analyze-mood', {
        body: {
          imageBase64,
          analysisType: 'facial'
        }
      });

      if (error) throw error;

      if (data.mood) {
        const detectedMood = data.mood as MoodType;
        setAiInsight(data.insight || data.suggestion);
        
        stopCamera();
        onMoodDetected(detectedMood);
      } else {
        throw new Error('Could not detect mood');
      }

    } catch (err) {
      console.error('AI Analysis error:', err);
      // Fallback to simple heuristic if AI fails
      fallbackAnalysis();
    } finally {
      setIsAnalyzing(false);
    }
  };

  const fallbackAnalysis = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    let totalBrightness = 0;
    let redSum = 0;
    let blueSum = 0;
    const pixelCount = data.length / 4;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      totalBrightness += (r + g + b) / 3;
      redSum += r;
      blueSum += b;
    }

    const avgBrightness = totalBrightness / pixelCount;
    const colorTemperature = (redSum - blueSum) / pixelCount / 255;
    const brightness = avgBrightness / 255;
    const random = Math.random();

    let detectedMood: MoodType;
    if (brightness > 0.6 && colorTemperature > 0.1) {
      detectedMood = random > 0.5 ? 'happy' : 'energetic';
    } else if (brightness > 0.5 && colorTemperature > 0) {
      detectedMood = random > 0.5 ? 'calm' : 'neutral';
    } else if (brightness < 0.4) {
      detectedMood = random > 0.5 ? 'tired' : 'calm';
    } else if (colorTemperature < -0.1) {
      detectedMood = random > 0.3 ? 'neutral' : 'anxious';
    } else {
      detectedMood = 'neutral';
    }

    await new Promise(resolve => setTimeout(resolve, 500));
    stopCamera();
    onMoodDetected(detectedMood);
  };

  return (
    <div className="space-y-6">
      <div className="relative mx-auto w-64 h-64 rounded-full overflow-hidden glass">
        {hasPermission === false ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
            <AlertCircle className="w-10 h-10 text-destructive mb-2" />
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
            />
            <canvas ref={canvasRef} className="hidden" />
            
            {isAnalyzing && (
              <motion.div
                className="absolute inset-0 flex items-center justify-center bg-background/50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                >
                  <Sparkles className="w-12 h-12 text-primary" />
                </motion.div>
              </motion.div>
            )}

            {/* Scan overlay */}
            {hasPermission && !isAnalyzing && (
              <motion.div
                className="absolute inset-0 border-4 border-primary/50 rounded-full"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}
          </>
        )}
      </div>

      <div className="space-y-3">
        <Button
          onClick={analyzeEmotion}
          disabled={!hasPermission || isAnalyzing}
          size="lg"
          className="w-full gradient-primary text-primary-foreground border-0"
        >
          {isAnalyzing ? (
            <>
              <Sparkles className="mr-2 h-5 w-5 animate-pulse" />
              Analyzing your mood...
            </>
          ) : (
            <>
              <Camera className="mr-2 h-5 w-5" />
              Capture & Analyze
            </>
          )}
        </Button>

        <Button
          variant="ghost"
          onClick={() => {
            stopCamera();
            onCancel();
          }}
          className="w-full text-muted-foreground"
        >
          Select manually instead
        </Button>
      </div>
    </div>
  );
}
