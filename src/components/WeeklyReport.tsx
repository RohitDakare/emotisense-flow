import { useMemo, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Calendar, Target, Lightbulb, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { useMood, MoodType, moodColors, moodEmojis } from '@/lib/mood-context';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Insight {
  icon: typeof TrendingUp;
  title: string;
  description: string;
  color: string;
}

export function WeeklyReport() {
  const { moodHistory } = useMood();
  const { user } = useAuth();
  const [questCount, setQuestCount] = useState(0);
  const [releaseCount, setReleaseCount] = useState(0);
  const [aiInsights, setAiInsights] = useState<Insight[]>([]);
  const [loadingInsights, setLoadingInsights] = useState(false);

  // Fetch real data from Supabase
  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;

      // Fetch quest progress
      const { data: quests } = await supabase
        .from('quest_progress')
        .select('*')
        .eq('user_id', user.id);

      if (quests) {
        setQuestCount(quests.length);
      }

      // Get release count from localStorage (heal sessions)
      const healSessions = localStorage.getItem('healSessions');
      setReleaseCount(healSessions ? parseInt(healSessions) : 0);
    };

    fetchStats();
  }, [user]);

  // Generate AI insights based on mood history
  useEffect(() => {
    const generateInsights = async () => {
      if (moodHistory.length < 2) {
        setAiInsights([
          {
            icon: TrendingUp,
            title: "Getting Started",
            description: "Log more moods to see personalized insights",
            color: "text-primary"
          }
        ]);
        return;
      }

      setLoadingInsights(true);
      try {
        const moodSummary = moodHistory.slice(0, 20).map(m => ({
          mood: m.mood,
          time: new Date(m.timestamp).toLocaleTimeString('en-US', { hour: '2-digit' })
        }));

        const { data, error } = await supabase.functions.invoke('analyze-mood', {
          body: {
            userInput: `Analyze these mood entries and provide 3 brief insights: ${JSON.stringify(moodSummary)}`,
            analysisType: 'chat'
          }
        });

        if (!error && data?.response) {
          // Parse insights from AI response
          const insights: Insight[] = [
            {
              icon: TrendingUp,
              title: "Mood Pattern",
              description: data.response.slice(0, 100) + '...',
              color: "text-primary"
            }
          ];
          setAiInsights(insights);
        }
      } catch (err) {
        console.error('Failed to generate insights:', err);
      } finally {
        setLoadingInsights(false);
      }
    };

    generateInsights();
  }, [moodHistory]);

  const moodDistribution = useMemo(() => {
    const counts: Record<MoodType, number> = {
      happy: 0, calm: 0, tired: 0, anxious: 0, neutral: 0, sad: 0, energetic: 0
    };

    moodHistory.forEach(entry => {
      counts[entry.mood]++;
    });

    return Object.entries(counts)
      .filter(([_, count]) => count > 0)
      .map(([mood, count]) => ({
        name: mood,
        value: count,
        color: moodColors[mood as MoodType],
        emoji: moodEmojis[mood as MoodType]
      }));
  }, [moodHistory]);

  const weeklyTrend = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() + 1); // Start from Monday

    return days.map((day, index) => {
      const dayDate = new Date(weekStart);
      dayDate.setDate(weekStart.getDate() + index);
      
      const dayMoods = moodHistory.filter(entry => {
        const entryDate = new Date(entry.timestamp);
        return entryDate.toDateString() === dayDate.toDateString();
      });

      const positive = dayMoods.filter(m => ['happy', 'calm', 'energetic'].includes(m.mood)).length;
      const neutral = dayMoods.filter(m => m.mood === 'neutral').length;
      const negative = dayMoods.filter(m => ['tired', 'anxious', 'sad'].includes(m.mood)).length;

      return { day, positive, neutral, negative };
    });
  }, [moodHistory]);

  const totalEntries = moodDistribution.reduce((acc, curr) => acc + curr.value, 0);

  const defaultInsights: Insight[] = [
    {
      icon: TrendingUp,
      title: "Peak Energy",
      description: moodHistory.length > 0 
        ? `Your most common mood is ${moodHistory.reduce((acc, m) => {
            acc[m.mood] = (acc[m.mood] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)[Object.entries(moodHistory.reduce((acc, m) => {
            acc[m.mood] = (acc[m.mood] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)).sort((a, b) => b[1] - a[1])[0]?.[0]] || 'neutral'}`
        : "Log moods to see patterns",
      color: "text-primary"
    },
    {
      icon: Calendar,
      title: "This Week",
      description: `You've logged ${totalEntries} mood entries this week`,
      color: "text-accent"
    },
    {
      icon: Target,
      title: "Quests Completed",
      description: `${questCount} cognitive quests completed`,
      color: "text-primary"
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="text-center">
        <h2 className="text-xl font-semibold flex items-center justify-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          Weekly Reflection
        </h2>
        <p className="text-sm text-muted-foreground">Your mood patterns at a glance</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Entries', value: totalEntries, icon: '📝' },
          { label: 'Quests', value: questCount, icon: '🎮' },
          { label: 'Releases', value: releaseCount, icon: '🍃' },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="glass border-0">
              <CardContent className="p-4 text-center">
                <span className="text-2xl mb-1 block">{stat.icon}</span>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Mood Distribution */}
      <Card className="glass border-0">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Mood Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          {moodDistribution.length > 0 ? (
            <div className="flex items-center gap-4">
              <div className="w-32 h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={moodDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={50}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {moodDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2">
                {moodDistribution.slice(0, 4).map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm capitalize flex-1">{item.emoji} {item.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {Math.round((item.value / totalEntries) * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              No mood data yet. Start logging your moods!
            </p>
          )}
        </CardContent>
      </Card>

      {/* Weekly Trend */}
      <Card className="glass border-0">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Weekly Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyTrend}>
                <XAxis 
                  dataKey="day" 
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: 'none',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                />
                <Bar 
                  dataKey="positive" 
                  stackId="a" 
                  fill="hsl(var(--primary))" 
                  radius={[4, 4, 0, 0]}
                  name="Positive"
                />
                <Bar 
                  dataKey="neutral" 
                  stackId="a" 
                  fill="hsl(var(--muted))"
                  name="Neutral"
                />
                <Bar 
                  dataKey="negative" 
                  stackId="a" 
                  fill="hsl(var(--destructive) / 0.5)" 
                  radius={[4, 4, 0, 0]}
                  name="Needs Care"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* AI Insights */}
      <Card className="glass border-0">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-primary" />
            AI Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loadingInsights ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            (aiInsights.length > 0 ? aiInsights : defaultInsights).map((insight, index) => (
              <motion.div
                key={insight.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.15 }}
                className="flex items-start gap-3 p-3 rounded-xl bg-background/50"
              >
                <insight.icon className={`w-5 h-5 ${insight.color} mt-0.5`} />
                <div>
                  <p className="font-medium text-sm">{insight.title}</p>
                  <p className="text-xs text-muted-foreground">{insight.description}</p>
                </div>
              </motion.div>
            ))
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
