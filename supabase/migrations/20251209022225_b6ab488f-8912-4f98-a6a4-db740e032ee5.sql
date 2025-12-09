-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  castle_level INTEGER DEFAULT 1,
  total_xp INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create mood_entries table
CREATE TABLE public.mood_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  mood TEXT NOT NULL,
  detected_by TEXT DEFAULT 'manual',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create wellness_reminders table
CREATE TABLE public.wellness_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  reminder_time TIME NOT NULL,
  days_of_week INTEGER[] DEFAULT ARRAY[1,2,3,4,5,6,7],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create calendar_events table
CREATE TABLE public.calendar_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  event_time TIME,
  predicted_mood TEXT,
  actual_mood TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create quest_progress table
CREATE TABLE public.quest_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  quest_type TEXT NOT NULL,
  score INTEGER DEFAULT 0,
  xp_earned INTEGER DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mood_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wellness_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quest_progress ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Mood entries policies
CREATE POLICY "Users can view their own mood entries" ON public.mood_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own mood entries" ON public.mood_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own mood entries" ON public.mood_entries FOR DELETE USING (auth.uid() = user_id);

-- Wellness reminders policies
CREATE POLICY "Users can view their own reminders" ON public.wellness_reminders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own reminders" ON public.wellness_reminders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own reminders" ON public.wellness_reminders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own reminders" ON public.wellness_reminders FOR DELETE USING (auth.uid() = user_id);

-- Calendar events policies
CREATE POLICY "Users can view their own events" ON public.calendar_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own events" ON public.calendar_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own events" ON public.calendar_events FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own events" ON public.calendar_events FOR DELETE USING (auth.uid() = user_id);

-- Quest progress policies
CREATE POLICY "Users can view their own quest progress" ON public.quest_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own quest progress" ON public.quest_progress FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for profiles timestamp
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();