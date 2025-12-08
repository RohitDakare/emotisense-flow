import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Calendar, Target, Lightbulb } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { useMood, MoodType, moodColors, moodEmojis } from '@/lib/mood-context';

export function WeeklyReport() {
  const { moodHistory } = useMood();

  const moodDistribution = useMemo(() => {
    const counts: Record<MoodType, number> = {
      happy: 0, calm: 0, tired: 0, anxious: 0, neutral: 0, sad: 0, energetic: 0
    };

    // Use actual history or generate sample data
    const data = moodHistory.length > 0 ? moodHistory : [
      { mood: 'happy' as MoodType }, { mood: 'happy' as MoodType },
      { mood: 'calm' as MoodType }, { mood: 'calm' as MoodType }, { mood: 'calm' as MoodType },
      { mood: 'neutral' as MoodType }, { mood: 'neutral' as MoodType },
      { mood: 'tired' as MoodType },
      { mood: 'anxious' as MoodType },
      { mood: 'energetic' as MoodType },
    ];

    data.forEach(entry => {
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
    return days.map((day, index) => ({
      day,
      positive: Math.floor(Math.random() * 5) + 2,
      neutral: Math.floor(Math.random() * 3) + 1,
      negative: Math.floor(Math.random() * 2),
    }));
  }, []);

  const insights = [
    {
      icon: TrendingUp,
      title: "Peak Energy",
      description: "You tend to feel most energetic on Wednesday mornings",
      color: "text-primary"
    },
    {
      icon: Calendar,
      title: "Pattern Detected",
      description: "Team meetings often correlate with anxious feelings",
      color: "text-accent"
    },
    {
      icon: Target,
      title: "Improvement",
      description: "Your 'calm' entries increased by 25% this week",
      color: "text-primary"
    },
  ];

  const totalEntries = moodDistribution.reduce((acc, curr) => acc + curr.value, 0);

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
          { label: 'Quests', value: 12, icon: '🎮' },
          { label: 'Releases', value: 8, icon: '🍃' },
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
                />
                <Bar 
                  dataKey="neutral" 
                  stackId="a" 
                  fill="hsl(var(--muted))" 
                />
                <Bar 
                  dataKey="negative" 
                  stackId="a" 
                  fill="hsl(var(--destructive) / 0.5)" 
                  radius={[4, 4, 0, 0]}
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
          {insights.map((insight, index) => (
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
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
}
