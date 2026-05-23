-- ============================================================
-- Cosen Manual UPI Payout System — DB Migration
-- Run in Supabase SQL Editor
-- ============================================================

-- 1. Add upi_id column to users
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS upi_id VARCHAR(100) DEFAULT NULL;

-- 2. Create payouts table
CREATE TABLE IF NOT EXISTS payouts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID REFERENCES orders(id) ON DELETE SET NULL,
  seller_id   UUID REFERENCES users(id) ON DELETE SET NULL,
  amount      NUMERIC(10, 2) NOT NULL,
  upi_id      VARCHAR(100) NOT NULL,
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
  paid_at     TIMESTAMPTZ DEFAULT NULL,
  created_at  TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3. Indexes for fast admin queries
CREATE INDEX IF NOT EXISTS idx_payouts_status     ON payouts(status);
CREATE INDEX IF NOT EXISTS idx_payouts_seller_id  ON payouts(seller_id);
CREATE INDEX IF NOT EXISTS idx_payouts_order_id   ON payouts(order_id);
CREATE INDEX IF NOT EXISTS idx_payouts_created_at ON payouts(created_at DESC);

-- 4. Prevent duplicate payout records per order
CREATE UNIQUE INDEX IF NOT EXISTS idx_payouts_order_unique ON payouts(order_id);
