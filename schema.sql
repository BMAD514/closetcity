-- Database schema for closet.city virtual try-on platform
-- This file should be executed against your Cloudflare D1 database

-- Users table for basic user management
CREATE TABLE IF NOT EXISTS users(
  id TEXT PRIMARY KEY,
  created_at INTEGER DEFAULT (strftime('%s','now'))
);

-- Garments table for storing uploaded clothing items
CREATE TABLE IF NOT EXISTS garments(
  id TEXT PRIMARY KEY,
  owner_id TEXT,
  title TEXT,
  brand TEXT,
  size TEXT,
  condition TEXT, -- e.g., "Like New", "Good", "Fair"
  price_cents INTEGER DEFAULT 0, -- store price in cents
  image_url TEXT NOT NULL, -- primary image (flat-lay)
  created_at INTEGER DEFAULT (strftime('%s','now')),
  FOREIGN KEY (owner_id) REFERENCES users(id)
);

-- Media table for multiple images per garment (flat-lays and generated try-ons)
CREATE TABLE IF NOT EXISTS listing_media(
  id TEXT PRIMARY KEY,
  listing_id TEXT NOT NULL,
  type TEXT NOT NULL, -- 'flatlay' | 'tryon'
  url TEXT NOT NULL,
  created_at INTEGER DEFAULT (strftime('%s','now')),
  FOREIGN KEY (listing_id) REFERENCES garments(id)
);

-- Cache table for storing generated try-on and pose images
-- Uses deterministic cache keys to avoid regenerating identical requests
CREATE TABLE IF NOT EXISTS pose_cache(
  cache_key TEXT PRIMARY KEY,
  image_url TEXT NOT NULL,
  prompt_version TEXT,
  created_at INTEGER DEFAULT (strftime('%s','now'))
);

-- Cache table for storing generated try-on composites
CREATE TABLE IF NOT EXISTS tryon_cache(
  cache_key TEXT PRIMARY KEY,
  image_url TEXT NOT NULL,
  prompt_version TEXT,
  created_at INTEGER DEFAULT (strftime('%s','now'))
);

-- Cache table for storing generated model images
CREATE TABLE IF NOT EXISTS model_cache(
  cache_key TEXT PRIMARY KEY,
  image_url TEXT NOT NULL,
  prompt_version TEXT,
  created_at INTEGER DEFAULT (strftime('%s','now'))
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_garments_owner_id ON garments(owner_id);
CREATE INDEX IF NOT EXISTS idx_garments_created_at ON garments(created_at);
CREATE INDEX IF NOT EXISTS idx_listing_media_listing_id ON listing_media(listing_id);
CREATE INDEX IF NOT EXISTS idx_pose_cache_prompt_version ON pose_cache(prompt_version);
CREATE INDEX IF NOT EXISTS idx_pose_cache_created_at ON pose_cache(created_at);
CREATE INDEX IF NOT EXISTS idx_tryon_cache_prompt_version ON tryon_cache(prompt_version);
CREATE INDEX IF NOT EXISTS idx_tryon_cache_created_at ON tryon_cache(created_at);
CREATE INDEX IF NOT EXISTS idx_model_cache_prompt_version ON model_cache(prompt_version);
CREATE INDEX IF NOT EXISTS idx_model_cache_created_at ON model_cache(created_at);

-- Orders table for Stripe checkout (minimal MVP)
CREATE TABLE IF NOT EXISTS orders(
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL, -- 'pending' | 'paid' | 'failed' | 'canceled'
  user_email TEXT,
  items_json TEXT NOT NULL, -- JSON string of line items
  total_cents INTEGER DEFAULT 0,
  stripe_session_id TEXT,
  created_at INTEGER DEFAULT (strftime('%s','now'))
);

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
