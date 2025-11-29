-- Enable real-time for cart_items and user_favorites tables
-- This allows cross-device syncing via Supabase Realtime subscriptions

-- Add tables to the supabase_realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE cart_items;
ALTER PUBLICATION supabase_realtime ADD TABLE user_favorites;

-- Set REPLICA IDENTITY to FULL so that updates and deletes include all row data
ALTER TABLE cart_items REPLICA IDENTITY FULL;
ALTER TABLE user_favorites REPLICA IDENTITY FULL;
