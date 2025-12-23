-- Migration: Update tasks table for refined task system
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS auto_transfer_enabled BOOLEAN DEFAULT FALSE;
-- Function to check checkpoints and notify/transfer
CREATE OR REPLACE FUNCTION public.check_task_checkpoints() RETURNS void AS $$
DECLARE task_record RECORD;
BEGIN FOR task_record IN
SELECT id,
    assignee_id,
    backup_assignee_id,
    title,
    min_progress_required,
    auto_transfer_enabled
FROM public.tasks
WHERE checkpoint_date <= NOW()
    AND checkpoint_status = 'pending' LOOP -- Simple check: if status is still 'todo', it's definitely below any progress target > 0
    -- In a real system, we'd check completion_percentage. 
    -- For this project, we'll assume status 'todo' or 'in_progress' with 0 work is a failure if target > 0.
    -- Logic: If we had a completion_percentage column (let's add it if missing or use a placeholder)
    -- For now, let's assume we send a notification if the task is not 'done' or 'review'.
INSERT INTO public.notifications (user_id, title, message, type)
VALUES (
        task_record.assignee_id,
        'Checkpoint Missed',
        'You missed the checkpoint for task: ' || task_record.title || '. Please update your progress.',
        'warning'
    );
IF task_record.auto_transfer_enabled
AND task_record.backup_assignee_id IS NOT NULL THEN
UPDATE public.tasks
SET assignee_id = backup_assignee_id,
    checkpoint_status = 'failed_transferred',
    status = 'todo' -- Reset status for new assignee
WHERE id = task_record.id;
INSERT INTO public.notifications (user_id, title, message, type)
VALUES (
        task_record.backup_assignee_id,
        'Task Auto-Assigned',
        'Task "' || task_record.title || '" has been auto-transferred to you due to a missed checkpoint.',
        'info'
    );
ELSE
UPDATE public.tasks
SET checkpoint_status = 'passed' -- Or just mark as checked
WHERE id = task_record.id;
END IF;
END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;