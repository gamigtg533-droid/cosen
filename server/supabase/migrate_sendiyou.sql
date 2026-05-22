-- ============================================================
-- SQL Migration for SendiYou Category & Gender
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Add gender to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS gender TEXT DEFAULT NULL;

-- 2. Add SendiYou category to the service_category enum
ALTER TYPE service_category ADD VALUE IF NOT EXISTS 'SendiYou';

-- 3. Add SendiYou-specific columns to services
ALTER TABLE services ADD COLUMN IF NOT EXISTS display_name TEXT DEFAULT NULL;
ALTER TABLE services ADD COLUMN IF NOT EXISTS preferred_gender TEXT DEFAULT NULL;
ALTER TABLE services ADD COLUMN IF NOT EXISTS identity_hidden BOOLEAN DEFAULT FALSE;
ALTER TABLE services ADD COLUMN IF NOT EXISTS accepted_by_id UUID REFERENCES users(id) DEFAULT NULL;
ALTER TABLE services ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ DEFAULT NULL;

-- 4. Add profile reveal columns to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS buyer_revealed BOOLEAN DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS seller_revealed BOOLEAN DEFAULT FALSE;
