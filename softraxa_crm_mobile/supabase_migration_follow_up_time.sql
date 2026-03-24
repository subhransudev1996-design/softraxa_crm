-- Run this in Supabase SQL Editor
-- Adds a follow_up_time column to the leads table to store time separately from the DATE column

ALTER TABLE leads ADD COLUMN IF NOT EXISTS follow_up_time TEXT;

-- Example stored format: '10:30' (24-hour HH:MM)
-- This allows storing time independently since follow_up_date is a DATE type, not TIMESTAMP
