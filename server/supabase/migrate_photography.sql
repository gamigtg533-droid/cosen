-- ============================================================
-- SQL Migration for Photography Category
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Add the new category to the service_category enum
ALTER TYPE service_category ADD VALUE IF NOT EXISTS 'Photography';
