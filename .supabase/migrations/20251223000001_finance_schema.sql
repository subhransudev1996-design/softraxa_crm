-- Add Invoices and Expenses tables
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE
    SET NULL,
        client_id UUID REFERENCES public.profiles(id) ON DELETE
    SET NULL,
        amount DECIMAL(15, 2) NOT NULL,
        status TEXT DEFAULT 'pending',
        -- 'pending', 'paid', 'cancelled'
        due_date DATE,
        created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    amount DECIMAL(15, 2) NOT NULL,
    category TEXT NOT NULL,
    -- 'Operational', 'Marketing', 'Payroll', 'Software', 'Other'
    description TEXT,
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Enable RLS
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
-- Basic Policies
CREATE POLICY "Admins can do everything on invoices" ON public.invoices USING (
    EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
            AND role = 'admin'
    )
);
CREATE POLICY "Admins can do everything on expenses" ON public.expenses USING (
    EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
            AND role = 'admin'
    )
);
-- Clients can see their own invoices
CREATE POLICY "Clients can see their own invoices" ON public.invoices FOR
SELECT USING (client_id = auth.uid());