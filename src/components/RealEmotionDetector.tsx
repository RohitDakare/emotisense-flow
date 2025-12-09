import { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Camera, Sparkles, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MoodType } from '@/lib/mood-context';

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

  const analyzeEmotion = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    setIsAnalyzing(true);

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) return;

      // Capture frame from video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);

      // Get image data for simple analysis
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Simple brightness and color analysis for mood estimation
      let totalBrightness = 0;
      let redSum = 0;
      let greenSum = 0;
      let blueSum = 0;
      const pixelCount = data.length / 4;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        totalBrightness += (r + g + b) / 3;
        redSum += r;
        greenSum += g;
        blueSum += b;
      }

      const avgBrightness = totalBrightness / pixelCount;
      const avgRed = redSum / pixelCount;
      const avgGreen = greenSum / pixelCount;
      const avgBlue = blueSum / pixelCount;

      // Simple heuristic-based mood detection
      // In a real app, you'd use a proper ML model like face-api.js or TensorFlow.js
      let detectedMood: MoodType;

      // Analyze face region brightness and color temperature
      const colorTemperature = (avgRed - avgBlue) / 255;
      const brightness = avgBrightness / 255;

      // Add some randomness to make it feel more dynamic
      const random = Math.random();

      if (brightness > 0.6 && colorTemperature > 0.1) {
        // Well-lit, warm colors - likely positive
        detectedMood = random > 0.5 ? 'happy' : 'energetic';
      } else if (brightness > 0.5 && colorTemperature > 0) {
        // Moderate lighting, slightly warm
        detectedMood = random > 0.5 ? 'calm' : 'neutral';
      } else if (brightness < 0.4) {
        // Low light conditions
        detectedMood = random > 0.5 ? 'tired' : 'calm';
      } else if (colorTemperature < -0.1) {
        // Cool colors
        detectedMood = random > 0.3 ? 'neutral' : 'anxious';
      } else {
        // Default
        detectedMood = 'neutral';
      }

      // Simulate processing delay for UX
      await new Promise(resolve => setTimeout(resolve, 1500));

      stopCamera();
      onMoodDetected(detectedMood);

    } catch (err) {
      console.error('Analysis error:', err);
      setError('Failed to analyze. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
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
