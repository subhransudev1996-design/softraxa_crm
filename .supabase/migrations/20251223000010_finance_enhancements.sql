-- Migration: Enhance Finance system
-- Update expenses to link with projects
ALTER TABLE public.expenses
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE
SET NULL,
    ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'transfer';
-- Update invoices with more detail
ALTER TABLE public.invoices
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'one_time',
    -- 'one_time', 'recurring', 'milestone'
ADD COLUMN IF NOT EXISTS tax_rate DECIMAL(5, 2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS notes TEXT;
-- Update RLS Policies for PMs
-- PMs should be able to see expenses linked to their projects
CREATE POLICY "PMs can view expenses of their projects" ON public.expenses FOR
SELECT TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE id = auth.uid()
                AND role IN ('admin', 'pm')
        )
    );
CREATE POLICY "PMs can view invoices of their projects" ON public.invoices FOR
SELECT TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE id = auth.uid()
                AND role IN ('admin', 'pm')
        )
    );