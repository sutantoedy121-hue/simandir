-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  timezone TEXT DEFAULT 'Asia/Jakarta',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Life categories lookup
CREATE TABLE life_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default categories
INSERT INTO life_categories (name, color, icon) VALUES
  ('Education', '#3B82F6', 'book'),
  ('Career', '#8B5CF6', 'briefcase'),
  ('Finance', '#10B981', 'dollar-sign'),
  ('Health', '#EF4444', 'heart'),
  ('Family', '#F59E0B', 'home'),
  ('Social', '#EC4899', 'users'),
  ('Spiritual', '#6366F1', 'star'),
  ('Hobby', '#14B8A6', 'palette'),
  ('Project', '#06B6D4', 'folder'),
  ('Personal Growth', '#A855F7', 'trending-up');

-- Activities (time tracking)
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- custom or life_category name
  type TEXT NOT NULL CHECK (type IN ('positive', 'negative', 'neutral')),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  duration_minutes INTEGER GENERATED ALWAYS AS (
    CASE
      WHEN end_time IS NOT NULL THEN EXTRACT(EPOCH FROM (end_time - start_time)) / 60
      ELSE NULL
    END
  ) STORED,
  life_category_id UUID REFERENCES life_categories(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Schedules/Events (calendar)
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  all_day BOOLEAN DEFAULT FALSE,
  reminder_minutes INTEGER, -- minutes before event to remind
  life_category_id UUID REFERENCES life_categories(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  priority INTEGER NOT NULL DEFAULT 2 CHECK (priority BETWEEN 1 AND 4), -- 1=urgent+important, 2=important, 3=urgent, 4=neither
  urgency INTEGER NOT NULL DEFAULT 2 CHECK (urgency BETWEEN 1 AND 5),
  importance INTEGER NOT NULL DEFAULT 2 CHECK (importance BETWEEN 1 AND 5),
  deadline TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  life_category_id UUID REFERENCES life_categories(id),
  project_id UUID, -- will reference projects table later
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transactions (finance)
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(15,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category TEXT NOT NULL,
  description TEXT,
  transaction_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  life_category_id UUID REFERENCES life_categories(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Budgets
CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  limit_amount DECIMAL(15,2) NOT NULL,
  period TEXT NOT NULL CHECK (period IN ('daily', 'weekly', 'monthly')),
  start_date DATE NOT NULL,
  end_date DATE,
  life_category_id UUID REFERENCES life_categories(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, category, period, start_date)
);

-- Habits
CREATE TABLE habits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'custom')),
  target_count INTEGER DEFAULT 1, -- times per frequency period
  life_category_id UUID REFERENCES life_categories(id),
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habit logs
CREATE TABLE habit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Goals
CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  target_date DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage BETWEEN 0 AND 100),
  life_category_id UUID REFERENCES life_categories(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Milestones
CREATE TABLE milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  target_date DATE,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notes
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  folder_id UUID, -- self-reference for folder structure
  life_category_id UUID REFERENCES life_categories(id),
  search_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(content, '')), 'B')
  ) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Note tags
CREATE TABLE note_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(note_id, tag)
);

-- Projects
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'completed', 'on_hold')),
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage BETWEEN 0 AND 100),
  start_date DATE,
  target_date DATE,
  life_category_id UUID REFERENCES life_categories(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Journal entries
CREATE TABLE journal_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT NOT NULL,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  mood TEXT, -- optional: 'great', 'good', 'okay', 'bad', 'terrible'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, entry_date)
);

-- AI chat history
CREATE TABLE ai_chat_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity logs (for pattern detection)
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- 'task_completed', 'expense_added', 'habit_logged', etc.
  entity_type TEXT NOT NULL, -- 'task', 'transaction', 'habit', etc.
  entity_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_activities_user_id ON activities(user_id);
CREATE INDEX idx_activities_start_time ON activities(start_time);
CREATE INDEX idx_events_user_id ON events(user_id);
CREATE INDEX idx_events_start_time ON events(start_time);
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_deadline ON tasks(deadline);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_date ON transactions(transaction_date);
CREATE INDEX idx_habits_user_id ON habits(user_id);
CREATE INDEX idx_habit_logs_habit_id ON habit_logs(habit_id);
CREATE INDEX idx_notes_user_id ON notes(user_id);
CREATE INDEX idx_notes_search_vector ON notes USING gin(search_vector);
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);

-- Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies (user can only access their own data)
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own activities" ON activities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own activities" ON activities FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own activities" ON activities FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own activities" ON activities FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own events" ON events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own events" ON events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own events" ON events FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own events" ON events FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own tasks" ON tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tasks" ON tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tasks" ON tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tasks" ON tasks FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own transactions" ON transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions" ON transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own transactions" ON transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own transactions" ON transactions FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own budgets" ON budgets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own budgets" ON budgets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own budgets" ON budgets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own budgets" ON budgets FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own habits" ON habits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own habits" ON habits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own habits" ON habits FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own habits" ON habits FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own habit_logs" ON habit_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own habit_logs" ON habit_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own habit_logs" ON habit_logs FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own goals" ON goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own goals" ON goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own goals" ON goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own goals" ON goals FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own milestones" ON milestones FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own milestones" ON milestones FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own milestones" ON milestones FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own milestones" ON milestones FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own notes" ON notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own notes" ON notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own notes" ON notes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own notes" ON notes FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own note_tags" ON note_tags FOR SELECT USING (EXISTS (SELECT 1 FROM notes WHERE notes.id = note_tags.note_id AND notes.user_id = auth.uid()));
CREATE POLICY "Users can insert own note_tags" ON note_tags FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM notes WHERE notes.id = note_tags.note_id AND notes.user_id = auth.uid()));
CREATE POLICY "Users can delete own note_tags" ON note_tags FOR DELETE USING (EXISTS (SELECT 1 FROM notes WHERE notes.id = note_tags.note_id AND notes.user_id = auth.uid()));

CREATE POLICY "Users can view own projects" ON projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own projects" ON projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own projects" ON projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own projects" ON projects FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own journal_entries" ON journal_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own journal_entries" ON journal_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own journal_entries" ON journal_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own journal_entries" ON journal_entries FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own ai_chat_history" ON ai_chat_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own ai_chat_history" ON ai_chat_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own ai_chat_history" ON ai_chat_history FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own activity_logs" ON activity_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own activity_logs" ON activity_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Everyone can read life_categories (public lookup)
CREATE POLICY "Anyone can view life_categories" ON life_categories FOR SELECT USING (true);

-- Functions for automatic profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update_updated_at trigger to all tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_activities_updated_at BEFORE UPDATE ON activities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON budgets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_habits_updated_at BEFORE UPDATE ON habits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON goals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_milestones_updated_at BEFORE UPDATE ON milestones FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_journal_entries_updated_at BEFORE UPDATE ON journal_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
