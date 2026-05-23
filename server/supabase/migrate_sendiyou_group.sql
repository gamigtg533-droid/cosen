-- ============================================================
-- SQL Migration for SendiYou Group Connection support
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Add group_size to services table (default 1 for individual connections)
ALTER TABLE services ADD COLUMN IF NOT EXISTS group_size INTEGER DEFAULT 1;

-- 2. Add buyer_ids to orders table (array of user UUIDs representing participants in the group)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS buyer_ids UUID[] DEFAULT '{}';
