-- Enable REPLICA IDENTITY FULL for donation_drafts table
-- This ensures updates and deletes include all row data for realtime subscriptions

ALTER TABLE donation_drafts REPLICA IDENTITY FULL;
