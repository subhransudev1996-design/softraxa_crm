-- 1. PROFILES Table (Extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name text,
  role text DEFAULT 'employee' CHECK (role IN ('admin', 'pm', 'employee', 'client', 'member')),
  points integer DEFAULT 0,
  level integer DEFAULT 1,
  avatar_url text,
  hourly_rate numeric,
  created_at timestamptz DEFAULT now()
);

-- 2. PROJECTS Table
CREATE TABLE IF NOT EXISTS public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  status text DEFAULT 'active',
  completion_percentage integer DEFAULT 0,
  client_id uuid REFERENCES public.profiles(id),
  budget numeric,
  start_date date,
  end_date date,
  created_at timestamptz DEFAULT now()
);

-- 3. TASKS Table
CREATE TABLE IF NOT EXISTS public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  status text DEFAULT 'todo', -- 'todo', 'in_progress', 'review', 'done'
  priority text DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  assignee_id uuid REFERENCES public.profiles(id),
  reviewer_id uuid REFERENCES public.profiles(id),
  backup_assignee_id uuid REFERENCES public.profiles(id),
  due_date timestamptz,
  checkpoint_date timestamptz,
  min_progress_required integer DEFAULT 0,
  progress integer DEFAULT 0,
  auto_transfer_enabled boolean DEFAULT false,
  checkpoint_status text DEFAULT 'pending',
  warning_sent boolean DEFAULT false,
  original_assignee_id uuid REFERENCES public.profiles(id),
  duration_seconds integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 4. LEADS Table
CREATE TABLE IF NOT EXISTS public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  company text,
  email text,
  phone text,
  status text DEFAULT 'new', -- 'new', 'contacted', 'negotiation', 'won', 'lost'
  value numeric,
  notes text,
  assigned_to uuid REFERENCES public.profiles(id),
  converted_by uuid REFERENCES public.profiles(id),
  created_at timestamptz DEFAULT now()
);

-- 5. INVOICES Table
CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  amount numeric NOT NULL,
  status text DEFAULT 'pending', -- 'pending', 'paid', 'cancelled'
  due_date date,
  project_id uuid REFERENCES public.projects(id),
  client_id uuid REFERENCES public.profiles(id),
  created_at timestamptz DEFAULT now()
);

-- 6. EXPENSES Table
CREATE TABLE IF NOT EXISTS public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  amount numeric NOT NULL,
  category text,
  description text,
  project_id uuid REFERENCES public.projects(id),
  date date DEFAULT current_date,
  created_at timestamptz DEFAULT now()
);

-- 7. TIME LOGS Table
CREATE TABLE IF NOT EXISTS public.time_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  duration_seconds integer NOT NULL,
  start_time timestamptz,
  end_time timestamptz DEFAULT now()
);

-- 8. ATTENDANCE Table
CREATE TABLE IF NOT EXISTS public.attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  clock_in timestamptz DEFAULT now(),
  clock_out timestamptz,
  status text -- 'on_time', 'late'
);

-- 9. LEAVE REQUESTS Table
CREATE TABLE IF NOT EXISTS public.leave_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  type text NOT NULL, -- 'sick', 'casual', 'paid'
  start_date date NOT NULL,
  end_date date NOT NULL,
  reason text,
  status text DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  created_at timestamptz DEFAULT now()
);

-- 10. TICKETS Table
CREATE TABLE IF NOT EXISTS public.tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  status text DEFAULT 'open', -- 'open', 'in_progress', 'resolved', 'closed'
  priority text DEFAULT 'medium',
  project_id uuid REFERENCES public.projects(id),
  created_by uuid REFERENCES public.profiles(id),
  assigned_to uuid REFERENCES public.profiles(id),
  created_at timestamptz DEFAULT now()
);

-- 11. WIKI ARTICLES Table
CREATE TABLE IF NOT EXISTS public.wiki_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text,
  category text,
  author_id uuid REFERENCES public.profiles(id),
  created_at timestamptz DEFAULT now()
);

-- 12. NOTIFICATIONS Table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text,
  type text DEFAULT 'info', -- 'info', 'warning', 'success', 'error'
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wiki_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- SIMPLE RLS POLICIES (Allow all for testing, can be hardened later)
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Authenticated users can view projects" ON public.projects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can view tasks" ON public.tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage own tasks" ON public.tasks FOR ALL USING (auth.uid() = assignee_id OR auth.uid() = original_assignee_id);

-- TRIGGER FOR AUTOMATIC PROFILE CREATION ON SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, role)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url',
    COALESCE(new.raw_user_meta_data->>'role', 'employee')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
